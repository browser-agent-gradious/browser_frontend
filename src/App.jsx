import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AgentProvider } from './context/AgentContext.jsx'
import AppShell from './components/layout/AppShell.jsx'

// AgentProvider stays — it holds WS state, screencast frame, task steps.
// What's gone: pendingAction / dispatchAction / ClickDot / page-level useAgentAction hooks.
// Pages are now plain React components with no agent wiring.

export default function App() {
    return (
        <AgentProvider>
            <BrowserRouter>
                <AppShell />
            </BrowserRouter>
        </AgentProvider>
    )
}