-- ==============================================================================
-- BloodSync: Development & Demo Seed Data
-- Migration: seed.sql
-- Description: Real-world Chennai health institutions, blood banks, donors, & inventory
-- ==============================================================================

-- 1. Create Placeholder Profiles (Linked to auth.users in production)
-- In a real Supabase setup, auth.users UUIDs correspond to these profiles.
-- For local/dev testing, we use standard deterministic UUIDs.

INSERT INTO public.profiles (id, full_name, email, phone, role)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Vikram Raghavan', 'vikram.donor@bloodsync.org', '+91 98401 54321', 'individual'),
    ('00000000-0000-0000-0000-000000000002', 'Priya Soundararajan', 'priya.soundar@bloodsync.org', '+91 98402 67890', 'individual'),
    ('00000000-0000-0000-0000-000000000003', 'Karthik Narayanan', 'karthik.n@bloodsync.org', '+91 98403 11223', 'individual'),
    ('00000000-0000-0000-0000-000000000004', 'Deepa Venkatesh', 'deepa.v@bloodsync.org', '+91 98404 99887', 'individual'),
    ('00000000-0000-0000-0000-000000000005', 'Arjun Balasubramanian', 'arjun.b@bloodsync.org', '+91 98405 44332', 'individual'),
    ('00000000-0000-0000-0000-000000000010', 'Dr. Rajesh Kumar', 'emergency.lead@srmhospital.edu.in', '+91 44 4743 2333', 'hospital'),
    ('00000000-0000-0000-0000-000000000011', 'Dr. Sangeetha Ramaswamy', 'trauma.lead@apollocares.org', '+91 44 2829 0200', 'hospital'),
    ('00000000-0000-0000-0000-000000000012', 'Dr. Vigneshwaran K', 'icu.triage@stanleymedical.org', '+91 44 2528 1351', 'hospital'),
    ('00000000-0000-0000-0000-000000000020', 'Dr. Meenakshi Sundaram', 'coordinator@chennaibloodbank.org', '+91 44 2819 1234', 'blood_bank'),
    ('00000000-0000-0000-0000-000000000021', 'Dr. Ramesh Chandran', 'dispatch@redcross-chennai.org', '+91 44 2855 4010', 'blood_bank'),
    ('00000000-0000-0000-0000-000000000022', 'Dr. Kavitha Selvan', 'director@rotary-lifeline.org', '+91 44 2498 7654', 'blood_bank'),
    ('00000000-0000-0000-0000-000000000099', 'Dr. Ananya Sharma', 'admin@bloodsync.gov.in', '+91 44 2530 5000', 'admin')
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Donors
INSERT INTO public.donors (id, user_id, age, blood_group, address, latitude, longitude, availability_status, lifetime_donations, last_donation_date, verification_status)
VALUES
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 29, 'O-', 'Guindy Industrial Estate, Chennai', 13.0067, 80.2025, 'ready_to_donate', 14, '2025-01-10', 'verified'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 34, 'A+', 'T. Nagar, Chennai', 13.0418, 80.2341, 'ready_to_donate', 8, '2024-11-20', 'verified'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 24, 'B+', 'Velachery Bypass, Chennai', 12.9791, 80.2185, 'ready_to_donate', 5, '2024-12-05', 'verified'),
    ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 41, 'AB-', 'Adyar Gandhi Nagar, Chennai', 13.0012, 80.2565, 'ready_to_donate', 19, '2025-02-01', 'verified'),
    ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 27, 'O+', 'Anna Nagar Roundtana, Chennai', 13.0850, 80.2101, 'on_break', 6, '2025-03-01', 'verified')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Hospitals
INSERT INTO public.hospitals (id, user_id, hospital_name, registration_id, emergency_lead_name, emergency_hotline, emergency_email, icu_beds, address, latitude, longitude, verification_status)
VALUES
    ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'SRM Hospital & Research Centre', 'MCI-TN-2015-88914', 'Dr. Rajesh Kumar', '+91 44 4743 2333', 'emergency.lead@srmhospital.edu.in', 45, 'GST Road, Kattankulathur, Chennai', 12.8231, 80.0442, 'verified'),
    ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011', 'Apollo Childrens & Specialty Hospital', 'MCI-TN-2008-11029', 'Dr. Sangeetha Ramaswamy', '+91 44 2829 0200', 'trauma.lead@apollocares.org', 60, 'Greams Road, Thousand Lights, Chennai', 13.0604, 80.2496, 'verified'),
    ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000012', 'Govt. Stanley Medical College Hospital', 'GOV-TN-MED-1965', 'Dr. Vigneshwaran K', '+91 44 2528 1351', 'icu.triage@stanleymedical.org', 120, 'Old Jail Road, Royapuram, Chennai', 13.1075, 80.2871, 'verified')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Blood Banks
INSERT INTO public.blood_banks (id, user_id, name, license_id, director_name, dispatch_phone, storage_capacity, address, latitude, longitude, verification_status)
VALUES
    ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000020', 'Chennai Central Blood Bank', 'TN-BB-LIC-CHN-0042', 'Dr. Meenakshi Sundaram', '+91 44 2819 1234', 1200, 'Egmore High Road, Egmore, Chennai', 13.0815, 80.2600, 'verified'),
    ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000021', 'Indian Red Cross Blood Bank Chennai', 'TN-BB-LIC-CHN-0018', 'Dr. Ramesh Chandran', '+91 44 2855 4010', 850, 'Montieth Road, Egmore, Chennai', 13.0722, 80.2612, 'verified'),
    ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000022', 'Rotary Lifeline Blood Storage Centre', 'TN-BB-LIC-CHN-0091', 'Dr. Kavitha Selvan', '+91 44 2498 7654', 600, 'Dr. Radhakrishnan Salai, Mylapore, Chennai', 13.0425, 80.2610, 'verified')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Blood Units (Inventory across facilities)
