CREATE OR REPLACE VIEW attendance_requests AS
SELECT id, 'REGULARIZATION' as request_type, requested_check_in::date as request_date, status, reason, created_at, employee_id
FROM regularization_requests
UNION ALL
SELECT id, 'WFH' as request_type, date as request_date, status, reason, created_at, employee_id
FROM wfh_requests
UNION ALL
SELECT id, 'OD' as request_type, date as request_date, status, reason, created_at, employee_id
FROM od_requests;
