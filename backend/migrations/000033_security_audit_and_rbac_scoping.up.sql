-- Migration 000033: Security, Audit Trail Engine & RBAC Data Scoping Audit

CREATE TABLE IF NOT EXISTS data_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    ip_address VARCHAR(50),
    user_agent TEXT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_data_access_logs_user ON data_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_module ON data_access_logs(module);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_accessed_at ON data_access_logs(accessed_at DESC);
