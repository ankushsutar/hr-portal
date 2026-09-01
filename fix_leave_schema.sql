ALTER TABLE leave_types 
ADD COLUMN IF NOT EXISTS code VARCHAR(20),
ADD COLUMN IF NOT EXISTS accrual_frequency VARCHAR(50),
ADD COLUMN IF NOT EXISTS accrual_days NUMERIC(4,2),
ADD COLUMN IF NOT EXISTS sandwich_rule BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allow_half_day BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS encashable BOOLEAN DEFAULT FALSE;

UPDATE leave_types SET code = 'PL' WHERE name LIKE '%Privilege%';
UPDATE leave_types SET code = 'CL' WHERE name LIKE '%Casual%';
UPDATE leave_types SET code = 'SL' WHERE name LIKE '%Sick%';
UPDATE leave_types SET code = 'LWP' WHERE name LIKE '%Without Pay%';

-- Also check leave_balances
-- From 000004:
-- year INT NOT NULL, total_accrued NUMERIC(5, 2) DEFAULT 0, total_used NUMERIC(5, 2) DEFAULT 0, balance NUMERIC(5, 2) DEFAULT 0
-- This is fine.