INSERT INTO public.blood_units (id, blood_bank_id, component_type, blood_group, collection_date, expiry_date, storage_temperature, status)
VALUES
    -- Chennai Central Blood Bank (3000...001)
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'prbc', 'O-', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '25 days', 4.0, 'available'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'prbc', 'O-', CURRENT_DATE - INTERVAL '12 days', CURRENT_DATE + INTERVAL '23 days', 3.8, 'available'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'prbc', 'O+', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '30 days', 4.1, 'available'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'prbc', 'O+', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE + INTERVAL '27 days', 4.0, 'available'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'prbc', 'A+', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '20 days', 4.2, 'available'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'prbc', 'A-', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '15 days', 3.9, 'available'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'prbc', 'B+', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '32 days', 4.0, 'available'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'prbc', 'AB+', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '28 days', 4.0, 'available'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'platelets', 'O+', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '4 days', 22.0, 'available'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'ffp', 'O-', CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '320 days', -25.0, 'available'),
    -- Red Cross (3000...002)
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000002', 'prbc', 'O-', CURRENT_DATE - INTERVAL '18 days', CURRENT_DATE + INTERVAL '17 days', 4.0, 'available'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000002', 'prbc', 'O+', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE + INTERVAL '21 days', 4.0, 'available'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000002', 'prbc', 'B+', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE + INTERVAL '29 days', 4.1, 'available'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000002', 'prbc', 'B-', CURRENT_DATE - INTERVAL '22 days', CURRENT_DATE + INTERVAL '13 days', 3.8, 'available'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000002', 'prbc', 'AB-', CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE + INTERVAL '6 days', 4.0, 'available'),
    -- Rotary Lifeline (3000...003)
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000003', 'prbc', 'O-', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '33 days', 4.0, 'available'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000003', 'prbc', 'A+', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE + INTERVAL '31 days', 4.0, 'available'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000003', 'platelets', 'A+', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '3 days', 22.5, 'available');

-- 6. Seed Open Emergency Request
INSERT INTO public.emergency_requests (id, created_by, hospital_id, patient_name, patient_blood_group, units_required, urgency, condition, latitude, longitude, address, required_by, status)
VALUES
    ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000001', 'Kavitha Murugan', 'O-', 3, 'critical', 'High-velocity blunt chest trauma with hemorrhagic shock', 12.8231, 80.0442, 'SRM Hospital Trauma ICU, Kattankulathur, Chennai', NOW() + INTERVAL '45 minutes', 'open'),
    ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000002', 'Master Rahul (Age 6)', 'A-', 2, 'urgent', 'Post-operative cardiac bleeding following valve reconstruction', 13.0604, 80.2496, 'Apollo Childrens Hospital PICU, Thousand Lights, Chennai', NOW() + INTERVAL '2 hours', 'open')
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Demand History (for ML forecasting)
INSERT INTO public.demand_history (blood_bank_id, blood_group, component_type, date, units_requested, units_issued, units_available)
VALUES
    ('30000000-0000-0000-0000-000000000001', 'O-', 'prbc', CURRENT_DATE - INTERVAL '7 days', 18, 16, 12),
    ('30000000-0000-0000-0000-000000000001', 'O-', 'prbc', CURRENT_DATE - INTERVAL '6 days', 22, 20, 10),
    ('30000000-0000-0000-0000-000000000001', 'O-', 'prbc', CURRENT_DATE - INTERVAL '5 days', 25, 22, 8),
    ('30000000-0000-0000-0000-000000000001', 'O-', 'prbc', CURRENT_DATE - INTERVAL '4 days', 19, 18, 9),
    ('30000000-0000-0000-0000-000000000001', 'O-', 'prbc', CURRENT_DATE - INTERVAL '3 days', 28, 25, 6),
    ('30000000-0000-0000-0000-000000000001', 'O-', 'prbc', CURRENT_DATE - INTERVAL '2 days', 30, 26, 5),
    ('30000000-0000-0000-0000-000000000001', 'O-', 'prbc', CURRENT_DATE - INTERVAL '1 day',  32, 28, 4);

-- 8. Seed Demand Predictions & Shortage Alert
INSERT INTO public.demand_predictions (id, blood_bank_id, blood_group, component_type, prediction_date, predicted_units, confidence, risk_level)
VALUES
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'O-', 'prbc', CURRENT_DATE + INTERVAL '1 day', 34, 0.91, 'critical'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'O+', 'prbc', CURRENT_DATE + INTERVAL '1 day', 42, 0.88, 'medium'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'A+', 'prbc', CURRENT_DATE + INTERVAL '1 day', 28, 0.85, 'low'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'AB-', 'prbc', CURRENT_DATE + INTERVAL '1 day', 12, 0.93, 'high');

INSERT INTO public.shortage_alerts (id, blood_bank_id, blood_group, component_type, current_inventory, predicted_demand, expected_shortfall, risk_level, status)
VALUES
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'O-', 'prbc', 4, 34, 30, 'critical', 'active'),
    (gen_random_uuid(), '30000000-0000-0000-0000-000000000001', 'AB-', 'prbc', 2, 12, 10, 'high', 'active');
