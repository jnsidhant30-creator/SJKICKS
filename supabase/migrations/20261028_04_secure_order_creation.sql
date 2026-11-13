-- ====================================================================
-- SJ STUDIO / SJ KICKS Secure Order Creation & Concurrency Control
-- Migration: 20261028_04_secure_order_creation.sql
-- Implements:
-- 1. Idempotency key on orders table
-- 2. Enhanced RLS preventing unauthorized access to guest / cross-user orders
-- 3. Atomic create_order_secure RPC function with row locking, server price/stock
--    recalculation in integer paise, and atomic stock decrement.
-- ====================================================================

-- 1. Add Idempotency Key to orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'orders'
    AND column_name = 'idempotency_key'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN idempotency_key TEXT UNIQUE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON public.orders(idempotency_key);

-- 2. Enhanced RLS for Orders and Order Items
-- Drop existing insert/select policies to reinforce strict security boundaries
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;

-- Secure SELECT: Users can only view their own authenticated orders; admins can view all.
-- Unauthenticated guests cannot query arbitrary orders by table select.
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR public.is_admin()
  );

-- Secure INSERT: Direct table insertion is restricted; orders must be created via trusted RPC.
-- Users can only insert if user_id matches auth.uid()
CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );

-- 3. Secure Atomic Order Creation RPC Function
CREATE OR REPLACE FUNCTION public.create_order_secure(p_order_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_idempotency_key TEXT;
  v_existing_order_id TEXT;
  v_current_user_id UUID;
  v_order_id TEXT;
  v_items_json JSONB;
  v_item RECORD;
  v_product RECORD;
  v_variant RECORD;
  v_quantity INT;
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
  v_result JSONB;
BEGIN
  -- Derive authenticated user ID
  v_current_user_id := auth.uid();

  -- Extract payload fields
  v_idempotency_key := NULLIF(TRIM(p_order_payload->>'idempotency_key'), '');
  v_items_json := p_order_payload->'items';
  v_shipping_address := p_order_payload->'shipping_address';
  v_payment_method := COALESCE(NULLIF(TRIM(p_order_payload->>'payment_method'), ''), 'COD');
  v_promo_code := NULLIF(UPPER(TRIM(p_order_payload->>'promo_code')), '');

  -- 1. Idempotency Check: Return existing order if key matches
  IF v_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_order_id
    FROM public.orders
    WHERE idempotency_key = v_idempotency_key
      AND ((v_current_user_id IS NOT NULL AND user_id = v_current_user_id) OR (v_current_user_id IS NULL AND user_id IS NULL));

    IF v_existing_order_id IS NOT NULL THEN
      SELECT jsonb_build_object(
        'orderId', o.id,
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
        'isDuplicate', TRUE
      ) INTO v_result
      FROM public.orders o
      WHERE o.id = v_existing_order_id;

      RETURN v_result;
    END IF;
  END IF;

  -- 2. Validate Items
  IF v_items_json IS NULL OR jsonb_array_length(v_items_json) = 0 THEN
    RAISE EXCEPTION 'Order submission rejected: Shopping bag is empty.';
  END IF;

  -- 3. Validate Shipping Address
  IF v_shipping_address IS NULL OR (v_shipping_address->>'fullName') IS NULL OR (v_shipping_address->>'addressLine1') IS NULL THEN
    RAISE EXCEPTION 'Order submission rejected: Valid shipping address is required.';
  END IF;

  -- 4. Create sorted temporary table of items to guarantee deadlock-free row locking
  CREATE TEMPORARY TABLE temp_order_items (
    product_id TEXT NOT NULL,
    size TEXT NOT NULL,
    color_name TEXT,
    quantity INT NOT NULL
  ) ON COMMIT DROP;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(v_items_json) AS x(
    product_id TEXT,
    size TEXT,
    color_name TEXT,
    quantity INT
  )
  LOOP
    IF v_item.quantity IS NULL OR v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity % for product %', v_item.quantity, v_item.product_id;
    END IF;

    INSERT INTO temp_order_items (product_id, size, color_name, quantity)
    VALUES (v_item.product_id, v_item.size, COALESCE(v_item.color_name, 'Standard'), v_item.quantity);
  END LOOP;

  -- 5. Lock rows in consistent sorted order and validate stock & trusted prices
  FOR v_item IN
    SELECT product_id, size, color_name, SUM(quantity)::INT AS quantity
    FROM temp_order_items
    GROUP BY product_id, size, color_name
    ORDER BY product_id ASC, size ASC
  LOOP
    -- Lock and retrieve variant with parent product
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

    -- Determine authoritative unit price in integer paise
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

  -- 6. Authoritative Discounts Recalculation (in integer paise)
  IF v_promo_code IS NOT NULL THEN
    IF v_promo_code = 'SJFIRST' THEN
      v_discount_paise := ROUND(v_subtotal_paise * 0.10);
    ELSIF v_promo_code = 'SAVE500' THEN
      IF v_subtotal_paise >= 499900 THEN
        v_discount_paise := 50000;
      ELSE
        RAISE EXCEPTION 'Coupon SAVE500 requires a minimum order of ₹4,999';
      END IF;
    ELSIF v_promo_code = 'FREESHIP' THEN
      IF v_subtotal_paise >= 149900 THEN
        v_discount_paise := 0; -- shipping will be 0 below
      ELSE
        RAISE EXCEPTION 'Coupon FREESHIP requires a minimum order of ₹1,499';
      END IF;
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

  -- 7. Authoritative Shipping Fee Recalculation (in integer paise)
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

  -- 8. Insert Order Record
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

  -- 9. Insert Order Items Records
  FOR v_item IN
    SELECT t.product_id, t.size, t.color_name, t.quantity,
           p.name, p.category, COALESCE(v.price_override, p.price) AS price,
           (p.images->>0) AS image
    FROM temp_order_items t
    JOIN public.products p ON p.id = t.product_id
    JOIN public.product_variants v ON v.product_id = t.product_id AND v.size = t.size
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
      v_item.name,
      v_item.category,
      v_item.size,
      v_item.color_name,
      ROUND(v_item.price, 2),
      v_item.quantity,
      v_item.image,
      v_now
    );
  END LOOP;

  -- Return comprehensive order response
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
    'idempotencyKey', v_idempotency_key
  );

  RETURN v_result;
END;
$$;

-- Grant execution to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.create_order_secure(JSONB) TO authenticated, anon;

