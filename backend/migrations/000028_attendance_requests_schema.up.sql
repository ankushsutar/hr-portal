CREATE TABLE IF NOT EXISTS attendance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL DEFAULT 'REGULARIZATION',
    request_date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    shift_name VARCHAR(100) DEFAULT 'Regular Shift',
    reason TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
