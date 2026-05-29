import React, { useState } from 'react'
import PageLayout from '../components/layout/PageLayout.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Badge from '../components/ui/Badge.jsx'
import Card from '../components/ui/Card.jsx'
import { payrollData } from '../data/payrollData.js'
import styles from './PayrollPage.module.css'

const fmt = (n) => n.toLocaleString('en-IN')

const statusVariant = {
    Paid: 'success',
    Pending: 'warning',
}

export default function PayrollPage() {

    const months = Object.keys(payrollData)

    const [selectedMonth, setSelectedMonth] = useState(months[0])

    const currentPayroll = payrollData[selectedMonth]

    const s = currentPayroll.summary

    const summaryStats = [
        {
            label: 'Gross Salary',
            value: `₹ ${fmt(s.grossSalary)}`,
        },

        {
            label: 'Deductions',
            value: `₹ ${fmt(s.deductions)}`,
        },

        {
            label: 'Net Salary',
            value: `₹ ${fmt(s.netSalary)}`,
        },
    ]

    return (
        <PageLayout
            title="Payroll"
            subtitle="Monthly payroll and salary breakdown."
        >

            <div className={styles.statsGrid}>
                {summaryStats.map((item) => (
                    <StatCard
                        key={item.label}
                        label={item.label}
                        value={item.value}
                    />
                ))}
            </div>

            <div className={styles.topBar}>

                <div className={styles.dropdownWrapper}>

                    <label className={styles.label}>
                        Payroll Month
                    </label>

                    <select
                        className={styles.dropdown}
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        {months.map((month) => (
                            <option key={month} value={month}>
                                {month}
                            </option>
                        ))}
                    </select>

                </div>

            </div>

            <Card className={styles.breakdownCard}>

                <div className={styles.breakdownHeader}>

                    <div>
                        <h2 className={styles.breakdownTitle}>
                            Breakdown - {selectedMonth}
                        </h2>

                        <p className={styles.paidOn}>
                            Paid On: {currentPayroll.paidOn}
                        </p>
                    </div>

                    <div className={styles.headerActions}>

                        <Badge
                            variant={statusVariant[currentPayroll.status]}
                        >
                            {currentPayroll.status}
                        </Badge>

                        <button className={styles.downloadBtn}>
                            Download
                        </button>

                    </div>

                </div>

                <table className={styles.table}>

                    <thead>
                        <tr>
                            <th>Component</th>
                            <th>Amount</th>
                            <th>Type</th>
                        </tr>
                    </thead>

                    <tbody>

                        {currentPayroll.breakdown.map((item) => (

                            <tr key={item.component}>

                                <td>{item.component}</td>

                                <td>₹ {fmt(item.amount)}</td>

                                <td>
                                    <span
                                        className={
                                            item.type === 'earning'
                                                ? styles.earning
                                                : styles.deduction
                                        }
                                    >
                                        {item.type}
                                    </span>
                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </Card>

        </PageLayout>
    )
}