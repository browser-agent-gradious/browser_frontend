import React from 'react'
import { useAgent } from '../../context/AgentContext.jsx'
import styles from './AgentButton.module.css'

/**
 * Floating action button — bottom right corner.
 * 
 * Always rendered in AppShell, never unmounts.
 */
export default function AgentButton() {
    const { toggleDialog, isOpen, isRecording } = useAgent()

    return (
        <button
            className={`${styles.fab} ${isOpen ? styles.fabOpen : ''} ${isRecording ? styles.fabRecording : ''}`}
            onClick={toggleDialog}
            aria-label={isOpen ? 'Close voice agent' : 'Open voice agent'}
            title="Voice Agent (Hold space to talk)"
        >
            {isOpen ? (
                /* Close icon */
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            ) : (
                /* Mic icon */
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
            )}
        </button>
    )
}