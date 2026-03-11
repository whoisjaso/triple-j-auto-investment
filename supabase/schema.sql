-- Triple J Auto Investment — Database Schema (v0.1 + v0.2 Pipeline)
-- Run this in your Supabase SQL Editor to create the tables.

-- ============================================================
-- VEHICLES
-- ============================================================

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text not null,
  year integer not null,
  price numeric(10, 2) not null,
  mileage integer not null,
  vin text not null unique,
  status text not null default 'Available'
    check (status in ('Bidding', 'Purchased', 'In_Transit', 'Arrived', 'Inspection', 'Available', 'Pending', 'Sold')),
  description text,
  image_url text,
  gallery text[] default '{}',
  slug text not null unique,
  body_style text,
  exterior_color text,
  interior_color text,
  transmission text,
  drivetrain text,
  engine text,
  fuel_type text,
  date_added timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- v0.2 Pipeline columns
  trim text,
  purchase_price numeric(10, 2),
  buy_fee numeric(10, 2),
  total_cost numeric(10, 2),
  seller_name text,
  auction_location text,
  work_order_number text,
  stock_number text,
  guarantee_expires_at timestamptz,
  guarantee_price numeric(10, 2),
  transport_carrier text,
  transport_load_id text,
  transport_cost numeric(10, 2),
  transport_pickup_eta timestamptz,
  transport_delivery_eta timestamptz,
  source_email_id text
);

create index if not exists idx_vehicles_status on vehicles (status);
create index if not exists idx_vehicles_slug on vehicles (slug);

-- ============================================================
-- LEADS
-- ============================================================

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text not null,
  message text,
  vehicle_id uuid references vehicles(id) on delete set null,
  source text not null default 'contact_form'
    check (source in ('contact_form', 'financing_inquiry', 'vehicle_inquiry', 'schedule_visit')),
  status text not null default 'New'
    check (status in ('New', 'Contacted', 'Qualified', 'Appointment', 'Negotiation', 'Sold', 'Lost')),
  created_at timestamptz default now()
);

create index if not exists idx_leads_status on leads (status);
create index if not exists idx_leads_created_at on leads (created_at desc);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger vehicles_updated_at
  before update on vehicles
  for each row
  execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table vehicles enable row level security;
alter table leads enable row level security;

-- Public can browse available vehicles
create policy "Public can view vehicles"
  on vehicles for select
  to anon
  using (true);

-- Public can submit leads
create policy "Public can submit leads"
  on leads for insert
  to anon
  with check (true);

-- Authenticated users (admin) have full access to vehicles
create policy "Admin full access to vehicles"
  on vehicles for all
  to authenticated
  using (true)
  with check (true);

-- Authenticated users (admin) have full access to leads
create policy "Admin full access to leads"
  on leads for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- VEHICLE EVENTS (v0.2 Pipeline Audit Trail)
-- ============================================================

create table if not exists vehicle_events (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  event_type text not null
    check (event_type in (
      'high_bid', 'purchased', 'guarantee_confirmed',
      'transport_accepted', 'transport_picked_up', 'transport_delivered',
      'arrived', 'inspection_started', 'listed', 'status_changed'
    )),
  event_data jsonb default '{}',
  source_email_id text,
  created_at timestamptz default now()
);

create index if not exists idx_vehicle_events_vehicle_id
  on vehicle_events (vehicle_id, created_at desc);

alter table vehicle_events enable row level security;

create policy "Anon can view vehicle events"
  on vehicle_events for select to anon using (true);

create policy "Anon can insert vehicle events"
  on vehicle_events for insert to anon with check (true);

create policy "Admin full access to vehicle events"
  on vehicle_events for all to authenticated using (true) with check (true);

-- ============================================================
-- LEAD NOTES (v0.2 CRM Communication Log)
-- ============================================================

create table if not exists lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  content text not null,
  note_type text not null default 'note'
    check (note_type in ('call', 'text', 'email', 'visit', 'note')),
  created_at timestamptz default now()
);

create index if not exists idx_lead_notes_lead_id on lead_notes(lead_id);
create index if not exists idx_lead_notes_created_at on lead_notes(created_at desc);

alter table lead_notes enable row level security;

create policy "Admin can manage lead notes"
  on lead_notes for all to anon using (true) with check (true);

-- ============================================================
-- LEAD TASKS (v0.2 CRM Follow-up Reminders)
-- ============================================================

create table if not exists lead_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  title text not null,
  due_date date,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_lead_tasks_lead_id on lead_tasks(lead_id);
create index if not exists idx_lead_tasks_due_date on lead_tasks(due_date) where not completed;

alter table lead_tasks enable row level security;

create policy "Admin can manage lead tasks"
  on lead_tasks for all to anon using (true) with check (true);
