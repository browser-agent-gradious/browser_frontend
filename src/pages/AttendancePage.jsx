import React from 'react'
import PageLayout from '../components/layout/PageLayout.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import DataTable from '../components/ui/DataTable.jsx'
import Badge from '../components/ui/Badge.jsx'
import { attendanceSummary, attendanceLogs } from '../data/attendanceData.js'
import styles from './AttendancePage.module.css'

const statusVariant = { Present: 'success', Absent: 'error', Late: 'warning', 'Half Day': 'info' }

const columns = [
    { key: 'date', label: 'Date' },
    { key: 'checkIn', label: 'Check In' },
    { key: 'checkOut', label: 'Check Out' },
    { key: 'hours', label: 'Hours' },
    {
        key: 'status',
        label: 'Status',
        render: (v) => <Badge variant={statusVariant[v] || 'default'}>{v}</Badge>,
    },
]

export default function AttendancePage() {
    const s = attendanceSummary
    const summaryStats = [
        { label: 'Present', value: s.present, sub: `of ${s.totalWorkingDays} working days` },
        { label: 'Absent', value: s.absent, sub: 'days this month' },
        { label: 'Late Arrivals', value: s.late, sub: 'days this month' },
        { label: 'Half Days', value: s.halfDay, sub: 'days this month' },
    ]

    return (
        <PageLayout
            title="Attendance"
            subtitle="Your attendance records for the current month."
        >
            <div className={styles.statsGrid}>
                {summaryStats.map(s => (
                    <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} />
                ))}
            </div>

            <section>
                <h2 className={styles.sectionTitle}>Daily Logs</h2>
                <DataTable columns={columns} rows={attendanceLogs} emptyText="No attendance records." />
            </section>
        </PageLayout>
    )
}