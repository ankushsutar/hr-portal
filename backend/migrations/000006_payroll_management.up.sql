-- Employee Statutory Details
CREATE TABLE employee_statutory_details (
    employee_id UUID PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
    pan_number VARCHAR(20) UNIQUE,
    aadhaar_number VARCHAR(20) UNIQUE,
    uan_number VARCHAR(50) UNIQUE,
    pf_number VARCHAR(50) UNIQUE,
    bank_account_number VARCHAR(100),
    ifsc_code VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Salary Components
CREATE TABLE salary_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- e.g., 'Basic Pay', 'HRA', 'PF'
    type VARCHAR(20) NOT NULL, -- EARNING, DEDUCTION
    is_taxable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Salary Structures
CREATE TABLE salary_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Salary Structure Components
CREATE TABLE salary_structure_components (
    structure_id UUID NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES salary_components(id) ON DELETE CASCADE,
    calculation_type VARCHAR(50) DEFAULT 'FIXED', -- FIXED, PERCENTAGE_OF_BASIC
    value NUMERIC(10, 2) NOT NULL,
    PRIMARY KEY(structure_id, component_id)
);

-- Employee Salaries
CREATE TABLE employee_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    structure_id UUID NOT NULL REFERENCES salary_structures(id) ON DELETE RESTRICT,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payroll Runs
CREATE TABLE payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    month INT NOT NULL,
    year INT NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, PROCESSED, COMPLETED
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, month, year)
);

-- Payslips
CREATE TABLE payslips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    basic_pay NUMERIC(12, 2) DEFAULT 0,
    hra NUMERIC(12, 2) DEFAULT 0,
    total_earnings NUMERIC(12, 2) DEFAULT 0,
    total_deductions NUMERIC(12, 2) DEFAULT 0,
    net_pay NUMERIC(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'GENERATED', -- GENERATED, PUBLISHED
    document_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(payroll_run_id, employee_id)
);
