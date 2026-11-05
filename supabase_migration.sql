-- =============================================================================
-- Migration: Attendance Constraints, Holidays Table, Nightly Absent Job & Payroll Snapshots
-- File: supabase_migration.sql
-- (Do not run automatically; apply via Supabase SQL Editor when ready)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Attendance deduplication and constraints
-- Attendance: one row per employee per day (dedupe first, keep latest)
-- -----------------------------------------------------------------------------
DELETE FROM attendance a USING attendance b
 WHERE a.employee_id = b.employee_id AND a.date = b.date
   AND a.created_at < b.created_at;

ALTER TABLE attendance
  DROP CONSTRAINT IF EXISTS attendance_employee_date_key;
ALTER TABLE attendance
  DROP CONSTRAINT IF EXISTS attendance_employee_id_date_unique;

ALTER TABLE attendance
  ADD CONSTRAINT attendance_employee_date_key UNIQUE (employee_id, date);

CREATE INDEX IF NOT EXISTS attendance_emp_date_idx ON attendance (employee_id, date);

-- -----------------------------------------------------------------------------
-- Step 2: salary_config columns
-- -----------------------------------------------------------------------------
ALTER TABLE salary_config
  ADD COLUMN IF NOT EXISTS tds_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tds_rate NUMERIC DEFAULT 2;

-- -----------------------------------------------------------------------------
-- Step 3: holidays table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT true,
  recurring BOOLEAN NOT NULL DEFAULT false
);

-- Seed holidays for 2026 (including Maharashtra state & national holidays)
-- Dussehra in 2026 is 20 October 2026
INSERT INTO holidays (date, name, is_paid, recurring) VALUES
  ('2026-01-01', 'New Year''s Day', true, true),
  ('2026-01-26', 'Republic Day', true, true),
  ('2026-02-19', 'Chhatrapati Shivaji Maharaj Jayanti', true, true),
  ('2026-03-04', 'Holi', true, false),
  ('2026-03-20', 'Gudi Padwa', true, false),
  ('2026-03-21', 'Eid al-Fitr', true, false),
  ('2026-04-14', 'Dr. Babasaheb Ambedkar Jayanti', true, true),
  ('2026-05-01', 'Maharashtra Day / Labour Day', true, true),
  ('2026-05-28', 'Eid al-Adha', true, false),
  ('2026-08-15', 'Independence Day', true, true),
  ('2026-08-28', 'Raksha Bandhan', true, false),
  ('2026-09-14', 'Ganesh Chaturthi', true, false),
  ('2026-10-02', 'Gandhi Jayanti', true, true),
  ('2026-10-20', 'Dussehra', true, false),
  ('2026-11-06', 'Dhanteras', true, false),
  ('2026-11-08', 'Diwali', true, false),
  ('2026-11-10', 'Bhai Dooj', true, false),
  ('2026-12-25', 'Christmas', true, true)
ON CONFLICT (date) DO UPDATE
  SET name = EXCLUDED.name,
      is_paid = EXCLUDED.is_paid,
      recurring = EXCLUDED.recurring;

-- -----------------------------------------------------------------------------
-- Step 4: payroll snapshots table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payroll_runs (
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  breakdown JSONB NOT NULL,
  finalized_at TIMESTAMPTZ DEFAULT NOW(),
  finalized_by TEXT,
  PRIMARY KEY (employee_id, month)
);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_month ON payroll_runs(month);

-- -----------------------------------------------------------------------------
-- Step 5: Function to mark unrecorded active employees as absent nightly at 23:59 IST
-- Inserts an 'absent' attendance row for each active employee (profiles.status in ('approved','digilocker_verified'))
-- with no row that day, skipping Sundays, rows in holidays where is_paid is true, and dates covered by approved leave_applications.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mark_nightly_absent_employees()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_ist DATE;
  is_sunday BOOLEAN;
  is_paid_holiday BOOLEAN;
BEGIN
  -- Current date in IST (UTC + 5:30)
  today_ist := (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;

  -- 1. Check if today is Sunday (DOW 0 in Postgres)
  is_sunday := (EXTRACT(DOW FROM (NOW() AT TIME ZONE 'Asia/Kolkata')) = 0);
  IF is_sunday THEN
    RAISE NOTICE 'Today (%) is Sunday (Weekly Off). Skipping auto-absent.', today_ist;
    RETURN;
  END IF;

  -- 2. Check if today is a paid holiday / festival from holidays table (or recurring yearly match)
  SELECT EXISTS(
    SELECT 1 FROM holidays
    WHERE (date = today_ist OR (recurring = true AND to_char(date, 'MM-DD') = to_char(today_ist, 'MM-DD')))
      AND is_paid = true
  ) INTO is_paid_holiday;

  IF is_paid_holiday THEN
    RAISE NOTICE 'Today (%) is a paid company holiday. Skipping auto-absent.', today_ist;
    RETURN;
  END IF;

  -- 3. Insert 'absent' for active employees with no attendance record today and not covered by approved leave
  INSERT INTO attendance (
    employee_id,
    date,
    status,
    work_type,
    created_at
  )
  SELECT
    p.id,
    today_ist,
    'absent',
    NULL,
    NOW()
  FROM profiles p
  LEFT JOIN employee_details ed ON ed.employee_id = p.id
  WHERE p.status IN ('approved', 'digilocker_verified')
    AND (p.role IS NULL OR p.role NOT IN ('announcement', 'hr'))
    -- Joined on or before today
    AND (ed.date_of_joining IS NULL OR ed.date_of_joining <= today_ist)
    -- No attendance record for today yet
    AND NOT EXISTS (
      SELECT 1 FROM attendance a
      WHERE a.employee_id = p.id
        AND a.date = today_ist
    )
    -- Not covered by approved leave application
    AND NOT EXISTS (
      SELECT 1 FROM leave_applications l
      WHERE l.employee_id = p.id
        AND l.status = 'approved'
        AND today_ist >= l.from_date
        AND today_ist <= l.to_date
    )
  ON CONFLICT (employee_id, date) DO NOTHING;

  RAISE NOTICE 'Nightly absent attendance marked successfully for %.', today_ist;
END;
$$;

-- -----------------------------------------------------------------------------
-- Step 6: pg_cron schedule
-- 23:59 IST = 18:29 UTC (cron runs in UTC on Supabase)
-- Note: Ensure pg_cron extension is enabled in Supabase Database > Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'nightly-absent-marking-2359-ist',
  '29 18 * * *',
  'SELECT mark_nightly_absent_employees();'
);

-- -----------------------------------------------------------------------------
-- RLS Notes (Comments Only - Do NOT create permissive anon policies):
-- -----------------------------------------------------------------------------
-- 1. attendance:
--    - Enable RLS: ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
--    - Authenticated employees can SELECT/INSERT/UPDATE their own rows (employee_id = auth.uid() or matching profiles.auth_user_id).
--    - HR administrators can SELECT/INSERT/UPDATE all rows.
-- 2. salary_config:
--    - Enable RLS: ALTER TABLE salary_config ENABLE ROW LEVEL SECURITY;
--    - Employees can SELECT only their own salary configuration.
--    - HR can SELECT/INSERT/UPDATE all rows.
-- 3. holidays:
--    - Enable RLS: ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
--    - Authenticated users can SELECT all holidays.
--    - Only HR can INSERT/UPDATE/DELETE.
-- 4. payroll_runs:
--    - Enable RLS: ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
--    - Authenticated employees can SELECT their own finalized snapshots (employee_id = auth.uid()).
--    - HR can SELECT/INSERT/UPDATE all snapshots.
