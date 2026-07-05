-- Government AI Copilot database seed SQL for Supabase
-- This file creates the core tables and inserts demo data for auth, requests,
-- documents, OCR, notifications, audit logs, and AI responses.
-- Run this in the Supabase SQL editor.

BEGIN;

-- Supabase-compatible UUID and password hashing extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('citizen', 'officer', 'supervisor', 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM ('pending', 'in_review', 'more_info_required', 'approved', 'rejected');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_status') THEN
        CREATE TYPE document_status AS ENUM ('uploaded', 'ocr_processing', 'ocr_complete', 'ocr_failed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('status_change', 'officer_remark', 'more_info_request', 'system');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
        CREATE TYPE audit_action AS ENUM ('request_submitted', 'document_uploaded', 'ocr_completed', 'ai_response_generated', 'status_changed', 'remark_added', 'login', 'logout');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_user_role') THEN
        CREATE TYPE audit_user_role AS ENUM ('citizen', 'officer', 'supervisor', 'admin');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS citizens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(500),
    aadhaar_number_masked VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(120) NOT NULL,
    designation VARCHAR(120)
);

CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(40) UNIQUE NOT NULL,
    citizen_id UUID NOT NULL REFERENCES citizens(id) ON DELETE CASCADE,
    service_type VARCHAR(120) NOT NULL,
    description TEXT,
    status request_status NOT NULL DEFAULT 'pending',
    assigned_officer_id UUID REFERENCES officers(id) ON DELETE SET NULL,
    officer_remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    stored_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    status document_status NOT NULL DEFAULT 'uploaded',
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ocr_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
    raw_text TEXT,
    extracted_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    corrected_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_role audit_user_role,
    action audit_action NOT NULL,
    request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
    previous_status VARCHAR(40),
    new_status VARCHAR(40),
    ip_address VARCHAR(45),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response_text TEXT NOT NULL,
    model_used VARCHAR(120) NOT NULL,
    retrieved_context JSONB,
    confidence DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed users
INSERT INTO users (id, username, email, hashed_password, role, is_active, created_at)
VALUES
    (gen_random_uuid(), 'admin', 'admin@govai.local', crypt('Admin@123', gen_salt('bf')), 'admin', TRUE, NOW()),
    (gen_random_uuid(), 'supervisor.revenue', 'supervisor.revenue@govai.local', crypt('Supervisor@123', gen_salt('bf')), 'supervisor', TRUE, NOW()),
    (gen_random_uuid(), 'officer.revenue', 'officer.revenue@govai.local', crypt('Officer@123', gen_salt('bf')), 'officer', TRUE, NOW()),
    (gen_random_uuid(), 'officer.municipal', 'officer.municipal@govai.local', crypt('Officer@123', gen_salt('bf')), 'officer', TRUE, NOW()),
    (gen_random_uuid(), 'officer.grievance', 'officer.grievance@govai.local', crypt('Officer@123', gen_salt('bf')), 'officer', TRUE, NOW()),
    (gen_random_uuid(), 'citizen.demo', 'citizen.demo@example.com', crypt('Citizen@123', gen_salt('bf')), 'citizen', TRUE, NOW())
ON CONFLICT (username) DO NOTHING;

-- Seed officers
INSERT INTO officers (id, user_id, full_name, department, designation)
SELECT gen_random_uuid(), u.id,
       CASE u.username
           WHEN 'admin' THEN 'System Administrator'
           WHEN 'supervisor.revenue' THEN 'Revenue Supervisor'
           WHEN 'officer.revenue' THEN 'Revenue Officer'
           WHEN 'officer.municipal' THEN 'Municipal Officer'
           WHEN 'officer.grievance' THEN 'Grievance Officer'
       END,
       CASE u.username
           WHEN 'admin' THEN 'All'
           WHEN 'supervisor.revenue' THEN 'Revenue'
           WHEN 'officer.revenue' THEN 'Revenue'
           WHEN 'officer.municipal' THEN 'Municipal Administration'
           WHEN 'officer.grievance' THEN 'Public Grievance Cell'
       END,
       CASE u.username
           WHEN 'admin' THEN 'Admin'
           WHEN 'supervisor.revenue' THEN 'Supervisor'
           WHEN 'officer.revenue' THEN 'Department Officer'
           WHEN 'officer.municipal' THEN 'Department Officer'
           WHEN 'officer.grievance' THEN 'Department Officer'
       END
FROM users u
WHERE u.username IN ('admin', 'supervisor.revenue', 'officer.revenue', 'officer.municipal', 'officer.grievance')
ON CONFLICT (user_id) DO NOTHING;

-- Seed citizen profile
INSERT INTO citizens (id, user_id, full_name, phone, address, aadhaar_number_masked)
SELECT gen_random_uuid(), u.id, 'Demo Citizen', '9999999999', '123 Demo Street, Hyderabad', '****-****-1234'
FROM users u
WHERE u.username = 'citizen.demo'
ON CONFLICT (user_id) DO NOTHING;

-- Seed sample request
INSERT INTO requests (id, request_number, citizen_id, service_type, description, status, assigned_officer_id, officer_remarks, created_at, updated_at)
SELECT gen_random_uuid(),
       'REV-2026-00001',
       c.id,
       'Property Tax Issue',
       'Citizen reported a mismatch in property tax assessment and requested review.',
       'in_review',
       o.id,
       'We are verifying the submitted records.',
       NOW() - INTERVAL '2 days',
       NOW() - INTERVAL '2 days'
FROM citizens c
JOIN users u ON u.id = c.user_id
JOIN officers o ON o.user_id = (SELECT id FROM users WHERE username = 'officer.revenue')
WHERE u.username = 'citizen.demo'
ON CONFLICT (request_number) DO NOTHING;

-- Seed document and OCR data
INSERT INTO documents (id, request_id, original_filename, stored_path, mime_type, size_bytes, status, uploaded_at)
SELECT gen_random_uuid(),
       r.id,
       'property-tax-notice.jpg',
       '/storage/uploads/property-tax-notice.jpg',
       'image/jpeg',
       245760,
       'ocr_complete',
       NOW() - INTERVAL '1 day'
FROM requests r
WHERE r.request_number = 'REV-2026-00001'
AND NOT EXISTS (
    SELECT 1 FROM documents d WHERE d.request_id = r.id AND d.original_filename = 'property-tax-notice.jpg'
);

INSERT INTO ocr_data (id, document_id, raw_text, extracted_fields, corrected_fields, confidence, created_at)
SELECT gen_random_uuid(),
       d.id,
       'Property Tax Notice\nOwner: Demo Citizen\nAssessment: 2026',
       '{"name": "Demo Citizen", "address": "123 Demo Street, Hyderabad", "assessment_year": "2026"}'::jsonb,
       '{"name": "Demo Citizen", "address": "123 Demo Street, Hyderabad", "assessment_year": "2026"}'::jsonb,
       0.91,
       NOW() - INTERVAL '1 day'
FROM documents d
WHERE d.original_filename = 'property-tax-notice.jpg'
AND NOT EXISTS (
    SELECT 1 FROM ocr_data o WHERE o.document_id = d.id
);

-- Seed notification and audit trail
INSERT INTO notifications (id, user_id, request_id, type, message, is_read, created_at)
SELECT gen_random_uuid(),
       u.id,
       r.id,
       'status_change',
       'Your request is now under review by the Revenue Department.',
       FALSE,
       NOW() - INTERVAL '1 day'
FROM users u
JOIN requests r ON r.request_number = 'REV-2026-00001'
WHERE u.username = 'citizen.demo'
AND NOT EXISTS (
    SELECT 1 FROM notifications n WHERE n.user_id = u.id AND n.request_id = r.id
);

INSERT INTO audit_logs (id, user_id, user_role, action, request_id, previous_status, new_status, ip_address, details, timestamp)
SELECT gen_random_uuid(),
       u.id,
       'citizen',
       'request_submitted',
       r.id,
       NULL,
       'pending',
       '127.0.0.1',
       '{"source": "web_app", "channel": "citizen"}'::jsonb,
       NOW() - INTERVAL '2 days'
FROM users u
JOIN requests r ON r.request_number = 'REV-2026-00001'
WHERE u.username = 'citizen.demo'
AND NOT EXISTS (
    SELECT 1 FROM audit_logs a WHERE a.request_id = r.id AND a.action = 'request_submitted'
);

INSERT INTO ai_responses (id, request_id, prompt, response_text, model_used, retrieved_context, confidence, created_at)
SELECT gen_random_uuid(),
       r.id,
       'Summarize the request and advise next steps.',
       'Your request has been received and is being reviewed by the Revenue department. You will receive updates shortly.',
       'qwen2.5:7b',
       '{"document_ids": ["demo-doc-1"], "scores": [0.92]}'::jsonb,
       0.92,
       NOW() - INTERVAL '1 day'
FROM requests r
WHERE r.request_number = 'REV-2026-00001'
AND NOT EXISTS (
    SELECT 1 FROM ai_responses a WHERE a.request_id = r.id
);

COMMIT;
