import React, { useState, useRef } from 'react'
import PageLayout from '../components/layout/PageLayout.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Badge from '../components/ui/Badge.jsx'
import Card from '../components/ui/Card.jsx'
import Dropdown from '../components/ui/Dropdown.jsx'
import { useAgentAction } from '../context/AgentContext.jsx'
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

    // Dropdown ref for agent actions
    const monthDropdownRef = useRef(null)

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

    // Agent action: update_payroll_month
    // Backend sends: { type: 'update_payroll_month', payload: { month: 'September 2024' } }
    // This allows the agent to change the month view based on user queries like "Show me my payroll for September."
    // useAgentAction('update_payroll_month', (payload) => {
    //     if (payrollData[payload.month]) {
    //         setSelectedMonth(payload.month)
    //     }
    // })

    useAgentAction('update_payroll_month', (payload) => {
            if (payrollData[payload.month] && monthDropdownRef.current) {
                monthDropdownRef.current.dropdown(payload.month)
            }
            else {
                console.warn(`Month "${payload.month}" not found in payrollData`)
            }
        })

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

                    {/* <select 
                        id="payroll-month-dropdown"
                        className={styles.dropdown}
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        {months.map((month) => (
                            <option key={month} value={month} id={`payroll-month-option-${month.toLowerCase().split(' ')[0]}`}>
                                {month}
                            </option>
                        ))}
                    </select> */}

                    <Dropdown
                        id="payroll-month-dropdown"
                        ref={monthDropdownRef}
                        options={months.map((m) => ({ value: m, label: m }))}
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                    />

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

                        <button id="download-payslip-button" className={styles.downloadBtn}>
                            Download
                        </button>

                    </div>

                </div>

                <table id="payroll-breakdown-table" className={styles.table}>

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