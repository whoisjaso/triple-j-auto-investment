-- ============================================================
-- v0.2 Phase 9: Automated Inventory Pipeline — Migration
-- Run this in Supabase SQL Editor AFTER v0.1 schema is in place.
-- ============================================================

-- 1. Expand vehicle status CHECK to include pipeline lifecycle stages
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_status_check;
ALTER TABLE vehicles ADD CONSTRAINT vehicles_status_check
  CHECK (status IN (
    'Bidding',      -- High bid placed at auction
    'Purchased',    -- Purchase confirmed via OVE/Manheim
    'In_Transit',   -- Transport accepted/picked up via Central Dispatch
    'Arrived',      -- Delivered to lot
    'Inspection',   -- Under inspection before listing
    'Available',    -- Listed on website (public-facing)
    'Pending',      -- Sale in progress
    'Sold'          -- Sale complete
  ));

-- 2. Add pipeline-specific columns to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS trim text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS purchase_price numeric(10, 2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS buy_fee numeric(10, 2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS total_cost numeric(10, 2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS seller_name text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS auction_location text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS work_order_number text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS stock_number text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS guarantee_expires_at timestamptz;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS guarantee_price numeric(10, 2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transport_carrier text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transport_load_id text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transport_cost numeric(10, 2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transport_pickup_eta timestamptz;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transport_delivery_eta timestamptz;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS source_email_id text;

-- 3. Create vehicle_events audit trail table
CREATE TABLE IF NOT EXISTS vehicle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  event_type text NOT NULL
    CHECK (event_type IN (
      'high_bid',
      'purchased',
      'guarantee_confirmed',
      'transport_accepted',
      'transport_picked_up',
      'transport_delivered',
      'arrived',
      'inspection_started',
      'listed',
      'status_changed'
    )),
  event_data jsonb DEFAULT '{}',
  source_email_id text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_events_vehicle_id
  ON vehicle_events (vehicle_id, created_at DESC);

-- 4. RLS for vehicle_events
ALTER TABLE vehicle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can view vehicle events"
  ON vehicle_events FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon can insert vehicle events"
  ON vehicle_events FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Admin full access to vehicle events"
  ON vehicle_events FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Index on pipeline statuses for admin queries
CREATE INDEX IF NOT EXISTS idx_vehicles_pipeline_status
  ON vehicles (status, updated_at DESC)
  WHERE status NOT IN ('Available', 'Pending', 'Sold');
