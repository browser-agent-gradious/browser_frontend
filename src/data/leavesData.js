export const leaveBalance = [
    {
        type: 'Casual Leave',
        remaining: 7,
        used: 1,
        total: 8,
    },
    {
        type: 'Sick Leave',
        remaining: 5,
        used: 1,
        total: 6,
    },
    {
        type: 'Vacation Leave',
        remaining: 9,
        used: 1,
        total: 10,
    },
]

export const leaveTypes = [
    'Casual Leave',
    'Sick Leave',
    'Vacation Leave',
]

export const leaveHistory = [
    {
        id: 1,
        type: 'Sick Leave',
        from: '2026-05-12',
        to: '2026-05-12',
        days: 1,
        reason: 'Fever and cold',
        status: 'Approved',
    },

    {
        id: 2,
        type: 'Casual Leave',
        from: '2026-04-17',
        to: '2026-04-17',
        days: 1,
        reason: 'Personal work',
        status: 'Approved',
    },

    {
        id: 3,
        type: 'Vacation Leave',
        from: '2026-03-09',
        to: '2026-03-09',
        days: 1,
        reason: 'Family trip',
        status: 'Approved',
    },
]