-- =============================================================================
-- Migration: Attendance Constraints, Holidays Table, Nightly Absent Job & Payroll Snapshots
-- File: supabase_migration.sql
-- (Do not run automatically; apply via Supabase SQL Editor when ready)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Step 1: Deduplicate existing attendance records
-- Keeps the latest record per employee_id and date (based on created_at DESC or id DESC)
-- -----------------------------------------------------------------------------
DELETE FROM attendance
WHERE id NOT IN (
  SELECT DISTINCT ON (employee_id, date) id
  FROM attendance
  ORDER BY employee_id, date, created_at DESC NULLS LAST, id DESC
);

-- -----------------------------------------------------------------------------
-- Step 2: Add unique constraint on (employee_id, date) to prevent duplicate rows
-- -----------------------------------------------------------------------------
ALTER TABLE attendance
DROP CONSTRAINT IF EXISTS attendance_employee_id_date_unique;

ALTER TABLE attendance
ADD CONSTRAINT attendance_employee_id_date_unique UNIQUE (employee_id, date);

-- -----------------------------------------------------------------------------
-- Step 3: Add index on (employee_id, date) for high-performance lookups
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);

-- -----------------------------------------------------------------------------
-- Step 4: Holidays Table (Company Holidays & Festivals including Maharashtra)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed holidays for 2026 (Maharashtra State & National Festival Calendar)
INSERT INTO holidays (date, name, is_paid) VALUES
  ('2026-01-01', 'New Year''s Day', true),
  ('2026-01-26', 'Republic Day', true),
  ('2026-02-19', 'Chhatrapati Shivaji Maharaj Jayanti', true),
  ('2026-03-04', 'Holi', true),
  ('2026-03-20', 'Gudi Padwa', true),
  ('2026-03-21', 'Eid al-Fitr', true),
  ('2026-04-14', 'Dr. Babasaheb Ambedkar Jayanti', true),
  ('2026-05-01', 'Maharashtra Day / Labour Day', true),
  ('2026-05-28', 'Eid al-Adha', true),
  ('2026-08-15', 'Independence Day', true),
  ('2026-08-28', 'Raksha Bandhan', true),
  ('2026-09-14', 'Ganesh Chaturthi', true),
  ('2026-10-02', 'Gandhi Jayanti', true),
  ('2026-10-19', 'Dussehra', true),
  ('2026-11-06', 'Dhanteras', true),
  ('2026-11-08', 'Diwali', true),
  ('2026-11-10', 'Bhai Dooj', true),
  ('2026-12-25', 'Christmas', true)
ON CONFLICT (date) DO UPDATE SET name = EXCLUDED.name, is_paid = EXCLUDED.is_paid;

-- -----------------------------------------------------------------------------
-- Step 5: Function to mark unrecorded active employees as absent nightly at 23:59 IST
-- Reads from the holidays table above
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION mark_nightly_absent_employees()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_ist DATE;
  is_sunday BOOLEAN;
  is_holiday BOOLEAN;
BEGIN
  -- Current date in IST (UTC + 5:30)
  today_ist := (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;

  -- 1. Check if today is Sunday (DOW 0 in Postgres)
  is_sunday := (EXTRACT(DOW FROM (NOW() AT TIME ZONE 'Asia/Kolkata')) = 0);
  IF is_sunday THEN
    RAISE NOTICE 'Today (%) is Sunday (Weekly Off). Skipping auto-absent.', today_ist;
    RETURN;
  END IF;

  -- 2. Check if today is a public holiday / festival from holidays table
  SELECT EXISTS(SELECT 1 FROM holidays WHERE date = today_ist) INTO is_holiday;
  IF is_holiday THEN
    RAISE NOTICE 'Today (%) is a public holiday. Skipping auto-absent.', today_ist;
    RETURN;
  END IF;

  -- 3. Insert 'absent' for active employees with no record today and not on approved leave
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
-- 23:59 IST = 18:29 UTC (cron uses UTC on Supabase)
-- Note: Ensure pg_cron extension is enabled in Supabase Database > Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'nightly-absent-marking-2359-ist',
  '29 18 * * *',
  'SELECT mark_nightly_absent_employees();'
);

-- -----------------------------------------------------------------------------
-- Step 7: Payroll Snapshots Table (Finalized Monthly Payroll Runs)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  breakdown JSONB NOT NULL,
  finalized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT payroll_runs_employee_id_month_unique UNIQUE (employee_id, month)
);

CREATE INDEX IF NOT EXISTS idx_payroll_runs_month ON payroll_runs(month);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_employee ON payroll_runs(employee_id);
