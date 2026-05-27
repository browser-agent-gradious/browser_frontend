import React, { useEffect } from 'react'
import styles from './Modal.module.css'

/**
    * Modal component for displaying content in an overlay.
    * 
    * Props:
    * - isOpen: boolean to control visibility
    * - onClose: function to call when modal should close
    * - title: string for modal header
    * - children: modal body content
    * 
    * Accessibility:
    * - role="dialog" and aria-modal="true" for screen readers
    * - aria-label on overlay for title
    * 
    * Close on Escape key and clicking outside panel
**/
export default function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        if (isOpen) document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
            <div className={styles.panel} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    <button className={styles.close} onClick={onClose} aria-label="Close">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                <div className={styles.body}>{children}</div>
            </div>
        </div>
    )
}