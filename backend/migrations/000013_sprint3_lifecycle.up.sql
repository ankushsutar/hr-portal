-- Sprint 3: Employee Lifecycle Engine

CREATE TABLE IF NOT EXISTS employee_lifecycle_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    effective_date DATE NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for querying employee timeline
CREATE INDEX IF NOT EXISTS idx_employee_lifecycle_events_emp_date ON employee_lifecycle_events(employee_id, effective_date DESC);
