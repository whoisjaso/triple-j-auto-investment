-- ================================================================
-- TRIPLE J AUTO INVESTMENT - DATABASE SCHEMA
-- ================================================================
-- This schema creates the database structure for the production system
-- Run this in Supabase SQL Editor after creating your project
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- PROFILES TABLE
-- ================================================================
-- Extends Supabase auth.users with admin flags and metadata
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- ================================================================
-- VEHICLES TABLE
-- ================================================================
-- Stores all vehicle inventory data
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vin TEXT UNIQUE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,

  -- Financial tracking
  cost DECIMAL(10, 2) DEFAULT 0,
  cost_towing DECIMAL(10, 2) DEFAULT 0,
  cost_mechanical DECIMAL(10, 2) DEFAULT 0,
  cost_cosmetic DECIMAL(10, 2) DEFAULT 0,
  cost_other DECIMAL(10, 2) DEFAULT 0,
  sold_price DECIMAL(10, 2),
  sold_date TIMESTAMPTZ,

  -- Vehicle details
  mileage INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Available', 'Pending', 'Sold', 'Wholesale')),
  description TEXT,
  image_url TEXT,
  gallery JSONB DEFAULT '[]'::jsonb,
  diagnostics JSONB DEFAULT '[]'::jsonb,

  -- Registration tracking
  registration_status TEXT CHECK (registration_status IN ('Pending', 'Submitted', 'Processing', 'Completed')),
  registration_due_date DATE,
  date_added DATE DEFAULT CURRENT_DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- LEADS TABLE
-- ================================================================
-- Stores customer inquiries and lead information
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  interest TEXT NOT NULL,
  status TEXT DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Closed')),
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_vin ON public.vehicles(vin);
CREATE INDEX idx_vehicles_date_added ON public.vehicles(date_added DESC);
CREATE INDEX idx_vehicles_registration_status ON public.vehicles(registration_status);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_date ON public.leads(date DESC);
CREATE INDEX idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- ================================================================
-- UPDATED_AT TRIGGER
-- ================================================================
-- Automatically update updated_at timestamp on vehicle changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================
-- Enable RLS on all tables
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Public can view available/pending vehicles
CREATE POLICY "Public can view available vehicles" ON public.vehicles
  FOR SELECT USING (status IN ('Available', 'Pending'));

-- Admins can do everything with vehicles (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can select vehicles" ON public.vehicles
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

CREATE POLICY "Admins can insert vehicles" ON public.vehicles
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

CREATE POLICY "Admins can update vehicles" ON public.vehicles
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

CREATE POLICY "Admins can delete vehicles" ON public.vehicles
  FOR DELETE USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

-- Admins can manage leads (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can select leads" ON public.leads
  FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

CREATE POLICY "Admins can insert leads" ON public.leads
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

CREATE POLICY "Admins can update leads" ON public.leads
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

CREATE POLICY "Admins can delete leads" ON public.leads
  FOR DELETE USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

-- Anyone can insert leads (public contact form)
CREATE POLICY "Anyone can create leads" ON public.leads
  FOR INSERT WITH CHECK (true);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (for last_login updates)
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

-- ================================================================
-- HELPER FUNCTION: Auto-create profile on user signup
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (NEW.id, NEW.email, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create your admin user in Authentication tab';
  RAISE NOTICE '2. Run: UPDATE public.profiles SET is_admin = true WHERE email = ''your-email@example.com'';';
  RAISE NOTICE '3. Configure your .env.local with Supabase credentials';
END $$;
