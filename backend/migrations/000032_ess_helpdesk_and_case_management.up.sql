-- Migration 000032: ESS Helpdesk / Support Ticketing Engine & HR Case Management

CREATE TABLE IF NOT EXISTS helpdesk_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    sla_hours INT DEFAULT 24,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS helpdesk_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES helpdesk_categories(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    status VARCHAR(20) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS helpdesk_ticket_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES helpdesk_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Support Categories
INSERT INTO helpdesk_categories (name, description, sla_hours) VALUES
('Payroll & Payslip Query', 'Salary discrepancies, payslip download issues, and tax deduction queries', 24),
('Leave & Attendance Issue', 'Biometric sync errors, leave balance adjustments, and attendance regularization', 12),
('IT & Hardware Support', 'Laptop issues, VPN configuration, software licenses, and access rights', 8),
('Benefits & Health Insurance', 'Medical insurance claim status, wellness benefits, and policy documents', 48),
('General HR Inquiry', 'HR policy clarifications, employment certificates, and workplace queries', 24)
ON CONFLICT (name) DO NOTHING;
