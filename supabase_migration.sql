-- =============================================================================
-- Migration: Attendance Deduplication, Constraints, Indexes & Nightly Absent Cron
-- File: supabase_migration.sql
-- (Do not run automatically; apply via Supabase SQL Editor when ready)
-- =============================================================================

-- Step 1: Deduplicate existing attendance records
-- Keeps the latest record per employee_id and date (based on created_at DESC or id DESC)
DELETE FROM attendance
WHERE id NOT IN (
  SELECT DISTINCT ON (employee_id, date) id
  FROM attendance
  ORDER BY employee_id, date, created_at DESC NULLS LAST, id DESC
);

-- Step 2: Add unique constraint on (employee_id, date) to prevent duplicate rows
ALTER TABLE attendance
DROP CONSTRAINT IF EXISTS attendance_employee_id_date_unique;

ALTER TABLE attendance
ADD CONSTRAINT attendance_employee_id_date_unique UNIQUE (employee_id, date);

-- Step 3: Add index on (employee_id, date) for high-performance range queries and lookups
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);

-- Step 4: Festival Table / Calendar Helper for Public Holidays
CREATE TABLE IF NOT EXISTS public_holidays (
  holiday_date DATE PRIMARY KEY,
  name TEXT NOT NULL
);

-- Populate holidays for 2026 (matching company festival calendar)
INSERT INTO public_holidays (holiday_date, name) VALUES
  ('2026-01-01', 'New Year''s Day'),
  ('2026-01-26', 'Republic Day'),
  ('2026-03-04', 'Holi'),
  ('2026-03-21', 'Eid al-Fitr'),
  ('2026-05-28', 'Eid al-Adha'),
  ('2026-08-15', 'Independence Day'),
  ('2026-08-28', 'Raksha Bandhan'),
  ('2026-09-14', 'Ganesh Chaturthi'),
  ('2026-10-02', 'Gandhi Jayanti'),
  ('2026-10-19', 'Dussehra'),
  ('2026-11-06', 'Dhanteras'),
  ('2026-11-08', 'Diwali'),
  ('2026-11-10', 'Bhai Dooj'),
  ('2026-12-25', 'Christmas')
ON CONFLICT (holiday_date) DO NOTHING;

-- Step 5: Function to mark unrecorded active employees as absent nightly at 23:59 IST
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
  -- Get current date in IST (UTC + 5:30)
  today_ist := (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;

  -- 1. Check if today is Sunday (DOW 0 in Postgres)
  is_sunday := (EXTRACT(DOW FROM (NOW() AT TIME ZONE 'Asia/Kolkata')) = 0);
  IF is_sunday THEN
    RAISE NOTICE 'Today (%) is Sunday (Weekly Off). Skipping auto-absent.', today_ist;
    RETURN;
  END IF;

  -- 2. Check if today is a public holiday / festival
  SELECT EXISTS(SELECT 1 FROM public_holidays WHERE holiday_date = today_ist) INTO is_holiday;
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

-- Step 6: pg_cron schedule
-- 23:59 IST = 18:29 UTC (cron uses UTC on Supabase)
-- Note: Ensure pg_cron extension is enabled in Supabase Database > Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'nightly-absent-marking-2359-ist',
  '29 18 * * *',
  'SELECT mark_nightly_absent_employees();'
);
