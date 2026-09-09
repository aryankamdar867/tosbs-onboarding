-- TOSBS ONBOARDING Database Schema
-- You can run this script directly in your Supabase SQL Editor.

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. HR Profiles Table
CREATE TABLE IF NOT EXISTS hr_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Employees (Core Onboarding Record)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    work_email TEXT UNIQUE NOT NULL,
    personal_email TEXT,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    status TEXT DEFAULT 'invited' NOT NULL, -- 'invited', 'registered', 'details_filled', 'digilocker_verified', 'approved'
    invite_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Detailed Profile Data
CREATE TABLE IF NOT EXISTS employee_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    phone_number TEXT,
    dob DATE,
    gender TEXT,
    permanent_address TEXT,
    current_address TEXT,
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    education_history JSONB, -- Array of education objects: [{degree, institution, passing_year, grade}]
    employment_history JSONB, -- Array of past jobs: [{company, role, start_date, end_date}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. DigiLocker Verifications
CREATE TABLE IF NOT EXISTS digilocker_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    aadhaar_masked TEXT NOT NULL, -- e.g. "XXXX-XXXX-1234"
    pan_number TEXT, -- e.g. "ABCDE1234F"
    name_on_aadhaar TEXT NOT NULL,
    dob_on_aadhaar DATE,
    gender_on_aadhaar TEXT,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Uploaded Documents Metadata
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- 'photo', 'signature', 'aadhaar_pdf', 'pan_pdf', 'degree'
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL, -- Can be a Supabase storage URL or base64 data URL
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert a default HR Account for demonstration purposes (Password authentication handled client-side or via Supabase Auth)
INSERT INTO hr_profiles (email, full_name)
VALUES ('admin@tosbs.com', 'Sarah Jenkins')
ON CONFLICT (email) DO NOTHING;
