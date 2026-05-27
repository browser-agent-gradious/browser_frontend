import React from 'react'
import styles from './Badge.module.css'

/**
 * Badge — inline status chip
 * variant: 'default' | 'success' | 'warning' | 'error' | 'info'
 */
export default function Badge({ children, variant = 'default' }) {
    return (
        <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>
    )
}
