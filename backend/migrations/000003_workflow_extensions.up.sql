-- Workflow Action Logs
CREATE TABLE workflow_action_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
    workflow_task_id UUID REFERENCES workflow_tasks(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- e.g., 'APPROVED', 'REJECTED', 'RETURNED', 'ESCALATED'
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
