-- Bulk Import Batches
CREATE TABLE import_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    import_type VARCHAR(50) NOT NULL, -- e.g., 'EMPLOYEES'
    total_rows INT DEFAULT 0,
    valid_rows INT DEFAULT 0,
    error_rows INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'UPLOADING', -- UPLOADING, VALIDATING, READY, IMPORTING, COMPLETED, FAILED
    errors_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
