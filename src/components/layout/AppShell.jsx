import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Dashboard from '../../pages/Dashboard.jsx'
import LeavesPage from '../../pages/LeavesPage.jsx'
import AttendancePage from '../../pages/AttendancePage.jsx'
import PayrollPage from '../../pages/PayrollPage.jsx'
import ProfilePage from '../../pages/ProfilePage.jsx'
import AgentButton from '../agent/AgentButton.jsx'
import AgentDialog from '../agent/AgentDialog.jsx'
import ClickDot from '../agent/ClickDot.jsx'

/**
 * AppShell — the permanent scaffold.
 * 
 * Rendered inside BrowserRouter so useNavigate() works in child hooks.
 * Everything outside <Routes> never unmounts on navigation.
 *
 * Structure:
 * - Navbar          — sticky, never unmounts
 * - Routes          — only this subtree swaps on navigation
 * - AgentDialog     — outside Routes, never unmounts → state preserved
 * - AgentButton     — FAB, always visible
 * - ClickDot         — global click visualizer, always visible, pointerEvents: none
 * 
 * Render order (bottom → top by z-index):
 * - Navbar (z: 100)
 * - Routes → page content
 * - AgentDialog (z: 999)
 * - AgentButton (z: 1000)
 * - ClickDot (z: 999999) — topmost, pointerEvents: none
 */
export default function AppShell() {
    return (
        <>
            <Navbar />

            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/leaves" element={<LeavesPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/profile" element={<ProfilePage />} />
            </Routes>

            {/* Agent components are OUTSIDE <Routes> — they never unmount during navigation */}
            <AgentDialog />
            <AgentButton />

            {/* Visual click debugger — renders red dot wherever agent clicks */}
            <ClickDot />
        </>
    )
}