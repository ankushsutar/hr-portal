-- Sprint 10: Leave Engine

CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  description TEXT,
  accrual_frequency VARCHAR(50), -- MONTHLY, QUARTERLY, ANNUAL
  accrual_days NUMERIC(4,2),
  max_carry_forward NUMERIC(4,2) DEFAULT 0,
  sandwich_rule BOOLEAN DEFAULT FALSE,
  allow_half_day BOOLEAN DEFAULT FALSE,
  encashable BOOLEAN DEFAULT FALSE,
  max_continuous_days INT,
  applicable_after_days INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  total_accrued NUMERIC(5,2) DEFAULT 0,
  total_used NUMERIC(5,2) DEFAULT 0,
  last_accrual_date DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, leave_type_id)
);
