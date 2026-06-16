import React, { createContext, useContext, useState, useCallback } from 'react'

const AgentContext = createContext(null)

export function AgentProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [sessionId, setSessionId] = useState(null)
    const [videoFrame, setVideoFrame] = useState(null)
    const [logs, setLogs] = useState([{ type: 'system', text: 'Ready for voice commands…' }])

    // ── Task state (drives ACK loop in AgentDialog) ────────────────────────
    // currentTask:  { task_id, page, intent_summary } | null
    // taskSteps:    [{ step_index, label, audio_b64, mime_type }]
    // currentStepIndex: which step we're currently playing/waiting on
    const [currentTask, setCurrentTask] = useState(null)
    const [taskSteps, setTaskSteps] = useState([])
    const [currentStepIndex, setCurrentStepIndex] = useState(0)

    const openDialog = useCallback(() => setIsOpen(true), [])
    const closeDialog = useCallback(() => setIsOpen(false), [])
    const toggleDialog = useCallback(() => setIsOpen(p => !p), [])

    const addLog = useCallback((type, text) => {
        setLogs(prev => [...prev, { type, text, id: Date.now() + Math.random() }])
    }, [])

    const clearLogs = useCallback(() => {
        setLogs([{ type: 'system', text: 'Logs cleared.' }])
    }, [])

    const resetTask = useCallback(() => {
        setCurrentTask(null)
        setTaskSteps([])
        setCurrentStepIndex(0)
    }, [])

    return (
        <AgentContext.Provider value={{
            isOpen, isConnected, isRecording, transcript, sessionId, videoFrame, logs,
            currentTask, taskSteps, currentStepIndex,
            setIsOpen, setIsConnected, setIsRecording, setTranscript,
            setSessionId, setVideoFrame, setCurrentTask, setTaskSteps, setCurrentStepIndex,
            openDialog, closeDialog, toggleDialog,
            addLog, clearLogs, resetTask,
        }}>
            {children}
        </AgentContext.Provider>
    )
}

export function useAgent() {
    const ctx = useContext(AgentContext)
    if (!ctx) throw new Error('useAgent must be used within AgentProvider')
    return ctx
}