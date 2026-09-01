-- Migration 000027: Advanced Leave Policy Engine, Accruals, Sandwich Rule & Enhanced Request Fields

CREATE TABLE IF NOT EXISTS leave_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    policy_name VARCHAR(100) NOT NULL,
    accrual_frequency VARCHAR(50) DEFAULT 'MONTHLY', -- 'MONTHLY', 'QUARTERLY', 'ANNUAL'
    accrual_rate NUMERIC(4,2) DEFAULT 1.25,
    max_carry_forward_days INT DEFAULT 5,
    sandwich_rule_enabled BOOLEAN DEFAULT false,
    is_encashable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(leave_type_id)
);

CREATE TABLE IF NOT EXISTS leave_accrual_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    accrual_date DATE NOT NULL,
    days_added NUMERIC(5,2) NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enhance leave_applications table with duration detail fields
ALTER TABLE leave_applications 
ADD COLUMN IF NOT EXISTS is_half_day BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS half_day_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS hourly_start_time VARCHAR(20),
ADD COLUMN IF NOT EXISTS hourly_end_time VARCHAR(20),
ADD COLUMN IF NOT EXISTS duration_type VARCHAR(20) DEFAULT 'FULL_DAY',
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Seed default policies for existing leave types
INSERT INTO leave_policies (leave_type_id, policy_name, accrual_frequency, accrual_rate, max_carry_forward_days, sandwich_rule_enabled, is_encashable)
SELECT id, name || ' Default Policy', 'MONTHLY', 1.25, 5, false, true 
FROM leave_types
ON CONFLICT (leave_type_id) DO NOTHING;
