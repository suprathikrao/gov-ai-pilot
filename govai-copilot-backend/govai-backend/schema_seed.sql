-- Government AI Copilot database seed SQL
-- This file creates the core tables and inserts demo data for auth, requests,
-- documents, OCR, notifications, audit logs, and AI responses.
-- Compatible with PostgreSQL / Supabase.

BEGIN;

-- Extension used for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Users and profiles
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS citizens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(500),
    aadhaar_number_masked VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS officers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(120) NOT NULL,
    designation VARCHAR(120)
);

-- Requests
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX IF NOT EXISTS idx_requests_citizen_id ON requests(citizen_id);
CREATE INDEX IF NOT EXISTS idx_requests_service_type ON requests(service_type);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_assigned_officer_id ON requests(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);

-- Documents and OCR
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    stored_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    status document_status NOT NULL DEFAULT 'uploaded',
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_request_id ON documents(request_id);

CREATE TABLE IF NOT EXISTS ocr_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
    raw_text TEXT,
    extracted_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    corrected_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    confidence DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_request_id ON notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- AI responses
CREATE TABLE IF NOT EXISTS ai_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    response_text TEXT NOT NULL,
    model_used VARCHAR(120) NOT NULL,
    retrieved_context JSONB,
    confidence DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_responses_request_id ON ai_responses(request_id);

-- Seed data: users and profiles
WITH inserted_users AS (
    INSERT INTO users (id, username, email, hashed_password, role, is_active, created_at)
    VALUES
        (uuid_generate_v4(), 'admin', 'admin@example.com', '$2b$12$A3Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q', 'admin', TRUE, NOW()),
        (uuid_generate_v4(), 'supervisor.revenue', 'supervisor.revenue@example.com', '$2b$12$A3Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q', 'supervisor', TRUE, NOW()),
        (uuid_generate_v4(), 'officer.revenue', 'officer.revenue@example.com', '$2b$12$A3Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q', 'officer', TRUE, NOW()),
        (uuid_generate_v4(), 'officer.municipal', 'officer.municipal@example.com', '$2b$12$A3Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q', 'officer', TRUE, NOW()),
        (uuid_generate_v4(), 'officer.grievance', 'officer.grievance@example.com', '$2b$12$A3Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q', 'officer', TRUE, NOW()),
        (uuid_generate_v4(), 'citizen.demo', 'citizen.demo@example.com', '$2b$12$A3Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q', 'citizen', TRUE, NOW())
    RETURNING id, username
),
inserted_officers AS (
    INSERT INTO officers (id, user_id, full_name, department, designation)
    SELECT uuid_generate_v4(), u.id, CASE u.username
        WHEN 'admin' THEN 'Admin User'
        WHEN 'supervisor.revenue' THEN 'Revenue Supervisor'
        WHEN 'officer.revenue' THEN 'Revenue Officer'
        WHEN 'officer.municipal' THEN 'Municipal Officer'
        WHEN 'officer.grievance' THEN 'Grievance Officer'
    END,
    CASE u.username
        WHEN 'admin' THEN 'Administration'
        WHEN 'supervisor.revenue' THEN 'Revenue'
        WHEN 'officer.revenue' THEN 'Revenue'
        WHEN 'officer.municipal' THEN 'Municipal'
        WHEN 'officer.grievance' THEN 'Grievance'
    END,
    CASE u.username
        WHEN 'admin' THEN 'System Administrator'
        WHEN 'supervisor.revenue' THEN 'Senior Supervisor'
        WHEN 'officer.revenue' THEN 'Junior Officer'
        WHEN 'officer.municipal' THEN 'Field Officer'
        WHEN 'officer.grievance' THEN 'Case Officer'
    END
    FROM inserted_users u
    WHERE u.username IN ('admin', 'supervisor.revenue', 'officer.revenue', 'officer.municipal', 'officer.grievance')
    RETURNING id, user_id
)
INSERT INTO citizens (id, user_id, full_name, phone, address, aadhaar_number_masked)
SELECT uuid_generate_v4(), u.id, 'Demo Citizen', '9999999999', '123 Demo Street, Hyderabad', '****-****-1234'
FROM inserted_users u
WHERE u.username = 'citizen.demo';

