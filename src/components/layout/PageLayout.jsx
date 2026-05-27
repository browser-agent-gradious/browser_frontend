import React from 'react'
import styles from './PageLayout.module.css'

/**
 * PageLayout — wraps every page with consistent padding and max-width.
 * Props:
 *   title    : page heading
 *   subtitle : optional sub-heading
 *   actions  : optional JSX for top-right action buttons
 *   children : page content
 */
export default function PageLayout({ title, subtitle, actions, children }) {
    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.title}>{title}</h1>
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    </div>
                    {actions && <div className={styles.actions}>{actions}</div>}
                </div>
                {children}
            </div>
        </main>
    )
}