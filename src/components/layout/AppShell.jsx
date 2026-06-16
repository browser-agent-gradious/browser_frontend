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

// ClickDot is removed — the red dot is now injected by Playwright's
// __agent_show_interaction init script in the server browser, not here.

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

            {/* Agent overlay — outside Routes so it never unmounts on navigation */}
            <AgentDialog />
            <AgentButton />
        </>
    )
}