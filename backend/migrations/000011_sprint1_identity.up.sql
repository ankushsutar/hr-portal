-- Sprint 1: Identity, Authorization & Data Scopes

-- User invitation fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP WITH TIME ZONE;

-- Session tracking (for revocation)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);

-- Permissions registry (module + action + scope)
DROP TABLE IF EXISTS permissions CASCADE;
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,  -- READ, WRITE, APPROVE, EXPORT, DELETE
    scope VARCHAR(50) NOT NULL,    -- SELF, DIRECT_REPORTS, DEPARTMENT, ORGANIZATION, SALARY_ACCESS
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(module, action, scope)
);

-- Seed default permissions
INSERT INTO permissions (module, action, scope, description) VALUES
    ('employees', 'READ',   'SELF',           'View own employee profile'),
    ('employees', 'READ',   'DIRECT_REPORTS', 'View direct report profiles'),
    ('employees', 'READ',   'DEPARTMENT',     'View all employees in department'),
    ('employees', 'READ',   'ORGANIZATION',   'View all employees in organization'),
    ('employees', 'WRITE',  'ORGANIZATION',   'Create and edit employee records'),
    ('leave',     'READ',   'SELF',           'View own leave requests'),
    ('leave',     'READ',   'DIRECT_REPORTS', 'View team leave requests'),
    ('leave',     'READ',   'ORGANIZATION',   'View all leave requests'),
    ('leave',     'APPROVE','DIRECT_REPORTS', 'Approve team leave requests'),
    ('leave',     'APPROVE','ORGANIZATION',   'Approve all leave requests'),
    ('attendance','READ',   'SELF',           'View own attendance'),
    ('attendance','READ',   'DIRECT_REPORTS', 'View team attendance'),
    ('attendance','READ',   'ORGANIZATION',   'View all attendance'),
    ('payroll',   'READ',   'SALARY_ACCESS',  'View payroll and salary data'),
    ('payroll',   'WRITE',  'SALARY_ACCESS',  'Process payroll'),
    ('users',     'READ',   'ORGANIZATION',   'View system users'),
    ('users',     'WRITE',  'ORGANIZATION',   'Manage system users')
ON CONFLICT (module, action, scope) DO NOTHING;

-- Role-Permission assignments
CREATE TABLE IF NOT EXISTS role_permissions_v2 (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Seed default roles first (ensures roles exist)
INSERT INTO roles (name, description) VALUES
    ('SUPER_ADMIN',    'Full system access'),
    ('HR_ADMIN',       'HR administration — full employee and leave access'),
    ('HR_MANAGER',     'HR approvals and lifecycle management'),
    ('MANAGER',        'Team management — direct reports only'),
    ('EMPLOYEE',       'Self-service access'),
    ('PAYROLL_ADMIN',  'Payroll and salary access')
ON CONFLICT (name) DO NOTHING;
