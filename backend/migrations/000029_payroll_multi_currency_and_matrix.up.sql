-- Migration 000029: Multi-Currency Salary Engine & Dynamic Allowance/Deduction Matrix

CREATE TABLE IF NOT EXISTS currencies (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    exchange_rate_to_base NUMERIC(12,6) DEFAULT 1.0,
    is_base BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Safely extend salary_components table if it already exists
ALTER TABLE salary_components 
ADD COLUMN IF NOT EXISTS code VARCHAR(50),
ADD COLUMN IF NOT EXISTS calculation_type VARCHAR(30) DEFAULT 'FLAT',
ADD COLUMN IF NOT EXISTS default_value NUMERIC(12,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS is_statutory BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS employee_salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    currency_code VARCHAR(3) DEFAULT 'INR' REFERENCES currencies(code),
    base_salary NUMERIC(12,2) NOT NULL,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_salary_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salary_structure_id UUID NOT NULL REFERENCES employee_salary_structures(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES salary_components(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    percentage NUMERIC(5,2) DEFAULT 0.0
);

-- Seed Currencies
INSERT INTO currencies (code, name, symbol, exchange_rate_to_base, is_base) VALUES
('INR', 'Indian Rupee', '₹', 1.000000, true),
('USD', 'US Dollar', '$', 0.012000, false),
('EUR', 'Euro', '€', 0.011000, false),
('AED', 'UAE Dirham', 'AED ', 0.044000, false),
('GBP', 'British Pound', '£', 0.009400, false)
ON CONFLICT (code) DO NOTHING;

-- Seed Salary Components for active organization
DO $$
DECLARE
    org_id UUID;
BEGIN
    SELECT id INTO org_id FROM organizations LIMIT 1;
    IF org_id IS NOT NULL THEN
        INSERT INTO salary_components (organization_id, code, name, type, calculation_type, default_value, is_taxable, is_statutory) VALUES
        (org_id, 'BASIC', 'Basic Salary', 'EARNING', 'PERCENTAGE_OF_GROSS', 50.00, true, true),
        (org_id, 'HRA', 'House Rent Allowance', 'EARNING', 'PERCENTAGE_OF_BASIC', 40.00, true, false),
        (org_id, 'SPECIAL_ALLOWANCE', 'Special Allowance', 'EARNING', 'FLAT', 15000.00, true, false),
        (org_id, 'MEDICAL_ALLOWANCE', 'Medical Allowance', 'EARNING', 'FLAT', 1250.00, false, false),
        (org_id, 'CONVEYANCE', 'Conveyance Allowance', 'EARNING', 'FLAT', 1600.00, false, false),
        (org_id, 'PF_EMP', 'Provident Fund (Employee)', 'DEDUCTION', 'PERCENTAGE_OF_BASIC', 12.00, false, true),
        (org_id, 'INCOME_TAX', 'Tax Deducted at Source (TDS)', 'DEDUCTION', 'PERCENTAGE_OF_GROSS', 10.00, false, true),
        (org_id, 'PROF_TAX', 'Professional Tax (PT)', 'DEDUCTION', 'FLAT', 200.00, false, true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
