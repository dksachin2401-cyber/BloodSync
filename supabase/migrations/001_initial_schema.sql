-- ==============================================================================
-- BloodSync: Intelligent Real-Time Emergency Blood Coordination & Demand Prediction
-- Migration: 001_initial_schema.sql
-- Description: Complete PostgreSQL Schema with Supabase Auth, RLS, Realtime & RPC
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Custom Types / Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('individual', 'hospital', 'blood_bank', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE blood_group_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE component_type AS ENUM ('whole_blood', 'prbc', 'platelets', 'ffp');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE unit_status AS ENUM ('available', 'reserved', 'dispatched', 'issued', 'expired', 'quarantined');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE urgency_level AS ENUM ('critical', 'urgent', 'standard');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('open', 'matching', 'matched', 'partially_fulfilled', 'fulfilled', 'cancelled', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE source_type AS ENUM ('blood_bank', 'donor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pledge_status AS ENUM ('pledged', 'accepted', 'rejected', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE availability_status AS ENUM ('ready_to_donate', 'on_break');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Utility Function: Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 4. Application Tables
-- ==============================================================================

-- 4.1. User Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'individual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.2. Donors Table
CREATE TABLE IF NOT EXISTS public.donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    age INT CHECK (age >= 18 AND age <= 65),
    blood_group blood_group_type NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    availability_status availability_status NOT NULL DEFAULT 'ready_to_donate',
    lifetime_donations INT NOT NULL DEFAULT 0,
    last_donation_date DATE,
    medical_notes TEXT,
    verification_status verification_status NOT NULL DEFAULT 'verified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_donors_updated_at
BEFORE UPDATE ON public.donors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.3. Hospitals Table
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_name TEXT NOT NULL,
    registration_id TEXT NOT NULL UNIQUE,
    emergency_lead_name TEXT NOT NULL,
    emergency_hotline TEXT NOT NULL,
    emergency_email TEXT NOT NULL,
    icu_beds INT NOT NULL DEFAULT 10,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    verification_status verification_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_hospitals_updated_at
BEFORE UPDATE ON public.hospitals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.4. Blood Banks Table
CREATE TABLE IF NOT EXISTS public.blood_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    license_id TEXT NOT NULL UNIQUE,
    director_name TEXT NOT NULL,
    dispatch_phone TEXT NOT NULL,
    storage_capacity INT NOT NULL DEFAULT 500,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    verification_status verification_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_blood_banks_updated_at
BEFORE UPDATE ON public.blood_banks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.5. Emergency Requests Table
CREATE TABLE IF NOT EXISTS public.emergency_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    patient_blood_group blood_group_type NOT NULL,
    units_required INT NOT NULL CHECK (units_required > 0),
    urgency urgency_level NOT NULL DEFAULT 'urgent',
    condition TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    required_by TIMESTAMPTZ NOT NULL,
    status request_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_emergency_requests_updated_at
BEFORE UPDATE ON public.emergency_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.6. Blood Units Table (Blood Bank Inventory)
CREATE TABLE IF NOT EXISTS public.blood_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blood_bank_id UUID NOT NULL REFERENCES public.blood_banks(id) ON DELETE CASCADE,
    component_type component_type NOT NULL DEFAULT 'prbc',
    blood_group blood_group_type NOT NULL,
    collection_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    storage_temperature NUMERIC(4, 1) NOT NULL DEFAULT 4.0,
    status unit_status NOT NULL DEFAULT 'available',
    reserved_for_request_id UUID REFERENCES public.emergency_requests(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_blood_units_updated_at
BEFORE UPDATE ON public.blood_units
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.7. Match Results Table
CREATE TABLE IF NOT EXISTS public.match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
    source_type source_type NOT NULL,
    source_id UUID NOT NULL,
    blood_group blood_group_type NOT NULL,
    distance_km NUMERIC(6, 2) NOT NULL,
    eta_minutes INT NOT NULL,
    compatibility_score NUMERIC(5, 2) NOT NULL,
    eta_score NUMERIC(5, 2) NOT NULL,
    expiry_score NUMERIC(5, 2) NOT NULL,
    availability_score NUMERIC(5, 2) NOT NULL,
    final_score NUMERIC(5, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'identified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.8. Donor Pledges Table
CREATE TABLE IF NOT EXISTS public.donor_pledges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES public.donors(id) ON DELETE CASCADE,
    eta_minutes INT NOT NULL DEFAULT 30,
    status pledge_status NOT NULL DEFAULT 'pledged',
    contact_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_donor_pledges_updated_at
BEFORE UPDATE ON public.donor_pledges
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.9. Demand History Table
CREATE TABLE IF NOT EXISTS public.demand_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blood_bank_id UUID NOT NULL REFERENCES public.blood_banks(id) ON DELETE CASCADE,
    blood_group blood_group_type NOT NULL,
    component_type component_type NOT NULL DEFAULT 'prbc',
    date DATE NOT NULL,
    units_requested INT NOT NULL DEFAULT 0,
    units_issued INT NOT NULL DEFAULT 0,
    units_available INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.10. Demand Predictions Table
CREATE TABLE IF NOT EXISTS public.demand_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blood_bank_id UUID NOT NULL REFERENCES public.blood_banks(id) ON DELETE CASCADE,
    blood_group blood_group_type NOT NULL,
    component_type component_type NOT NULL DEFAULT 'prbc',
    prediction_date DATE NOT NULL,
    predicted_units INT NOT NULL DEFAULT 0,
    confidence NUMERIC(4, 2) NOT NULL DEFAULT 0.85,
    risk_level risk_level NOT NULL DEFAULT 'low',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.11. Shortage Alerts Table
CREATE TABLE IF NOT EXISTS public.shortage_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blood_bank_id UUID NOT NULL REFERENCES public.blood_banks(id) ON DELETE CASCADE,
    blood_group blood_group_type NOT NULL,
    component_type component_type NOT NULL DEFAULT 'prbc',
    current_inventory INT NOT NULL,
    predicted_demand INT NOT NULL,
    expected_shortfall INT NOT NULL,
    risk_level risk_level NOT NULL DEFAULT 'high',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 4.12. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_request_id UUID REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
    related_pledge_id UUID REFERENCES public.donor_pledges(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.13. Coordination Logs Table (Audit Trail)
CREATE TABLE IF NOT EXISTS public.coordination_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4.14. System Settings & Matching Configuration Table
CREATE TABLE IF NOT EXISTS public.matching_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weight_eta NUMERIC(4, 2) NOT NULL DEFAULT 0.35,
    weight_compatibility NUMERIC(4, 2) NOT NULL DEFAULT 0.30,
    weight_availability NUMERIC(4, 2) NOT NULL DEFAULT 0.20,
    weight_expiry NUMERIC(4, 2) NOT NULL DEFAULT 0.15,
    traffic_factor NUMERIC(3, 2) NOT NULL DEFAULT 1.25,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default matching weights
INSERT INTO public.matching_configuration (weight_eta, weight_compatibility, weight_availability, weight_expiry, traffic_factor)
VALUES (0.35, 0.30, 0.20, 0.15, 1.25)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 5. Indexes for High-Performance Queries
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON public.donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_donors_availability ON public.donors(availability_status);
CREATE INDEX IF NOT EXISTS idx_donors_geo ON public.donors(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hospitals_geo ON public.hospitals(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_blood_banks_geo ON public.blood_banks(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_blood_units_bank_group ON public.blood_units(blood_bank_id, blood_group, status);
CREATE INDEX IF NOT EXISTS idx_blood_units_expiry ON public.blood_units(expiry_date);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_status ON public.emergency_requests(status);
CREATE INDEX IF NOT EXISTS idx_emergency_requests_blood ON public.emergency_requests(patient_blood_group, urgency);
CREATE INDEX IF NOT EXISTS idx_match_results_request ON public.match_results(request_id, final_score DESC);
CREATE INDEX IF NOT EXISTS idx_donor_pledges_request ON public.donor_pledges(request_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coordination_logs_request ON public.coordination_logs(request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shortage_alerts_bank ON public.shortage_alerts(blood_bank_id, status);

-- ==============================================================================
-- 6. Trigger: Auto Create Profile on Auth SignUp
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_role user_role;
    v_phone TEXT;
BEGIN
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'Registered User');
    v_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'individual'::user_role);
    v_phone := NEW.raw_user_meta_data->>'phone';

    INSERT INTO public.profiles (id, full_name, email, phone, role)
    VALUES (NEW.id, v_full_name, NEW.email, v_phone, v_role)
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        role = EXCLUDED.role,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 7. Concurrency-Safe Inventory Reservation Function (Atomic RPC)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.reserve_blood_units(
    p_request_id UUID,
    p_blood_unit_ids UUID[],
    p_actor_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_unit_count INT;
    v_available_count INT;
    v_request RECORD;
BEGIN
    -- 1. Check request validity
    SELECT * INTO v_request FROM public.emergency_requests WHERE id = p_request_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Emergency request not found.');
    END IF;

    -- 2. Lock and verify units are genuinely available
    v_unit_count := array_length(p_blood_unit_ids, 1);
    
    SELECT COUNT(*) INTO v_available_count
    FROM public.blood_units
    WHERE id = ANY(p_blood_unit_ids) AND status = 'available'
    FOR UPDATE;

    IF v_available_count < v_unit_count THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Inventory changed before reservation could be completed. Some units are no longer available.'
        );
    END IF;

    -- 3. Atomically reserve units
    UPDATE public.blood_units
    SET status = 'reserved',
        reserved_for_request_id = p_request_id,
        updated_at = NOW()
    WHERE id = ANY(p_blood_unit_ids);

    -- 4. Update emergency request status
    UPDATE public.emergency_requests
    SET status = 'matched',
        updated_at = NOW()
    WHERE id = p_request_id;

    -- 5. Create coordination audit log
    INSERT INTO public.coordination_logs (request_id, actor_user_id, action, description)
    VALUES (
        p_request_id,
        p_actor_id,
        'UNITS_RESERVED',
        format('%s blood units reserved atomically for request %s', v_unit_count, p_request_id)
    );

    -- 6. Create notification for request creator
    INSERT INTO public.notifications (recipient_user_id, type, title, message, related_request_id)
    VALUES (
        v_request.created_by,
        'UNITS_RESERVED',
        'Blood Units Reserved',
        format('%s compatible blood units have been reserved and locked for patient %s.', v_unit_count, v_request.patient_name),
        p_request_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', format('Successfully reserved %s blood units.', v_unit_count),
        'reserved_count', v_unit_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 8. Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortage_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordination_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_configuration ENABLE ROW LEVEL SECURITY;

-- 8.1. Profiles RLS
CREATE POLICY "Allow public read access to basic profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow users to update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 8.2. Donors RLS
CREATE POLICY "Allow authenticated users to read donors"
ON public.donors FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow donors to manage own donor record"
ON public.donors FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 8.3. Hospitals RLS
CREATE POLICY "Allow authenticated users to view verified hospitals"
ON public.hospitals FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow hospitals to manage own profile"
ON public.hospitals FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow admin full access to hospitals"
ON public.hospitals FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 8.4. Blood Banks RLS
CREATE POLICY "Allow authenticated users to view blood banks"
ON public.blood_banks FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow blood banks to manage own facility"
ON public.blood_banks FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow admin full access to blood banks"
ON public.blood_banks FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 8.5. Blood Units (Inventory) RLS
CREATE POLICY "Allow authenticated users to view available units"
ON public.blood_units FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow blood banks to manage own inventory"
ON public.blood_units FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.blood_banks
        WHERE blood_banks.id = blood_units.blood_bank_id AND blood_banks.user_id = auth.uid()
    )
);

CREATE POLICY "Allow admin full access to inventory"
ON public.blood_units FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 8.6. Emergency Requests RLS
CREATE POLICY "Allow all authenticated users to view open emergency requests"
ON public.emergency_requests FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow hospitals and individuals to create requests"
ON public.emergency_requests FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Allow creator or admin to update request"
ON public.emergency_requests FOR UPDATE TO authenticated
USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 8.7. Match Results RLS
CREATE POLICY "Allow authenticated users to view match results"
ON public.match_results FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow match results creation by system or creator"
ON public.match_results FOR INSERT TO authenticated
WITH CHECK (true);

-- 8.8. Donor Pledges RLS
CREATE POLICY "Allow authenticated users to view donor pledges"
ON public.donor_pledges FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow donors to create pledges"
ON public.donor_pledges FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.donors
        WHERE donors.id = donor_pledges.donor_id AND donors.user_id = auth.uid()
    )
);

CREATE POLICY "Allow donor or request creator to update pledge"
ON public.donor_pledges FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.donors
        WHERE donors.id = donor_pledges.donor_id AND donors.user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.emergency_requests
        WHERE emergency_requests.id = donor_pledges.request_id AND emergency_requests.created_by = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 8.9. Demand History & Predictions RLS
CREATE POLICY "Allow read access to demand history"
ON public.demand_history FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow blood banks to insert demand history"
ON public.demand_history FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.blood_banks
        WHERE blood_banks.id = demand_history.blood_bank_id AND blood_banks.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Allow read access to demand predictions"
ON public.demand_predictions FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow insertion of predictions"
ON public.demand_predictions FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 8.10. Shortage Alerts RLS
CREATE POLICY "Allow authenticated users to view shortage alerts"
ON public.shortage_alerts FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow managing shortage alerts"
ON public.shortage_alerts FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 8.11. Notifications RLS
CREATE POLICY "Allow users to view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (recipient_user_id = auth.uid());

CREATE POLICY "Allow system/users to insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow users to update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (recipient_user_id = auth.uid())
WITH CHECK (recipient_user_id = auth.uid());

-- 8.12. Coordination Logs RLS
CREATE POLICY "Allow read access to coordination logs"
ON public.coordination_logs FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow insert access to coordination logs"
ON public.coordination_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- 8.13. Matching Configuration RLS
CREATE POLICY "Allow read access to matching config"
ON public.matching_configuration FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow admin to update matching config"
ON public.matching_configuration FOR UPDATE TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ==============================================================================
-- 9. Realtime Publication Configuration
-- ==============================================================================
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_requests;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_results;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.donor_pledges;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blood_units;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shortage_alerts;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coordination_logs;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hospitals;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blood_banks;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.donors;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION
    WHEN duplicate_object THEN null;
    WHEN undefined_object THEN null;
END $$;
