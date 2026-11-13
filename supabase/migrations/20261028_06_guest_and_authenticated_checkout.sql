-- ====================================================================
-- SJ STUDIO / SJ KICKS Unified Guest & Authenticated Checkout Architecture
-- Migration: 20261028_06_guest_and_authenticated_checkout.sql
-- Security Hardened:
-- 1. Genuine guest checkout without account creation (auth.uid() IS NULL)
-- 2. Authenticated customer checkout (auth.uid() IS NOT NULL)
-- 3. Cryptographically secure 256-bit guest access tokens generated exclusively on server
-- 4. Fail-closed CSPRNG requirement: strictly extensions.gen_random_bytes() with abort on failure
-- 5. Strict separation between idempotency key and guest access token
-- 6. Correct idempotency uniqueness: user-scoped for auth users, guest-scoped for guests
-- 7. Complete normalized payload comparison on idempotency retry (items, variants, shipping, payment, promo)
-- 8. Zero disclosure of guest access tokens on idempotency retries or guest lookups
-- 9. Online payments remain in "Pending Payment" state until verified gateway confirmation
-- 10. Strict exact variant matching (size AND color) without silent substitution
-- 11. Transaction-level advisory lock on idempotency key for safe concurrent execution
-- ====================================================================

-- 0. Ensure pgcrypto extension is installed and located in extensions schema
DO $$
BEGIN
  CREATE SCHEMA IF NOT EXISTS extensions;

  IF EXISTS (
    SELECT 1
    FROM pg_extension e
    JOIN pg_namespace n ON e.extnamespace = n.oid
    WHERE e.extname = 'pgcrypto' AND n.nspname <> 'extensions'
  ) THEN
    ALTER EXTENSION pgcrypto SET SCHEMA extensions;
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
  ) THEN
    CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
  END IF;
END $$;

-- ----------------------------------------------------
-- 1. Schema Enhancement: Add guest_access_token & idempotency_key
-- ----------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'orders'
    AND column_name = 'guest_access_token'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN guest_access_token TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'orders'
    AND column_name = 'idempotency_key'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN idempotency_key TEXT;
  END IF;
END $$;

-- Drop any legacy global unique constraint/index from earlier migrations
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_idempotency_key_key;
DROP INDEX IF EXISTS public.idx_orders_idempotency;

-- Unique index for guest access tokens
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_guest_access_token
  ON public.orders(guest_access_token)
  WHERE guest_access_token IS NOT NULL;

-- Unique index for authenticated users: scoped strictly by (user_id, idempotency_key)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_authenticated_idempotency
  ON public.orders(user_id, idempotency_key)
  WHERE user_id IS NOT NULL AND idempotency_key IS NOT NULL;

-- Unique index for guest users: scoped exclusively to guest orders (user_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_guest_idempotency
  ON public.orders(idempotency_key)
  WHERE user_id IS NULL AND idempotency_key IS NOT NULL;

-- ----------------------------------------------------
-- 2. Hardened Table RLS Policies
-- ----------------------------------------------------
-- Direct table SELECT: Authenticated users view their own; Admins view all.
-- Anonymous guests CANNOT query orders or order_items table directly.
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR public.is_admin()
  );

-- Direct table INSERT: Disallow direct customer/guest writes to prevent bypassing price & stock checks.
-- All orders must be created via create_order_secure RPC.
DROP POLICY IF EXISTS "Admins can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Admins can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items for their orders" ON public.order_items;
CREATE POLICY "Admins can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (public.is_admin());

