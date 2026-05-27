import React from 'react'
import PageLayout from '../components/layout/PageLayout.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import DataTable from '../components/ui/DataTable.jsx'
import Badge from '../components/ui/Badge.jsx'
import Card from '../components/ui/Card.jsx'
import { payrollSummary, payslips, deductionBreakdown } from '../data/payrollData.js'
import styles from './PayrollPage.module.css'

const fmt = (n) => n.toLocaleString('en-IN')
const statusVariant = { Paid: 'success', Pending: 'warning' }

const slipColumns = [
    { key: 'month', label: 'Month' },
    { key: 'gross', label: 'Gross', render: (v) => `₹ ${fmt(v)}` },
    { key: 'deductions', label: 'Deductions', render: (v) => `₹ ${fmt(v)}` },
    { key: 'net', label: 'Net Pay', render: (v) => `₹ ${fmt(v)}` },
    { key: 'paidOn', label: 'Paid On' },
    {
        key: 'status',
        label: 'Status',
        render: (v) => <Badge variant={statusVariant[v] || 'default'}>{v}</Badge>,
    },
]

export default function PayrollPage() {
    const s = payrollSummary
    const summaryStats = [
        { label: 'Gross Salary', value: `${s.currency} ${fmt(s.grossSalary)}`, sub: 'per month (CTC component)' },
        { label: 'Total Deductions', value: `${s.currency} ${fmt(s.deductions)}`, sub: 'PF + Tax + Insurance' },
        { label: 'Net Pay', value: `${s.currency} ${fmt(s.netSalary)}`, sub: 'in-hand per month' },
    ]

    return (
        <PageLayout
            title="Payroll"
            subtitle="Your salary details and payslip history."
        >
            <div className={styles.statsGrid}>
                {summaryStats.map(s => (
                    <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} />
                ))}
            </div>

            <div className={styles.grid}>
                <section className={styles.main}>
                    <h2 className={styles.sectionTitle}>Payslip History</h2>
                    <DataTable columns={slipColumns} rows={payslips} emptyText="No payslips found." />
                </section>

                <aside>
                    <h2 className={styles.sectionTitle}>Deduction Breakdown</h2>
                    <Card>
                        <ul className={styles.deductionList}>
                            {deductionBreakdown.map(d => (
                                <li key={d.label} className={styles.deductionItem}>
                                    <span className={styles.deductionLabel}>{d.label}</span>
                                    <span className={styles.deductionAmt}>₹ {fmt(d.amount)}</span>
                                </li>
                            ))}
                            <li className={`${styles.deductionItem} ${styles.deductionTotal}`}>
                                <span>Total Deductions</span>
                                <span>₹ {fmt(deductionBreakdown.reduce((a, d) => a + d.amount, 0))}</span>
                            </li>
                        </ul>
                    </Card>
                </aside>
            </div>
        </PageLayout>
    )
}