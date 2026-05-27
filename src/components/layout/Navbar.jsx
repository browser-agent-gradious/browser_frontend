import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import styles from './Navbar.module.css'

const NAV_LINKS = [
    { path: '/', label: 'Dashboard' },
    { path: '/leaves', label: 'Leaves' },
    { path: '/attendance', label: 'Attendance' },
    { path: '/payroll', label: 'Payroll' },
    { path: '/profile', label: 'Profile' },
]

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const navigate = useNavigate()

    return (
        <header className={styles.header}>
            <nav className={styles.nav}>
                {/* Logo */}
                <button
                    className={styles.logo}
                    onClick={() => navigate('/')}
                    aria-label="HR Portal home"
                >
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                        <rect width="28" height="28" rx="6" fill="#111111" />
                        <text x="7" y="20" fontFamily="Inter,sans-serif" fontWeight="700" fontSize="13" fill="white">HR</text>
                    </svg>
                    <span className={styles.logoText}>Portal</span>
                </button>

                {/* Desktop links */}
                <div className={styles.links}>
                    {NAV_LINKS.map(({ path, label }) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={path === '/'}
                            className={({ isActive }) =>
                                `${styles.link} ${isActive ? styles.linkActive : ''}`
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                </div>

                {/* Mobile hamburger */}
                <button
                    className={styles.hamburger}
                    onClick={() => setMenuOpen(prev => !prev)}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                >
                    {menuOpen ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    )}
                </button>
            </nav>

            {/* Mobile drawer */}
            {menuOpen && (
                <div className={styles.mobileMenu}>
                    {NAV_LINKS.map(({ path, label }) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={path === '/'}
                            className={({ isActive }) =>
                                `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ''}`
                            }
                            onClick={() => setMenuOpen(false)}
                        >
                            {label}
                        </NavLink>
                    ))}
                </div>
            )}
        </header>
    )
}