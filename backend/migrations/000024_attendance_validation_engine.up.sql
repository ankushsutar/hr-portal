-- Migration 000024: Attendance 3-Stage Validation Engine

ALTER TABLE attendance_daily_status 
ADD COLUMN IF NOT EXISTS validation_status VARCHAR(50) DEFAULT 'TO_VALIDATE',
ADD COLUMN IF NOT EXISTS worked_hours NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS expected_hours NUMERIC(5,2) DEFAULT 8.0,
ADD COLUMN IF NOT EXISTS ot_hours NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS validation_comments TEXT;

-- Migration for legacy attendance_logs table compatibility
ALTER TABLE attendance_logs
ADD COLUMN IF NOT EXISTS validation_status VARCHAR(50) DEFAULT 'TO_VALIDATE',
ADD COLUMN IF NOT EXISTS worked_hours NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ot_hours NUMERIC(5,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_attendance_daily_validation ON attendance_daily_status(validation_status);
CREATE INDEX IF NOT EXISTS idx_attendance_daily_date_emp ON attendance_daily_status(date, employee_id);
