import React, { useEffect, useRef } from 'react'
import { useAgent } from '../../context/AgentContext.jsx'
import { useAgentSocket } from './useAgentSocket.js'
import styles from './AgentDialog.module.css'

export default function AgentDialog() {
    const {
        isOpen, isConnected, isRecording,
        transcript, logs, clearLogs,
        videoFrame,
        currentTask, taskSteps, currentStepIndex,
    } = useAgent()

    const { toggleRecording, startRecording, stopRecording, playStepAudio, sendStepAck } = useAgentSocket()

    const logsEndRef = useRef(null)
    const holdTimerRef = useRef(null)
    const isHoldRef = useRef(false)
    const ackInFlight = useRef(false)

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    // ACK loop — play narration audio then signal backend to perform the action
    useEffect(() => {
        // Don't do anything if there's no task or no steps, or if we're already waiting for an ACK
        if (!currentTask || !taskSteps.length) return

        // Don't do anything if we've already played all steps
        if (currentStepIndex >= taskSteps.length) return

        // Don't do anything if an ACK is already in flight
        if (ackInFlight.current) return

        // Play the current step's audio, then send an ACK to the backend
        const step = taskSteps[currentStepIndex]
        if (!step) return

        ackInFlight.current = true
        playStepAudio(step.audio_b64, step.mime_type)
            .catch(() => { })
            .finally(() => {
                sendStepAck(currentTask.task_id, step.step_index)
                ackInFlight.current = false
            })
    }, [currentStepIndex, taskSteps, currentTask]) // eslint-disable-line

    // Mic button: click vs hold discrimination
    const onMicMouseDown = () => {
        isHoldRef.current = false
        holdTimerRef.current = setTimeout(() => {
            isHoldRef.current = true
            startRecording()
        }, 200)
    }
    const onMicMouseUp = () => {
        clearTimeout(holdTimerRef.current)
        if (isHoldRef.current) { stopRecording(); isHoldRef.current = false }
        else toggleRecording()
    }
    const onMicMouseLeave = () => {
        clearTimeout(holdTimerRef.current)
        if (isHoldRef.current) { stopRecording(); isHoldRef.current = false }
    }

    const statusText = isRecording ? 'Listening…'
        : isConnected ? 'Click or hold to speak'
            : isOpen ? 'Connecting…'
                : 'Open dialog to connect'

    const logTypeClass = {
        ack: styles.logAck,
        result: styles.logResult,
        error: styles.logError,
        system: styles.logSystem,
        step: styles.logStep,
    }

    // Screencast is active — render expanded side-by-side layout
    if (isOpen && videoFrame) {
        return (
            <div className={styles.expandedInner}>
                {/* Video pane */}
                <div className={styles.videoPane}>
                    <img
                        src={videoFrame}
                        alt="Agent screencast"
                        className={styles.videoFrame}
                    />
                </div>

                {/* Agent panel — narrower when screencast is visible */}
                <div className={styles.container}>
                    <div className={styles.header}>
                        <span className={styles.title}>HR Assistant</span>
                        <span className={`${styles.statusDot} ${isConnected ? styles.statusDotConnected : ''}`} />
                    </div>

                    {/* Current step label */}
                    {currentTask && taskSteps[currentStepIndex] && (
                        <div className={styles.transcriptBox}>
                            {taskSteps[currentStepIndex].label}
                        </div>
                    )}

                    {/* Step progress pills */}
                    {taskSteps.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
                            {taskSteps.map((s, i) => (
                                <span
                                    key={s.step_index}
                                    style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: i < currentStepIndex ? '#4ade80'
                                            : i === currentStepIndex ? '#ffffff'
                                                : '#333',
                                        transition: 'background 0.3s',
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Logs */}
                    <div className={styles.logsHeader}>
                        <span>Logs</span>
                        <button className={styles.clearBtn} onClick={clearLogs}>Clear</button>
                    </div>
                    <div className={styles.logs}>
                        {logs.map((log) => (
                            <div key={log.id} className={`${styles.logLine} ${logTypeClass[log.type] || ''}`}>
                                {log.text}
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>
        )
    }

    // Normal compact dialog
    return (
        // ✅ Correct class names matching AgentDialog.module.css
        <div className={`${styles.dialogWrapper} ${isOpen ? styles.dialogOpen : ''}`}>
            <div className={styles.container}>

                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.title}>HR Assistant</span>
                    <span className={`${styles.statusDot} ${isConnected ? styles.statusDotConnected : ''}`} />
                </div>

                {/* Transcript */}
                {transcript && (
                    <div className={`${styles.transcriptBox} ${styles.transcriptActive}`}>
                        {transcript}
                    </div>
                )}

                {/* Mic button */}
                <button
                    className={`${styles.micButton} ${isRecording ? styles.micRecording : ''}`}
                    onMouseDown={onMicMouseDown}
                    onMouseUp={onMicMouseUp}
                    onMouseLeave={onMicMouseLeave}
                    onTouchStart={(e) => { e.preventDefault(); onMicMouseDown() }}
                    onTouchEnd={(e) => { e.preventDefault(); onMicMouseUp() }}
                    disabled={!isConnected}
                    aria-label="Microphone"
                >
                    {/* Mic SVG icon */}
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                        stroke={isRecording ? '#ffffff' : 'currentColor'} strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                </button>

                {/* Status */}
                <p className={styles.statusText}>{statusText}</p>
                <p className={styles.hintText}>Space to talk · Click to toggle</p>

                {/* Logs */}
                <div className={styles.logsHeader}>
                    <span>Logs</span>
                    <button className={styles.clearBtn} onClick={clearLogs}>Clear</button>
                </div>
                <div className={styles.logs}>
                    {logs.map((log) => (
                        // ✅ key prop added — fixes React warning
                        <div key={log.id} className={`${styles.logLine} ${logTypeClass[log.type] || ''}`}>
                            {log.text}
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>

            </div>
        </div>
    )
}