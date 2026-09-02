-- Sprint 11: Payroll Engine State Machine & Advances

ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'DRAFT';
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS total_lop_days NUMERIC(8,2) DEFAULT 0;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS total_advances_deducted NUMERIC(12,2) DEFAULT 0;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS variance_percentage NUMERIC(5,2) DEFAULT 0;

DROP TABLE IF EXISTS payroll_advances CASCADE;
CREATE TABLE payroll_advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    amount NUMERIC(12,2) NOT NULL,
    recovery_months INT NOT NULL DEFAULT 1,
    reason TEXT,
    deduct_from_month INT NOT NULL,
    deduct_from_year INT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for payroll advances query by month/year/employee
CREATE INDEX IF NOT EXISTS idx_payroll_advances_emp_period ON payroll_advances(employee_id, deduct_from_year, deduct_from_month);
