export const leaveBalance = [
    { type: 'Casual Leave', total: 12, used: 3, remaining: 9 },
    { type: 'Sick Leave', total: 10, used: 4, remaining: 6 },
    { type: 'Earned Leave', total: 15, used: 0, remaining: 15 },
    { type: 'Compensatory Off', total: 2, used: 0, remaining: 2 },
]

export const leaveHistory = [
    { id: 1, type: 'Sick Leave', from: '2026-05-20', to: '2026-05-21', days: 2, reason: 'Fever and rest', status: 'Approved' },
    { id: 2, type: 'Casual Leave', from: '2026-04-14', to: '2026-04-14', days: 1, reason: 'Personal work', status: 'Approved' },
    { id: 3, type: 'Casual Leave', from: '2026-05-18', to: '2026-05-19', days: 2, reason: 'Family event', status: 'Pending' },
    { id: 4, type: 'Earned Leave', from: '2026-03-25', to: '2026-03-28', days: 4, reason: 'Vacation', status: 'Approved' },
    { id: 5, type: 'Sick Leave', from: '2026-02-10', to: '2026-02-10', days: 1, reason: 'Doctor visit', status: 'Rejected' },
]

export const leaveTypes = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Compensatory Off']