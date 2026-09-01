-- Migration 000025: Shift Exceptions & Attendance Exception Tracking
CREATE TABLE IF NOT EXISTS attendance_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    exception_type VARCHAR(50) NOT NULL, -- 'LATE_ARRIVAL', 'EARLY_DEPARTURE', 'BOTH', 'MISSING_PUNCH'
    late_minutes INT DEFAULT 0,
    early_departure_minutes INT DEFAULT 0,
    grace_period_minutes INT DEFAULT 15,
    justification TEXT,
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'WAIVED'
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_att_exceptions_employee ON attendance_exceptions(employee_id);
CREATE INDEX IF NOT EXISTS idx_att_exceptions_status ON attendance_exceptions(status);
CREATE INDEX IF NOT EXISTS idx_att_exceptions_date ON attendance_exceptions(attendance_date);