-- Requests and related records
WITH demo_citizen AS (
    SELECT c.id AS citizen_id
    FROM citizens c
    JOIN users u ON u.id = c.user_id
    WHERE u.username = 'citizen.demo'
),
assigned_officer AS (
    SELECT o.id AS officer_id
    FROM officers o
    JOIN users u ON u.id = o.user_id
    WHERE u.username = 'officer.revenue'
)
INSERT INTO requests (id, request_number, citizen_id, service_type, description, status, assigned_officer_id, officer_remarks, created_at, updated_at)
SELECT
    uuid_generate_v4(),
    'REV-2026-00001',
    dc.citizen_id,
    'Property Tax Issue',
    'Citizen reported a mismatch in property tax assessment and requested review.',
    'in_review',
    ao.officer_id,
    'We are verifying the submitted records.',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
FROM demo_citizen dc
CROSS JOIN assigned_officer ao;

-- Documents
WITH req AS (
    SELECT id FROM requests WHERE request_number = 'REV-2026-00001'
)
INSERT INTO documents (id, request_id, original_filename, stored_path, mime_type, size_bytes, status, uploaded_at)
VALUES
    (uuid_generate_v4(), (SELECT id FROM req), 'property-tax-notice.jpg', '/storage/uploads/property-tax-notice.jpg', 'image/jpeg', 245760, 'ocr_complete', NOW() - INTERVAL '1 day');

-- OCR data
WITH doc AS (
    SELECT id FROM documents WHERE original_filename = 'property-tax-notice.jpg'
)
INSERT INTO ocr_data (id, document_id, raw_text, extracted_fields, corrected_fields, confidence, created_at)
VALUES (
    uuid_generate_v4(),
    (SELECT id FROM doc),
    'Property Tax Notice\nOwner: Demo Citizen\nAssessment: 2026',
    '{"name": "Demo Citizen", "address": "123 Demo Street, Hyderabad", "assessment_year": "2026"}'::jsonb,
    '{"name": "Demo Citizen", "address": "123 Demo Street, Hyderabad", "assessment_year": "2026"}'::jsonb,
    0.91,
    NOW() - INTERVAL '1 day'
);

-- Notifications
WITH req AS (
    SELECT id FROM requests WHERE request_number = 'REV-2026-00001'
), usr AS (
    SELECT id FROM users WHERE username = 'citizen.demo'
)
INSERT INTO notifications (id, user_id, request_id, type, message, is_read, created_at)
VALUES (
    uuid_generate_v4(),
    (SELECT id FROM usr),
    (SELECT id FROM req),
    'status_change',
    'Your request is now under review by the Revenue Department.',
    FALSE,
    NOW() - INTERVAL '1 day'
);

-- Audit logs
WITH req AS (
    SELECT id FROM requests WHERE request_number = 'REV-2026-00001'
), usr AS (
    SELECT id FROM users WHERE username = 'citizen.demo'
)
INSERT INTO audit_logs (id, user_id, user_role, action, request_id, previous_status, new_status, ip_address, details, timestamp)
VALUES (
    uuid_generate_v4(),
    (SELECT id FROM usr),
    'citizen',
    'request_submitted',
    (SELECT id FROM req),
    NULL,
    'pending',
    '127.0.0.1',
    '{"source": "web_app", "channel": "citizen"}'::jsonb,
    NOW() - INTERVAL '2 days'
);

-- AI response
WITH req AS (
    SELECT id FROM requests WHERE request_number = 'REV-2026-00001'
)
INSERT INTO ai_responses (id, request_id, prompt, response_text, model_used, retrieved_context, confidence, created_at)
VALUES (
    uuid_generate_v4(),
    (SELECT id FROM req),
    'Summarize the request and advise next steps.',
    'Your request has been received and is being reviewed by the Revenue department. You will receive updates shortly.',
    'qwen2.5:7b',
    '{"document_ids": ["demo-doc-1"], "scores": [0.92]}'::jsonb,
    0.92,
    NOW() - INTERVAL '1 day'
);

COMMIT;
