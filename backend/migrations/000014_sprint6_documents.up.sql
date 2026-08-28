-- Sprint 6: Document Engine

CREATE TABLE IF NOT EXISTS document_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    has_expiry BOOLEAN DEFAULT FALSE,
    requires_verification BOOLEAN DEFAULT TRUE,
    access_scope VARCHAR(50) DEFAULT 'HR' -- HR, PAYROLL, ALL
);

CREATE TABLE IF NOT EXISTS employee_document_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES document_types(id) ON DELETE CASCADE,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'SUBMITTED', -- SUBMITTED, APPROVED, REJECTED
    expiry_date DATE,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    rejection_reason TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
