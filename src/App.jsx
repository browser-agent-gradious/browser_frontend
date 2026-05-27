import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AgentProvider } from './context/AgentContext.jsx'
import AppShell from './components/layout/AppShell.jsx'

/**
 * App — root component.
 *
 * Layer order (outermost → innermost):
 * - AgentProvider   — global agent state, wraps everything
 * - BrowserRouter   — enables React Router hooks in all descendants
 * - AppShell        — Navbar + Routes + Agent UI
 *
 * Why this order?
 *   AgentProvider must be outside BrowserRouter so AgentDialog
 *   (rendered inside AppShell/BrowserRouter) can call useNavigate()
 *   while still reading from AgentContext.
 */
export default function App() {
    return (
        <AgentProvider>
            <BrowserRouter>
                <AppShell />
            </BrowserRouter>
        </AgentProvider>
    )
}