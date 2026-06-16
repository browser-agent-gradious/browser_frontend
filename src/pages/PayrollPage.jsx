import React, { useState, useRef } from 'react'
import PageLayout from '../components/layout/PageLayout.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Badge from '../components/ui/Badge.jsx'
import Card from '../components/ui/Card.jsx'
import Dropdown from '../components/ui/Dropdown.jsx'
import { downloadPayslip } from '../utils/downloadService.js'
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

    // Inside PayrollPage(), add a loading state:
    const [downloading, setDownloading] = useState(false)

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

    const handleDownload = async () => {
        setDownloading(true)
        try {
            await downloadPayslip(selectedMonth)
        } catch (err) {
            console.error('Download failed:', err)
        } finally {
            setDownloading(false)
        }
    }

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

                        <button
                            id="download-payslip-button"
                            className={styles.downloadBtn}
                            onClick={handleDownload}
                            disabled={downloading}
                        >
                            {downloading ? 'Downloading...' : 'Download'}
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