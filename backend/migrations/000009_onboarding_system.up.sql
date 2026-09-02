-- Onboarding Templates
CREATE TABLE onboarding_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding Tasks
CREATE TABLE onboarding_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_role VARCHAR(100) NOT NULL, -- The role responsible for this task (e.g. HR_ADMIN, EMPLOYEE, IT_ADMIN)
    due_days INT DEFAULT 0, -- Days after joining date
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Document Checklists
CREATE TABLE document_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Employee Onboarding Instances
CREATE TABLE employee_onboarding_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES onboarding_templates(id),
    status VARCHAR(50) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED, ABANDONED
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Employee Tasks
CREATE TABLE employee_onboarding_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID NOT NULL REFERENCES employee_onboarding_instances(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES onboarding_tasks(id),
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, COMPLETED, OVERDUE
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Employee Documents
CREATE TABLE IF NOT EXISTS employee_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instance_id UUID REFERENCES employee_onboarding_instances(id) ON DELETE CASCADE,
    checklist_id UUID REFERENCES document_checklists(id),
    document_url VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'SUBMITTED', -- SUBMITTED, APPROVED, REJECTED
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
