-- Sprint 13: Data Quality Center & Reports Optimization Indexes

CREATE INDEX IF NOT EXISTS idx_employees_dept_status ON employees(department_id, employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_joining_date ON employees(date_of_joining);
