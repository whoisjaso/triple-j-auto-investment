-- Triple J Auto Investment — v0.1 Database Schema
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
    check (status in ('Available', 'Pending', 'Sold')),
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
  updated_at timestamptz default now()
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
    check (status in ('New', 'Contacted', 'Closed')),
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
