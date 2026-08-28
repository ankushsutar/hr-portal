-- Sprint 7: Confirmation & Exit Workflows

CREATE TABLE IF NOT EXISTS exit_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    resignation_date DATE NOT NULL,
    last_working_date DATE,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, COMPLETED
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clearance_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exit_request_id UUID NOT NULL REFERENCES exit_requests(id) ON DELETE CASCADE,
    department VARCHAR(50) NOT NULL, -- IT, FINANCE, HR, ADMIN
    task_description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, COMPLETED
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES users(id)
);
