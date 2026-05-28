import React, { useState, useEffect, useCallback } from 'react'
import { useAgent } from '../../context/AgentContext.jsx'

/**
 * ClickDot — Visual debugger overlay.
 *
 * Listens for { type: "click_dot", payload: { x, y, label? } } actions
 * dispatched from the agent backend. Renders a pulsing red dot at (x, y)
 * in fixed viewport coordinates, then fades it out after 2s.
 *
 * The dot uses pointerEvents: none so it never blocks the actual click
 * that the agent performs immediately after sending the action.
 *
 * Multiple dots can exist simultaneously (e.g., rapid multi-step actions).
 */
export default function ClickDot() {
    const [dots, setDots] = useState([])
    const { pendingAction, clearPendingAction } = useAgent()

    // React to click_dot actions from the agent backend
    useEffect(() => {
        if (pendingAction?.type === 'click_dot') {
            const { x, y, label } = pendingAction.payload
            const id = Date.now() + Math.random()

            setDots(prev => [...prev, { id, x, y, label, phase: 'enter' }])

            // After 2.2s start fade-out, after 2.8s remove
            setTimeout(() => {
                setDots(prev => prev.map(d => d.id === id ? { ...d, phase: 'exit' } : d))
            }, 1200)
            setTimeout(() => {
                setDots(prev => prev.filter(d => d.id !== id))
            }, 1800)

            clearPendingAction()
        }
    }, [pendingAction])

    if (dots.length === 0) return null

    return (
        <>
            {dots.map(dot => (
                <div key={dot.id} style={wrapperStyle(dot.x, dot.y, dot.phase)}>
                    {/* Outer ripple ring */}
                    <div style={rippleStyle} />
                    {/* Inner solid dot */}
                    <div style={dotStyle} />
                    {/* Optional label */}
                    {dot.label && <span style={labelStyle}>{dot.label}</span>}
                </div>
            ))}
        </>
    )
}

// ── Inline styles (no CSS module needed — fully dynamic) ─────────────────────

const wrapperStyle = (x, y, phase) => ({
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
    transform: 'translate(-50%, -50%)',
    zIndex: 999999,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: phase === 'exit' ? 0 : 1,
    transition: phase === 'exit' ? 'opacity 600ms ease' : 'opacity 150ms ease',
})

const dotStyle = {
    position: 'absolute',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    border: '2.5px solid #ffffff',
    boxShadow: '0 0 0 1px #ef4444, 0 0 12px rgba(239,68,68,0.7)',
}

const rippleStyle = {
    position: 'absolute',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '2px solid rgba(239,68,68,0.6)',
    animation: 'clickDotRipple 1.1s ease-out infinite',
}

const labelStyle = {
    position: 'absolute',
    top: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.75)',
    color: '#fff',
    fontSize: '11px',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: 600,
    padding: '2px 7px',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
}
