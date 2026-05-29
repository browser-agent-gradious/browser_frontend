import React from 'react'
import PageLayout from '../components/layout/PageLayout.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import DataTable from '../components/ui/DataTable.jsx'
import Badge from '../components/ui/Badge.jsx'
import { stats, recentActivity } from '../data/dashboardData.js'
import styles from './Dashboard.module.css'

const statusVariant = {
    Approved: 'success',
    Paid: 'success',
    Pending: 'warning',
    Noted: 'info',
    Rejected: 'error',
}

const activityColumns = [
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description' },
    { key: 'date', label: 'Date' },
    {
        key: 'status',
        label: 'Status',
        render: (val) => <Badge variant={statusVariant[val] || 'default'}>{val}</Badge>,
    },
]

export default function Dashboard() {
    return (
        <PageLayout
            title="Dashboard"
            subtitle="Welcome back, Arjun. Here's your summary."
        >
            <div className={styles.statsGrid}>
                {stats.map(s => (
                    <StatCard key={s.id} label={s.label} value={s.value} sub={s.sub} />
                ))}
            </div>

            <section className={styles.section} id="recent-activity-section">
                <h2 className={styles.sectionTitle}>Recent Activity</h2>
                <DataTable
                    columns={activityColumns}
                    rows={recentActivity}
                    emptyText="No recent activity."
                />
            </section>
        </PageLayout>
    )
}