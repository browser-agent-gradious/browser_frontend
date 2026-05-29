import React, { useState } from 'react'
import PageLayout from '../components/layout/PageLayout.jsx'
import DataTable from '../components/ui/DataTable.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import { useAgentAction } from '../context/AgentContext.jsx'
import { leaveBalance, leaveHistory, leaveTypes } from '../data/leavesData.js'
import styles from './LeavesPage.module.css'

const statusVariant = { Approved: 'success', Pending: 'warning', Rejected: 'error' }

const historyColumns = [
    { key: 'type', label: 'Type' },
    { key: 'from', label: 'From' },
    { key: 'to', label: 'To' },
    { key: 'days', label: 'Days', render: (v) => `${v}d` },
    { key: 'reason', label: 'Reason' },
    {
        key: 'status',
        label: 'Status',
        render: (v) => <Badge variant={statusVariant[v] || 'default'}>{v}</Badge>,
    },
]

const EMPTY_FORM = { type: '', from: '', to: '', reason: '' }

export default function LeavesPage() {
    const [modalOpen, setModalOpen] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const [submitted, setSubmitted] = useState(false)

    // ── Agent action: fill_form ──────────────────────────────────────────────
    // Backend sends: { type: 'fill_form', payload: { field: 'type', value: 'Sick Leave' } }
    useAgentAction('fill_form', (payload) => {
        setModalOpen(true)
        setForm(prev => ({ ...prev, [payload.field]: payload.value }))
    })

    // Agent can also trigger open_modal
    useAgentAction('open_modal', () => {
        setModalOpen(true)
    })

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setSubmitted(true)
        setTimeout(() => {
            setSubmitted(false)
            setModalOpen(false)
            setForm(EMPTY_FORM)
        }, 1800)
    }

    return (
        <PageLayout
            title="Leaves"
            subtitle="Manage and apply for your leaves."
            actions={
                <Button id="apply-leave-button" onClick={() => setModalOpen(true)}>
                    Apply Leave
                </Button>
            }
        >
            {/* Balance grid */}
            <div className={styles.balanceGrid}>
                {leaveBalance.map(lb => (
                    <StatCard
                        key={lb.type}
                        label={lb.type}
                        value={
                            <>
                                {lb.remaining}
                                <span className={styles.remainingText}>
                                    {' '}remaining
                                </span>
                            </>
                        }
                        sub={
                            <>
                                {lb.used} used of {lb.total}
                            </>
                        }
                    />
                ))}
            </div>

            {/* History */}
            <section className={styles.section} id="leave-history-section">
                <h2 className={styles.sectionTitle}>Leave History</h2>
                <DataTable columns={historyColumns} rows={leaveHistory} emptyText="No leave records." />
            </section>

            {/* Apply Leave Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Apply for Leave">
                {submitted ? (
                    <div className={styles.successMsg}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" />
                        </svg>
                        <p>Leave request submitted successfully!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <label className={styles.label}>
                            Leave Type
                            <select id="leave-type-dropdown"
                                name="type"
                                value={form.type}
                                onChange={handleChange}
                                required
                                className={styles.input}
                            >
                                <option value="">Select type</option>
                                {leaveTypes.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </label>

                        <div className={styles.row}>
                            <label className={styles.label}>
                                From
                                <input     id="leave-from-date"
                                    type="date"
                                    name="from"
                                    value={form.from}
                                    onChange={handleChange}
                                    required
                                    className={styles.input}
                                />
                            </label>
                            <label className={styles.label}>
                                To
                                <input    id="leave-to-date"
                                    type="date"
                                    name="to"
                                    value={form.to}
                                    onChange={handleChange}
                                    required
                                    className={styles.input}
                                />
                            </label>
                        </div>

                        <label className={styles.label}>
                            Reason
                            <textarea id="leave-reason-input"
                                name="reason"
                                value={form.reason}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Briefly describe the reason..."
                                className={styles.input}
                                style={{ resize: 'vertical' }}
                            />
                        </label>

                        <div className={styles.formActions}>
                            <Button id="cancel-leave-button" type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button id="submit-leave-button" type="submit">Submit Request</Button>
                        </div>
                    </form>
                )}
            </Modal>
        </PageLayout>
    )
}