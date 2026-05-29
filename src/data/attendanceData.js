export const leaveDates = {
    '2026-05-12': 'SickLeave',
    '2026-04-17': 'CasualLeave',
    '2026-03-09': 'VacationLeave',
}

const checkInTimes = [
    '8:52 AM',
    '8:58 AM',
    '9:00 AM',
    '9:03 AM',
    '9:07 AM',
    '9:10 AM',
    '9:14 AM',
    '9:18 AM',
]

const checkOutTimes = [
    '5:48 PM',
    '5:55 PM',
    '6:00 PM',
    '6:05 PM',
    '6:10 PM',
    '6:18 PM',
    '6:22 PM',
]

const convertToMinutes = (time) => {

    const [hourMinute, modifier] = time.split(' ')

    let [hours, minutes] = hourMinute.split(':').map(Number)

    if (modifier === 'PM' && hours !== 12) {
        hours += 12
    }

    if (modifier === 'AM' && hours === 12) {
        hours = 0
    }

    return hours * 60 + minutes
}

const calculateHours = (checkIn, checkOut) => {

    const inMinutes = convertToMinutes(checkIn)
    const outMinutes = convertToMinutes(checkOut)

    const diff = outMinutes - inMinutes

    const hrs = Math.floor(diff / 60)
    const mins = diff % 60

    return `${hrs}h ${mins}m`
}

const generateAttendance = (year, month, totalDays) => {

    const attendance = {}
    const logs = []

    let id = 1

    const today = new Date()

    const isCurrentMonth =
        today.getFullYear() === year &&
        today.getMonth() === month

    const maxDay = isCurrentMonth
        ? today.getDate() - 1
        : totalDays

    for (let day = 1; day <= maxDay; day++) {

        const date = new Date(year, month, day)

        const weekDay = date.getDay()

        // Skip weekends
        if (weekDay === 0 || weekDay === 6) {
            continue
        }

        const formattedDate =
            `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

        // LEAVE DAYS
        if (leaveDates[formattedDate]) {

            const leaveType = leaveDates[formattedDate]

            attendance[day] = leaveType

            logs.push({
                id: id++,
                date: formattedDate,
                checkIn: '--',
                checkOut: '--',
                hours: '--',
                status:
                    leaveType
                        .replace('Leave', ' Leave'),
            })

            continue
        }

        // PRESENT DAYS
        attendance[day] = 'Present'

        const checkIn =
            checkInTimes[day % checkInTimes.length]

        const checkOut =
            checkOutTimes[(day + 2) % checkOutTimes.length]

        logs.push({
            id: id++,
            date: formattedDate,
            checkIn,
            checkOut,
            hours: calculateHours(checkIn, checkOut),
            status: 'Present',
        })
    }

    return { attendance, logs }
}

const mayData = generateAttendance(2026, 4, 31)
const aprilData = generateAttendance(2026, 3, 30)
const marchData = generateAttendance(2026, 2, 31)

const allLogs = [
    ...mayData.logs,
    ...aprilData.logs,
    ...marchData.logs,
]

export const attendanceSummary = {

    present: allLogs.filter(
        (log) => log.status === 'Present'
    ).length,

    leave: allLogs.filter(
        (log) => log.status === 'Leave'
    ).length,

    absent: 0,

    totalWorkingDays: allLogs.length,
}

export const attendanceData = {

    'May 2026': {
        firstDay: 5,
        totalDays: 31,
        attendance: mayData.attendance,
        logs: mayData.logs.reverse(),
    },

    'April 2026': {
        firstDay: 3,
        totalDays: 30,
        attendance: aprilData.attendance,
        logs: aprilData.logs.reverse(),
    },

    'March 2026': {
        firstDay: 0,
        totalDays: 31,
        attendance: marchData.attendance,
        logs: marchData.logs.reverse(),
    },
}