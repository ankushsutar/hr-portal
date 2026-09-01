INSERT INTO leave_types (id, organization_id, name, code, description, is_paid, max_carry_forward, accrual_frequency, accrual_days, sandwich_rule, allow_half_day, encashable)
VALUES
(uuid_generate_v4(), '633a9fd3-1602-4bc8-9aa4-dd2d575cd5b3', 'Privilege Leave (PL)', 'PL', 'Annual Privilege Leave', true, 30, 'MONTHLY', 1.5, false, true, true),
(uuid_generate_v4(), '633a9fd3-1602-4bc8-9aa4-dd2d575cd5b3', 'Casual Leave (CL)', 'CL', 'Casual Leave', true, 0, 'ANNUAL', 12, false, true, false),
(uuid_generate_v4(), '633a9fd3-1602-4bc8-9aa4-dd2d575cd5b3', 'Sick Leave (SL)', 'SL', 'Sick Leave', true, 0, 'ANNUAL', 10, true, true, false),
(uuid_generate_v4(), '633a9fd3-1602-4bc8-9aa4-dd2d575cd5b3', 'Leave Without Pay (LWP)', 'LWP', 'Unpaid Leave', false, 0, 'N/A', 0, false, true, false)
ON CONFLICT DO NOTHING;

INSERT INTO leave_balances (employee_id, leave_type_id, year, total_accrued, total_used, balance)
SELECT e.id, lt.id, 2026, 
  CASE WHEN lt.code = 'PL' THEN 18 WHEN lt.code = 'CL' THEN 12 WHEN lt.code = 'SL' THEN 10 ELSE 0 END,
  CASE WHEN lt.code = 'PL' THEN 4 WHEN lt.code = 'CL' THEN 3 WHEN lt.code = 'SL' THEN 2 ELSE 0 END,
  CASE WHEN lt.code = 'PL' THEN 14 WHEN lt.code = 'CL' THEN 9 WHEN lt.code = 'SL' THEN 8 ELSE 0 END
FROM employees e
CROSS JOIN leave_types lt;

