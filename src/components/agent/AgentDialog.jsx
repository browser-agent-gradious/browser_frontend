import React, { useEffect, useRef } from 'react'
import { useAgent } from '../../context/AgentContext.jsx'
import { useAgentSocket } from './useAgentSocket.js'
import styles from './AgentDialog.module.css'

/**
 * AgentDialog — always mounted in AppShell, never unmounts.
 * Visibility is toggled via CSS opacity/transform (not React conditional render).
 * This preserves all local + context state across page navigations.
 *
 * WebSocket connection: initiated when dialog is opened (isOpen → true),
 * NOT on component mount. Managed inside useAgentSocket via a useEffect
 * that watches isOpen from AgentContext.
 *
 * Mic interaction modes:
 *   Click  → toggle recording on/off
 *   Hold   → push-to-talk (records while held, sends on release)
 *   Space  → push-to-talk via keyboard
 *
 * Audio flow:
 *   Browser mic → MediaRecorder → Blob → Base64 → JSON → WS → FastAPI
 *   FastAPI TTS → Base64 audio → JSON → WS → Web Audio API → speaker
 */
export default function AgentDialog() {
    const {
        isOpen,
        isConnected,
        isRecording,
        transcript,
        logs,
        clearLogs,
    } = useAgent()

    // useAgentSocket handles WS + MediaRecorder; connect() is called internally
    // when isOpen changes via the useEffect inside the hook.
    const { toggleRecording, startRecording, stopRecording } = useAgentSocket()

    const logsEndRef = useRef(null)
    const holdTimerRef = useRef(null)
    const isHoldRef = useRef(false)

    // Auto-scroll logs to bottom on new entries
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    // ── Mic button: click vs hold discrimination ─────────────────────────────
    // If user releases within 200ms → treated as a click → toggleRecording
    // If user holds > 200ms → push-to-talk → startRecording / stopRecording on release

    const onMicMouseDown = () => {
        isHoldRef.current = false
        holdTimerRef.current = setTimeout(() => {
            isHoldRef.current = true
            startRecording()
        }, 200)
    }

    const onMicMouseUp = () => {
        clearTimeout(holdTimerRef.current)
        if (isHoldRef.current) {
            stopRecording()
            isHoldRef.current = false
        } else {
            toggleRecording()
        }
    }

    const onMicMouseLeave = () => {
        clearTimeout(holdTimerRef.current)
        if (isHoldRef.current) {
            stopRecording()
            isHoldRef.current = false
        }
    }

    const onMicTouchStart = (e) => { e.preventDefault(); onMicMouseDown() }
    const onMicTouchEnd = (e) => { e.preventDefault(); onMicMouseUp() }

    // ── Derived UI state ─────────────────────────────────────────────────────
    const statusText = isRecording
        ? 'Listening…'
        : isConnected
            ? 'Click or hold to speak'
            : isOpen
                ? 'Connecting…'
                : 'Open dialog to connect'

    const logTypeClass = {
        ack: styles.logAck,
        result: styles.logResult,
        error: styles.logError,
        system: styles.logSystem,
        step: styles.logStep,
    }

    return (
        <div
            className={`${styles.dialogWrapper} ${isOpen ? styles.dialogOpen : ''}`}
            role="dialog"
            aria-label="Voice Agent"
            aria-hidden={!isOpen}
        >
            <div className={styles.container}>

                {/* ── Header ─────────────────────────────────────────── */}
                <div className={styles.header}>
                    <span className={styles.title}>Voice Agent</span>
                    <span
                        className={`${styles.statusDot} ${isConnected ? styles.statusDotConnected : ''}`}
                        title={isConnected ? 'Connected' : 'Disconnected'}
                    />
                </div>

                {/* ── Mic button ─────────────────────────────────────── */}
                <button
                    className={`${styles.micButton} ${isRecording ? styles.micRecording : ''}`}
                    onMouseDown={onMicMouseDown}
                    onMouseUp={onMicMouseUp}
                    onMouseLeave={onMicMouseLeave}
                    onTouchStart={onMicTouchStart}
                    onTouchEnd={onMicTouchEnd}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                    title="Click to toggle · Hold to push-to-talk · Space to push-to-talk"
                    disabled={!isConnected}
                >
                    <svg fill="white" height="34" width="34" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                </button>

                {/* ── Status / hint ──────────────────────────────────── */}
                <div className={styles.statusText}>{statusText}</div>
                <div className={styles.hintText}>
                    click = toggle &nbsp;·&nbsp; space = push-to-talk
                </div>

                {/* ── Transcript box ─────────────────────────────────── */}
                <div className={`${styles.transcriptBox} ${transcript ? styles.transcriptActive : ''}`}>
                    {transcript || 'Ready for voice commands…'}
                </div>

                {/* ── Logs header ─────────────────────────────────────── */}
                <div className={styles.logsHeader}>
                    <span>Activity Log</span>
                    <button className={styles.clearBtn} onClick={clearLogs} aria-label="Clear logs">
                        Clear
                    </button>
                </div>

                {/* ── Logs pane ──────────────────────────────────────── */}
                <div className={styles.logs} role="log" aria-live="polite">
                    {logs.map((entry, i) => (
                        <div
                            key={entry.id ?? i}
                            className={`${styles.logLine} ${logTypeClass[entry.type] || ''}`}
                        >
                            &gt; {entry.text}
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>

            </div>
        </div>
    )
}


// Previous version before adding keyboard support + some accessibility improvements:

// import React, { useEffect, useRef } from 'react'
// import { useAgent } from '../../context/AgentContext.jsx'
// import { useAgentSocket } from './useAgentSocket.js'
// import styles from './AgentDialog.module.css'

// /**
//  * AgentDialog
//  * 
//  * Always mounted in AppShell. Visibility toggled via CSS (not unmounted).
//  * 
//  * Structure mirrors sidepanel.html:
//  *   - Header: title + connection status dot
//  *   - Mic button (click = toggle, hold = push-to-talk)
//  *   - Status text + hint
//  *   - Transcript box
//  *   - Log pane
//  */
// export default function AgentDialog() {
//     const {
//         isOpen,
//         isConnected,
//         isRecording,
//         transcript,
//         logs,
//         clearLogs,
//     } = useAgent()

//     const { connect, toggleRecording, startRecording, stopRecording } = useAgentSocket()
//     const logsEndRef = useRef(null)
//     const holdTimerRef = useRef(null)
//     const isHoldRef = useRef(false)

//     // Connect to backend once dialog is opened for the first time
//     useEffect(() => {
//         if (isOpen) {
//             connect()
//         }
//     }, [connect])

//     // Auto-scroll logs
//     useEffect(() => {
//         logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
//     }, [logs])

//     // ── Mic button handlers ──────────────────────────────────────────────────
//     // Click = toggle, Hold (>200ms) = push-to-talk

//     const onMicMouseDown = () => {
//         isHoldRef.current = false
//         holdTimerRef.current = setTimeout(() => {
//             isHoldRef.current = true
//             startRecording()
//         }, 200)
//     }

//     const onMicMouseUp = () => {
//         clearTimeout(holdTimerRef.current)
//         if (isHoldRef.current) {
//             stopRecording()
//             isHoldRef.current = false
//         } else {
//             toggleRecording()
//         }
//     }

//     const onMicMouseLeave = () => {
//         clearTimeout(holdTimerRef.current)
//         if (isHoldRef.current) {
//             stopRecording()
//             isHoldRef.current = false
//         }
//     }

//     // Touch support
//     const onMicTouchStart = (e) => {
//         e.preventDefault()
//         onMicMouseDown()
//     }
//     const onMicTouchEnd = (e) => {
//         e.preventDefault()
//         onMicMouseUp()
//     }

//     const statusText = 
//         isRecording ? 'Listening...'
//         : isConnected ? 'Click or hold to speak'
//         : 'Connecting to agent...'

//     const logTypeClass = {
//         ack: styles.logAck,
//         result: styles.logResult,
//         error: styles.logError,
//         system: styles.logSystem,
//         step: styles.logStep,
//     }

//     return (
//         <div
//             className={`${styles.dialogWrapper} ${isOpen ? styles.dialogOpen : ''}`}
//             role="dialog"
//             aria-label="Voice Agent"
//             aria-hidden={!isOpen}
//         >
//             <div className={styles.container}>

//                 {/* ── Header ────────────────────────────────────────── */}
//                 <div className={styles.header}>
//                     <span className={styles.title}>Voice Agent</span>
//                     <span
//                         className={`${styles.statusDot} ${isConnected ? styles.statusDotConnected : ''}`}
//                         title={isConnected ? 'Connected' : 'Disconnected'}
//                     />
//                 </div>

//                 {/* ── Mic button ────────────────────────────────────── */}
//                 <button
//                     className={`${styles.micButton} ${isRecording ? styles.micRecording : ''}`}
//                     onMouseDown={onMicMouseDown}
//                     onMouseUp={onMicMouseUp}
//                     onMouseLeave={onMicMouseLeave}
//                     onTouchStart={onMicTouchStart}
//                     onTouchEnd={onMicTouchEnd}
//                     aria-label={isRecording ? 'Stop recording' : 'Start recording'}
//                     title="Click to toggle · Hold to push-to-talk · Space to push-to-talk"
//                 >
//                     <svg fill="white" height="34" width="34" viewBox="0 0 24 24">
//                         <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
//                         <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
//                     </svg>
//                 </button>

//                 {/* ── Status + hint ─────────────────────────────────── */}
//                 <div className={styles.statusText}>{statusText}</div>
//                 <div className={styles.hintText}>
//                     click = toggle &nbsp;·&nbsp; hold = push-to-talk &nbsp;·&nbsp; space = push-to-talk
//                 </div>

//                 {/* ── Transcript ────────────────────────────────────── */}
//                 <div className={`${styles.transcriptBox} ${transcript ? styles.transcriptActive : ''}`}>
//                     {transcript || 'Ready for voice commands…'}
//                 </div>

//                 {/* ── Logs ──────────────────────────────────────────── */}
//                 <div className={styles.logsHeader}>
//                     <span>Activity Log</span>
//                     <button className={styles.clearBtn} onClick={clearLogs} aria-label="Clear logs">
//                         Clear
//                     </button>
//                 </div>
//                 <div className={styles.logs} role="log" aria-live="polite">
//                     {logs.map((entry) => (
//                         <div
//                             key={entry.id || entry.text}
//                             className={`${styles.logLine} ${logTypeClass[entry.type] || ''}`}
//                         >
//                             &gt; {entry.text}
//                         </div>
//                     ))}
//                     <div ref={logsEndRef} />
//                 </div>

//             </div>
//         </div>
//     )
// }