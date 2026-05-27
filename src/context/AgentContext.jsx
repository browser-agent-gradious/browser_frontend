import React, { createContext, useContext, useState, useCallback } from 'react'

const AgentContext = createContext(null)

/**
 * AgentProvider wraps the entire app.
 *
 * agentState holds:
 *   - isOpen         : whether the dialog popup is visible
 *   - isConnected    : WebSocket connection status
 *   - isRecording    : mic is actively capturing
 *   - transcript     : current live transcript text
 *   - logs           : array of { type, text } log entries
 *   - pendingAction  : { type, payload } — latest action from backend for pages to consume
 */
export function AgentProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [logs, setLogs] = useState([
        { type: 'system', text: 'Ready for voice commands...' },
    ])
    const [pendingAction, setPendingAction] = useState(null)

    const openDialog = useCallback(() => setIsOpen(true), [])
    const closeDialog = useCallback(() => setIsOpen(false), [])
    const toggleDialog = useCallback(() => setIsOpen(prev => !prev), [])

    const addLog = useCallback((type, text) => {
        setLogs(prev => [...prev, { type, text, id: Date.now() + Math.random() }])
    }, [])

    const clearLogs = useCallback(() => {
        setLogs([{ type: 'system', text: 'Logs cleared.' }])
    }, [])

    /**
     * Dispatch an action received from the agent backend.
     * 
     * Pages subscribe to pendingAction via useAgentAction() hook.
     * 
     * After consuming, pages call clearPendingAction().
     */
    const dispatchAction = useCallback((action) => {
        setPendingAction(action)
    }, [])

    const clearPendingAction = useCallback(() => {
        setPendingAction(null)
    }, [])

    const value = {
        isOpen,
        isConnected,
        isRecording,
        transcript,
        logs,
        pendingAction,
        openDialog,
        closeDialog,
        toggleDialog,
        setIsConnected,
        setIsRecording,
        setTranscript,
        addLog,
        clearLogs,
        dispatchAction,
        clearPendingAction,
    }

    return (
        <AgentContext.Provider value={value}>
            {children}
        </AgentContext.Provider>
    )
}

/** Main hook — access full agent context */
export function useAgent() {
    const ctx = useContext(AgentContext)
    if (!ctx) throw new Error('useAgent must be used within AgentProvider')
    return ctx
}

/**
 * Convenience hook for pages that only need to react to agent actions.
 * 
 * Usage:
 *   useAgentAction('fill_form', (payload) => { ... })
 */
export function useAgentAction(actionType, handler) {
    const { pendingAction, clearPendingAction } = useContext(AgentContext)

    React.useEffect(() => {
        if (pendingAction && pendingAction.type === actionType) {
            handler(pendingAction.payload)
            clearPendingAction()
        }
    }, [pendingAction])
}