-- Harden is_admin helper with safe search path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- ----------------------------------------------------
-- 3. Unified create_order_secure RPC Function
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order_secure(p_order_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_current_user_id UUID;
  v_guest_access_token TEXT := NULL;
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
  v_payload_mismatch BOOLEAN := FALSE;
  v_result JSONB;
BEGIN
  -- 1. Determine Identity Safely
  -- If authenticated: bind strictly to auth.uid().
  -- If unauthenticated: user_id is forced to NULL (never trust client user_id).
  v_current_user_id := auth.uid();

  -- Extract idempotency key early
  v_idempotency_key := NULLIF(TRIM(p_order_payload->>'idempotency_key'), '');

  -- Transaction-level advisory lock on idempotency key to prevent race conditions during concurrent requests
  IF v_idempotency_key IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('sjk_order_idem_' || COALESCE(v_current_user_id::TEXT, 'guest') || '_' || v_idempotency_key));
  END IF;

  IF v_current_user_id IS NULL THEN
    -- Generate cryptographically secure 256-bit (32 bytes) random token via CSPRNG exclusively on the server.
    -- Client-provided guest access tokens are NEVER accepted.
    -- Fail closed: abort immediately if extensions.gen_random_bytes is unavailable.
    BEGIN
      v_guest_access_token := 'gst_' || encode(extensions.gen_random_bytes(32), 'hex');
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Cryptographic failure: Secure random byte generator (extensions.gen_random_bytes) is unavailable. Guest order creation aborted.';
    END;
  ELSE
    v_guest_access_token := NULL;
  END IF;

  -- 2. Extract payload fields
  v_items_json := p_order_payload->'items';
  v_shipping_address := p_order_payload->'shipping_address';
  v_payment_method := COALESCE(NULLIF(TRIM(p_order_payload->>'payment_method'), ''), 'COD');
  v_promo_code := NULLIF(UPPER(TRIM(p_order_payload->>'promo_code')), '');

  -- 3. Idempotency Check with Safe Retry & Anti-Disclosure Protections
  IF v_idempotency_key IS NOT NULL THEN
    IF v_current_user_id IS NOT NULL THEN
      -- Authenticated user: scoped strictly to current user
      SELECT * INTO v_existing_order
      FROM public.orders
      WHERE idempotency_key = v_idempotency_key
        AND user_id = v_current_user_id;

      IF v_existing_order.id IS NOT NULL THEN
        -- Complete normalized payload comparison: items, variants, quantities, shipping, payment, promo
        WITH req_items AS (
          SELECT
            NULLIF(TRIM(x->>'product_id'), '') AS product_id,
            NULLIF(TRIM(x->>'size'), '') AS size,
            COALESCE(NULLIF(TRIM(x->>'color_name'), ''), 'Standard') AS color_name,
            SUM((x->>'quantity')::INT)::INT AS quantity
          FROM jsonb_array_elements(v_items_json) AS x
          GROUP BY 1, 2, 3
        ),
        exist_items AS (
          SELECT
            product_id,
            size,
            COALESCE(color_name, 'Standard') AS color_name,
            SUM(quantity)::INT AS quantity
          FROM public.order_items
          WHERE order_id = v_existing_order.id
          GROUP BY 1, 2, 3
        )
        SELECT EXISTS (
          (SELECT product_id, size, color_name, quantity FROM req_items
           EXCEPT
           SELECT product_id, size, color_name, quantity FROM exist_items)
          UNION ALL
          (SELECT product_id, size, color_name, quantity FROM exist_items
           EXCEPT
           SELECT product_id, size, color_name, quantity FROM req_items)
        ) INTO v_payload_mismatch;

        IF v_payload_mismatch
           OR COALESCE(v_existing_order.payment_details->>'method', '') <> v_payment_method
           OR COALESCE(v_existing_order.promo_code, '') <> COALESCE(v_promo_code, '')
           OR COALESCE(v_existing_order.shipping_address->>'fullName', '') <> COALESCE(v_shipping_address->>'fullName', '')
           OR COALESCE(v_existing_order.shipping_address->>'addressLine1', '') <> COALESCE(v_shipping_address->>'addressLine1', '')
           OR COALESCE(v_existing_order.shipping_address->>'phone', '') <> COALESCE(v_shipping_address->>'phone', '')
           OR COALESCE(v_existing_order.shipping_address->>'pincode', '') <> COALESCE(v_shipping_address->>'pincode', '') THEN
          RAISE EXCEPTION 'Idempotency key % was previously used with a different order payload.', v_idempotency_key;
        END IF;

        SELECT jsonb_build_object(
          'orderId', o.id,
          'userId', o.user_id,
          'guestAccessToken', NULL,
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

    ELSE
      -- Guest order idempotency check
      SELECT * INTO v_existing_order
      FROM public.orders
      WHERE idempotency_key = v_idempotency_key;

      IF v_existing_order.id IS NOT NULL THEN
        -- Prevent guest key from colliding with an authenticated customer order
        IF v_existing_order.user_id IS NOT NULL THEN
          RAISE EXCEPTION 'Idempotency key collision across user accounts.';
        END IF;

        -- Complete normalized payload comparison: items, variants, quantities, shipping, payment, promo
        WITH req_items AS (
          SELECT
            NULLIF(TRIM(x->>'product_id'), '') AS product_id,
            NULLIF(TRIM(x->>'size'), '') AS size,
            COALESCE(NULLIF(TRIM(x->>'color_name'), ''), 'Standard') AS color_name,
            SUM((x->>'quantity')::INT)::INT AS quantity
          FROM jsonb_array_elements(v_items_json) AS x
          GROUP BY 1, 2, 3
        ),
        exist_items AS (
          SELECT
            product_id,
            size,
            COALESCE(color_name, 'Standard') AS color_name,
            SUM(quantity)::INT AS quantity
          FROM public.order_items
          WHERE order_id = v_existing_order.id
          GROUP BY 1, 2, 3
        )
        SELECT EXISTS (
          (SELECT product_id, size, color_name, quantity FROM req_items
           EXCEPT
           SELECT product_id, size, color_name, quantity FROM exist_items)
          UNION ALL
          (SELECT product_id, size, color_name, quantity FROM exist_items
           EXCEPT
           SELECT product_id, size, color_name, quantity FROM req_items)
        ) INTO v_payload_mismatch;

        IF v_payload_mismatch
           OR COALESCE(v_existing_order.payment_details->>'method', '') <> v_payment_method
           OR COALESCE(v_existing_order.promo_code, '') <> COALESCE(v_promo_code, '')
           OR COALESCE(v_existing_order.shipping_address->>'fullName', '') <> COALESCE(v_shipping_address->>'fullName', '')
           OR COALESCE(v_existing_order.shipping_address->>'addressLine1', '') <> COALESCE(v_shipping_address->>'addressLine1', '')
           OR COALESCE(v_existing_order.shipping_address->>'phone', '') <> COALESCE(v_shipping_address->>'phone', '')
           OR COALESCE(v_existing_order.shipping_address->>'pincode', '') <> COALESCE(v_shipping_address->>'pincode', '') THEN
          RAISE EXCEPTION 'Idempotency key % was previously used with a different order payload.', v_idempotency_key;
        END IF;

        -- Verified legitimate guest retry: DO NOT disclose guest access token merely because caller knows idempotency key!
        SELECT jsonb_build_object(
          'orderId', o.id,
          'userId', NULL,
          'guestAccessToken', NULL,
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
  END IF;

  -- 4. Validate Items Array & Anti-Abuse Volume Threshold
  IF v_items_json IS NULL OR jsonb_array_length(v_items_json) = 0 THEN
    RAISE EXCEPTION 'Order submission rejected: Shopping bag is empty.';
  END IF;

  SELECT COALESCE(SUM((x->>'quantity')::INT), 0) INTO v_requested_item_count
  FROM jsonb_array_elements(v_items_json) AS x;

  IF v_requested_item_count > 30 THEN
    RAISE EXCEPTION 'Order submission rejected: Maximum volume of 30 units exceeded.';
  END IF;

  -- 5. Validate Shipping Address & Contact Details
  IF v_shipping_address IS NULL
     OR NULLIF(TRIM(v_shipping_address->>'fullName'), '') IS NULL
     OR NULLIF(TRIM(v_shipping_address->>'addressLine1'), '') IS NULL
     OR NULLIF(TRIM(v_shipping_address->>'phone'), '') IS NULL
     OR NULLIF(TRIM(v_shipping_address->>'pincode'), '') IS NULL THEN
    RAISE EXCEPTION 'Order submission rejected: Valid shipping address and contact details are required.';
  END IF;

  -- 6. Lock variant rows in consistent sorted order and validate stock & trusted prices
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
    ORDER BY product_id ASC, size ASC, color_name ASC
  LOOP
    IF v_item.product_id IS NULL OR v_item.size IS NULL THEN
      RAISE EXCEPTION 'Order submission rejected: Missing product ID or size specification.';
    END IF;

    -- Strict per-variant quantity cap to protect inventory from automated depletion
    IF v_item.quantity IS NULL OR v_item.quantity <= 0 OR v_item.quantity > 10 THEN
      RAISE EXCEPTION 'Invalid quantity % for product %. Maximum limit is 10 units per item.', v_item.quantity, v_item.product_id;
    END IF;

    -- Lock variant row in sorted order.
    -- Strict exact match on product_id, size, AND color_name.
    -- Never silently substitute another color or variant.
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
      AND (
        v.color_name = v_item.color_name
        OR (v.color_name IS NULL AND v_item.color_name = 'Standard')
      )
    FOR UPDATE OF v;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Item variant not found: Product % Size % Color %', v_item.product_id, v_item.size, v_item.color_name;
    END IF;

    IF NOT v_variant.is_active THEN
      RAISE EXCEPTION 'Product % (%) is no longer active in our catalog.', v_variant.product_name, v_item.product_id;
    END IF;

    IF v_variant.stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for % (Size: %, Color: %). Requested: %, Available: %',
        v_variant.product_name, v_item.size, v_item.color_name, v_item.quantity, v_variant.stock;
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
  IF v_promo_code IS NOT NULL THEN
    IF v_promo_code = 'SJFIRST' THEN
      v_discount_paise := ROUND(v_subtotal_paise * 0.10);
    ELSIF v_promo_code IN ('SJVIP500', 'SAVE500') THEN
      IF v_subtotal_paise >= 500000 THEN -- ₹5,000 threshold in paise
        v_discount_paise := 50000;       -- ₹500 discount
      ELSE
        RAISE EXCEPTION 'Coupon % requires a minimum order of ₹5,000', v_promo_code;
      END IF;
    ELSIF v_promo_code = 'FREESHIP' THEN
      v_discount_paise := 0; -- Shipping waived below
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

  -- Generate Unique Order ID with at least 128 bits of CSPRNG entropy & database collision retry
  LOOP
    BEGIN
      v_order_id := 'SJK-' || TO_CHAR(v_now, 'YYYY') || '-' || UPPER(encode(extensions.gen_random_bytes(16), 'hex'));
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Cryptographic failure: Secure random byte generator (extensions.gen_random_bytes) is unavailable. Order ID generation aborted.';
    END;

    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE id = v_order_id);
  END LOOP;
  v_order_date := TO_CHAR(v_now, 'DD Mon YYYY');
  v_estimated_delivery := TO_CHAR(v_now + INTERVAL '4 days', 'DD Mon YYYY');

  -- Task 5: Payment security - Never mark online payment as paid without verified payment gateway confirmation.
  BEGIN
    v_payment_details := jsonb_build_object(
      'method', v_payment_method,
      'status', CASE WHEN v_payment_method = 'COD' THEN 'Pending on Delivery' ELSE 'Pending Payment' END,
      'transactionId', 'TXN-' || UPPER(encode(extensions.gen_random_bytes(16), 'hex'))
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Cryptographic failure: Secure random byte generator (extensions.gen_random_bytes) is unavailable. Transaction ID generation aborted.';
  END;

  -- 9. Insert Order Record
  INSERT INTO public.orders (
    id,
    user_id,
    guest_access_token,
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
    v_guest_access_token,
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

  -- 10. Insert Order Items Records with exact variant match
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
      WHERE pv.product_id = r.product_id
        AND pv.size = r.size
        AND (
          pv.color_name = r.color_name
          OR (pv.color_name IS NULL AND r.color_name = 'Standard')
        )
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
  -- Guest access token is returned ONLY on initial order creation (isDuplicate = FALSE)
  v_result := jsonb_build_object(
    'orderId', v_order_id,
    'userId', v_current_user_id,
    'guestAccessToken', v_guest_access_token,
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
-- 4. Secure Guest Order Lookup RPC Function
-- ----------------------------------------------------
-- Requires BOTH valid order ID and matching 256-bit guest access token.
-- Strictly restricted to unowned (user_id IS NULL) guest orders.
-- Does NOT disclose the guest_access_token in response.
CREATE OR REPLACE FUNCTION public.get_guest_order(p_order_id TEXT, p_guest_access_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_items JSONB;
  v_result JSONB;
BEGIN
  IF p_order_id IS NULL OR p_guest_access_token IS NULL OR TRIM(p_guest_access_token) = '' THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND guest_access_token = p_guest_access_token
    AND user_id IS NULL;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'productId', product_id,
      'name', name,
      'category', category,
      'size', size,
      'color', jsonb_build_object('name', COALESCE(color_name, 'Standard')),
      'price', price,
      'quantity', quantity,
      'image', image
    )
  ) INTO v_items
  FROM public.order_items
  WHERE order_id = v_order.id;

  -- NOTE: guest_access_token is NEVER disclosed in the RPC response!
  v_result := jsonb_build_object(
    'orderId', v_order.id,
    'userId', NULL,
    'status', v_order.status,
    'orderDate', v_order.order_date,
    'estimatedDelivery', v_order.estimated_delivery,
    'pricing', jsonb_build_object(
      'subtotal', v_order.subtotal,
      'discount', v_order.discount,
      'shipping', v_order.shipping,
      'total', v_order.total,
      'promoCode', v_order.promo_code
    ),
    'shippingAddress', v_order.shipping_address,
    'paymentDetails', v_order.payment_details,
    'idempotencyKey', v_order.idempotency_key,
    'items', COALESCE(v_items, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

-- ----------------------------------------------------
-- 5. RPC Execution Permissions
-- ----------------------------------------------------
REVOKE ALL ON FUNCTION public.create_order_secure(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order_secure(JSONB) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_guest_order(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_guest_order(TEXT, TEXT) TO anon, authenticated;
