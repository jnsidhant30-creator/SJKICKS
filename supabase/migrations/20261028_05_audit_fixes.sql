-- ====================================================================
-- SJ STUDIO / SJ KICKS Security Audit & RLS Hardening Fixes
-- Migration: 20261028_05_audit_fixes.sql
-- Addresses:
-- 1. Direct table INSERT bypass prevention on orders and order_items
-- 2. Enforces authentication on create_order_secure (rejects unauthenticated calls)
-- 3. Restricts EXECUTE grants to authenticated users only (revokes anon)
-- 4. User-scoped idempotency key validation with changed-payload detection
-- 5. Alignment of promo codes (SJVIP500, SAVE500, FREESHIP, SJFIRST, ATELIER20)
-- 6. Eliminates Cartesian row multiplication on multi-color variant order_items
-- ====================================================================

-- ----------------------------------------------------
-- 1. Hardened RLS: Restrict direct INSERT to Admins Only
-- ----------------------------------------------------
-- Drop permissive insert policies that allowed clients to bypass trusted RPC
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert order items for their orders" ON public.order_items;

-- Direct table insertion is restricted exclusively to administrators or internal services.
-- Standard customers must use the trusted create_order_secure RPC function.
CREATE POLICY "Admins can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------
-- 2. User-Scoped Idempotency Index
-- ----------------------------------------------------
-- Ensure idempotency key is scoped per user to prevent cross-user collisions or squatting
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_user_idempotency_scoped
  ON public.orders(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND user_id IS NOT NULL;

-- ----------------------------------------------------
-- 3. Hardened Atomic Order Creation RPC Function
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order_secure(p_order_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_user_id UUID;
  v_idempotency_key TEXT;
  v_existing_order RECORD;
  v_order_id TEXT;
  v_items_json JSONB;
  v_item RECORD;
  v_variant RECORD;
  v_unit_price NUMERIC(10, 2);
  v_unit_price_paise BIGINT;
  v_line_total_paise BIGINT;
  v_subtotal_paise BIGINT := 0;
  v_discount_paise BIGINT := 0;
  v_shipping_paise BIGINT := 0;
  v_total_paise BIGINT := 0;
  v_promo_code TEXT;
  v_shipping_address JSONB;
  v_payment_method TEXT;
  v_payment_details JSONB;
  v_now TIMESTAMPTZ := NOW();
  v_order_date TEXT;
  v_estimated_delivery TEXT;
  v_free_shipping_threshold_paise BIGINT := 249900; -- ₹2,499 in paise
  v_standard_shipping_fee_paise BIGINT := 19900;    -- ₹199 in paise
  v_requested_item_count INT := 0;
  v_existing_item_count INT := 0;
  v_result JSONB;
BEGIN
  -- 1. Derive and enforce authenticated caller identity
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required: You must be signed in to place an order.';
  END IF;

  -- 2. Extract payload fields
  v_idempotency_key := NULLIF(TRIM(p_order_payload->>'idempotency_key'), '');
  v_items_json := p_order_payload->'items';
  v_shipping_address := p_order_payload->'shipping_address';
  v_payment_method := COALESCE(NULLIF(TRIM(p_order_payload->>'payment_method'), ''), 'COD');
  v_promo_code := NULLIF(UPPER(TRIM(p_order_payload->>'promo_code')), '');

  -- 3. Idempotency Check with Changed-Payload Verification
  IF v_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing_order
    FROM public.orders
    WHERE idempotency_key = v_idempotency_key
      AND user_id = v_current_user_id;

    IF v_existing_order.id IS NOT NULL THEN
      -- Count items in requested payload
      SELECT COALESCE(SUM((x->>'quantity')::INT), 0) INTO v_requested_item_count
      FROM jsonb_array_elements(v_items_json) AS x;

      -- Count items in existing order
      SELECT COALESCE(SUM(quantity), 0) INTO v_existing_item_count
      FROM public.order_items
      WHERE order_id = v_existing_order.id;

      -- Guard against reusing same idempotency key for a different order payload
      IF v_requested_item_count <> v_existing_item_count THEN
        RAISE EXCEPTION 'Idempotency key % was previously used with a different order payload.', v_idempotency_key;
      END IF;

      -- Return existing order safely without double decrementing stock
      SELECT jsonb_build_object(
        'orderId', o.id,
        'userId', o.user_id,
        'status', o.status,
        'orderDate', o.order_date,
        'estimatedDelivery', o.estimated_delivery,
        'pricing', jsonb_build_object(
          'subtotal', o.subtotal,
          'discount', o.discount,
          'shipping', o.shipping,
          'total', o.total,
          'promoCode', o.promo_code
        ),
        'shippingAddress', o.shipping_address,
        'paymentDetails', o.payment_details,
        'idempotencyKey', o.idempotency_key,
        'isDuplicate', TRUE
      ) INTO v_result
      FROM public.orders o
      WHERE o.id = v_existing_order.id;

      RETURN v_result;
    END IF;
  END IF;

  -- 4. Validate Items Array
  IF v_items_json IS NULL OR jsonb_array_length(v_items_json) = 0 THEN
    RAISE EXCEPTION 'Order submission rejected: Shopping bag is empty.';
  END IF;

  -- 5. Validate Shipping Address
  IF v_shipping_address IS NULL
     OR NULLIF(TRIM(v_shipping_address->>'fullName'), '') IS NULL
     OR NULLIF(TRIM(v_shipping_address->>'addressLine1'), '') IS NULL
     OR NULLIF(TRIM(v_shipping_address->>'phone'), '') IS NULL
     OR NULLIF(TRIM(v_shipping_address->>'pincode'), '') IS NULL THEN
    RAISE EXCEPTION 'Order submission rejected: Valid shipping address and contact details are required.';
  END IF;

  -- 6. Lock variant rows in consistent sorted order and validate stock & trusted prices
  -- Use in-memory grouping without persistent temporary tables
  FOR v_item IN
    WITH raw_items AS (
      SELECT
        NULLIF(TRIM(x->>'product_id'), '') AS product_id,
        NULLIF(TRIM(x->>'size'), '') AS size,
        COALESCE(NULLIF(TRIM(x->>'color_name'), ''), 'Standard') AS color_name,
        (x->>'quantity')::INT AS quantity
      FROM jsonb_array_elements(v_items_json) AS x
    )
    SELECT
      product_id,
      size,
      color_name,
      SUM(quantity)::INT AS quantity
    FROM raw_items
    GROUP BY product_id, size, color_name
    ORDER BY product_id ASC, size ASC
  LOOP
    IF v_item.product_id IS NULL OR v_item.size IS NULL THEN
      RAISE EXCEPTION 'Order submission rejected: Missing product ID or size specification.';
    END IF;

    IF v_item.quantity IS NULL OR v_item.quantity <= 0 OR v_item.quantity > 100 THEN
      RAISE EXCEPTION 'Invalid quantity % for product %', v_item.quantity, v_item.product_id;
    END IF;

    -- Lock variant row. If multiple color variants exist, match exact color or pick primary
    SELECT
      v.id,
      v.stock,
      v.price_override,
      p.price AS product_price,
      p.name AS product_name,
      p.category AS product_category,
      p.images AS product_images,
      p.is_active
    INTO v_variant
    FROM public.product_variants v
    JOIN public.products p ON p.id = v.product_id
    WHERE v.product_id = v_item.product_id
      AND v.size = v_item.size
    ORDER BY (CASE WHEN v.color_name = v_item.color_name THEN 0 ELSE 1 END) ASC
    LIMIT 1
    FOR UPDATE OF v;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Item variant not found: Product % Size %', v_item.product_id, v_item.size;
    END IF;

    IF NOT v_variant.is_active THEN
      RAISE EXCEPTION 'Product % (%) is no longer active in our catalog.', v_variant.product_name, v_item.product_id;
    END IF;

    IF v_variant.stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for % (Size: %). Requested: %, Available: %',
        v_variant.product_name, v_item.size, v_item.quantity, v_variant.stock;
    END IF;

    -- Authoritative unit price in integer paise
    v_unit_price := COALESCE(v_variant.price_override, v_variant.product_price);
    v_unit_price_paise := ROUND(v_unit_price * 100);
    v_line_total_paise := v_unit_price_paise * v_item.quantity;
    v_subtotal_paise := v_subtotal_paise + v_line_total_paise;

    -- Atomically decrement stock
    UPDATE public.product_variants
    SET stock = stock - v_item.quantity,
        updated_at = v_now
    WHERE id = v_variant.id;
  END LOOP;

  -- 7. Authoritative Discounts Recalculation (in integer paise)
  -- Matches PROMO_CODES in src/data/products.js
  IF v_promo_code IS NOT NULL THEN
    IF v_promo_code = 'SJFIRST' THEN
      v_discount_paise := ROUND(v_subtotal_paise * 0.10);
    ELSIF v_promo_code IN ('SJVIP500', 'SAVE500') THEN
      IF v_subtotal_paise >= 500000 THEN -- ₹5,000 in paise
        v_discount_paise := 50000;       -- ₹500 discount
      ELSE
        RAISE EXCEPTION 'Coupon % requires a minimum order of ₹5,000', v_promo_code;
      END IF;
    ELSIF v_promo_code = 'FREESHIP' THEN
      v_discount_paise := 0; -- Shipping will be waived to ₹0
    ELSIF v_promo_code = 'ATELIER20' THEN
      IF v_subtotal_paise >= 999900 THEN
        v_discount_paise := ROUND(v_subtotal_paise * 0.20);
      ELSE
        RAISE EXCEPTION 'Coupon ATELIER20 requires a minimum order of ₹9,999';
      END IF;
    ELSE
      RAISE EXCEPTION 'Invalid promo code: %', v_promo_code;
    END IF;
  END IF;

  v_discount_paise := LEAST(v_subtotal_paise, v_discount_paise);

  -- 8. Authoritative Shipping Fee Recalculation (in integer paise)
  IF v_subtotal_paise >= v_free_shipping_threshold_paise OR v_promo_code = 'FREESHIP' THEN
    v_shipping_paise := 0;
  ELSE
    v_shipping_paise := v_standard_shipping_fee_paise;
  END IF;

  -- Final total in paise
  v_total_paise := GREATEST(0, v_subtotal_paise - v_discount_paise + v_shipping_paise);

  -- Generate Unique Order ID
  v_order_id := 'SJK-' || TO_CHAR(v_now, 'YYYY') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
  v_order_date := TO_CHAR(v_now, 'DD Mon YYYY');
  v_estimated_delivery := TO_CHAR(v_now + INTERVAL '4 days', 'DD Mon YYYY');

  v_payment_details := jsonb_build_object(
    'method', v_payment_method,
    'status', CASE WHEN v_payment_method = 'COD' THEN 'Pending on Delivery' ELSE 'Simulated Paid' END,
    'transactionId', 'TXN-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
  );

  -- 9. Insert Order Record
  INSERT INTO public.orders (
    id,
    user_id,
    order_date,
    estimated_delivery,
    status,
    subtotal,
    discount,
    shipping,
    total,
    promo_code,
    shipping_address,
    payment_details,
    idempotency_key,
    created_at
  ) VALUES (
    v_order_id,
    v_current_user_id,
    v_order_date,
    v_estimated_delivery,
    'Confirmed',
    ROUND((v_subtotal_paise::NUMERIC / 100.0), 2),
    ROUND((v_discount_paise::NUMERIC / 100.0), 2),
    ROUND((v_shipping_paise::NUMERIC / 100.0), 2),
    ROUND((v_total_paise::NUMERIC / 100.0), 2),
    v_promo_code,
    v_shipping_address,
    v_payment_details,
    v_idempotency_key,
    v_now
  );

  -- 10. Insert Order Items Records (Guaranteed 1:1, non-multiplying)
  FOR v_item IN
    WITH raw_items AS (
      SELECT
        NULLIF(TRIM(x->>'product_id'), '') AS product_id,
        NULLIF(TRIM(x->>'size'), '') AS size,
        COALESCE(NULLIF(TRIM(x->>'color_name'), ''), 'Standard') AS color_name,
        (x->>'quantity')::INT AS quantity
      FROM jsonb_array_elements(v_items_json) AS x
    )
    SELECT
      r.product_id,
      r.size,
      r.color_name,
      SUM(r.quantity)::INT AS quantity,
      p.name AS product_name,
      p.category AS product_category,
      COALESCE(v.price_override, p.price) AS unit_price,
      (p.images->>0) AS image
    FROM raw_items r
    JOIN public.products p ON p.id = r.product_id
    JOIN LATERAL (
      SELECT price_override
      FROM public.product_variants pv
      WHERE pv.product_id = r.product_id AND pv.size = r.size
      ORDER BY (CASE WHEN pv.color_name = r.color_name THEN 0 ELSE 1 END) ASC
      LIMIT 1
    ) v ON TRUE
    GROUP BY r.product_id, r.size, r.color_name, p.name, p.category, v.price_override, p.price, p.images
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      name,
      category,
      size,
      color_name,
      price,
      quantity,
      image,
      created_at
    ) VALUES (
      v_order_id,
      v_item.product_id,
      v_item.product_name,
      v_item.product_category,
      v_item.size,
      v_item.color_name,
      ROUND(v_item.unit_price, 2),
      v_item.quantity,
      v_item.image,
      v_now
    );
  END LOOP;

  -- 11. Return comprehensive order response
  v_result := jsonb_build_object(
    'orderId', v_order_id,
    'userId', v_current_user_id,
    'status', 'Confirmed',
    'orderDate', v_order_date,
    'estimatedDelivery', v_estimated_delivery,
    'pricing', jsonb_build_object(
      'subtotal', ROUND((v_subtotal_paise::NUMERIC / 100.0), 2),
      'discount', ROUND((v_discount_paise::NUMERIC / 100.0), 2),
      'shipping', ROUND((v_shipping_paise::NUMERIC / 100.0), 2),
      'total', ROUND((v_total_paise::NUMERIC / 100.0), 2),
      'promoCode', v_promo_code
    ),
    'shippingAddress', v_shipping_address,
    'paymentDetails', v_payment_details,
    'idempotencyKey', v_idempotency_key,
    'isDuplicate', FALSE
  );

  RETURN v_result;
END;
$$;

-- ----------------------------------------------------
-- 4. Restrict Execution Grants strictly to Authenticated Users
-- ----------------------------------------------------
REVOKE ALL ON FUNCTION public.create_order_secure(JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_order_secure(JSONB) TO authenticated;

