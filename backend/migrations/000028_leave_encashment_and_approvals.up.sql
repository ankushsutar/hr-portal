-- Migration 000028: Leave Encashment Engine & Multi-level Approval Hierarchy

CREATE TABLE IF NOT EXISTS leave_encashment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    days_to_encash NUMERIC(5,2) NOT NULL,
    per_day_rate NUMERIC(12,2) DEFAULT 0.0,
    total_amount NUMERIC(12,2) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, PAID
    reason TEXT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_approval_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leave_application_id UUID NOT NULL REFERENCES leave_applications(id) ON DELETE CASCADE,
    level INT NOT NULL DEFAULT 1, -- Level 1: Manager, Level 2: HR Admin
    approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    comments TEXT,
    action_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(leave_application_id, level)
);
