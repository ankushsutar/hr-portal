CREATE OR REPLACE VIEW v_universal_approvals AS
SELECT 
    id, 
    'LEAVE' as module, 
    'Leave Request' as type, 
    employee_id, 
    to_char(start_date, 'YYYY-MM-DD') || ' to ' || to_char(end_date, 'YYYY-MM-DD') as requested_date, 
    reason, 
    'NORMAL' as priority, 
    status, 
    created_at 
FROM leave_applications
UNION ALL
SELECT 
    id, 
    'ATTENDANCE' as module, 
    'Regularization' as type, 
    employee_id, 
    to_char(requested_check_in, 'YYYY-MM-DD') as requested_date, 
    reason, 
    'NORMAL' as priority, 
    status, 
    created_at 
FROM regularization_requests
UNION ALL
SELECT 
    id, 
    'ATTENDANCE' as module, 
    'On Duty' as type, 
    employee_id, 
    to_char(date, 'YYYY-MM-DD') as requested_date, 
    reason, 
    'NORMAL' as priority, 
    status, 
    created_at 
FROM od_requests
UNION ALL
SELECT 
    id, 
    'ATTENDANCE' as module, 
    'WFH' as type, 
    employee_id, 
    to_char(date, 'YYYY-MM-DD') as requested_date, 
    reason, 
    'NORMAL' as priority, 
    status, 
    created_at 
FROM wfh_requests
UNION ALL
SELECT 
    id, 
    'ADVANCE' as module, 
    'Salary Advance' as type, 
    employee_id, 
    'Recovery Months: ' || recovery_months::text as requested_date, 
    reason, 
    'URGENT' as priority, 
    status, 
    created_at 
FROM payroll_advances
UNION ALL
SELECT 
    id, 
    'OFFBOARDING' as module, 
    'Exit Request' as type, 
    employee_id, 
    to_char(resignation_date, 'YYYY-MM-DD') as requested_date, 
    reason, 
    'NORMAL' as priority, 
    status, 
    created_at 
FROM exit_requests;
