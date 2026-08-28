-- Sprint 2: Employee Master rich profile fields

-- Core employee table extensions
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) DEFAULT 'PERMANENT';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_phone VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS nationality VARCHAR(100) DEFAULT 'Indian';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS probation_end_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS confirmation_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS notice_period_days INT DEFAULT 30;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_location_id UUID REFERENCES locations(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS reporting_manager_id UUID REFERENCES employees(id);

-- Designations: add grade column if missing
ALTER TABLE designations ADD COLUMN IF NOT EXISTS grade VARCHAR(50);

-- Auto-generate employee IDs via sequence
CREATE SEQUENCE IF NOT EXISTS employee_id_seq START 1001;

-- Ensure statutory details table has all India-specific fields
ALTER TABLE employee_statutory_details ADD COLUMN IF NOT EXISTS esic_number VARCHAR(50);
ALTER TABLE employee_statutory_details ADD COLUMN IF NOT EXISTS pt_applicable BOOLEAN DEFAULT FALSE;
ALTER TABLE employee_statutory_details ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);

-- Seed demo org data for form dropdowns
INSERT INTO organizations (name, code) VALUES ('Demo Company', 'DEMO') ON CONFLICT (code) DO NOTHING;
