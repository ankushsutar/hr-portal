-- Migration 000034: Add summary columns to payroll_runs table
ALTER TABLE payroll_runs 
ADD COLUMN IF NOT EXISTS total_employees INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_gross NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_deductions NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_net_pay NUMERIC(12, 2) DEFAULT 0;
