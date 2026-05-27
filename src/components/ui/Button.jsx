import React from 'react'
import styles from './Button.module.css'

/**
 * Button
 * variant: 'primary' | 'secondary' | 'ghost' | 'danger'
 * size:    'sm' | 'md' | 'lg'
 */
export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    onClick,
    type = 'button',
    className = '',
    ...rest
}) {
    return (
        <button
            type={type}
            className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
            disabled={disabled}
            onClick={onClick}
            {...rest}
        >
            {children}
        </button>
    )
}