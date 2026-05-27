import React from 'react'
import styles from './StatCard.module.css'

export default function StatCard({ label, value, sub }) {
    return (
        <div className={styles.stat}>
            <span className={styles.label}>{label}</span>
            <span className={styles.value}>{value}</span>
            {sub && <span className={styles.sub}>{sub}</span>}
        </div>
    )
}