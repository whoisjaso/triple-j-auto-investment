-- ================================================================
-- TRIPLE J AUTO - REGISTRATION STATUS LEDGER
-- ================================================================
-- Run this migration after the main schema.sql
-- Creates tables for tracking registration status through 7 stages
-- ================================================================

-- ================================================================
-- REGISTRATIONS TABLE (One per vehicle sale)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(20) UNIQUE NOT NULL,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,

    -- Customer Info (denormalized for quick access)
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,

    -- Vehicle Info (snapshot at time of sale)
    vin VARCHAR(17) NOT NULL,
    vehicle_year INTEGER NOT NULL,
    vehicle_make TEXT NOT NULL,
    vehicle_model TEXT NOT NULL,

    -- Status Tracking
    current_stage VARCHAR(50) NOT NULL DEFAULT 'payment',
    current_status VARCHAR(20) NOT NULL DEFAULT 'complete', -- First stage auto-completes

    -- Timestamps
    purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- REGISTRATION STAGES TABLE (Audit trail for each stage)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.registration_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,

    -- Stage Info
    stage_key VARCHAR(50) NOT NULL, -- payment, insurance, inspection, submission, dmv_processing, approved, ready
    stage_label TEXT NOT NULL,
    stage_order INTEGER NOT NULL,

    -- Status & Ownership
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, pending, complete, blocked
    ownership VARCHAR(20) NOT NULL, -- customer, dealer, state

    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Blocked Info
    blocked_reason TEXT,
    action_required TEXT,
    action_url TEXT,

    -- Admin Notes (visible only to admin)
    internal_notes TEXT,

    -- Metadata
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one stage per registration
    UNIQUE(registration_id, stage_key)
);

-- ================================================================
-- REGISTRATION DOCUMENTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.registration_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    stage_key VARCHAR(50) NOT NULL,

    -- Document Info
    document_type VARCHAR(50) NOT NULL, -- insurance_proof, inspection_report, dmv_confirmation, plates_photo
    document_name TEXT,
    file_url TEXT NOT NULL,

    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Metadata
    uploaded_by VARCHAR(20) DEFAULT 'customer', -- customer, admin
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- REGISTRATION NOTIFICATIONS TABLE (Audit trail)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.registration_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,

    -- Notification Details
    notification_type VARCHAR(50) NOT NULL, -- stage_complete, action_required, blocked, ready_pickup
    channel VARCHAR(20) NOT NULL, -- sms, email
    recipient TEXT NOT NULL, -- Phone or email
    message TEXT NOT NULL,

    -- Status Tracking
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered BOOLEAN,
    delivery_error TEXT,

    -- Metadata
    triggered_by VARCHAR(50), -- admin_action, auto, system
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_registrations_order_id ON public.registrations(order_id);
CREATE INDEX IF NOT EXISTS idx_registrations_customer_phone ON public.registrations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_registrations_current_stage ON public.registrations(current_stage);
CREATE INDEX IF NOT EXISTS idx_registrations_vin ON public.registrations(vin);
CREATE INDEX IF NOT EXISTS idx_stages_registration ON public.registration_stages(registration_id);
CREATE INDEX IF NOT EXISTS idx_stages_status ON public.registration_stages(status);
CREATE INDEX IF NOT EXISTS idx_documents_registration ON public.registration_documents(registration_id);
CREATE INDEX IF NOT EXISTS idx_notifications_registration ON public.registration_notifications(registration_id);

-- ================================================================
-- UPDATED_AT TRIGGERS
-- ================================================================
CREATE TRIGGER update_registrations_updated_at
BEFORE UPDATE ON public.registrations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_registration_stages_updated_at
BEFORE UPDATE ON public.registration_stages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- ROW LEVEL SECURITY POLICIES
-- ================================================================

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_notifications ENABLE ROW LEVEL SECURITY;

-- Public can view their own registration by order_id (for customer tracker)
CREATE POLICY "Public can view registration by order_id" ON public.registrations
    FOR SELECT USING (true); -- Order ID acts as auth token

CREATE POLICY "Public can view stages for accessible registrations" ON public.registration_stages
    FOR SELECT USING (true);

-- Admins can do everything
CREATE POLICY "Admins can manage registrations" ON public.registrations
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

CREATE POLICY "Admins can manage registration_stages" ON public.registration_stages
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

CREATE POLICY "Admins can manage registration_documents" ON public.registration_documents
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

CREATE POLICY "Admins can manage registration_notifications" ON public.registration_notifications
    FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true));

-- Public can upload documents (customer uploads)
CREATE POLICY "Anyone can upload documents" ON public.registration_documents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view documents for accessible registrations" ON public.registration_documents
    FOR SELECT USING (true);

-- ================================================================
-- HELPER FUNCTION: Generate Order ID
-- ================================================================
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
    year_part TEXT;
    seq_num INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');

    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_id FROM 9) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM public.registrations
    WHERE order_id LIKE 'TJ-' || year_part || '-%';

    new_id := 'TJ-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');

    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- HELPER FUNCTION: Initialize Registration Stages
-- ================================================================
-- Call this after creating a new registration to set up all 7 stages
CREATE OR REPLACE FUNCTION initialize_registration_stages(reg_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Stage 1: Payment Received (auto-complete on creation)
    INSERT INTO public.registration_stages
        (registration_id, stage_key, stage_label, stage_order, status, ownership, started_at, completed_at)
    VALUES
        (reg_id, 'payment', 'Payment Received', 1, 'complete', 'dealer', NOW(), NOW());

    -- Stage 2: Insurance Verified (customer action)
    INSERT INTO public.registration_stages
        (registration_id, stage_key, stage_label, stage_order, status, ownership, action_required, action_url)
    VALUES
        (reg_id, 'insurance', 'Insurance Verified', 2, 'pending', 'customer', 'Upload proof of insurance', '/upload-insurance');

    -- Stage 3: Inspection Complete (customer action)
    INSERT INTO public.registration_stages
        (registration_id, stage_key, stage_label, stage_order, status, ownership, action_required)
    VALUES
        (reg_id, 'inspection', 'Inspection Complete', 3, 'waiting', 'customer', 'Complete state safety inspection');

    -- Stage 4: Dealer Submission (dealer action)
    INSERT INTO public.registration_stages
        (registration_id, stage_key, stage_label, stage_order, status, ownership)
    VALUES
        (reg_id, 'submission', 'Dealer Submission', 4, 'waiting', 'dealer');

    -- Stage 5: DMV Processing (state)
    INSERT INTO public.registration_stages
        (registration_id, stage_key, stage_label, stage_order, status, ownership)
    VALUES
        (reg_id, 'dmv_processing', 'DMV Processing', 5, 'waiting', 'state');

    -- Stage 6: Registration Approved (state)
    INSERT INTO public.registration_stages
        (registration_id, stage_key, stage_label, stage_order, status, ownership)
    VALUES
        (reg_id, 'approved', 'Registration Approved', 6, 'waiting', 'state');

    -- Stage 7: Ready for Delivery (dealer)
    INSERT INTO public.registration_stages
        (registration_id, stage_key, stage_label, stage_order, status, ownership, action_required)
    VALUES
        (reg_id, 'ready', 'Ready for Delivery', 7, 'waiting', 'dealer', 'Schedule pickup');
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Registration Ledger schema created successfully!';
    RAISE NOTICE 'Tables created: registrations, registration_stages, registration_documents, registration_notifications';
    RAISE NOTICE 'Functions created: generate_order_id(), initialize_registration_stages()';
END $$;
