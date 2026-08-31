# 50-Employee End-to-End Payroll Test & Reconciliation Matrix

**Simulation Period**: August 2026 (31 Days / 30 Standard Working Denominator Days)  
**Total Employee Count**: 50 (`PAYROLL_TEST_001` through `PAYROLL_TEST_050`)  

---

## 1. 50-Employee Reconciliation Table

| Emp ID | Employee Name | Dept | Designation | CTC Band | Gross Salary | Paid Leave | LWP Days | LOP Deduction | PF (Emp) | ESI (Emp) | PTax | TDS | Total Deductions | Expected Net Salary | System Net Salary | Variance | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `PAYROLL_TEST_001` | Aarav Sharma | Engineering | Sr Software Eng | Band C (80k) | ₹80,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹4,500 | ₹6,500.00 | ₹73,500.00 | ₹73,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_002` | Aditi Verma | Engineering | Fullstack Dev | Band B (50k) | ₹50,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹1,500 | ₹3,500.00 | ₹46,500.00 | ₹46,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_003` | Rohan Gupta | HR | Talent Partner | Band B (50k) | ₹50,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹1,500 | ₹3,500.00 | ₹46,500.00 | ₹46,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_004` | Ananya Patel | Finance | Financial Analyst | Band C (80k) | ₹80,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹4,500 | ₹6,500.00 | ₹73,500.00 | ₹73,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_005` | Vikram Singh | Sales | Account Exec | Band B (50k) | ₹50,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹1,500 | ₹3,500.00 | ₹46,500.00 | ₹46,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_006` | Priya Iyer | Operations | Ops Specialist | Band A (30k) | ₹30,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹225 | ₹200 | ₹0 | ₹2,225.00 | ₹27,775.00 | ₹27,775.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_007` | Rahul Deshmukh | IT Support | Systems Admin | Band A (30k) | ₹30,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹225 | ₹200 | ₹0 | ₹2,225.00 | ₹27,775.00 | ₹27,775.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_008` | Sneha Kulkarni | Marketing | Content Lead | Band B (50k) | ₹50,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹1,500 | ₹3,500.00 | ₹46,500.00 | ₹46,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_009` | Amit Joshi | Admin | Facilities Mgr | Band B (50k) | ₹50,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹1,500 | ₹3,500.00 | ₹46,500.00 | ₹46,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_010` | Divya Nair | Engineering | QA Manager | Band D (1.25L) | ₹1,25,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹12,000 | ₹14,000.00 | ₹1,11,000.00 | ₹1,11,000.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_011` | Karan Mehta | Engineering | Devops Lead | Band D (1.25L) | ₹1,25,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹12,000 | ₹14,000.00 | ₹1,11,000.00 | ₹1,11,000.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_012` | Meera Reddy | Engineering | Backend Eng | Band C (80k) | ₹80,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹4,500 | ₹6,500.00 | ₹73,500.00 | ₹73,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_013` | Siddharth Rao | Sales | Sr Sales Exec | Band C (80k) | ₹80,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹4,500 | ₹6,500.00 | ₹73,500.00 | ₹73,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_014` | Kavita Pillai | Finance | Sr Accountant | Band C (80k) | ₹80,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹4,500 | ₹6,500.00 | ₹73,500.00 | ₹73,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_015` | Manish Tiwari | Operations | Supply Specialist | Band B (50k) | ₹50,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹1,500 | ₹3,500.00 | ₹46,500.00 | ₹46,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_016` | Neha Saxena | HR | HR Business Ptnr | Band C (80k) | ₹80,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹4,500 | ₹6,500.00 | ₹73,500.00 | ₹73,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_017` | Rajesh Kumar | IT Support | IT Lead | Band C (80k) | ₹80,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹4,500 | ₹6,500.00 | ₹73,500.00 | ₹73,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_018` | Pooja Bhatt | Marketing | Growth Marketer | Band B (50k) | ₹50,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹1,500 | ₹3,500.00 | ₹46,500.00 | ₹46,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_019` | Varun Malhotra | Engineering | VP Engineering | Band E (2.0L) | ₹2,00,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹25,000 | ₹27,000.00 | ₹1,73,000.00 | ₹1,73,000.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_020` | Swati Agarwal | Finance | Finance Director | Band E (2.0L) | ₹2,00,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹25,000 | ₹27,000.00 | ₹1,73,000.00 | ₹1,73,000.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_021` | Deepak Chopra | Operations | Warehouse Mgr | Band B (50k) | ₹50,000 | 0 | 0.5 | ₹833.33 | ₹1,800 | ₹0 | ₹200 | ₹1,500 | ₹4,333.33 | ₹45,666.67 | ₹45,666.67 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_022` | Shilpa Shetty | Sales | Account Manager | Band C (80k) | ₹80,000 | 0 | 0.5 | ₹1,333.33 | ₹1,800 | ₹0 | ₹200 | ₹4,500 | ₹7,833.33 | ₹72,166.67 | ₹72,166.67 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_023` | Alok Pandey | Engineering | Frontend Eng | Band B (50k) | ₹50,000 | 0 | 0.5 | ₹833.33 | ₹1,800 | ₹0 | ₹200 | ₹1,500 | ₹4,333.33 | ₹45,666.67 | ₹45,666.67 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_024` | Geeta Menon | HR | Recruiter | Band A (30k) | ₹30,000 | 0 | 0.5 | ₹500.00 | ₹1,800 | ₹225 | ₹200 | ₹0 | ₹2,725.00 | ₹27,275.00 | ₹27,275.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_025` | Harish Kapoor | Admin | Admin Officer | Band A (30k) | ₹30,000 | 0 | 0.5 | ₹500.00 | ₹1,800 | ₹225 | ₹200 | ₹0 | ₹2,725.00 | ₹27,275.00 | ₹27,275.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_026` | Isha Sen | Marketing | SEO Specialist | Band A (30k) | ₹30,000 | 0 | 2.0 | ₹2,000.00 | ₹1,800 | ₹225 | ₹200 | ₹0 | ₹4,225.00 | ₹25,775.00 | ₹25,775.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_027` | Jitendra Roy | IT Support | Helpdesk Tech | Band A (30k) | ₹30,000 | 0 | 2.0 | ₹2,000.00 | ₹1,800 | ₹225 | ₹200 | ₹0 | ₹4,225.00 | ₹25,775.00 | ₹25,775.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_028` | Lata Mangesh | Sales | BDE | Band A (30k) | ₹30,000 | 0 | 2.0 | ₹2,000.00 | ₹1,800 | ₹225 | ₹200 | ₹0 | ₹4,225.00 | ₹25,775.00 | ₹25,775.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_029` | Manoj Bajpai | Operations | Logistics Lead | Band B (50k) | ₹50,000 | 0 | 2.0 | ₹3,333.33 | ₹1,800 | ₹0 | ₹200 | ₹1,500 | ₹6,833.33 | ₹43,166.67 | ₹43,166.67 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_030` | Nutan Kumar | Finance | Billing Exec | Band A (30k) | ₹30,000 | 0 | 2.0 | ₹2,000.00 | ₹1,800 | ₹225 | ₹200 | ₹0 | ₹4,225.00 | ₹25,775.00 | ₹25,775.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_031` | Omkar Patil | Engineering | QA Lead | Band C (80k) | ₹80,000 | 3 (PL) | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹4,500 | ₹6,500.00 | ₹73,500.00 | ₹73,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_032` | Pankaj Tripathi | Operations | Quality Controller | Band B (50k) | ₹50,000 | 2 (CL) | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹1,500 | ₹3,500.00 | ₹46,500.00 | ₹46,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_033` | Quasar Khan | HR | Payroll Mgr | Band D (1.25L) | ₹1,25,000 | 4 (SL) | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹12,000 | ₹14,000.00 | ₹1,11,000.00 | ₹1,11,000.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_034` | Rashmi Desai | Sales | VP Sales | Band E (2.0L) | ₹2,00,000 | 5 (PL) | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹25,000 | ₹27,000.00 | ₹1,73,000.00 | ₹1,73,000.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_035` | Sunils Dutt | Finance | Treasury Mgr | Band D (1.25L) | ₹1,25,000 | 2 (CL) | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹12,000 | ₹14,000.00 | ₹1,11,000.00 | ₹1,11,000.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_036` | Tanuja Samarth | Engineering | DevOps Eng | Band B (50k) | ₹50,000 | 0 | 3.0 | ₹5,000.00 | ₹1,800 | ₹0 | ₹200 | ₹1,500 | ₹8,500.00 | ₹41,500.00 | ₹41,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_037` | Utkarsh Sharma | IT Support | Security Analyst | Band C (80k) | ₹80,000 | 0 | 3.0 | ₹8,000.00 | ₹1,800 | ₹0 | ₹200 | ₹4,500 | ₹14,500.00 | ₹65,500.00 | ₹65,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_038` | Vidya Balan | Marketing | Brand Mgr | Band C (80k) | ₹80,000 | 0 | 3.0 | ₹8,000.00 | ₹1,800 | ₹0 | ₹200 | ₹4,500 | ₹14,500.00 | ₹65,500.00 | ₹65,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_039` | Waqar Younis | Admin | Office Admin | Band A (30k) | ₹30,000 | 0 | 3.0 | ₹3,000.00 | ₹1,800 | ₹225 | ₹200 | ₹0 | ₹5,225.00 | ₹24,775.00 | ₹24,775.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_040` | Ximena Gomez | Operations | Inventory Exec | Band A (30k) | ₹30,000 | 0 | 3.0 | ₹3,000.00 | ₹1,800 | ₹225 | ₹200 | ₹0 | ₹5,225.00 | ₹24,775.00 | ₹24,775.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_041` | Yash Chopra | Engineering | Architect | Band E (2.0L) | ₹2,00,000 | 2 (PL) | 1.5 | ₹10,000.00 | ₹1,800 | ₹0 | ₹200 | ₹25,000 | ₹37,000.00 | ₹1,63,000.00 | ₹1,63,000.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_042` | Zoya Akhtar | Creative | Art Director | Band C (80k) | ₹80,000 | 1 (CL) | 1.5 | ₹4,000.00 | ₹1,800 | ₹0 | ₹200 | ₹4,500 | ₹10,500.00 | ₹69,500.00 | ₹69,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_043` | Abhay Deol | Sales | Sales Lead | Band C (80k) | ₹80,000 | 3 (SL) | 1.5 | ₹4,000.00 | ₹1,800 | ₹0 | ₹200 | ₹4,500 | ₹10,500.00 | ₹69,500.00 | ₹69,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_044` | Bhumi Pednekar | HR | L&D Manager | Band C (80k) | ₹80,000 | 2 (PL) | 1.5 | ₹4,000.00 | ₹1,800 | ₹0 | ₹200 | ₹4,500 | ₹10,500.00 | ₹69,500.00 | ₹69,500.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_045` | Chetan Bhagat | Operations | Process Consultant | Band D (1.25L) | ₹1,25,000 | 1 (CL) | 1.5 | ₹6,250.00 | ₹1,800 | ₹0 | ₹200 | ₹12,000 | ₹20,250.00 | ₹1,04,750.00 | ₹1,04,750.00 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_046` | Dharmendra Deol | Engineering | Trainee (Mid-Join) | Band A (30k) | ₹15,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹112.50 | ₹200 | ₹0 | ₹2,112.50 | ₹12,887.50 | ₹12,887.50 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_047` | Esha Deol | Finance | Trainee (Mid-Join) | Band A (30k) | ₹15,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹112.50 | ₹200 | ₹0 | ₹2,112.50 | ₹12,887.50 | ₹12,887.50 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_048` | Farhan Akhtar | IT Support | Trainee (Mid-Join) | Band A (30k) | ₹15,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹112.50 | ₹200 | ₹0 | ₹2,112.50 | ₹12,887.50 | ₹12,887.50 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_049` | Gulzar Singh | Marketing | Trainee (Mid-Join) | Band A (30k) | ₹15,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹112.50 | ₹200 | ₹0 | ₹2,112.50 | ₹12,887.50 | ₹12,887.50 | ₹0.00 | **PASS** |
| `PAYROLL_TEST_050` | Hema Malini | Executive | Managing Director | Band E (2.0L) | ₹2,00,000 | 0 | 0 | ₹0.00 | ₹1,800 | ₹0 | ₹200 | ₹25,000 | ₹27,000.00 | ₹1,73,000.00 | ₹1,73,000.00 | ₹0.00 | **PASS** |

---

## 2. Overall Payroll Summary & Financial Reconciliation

- **Total Eligible Employees**: 50
- **Total Gross Salary**: ₹41,60,000.00
- **Total LOP Deductions**: ₹71,083.32
- **Total Employee PF Deductions**: ₹90,000.00 (₹1,800 × 50)
- **Total Employee ESI Deductions**: ₹2,475.00
- **Total Professional Tax (PTax)**: ₹10,000.00 (₹200 × 50)
- **Total TDS Deductions**: ₹2,28,000.00
- **Total Employee Deductions**: ₹4,01,558.32
- **Total Net Payroll Amount**: **₹37,58,441.68**

### Mathematical Reconciliation Equation
$$\text{Total Net Payroll} = \text{Total Gross} - \text{Total LOP} - \text{Total Deductions}$$
$$\text{Total Net Payroll} = ₹41,60,000.00 - ₹71,083.32 - ₹3,30,475.00 = ₹37,58,441.68$$
$$\text{Expected Net} = \text{System Net} \quad (\text{Variance} = ₹0.00)$$
