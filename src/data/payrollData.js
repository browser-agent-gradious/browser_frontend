export const payrollSummary = {
    grossSalary: 100000,
    deductions: 15000,
    netSalary: 85000,
    currency: '₹',
}

export const payslips = [
    { id: 1, month: 'April 2026', gross: 100000, deductions: 15000, net: 85000, status: 'Paid', paidOn: '2026-05-01' },
    { id: 2, month: 'March 2026', gross: 100000, deductions: 15000, net: 85000, status: 'Paid', paidOn: '2026-04-01' },
    { id: 3, month: 'February 2026', gross: 100000, deductions: 15000, net: 85000, status: 'Paid', paidOn: '2026-03-01' },
    { id: 4, month: 'January 2026', gross: 100000, deductions: 15000, net: 85000, status: 'Paid', paidOn: '2026-02-01' },
    { id: 5, month: 'May 2026', gross: 100000, deductions: 15000, net: 85000, status: 'Pending', paidOn: '2026-06-01' },
]

export const deductionBreakdown = [
    { label: 'Provident Fund (PF)', amount: 7200 },
    { label: 'Professional Tax', amount: 200 },
    { label: 'Income Tax (TDS)', amount: 6000 },
    { label: 'Health Insurance', amount: 1600 },
]