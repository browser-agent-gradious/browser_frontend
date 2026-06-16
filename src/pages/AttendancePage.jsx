import React, { useState, useRef } from 'react'
import PageLayout from '../components/layout/PageLayout.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Dropdown from '../components/ui/Dropdown.jsx'
import { attendanceSummary, attendanceData } from '../data/attendanceData.js'
import styles from './AttendancePage.module.css'
import DataTable from '../components/ui/DataTable.jsx'
import Badge from '../components/ui/Badge.jsx'

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AttendancePage() {

    // Get the list of months from attendanceData
    const months = Object.keys(attendanceData)

    const [selectedMonth, setSelectedMonth] = useState(months[0])

    // Get the attendance data for the selected month
    const currentMonth = attendanceData[selectedMonth]

    // Get the logs for the selected month
    const currentLogs = currentMonth.logs

    // Dropdown ref for agent actions
    const monthDropdownRef = useRef(null)

    // Calculate summary stats for the current month
    const s = {
        present: currentLogs.filter(
            (log) => log.status === 'Present'
        ).length,

        leave: currentLogs.filter(
            (log) => log.status.includes('Leave')
        ).length,

        absent: currentLogs.filter(
            (log) => log.status === 'Absent'
        ).length,
    }

    // Prepare summary stats for display
    const summaryStats = [
        {
            label: 'Present',
            value: s.present,
            className: styles.presentCard,
        },

        {
            label: 'Absent',
            value: s.absent,
            className: styles.absentCard,
        },

        {
            label: 'Leave',
            value: s.leave,
            className: styles.leaveCard,
        },
    ]

    // Function to render calendar days with attendance status
    const renderCalendarDays = () => {

        const days = []

        for (let i = 0; i < currentMonth.firstDay; i++) {
            days.push(
                <div key={`empty-${i}`} className={styles.emptyCell}></div>
            )
        }

        {/* Render days with attendance status */}
        for (let day = 1; day <= currentMonth.totalDays; day++) {

            const status = currentMonth.attendance[day]

            days.push(
                <div
                    key={day}
                    className={`${styles.dayCell} ${status ? styles[status.replace(' ', '')] : ''}`}
                >
                    {/* Show day number and status badge */}
                    <span className={styles.dayNumber}>
                        {day}
                    </span>

                    {status && (
                        <span className={styles.status}>
                            {status.replace('Leave', '')}
                        </span>
                    )}
                </div>
            )
        }

        return days
    }

    // TODO: Add id or some form of identifiers to elements. So that selectors can work correctly. For example, the dropdown can have id "attendance-month-dropdown" and options can have ids like "attendance-month-option-september" etc.
    return (
        <PageLayout
            title="Attendance"
            subtitle="Monthly attendance overview"
        >
            {/* Summary stats */}
            <div className={styles.statsGrid}>
                {summaryStats.map((item) => (
                    <div
                        key={item.label}
                        className={item.className}
                    >
                        <StatCard
                            label={item.label}
                            value={item.value}
                        />
                    </div>
                ))}
            </div>
            
            {/* Month selector */}
            <div className={styles.headerRow}>

                <div className={styles.dropdownWrapper}>

                    <label className={styles.label}>
                        Monthly View
                    </label>

                    {/* <select 
                        id="attendance-month-dropdown"
                        className={styles.dropdown}
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        {months.map((month) => (
                            <option key={month} value={month} id={`attendance-month-option-${month.toLowerCase().split(' ')[0]}`}>
                                {month}
                            </option>
                        ))}
                    </select> */}

                    <Dropdown
                        id="attendance-month-dropdown"
                        ref={monthDropdownRef}
                        options={months.map((m) => ({ value: m, label: m }))}
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                    />
                </div>

            </div>
            
            {/* Calendar view */}
            <div className={styles.calendarWrapper}>

                <div className={styles.weekDays}>
                    {weekDays.map((day) => (
                        <div key={day} className={styles.weekDay}>
                            {day}
                        </div>
                    ))}
                </div>

                <div className={styles.calendarGrid}>
                    {renderCalendarDays()}
                </div>

            </div>

            {/* Attendance logs table */}
            <section className={styles.logsSection}>

                <h2 className={styles.logsTitle}>
                    Attendance Logs
                </h2>

                <DataTable
                    columns={[
                        { key: 'date', label: 'Date' },
                        { key: 'checkIn', label: 'Check In' },
                        { key: 'checkOut', label: 'Check Out' },
                        { key: 'hours', label: 'Hours' },
                        {
                            key: 'status',
                            label: 'Status',
                            render: (v) => {

                                const variantMap = {
                                    Present: 'success',

                                    'Sick Leave': 'warning',

                                    'Casual Leave': 'info',

                                    'Vacation Leave': 'info',

                                    Absent: 'error',
                                }

                                return (
                                    <Badge variant={variantMap[v] || 'default'}>
                                        {v}
                                    </Badge>
                                )
                            },
                        },
                    ]}
                    rows={currentMonth.logs}
                    emptyText="No attendance logs."
                />

            </section>

        </PageLayout>
    )
}