-- Sprint 5: Bulk Import Engine - Rows Tracking

CREATE TABLE IF NOT EXISTS import_rows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
    row_number INT NOT NULL,
    raw_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, VALID, ERROR, PROCESSED
    error_message TEXT,
    created_employee_id UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_import_rows_batch_status ON import_rows(batch_id, status);
