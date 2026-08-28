-- Sprint 8: Attendance Foundation

CREATE TABLE IF NOT EXISTS attendance_raw_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- MANUAL, CSV, ESSL
    punch_time TIMESTAMPTZ NOT NULL,
    punch_type VARCHAR(20), -- IN, OUT
    device_id VARCHAR(100),
    raw_payload JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_daily_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    first_in TIMESTAMPTZ,
    last_out TIMESTAMPTZ,
    status VARCHAR(50), -- PRESENT, ABSENT, HALF_DAY, LATE
    late_by_minutes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);
