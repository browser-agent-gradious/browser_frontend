import { useRef, useCallback, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAgent } from '../../context/AgentContext.jsx'

const WS_URL = import.meta.env.VITE_AGENT_WS_URL || 'ws://localhost:8000/ws/agent'

/**
 * useAgentSocket
 *
 * Manages WebSocket connection + MediaRecorder.
 * Drives the new backend protocol:
 *
 * Frontend → Backend:
 *   { type: "audio",    audio, mimeType, current_page }
 *   { type: "step_ack", task_id, step_index }
 *
 * Backend → Frontend:
 *   { type: "session_init",    session_id }
 *   { type: "screencast_frame",data }
 *   { type: "transcript",      text }
 *   { type: "task_start",      task_id, page, intent_summary }
 *   { type: "task_steps",      task_id, steps: [{step_index, label, audio_b64, mime_type}] }
 *   { type: "step_done",       task_id, step_index }
 *   { type: "task_end",        task_id }
 *   { type: "error",           text }
 */
export function useAgentSocket() {
    const {
        isOpen, isRecording,
        setIsConnected, setIsRecording, setTranscript,
        setSessionId, setVideoFrame,
        setCurrentTask, setTaskSteps, setCurrentStepIndex,
        addLog, resetTask,
    } = useAgent()

    const location = useLocation()
    const locationRef = useRef(location)
    useEffect(() => { locationRef.current = location }, [location])

    const wsRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])
    const isHoldRef = useRef(false)
    const reconnectTimer = useRef(null)
    const shouldReconnect = useRef(false)

    // ── WebSocket lifecycle ─────────────────────────────────────────────────

    // connect: called when AgentDialog opens, and on WS disconnects (with 3s debounce)
    const connect = useCallback(() => {

        // Prevent multiple simultaneous connections (can happen if user toggles dialog rapidly)
        if (wsRef.current &&
            (wsRef.current.readyState === WebSocket.OPEN ||
                wsRef.current.readyState === WebSocket.CONNECTING)) return
        
        shouldReconnect.current = true
        addLog('system', 'Connecting to agent…')

        const ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onopen = () => { setIsConnected(true); addLog('system', 'Connected.') }
        ws.onclose = () => {
            setIsConnected(false)
            addLog('system', 'Disconnected.')

            // Auto-reconnect with debounce
            if (shouldReconnect.current) {
                addLog('system', 'Reconnecting in 3s…')
                reconnectTimer.current = setTimeout(connect, 3000)
            }
        }
        ws.onerror = () => addLog('error', 'WebSocket error.')

        // Handle incoming messages in a centralized way
        ws.onmessage = (event) => {
            try { handleServerMessage(JSON.parse(event.data)) }
            catch { addLog('error', `Bad message: ${event.data}`) }
        }
    }, []) // eslint-disable-line

    // disconnect: called when AgentDialog closes, and before new WS connects
    const disconnect = useCallback(() => {
        shouldReconnect.current = false
        clearTimeout(reconnectTimer.current)
        wsRef.current?.close()
        wsRef.current = null
        setIsConnected(false)
    }, []) // eslint-disable-line

    // Connect on dialog open, disconnect on close
    useEffect(() => {
        if (isOpen) connect()
        else disconnect()
    }, [isOpen]) // eslint-disable-line

    // Cleanup on unmount
    useEffect(() => () => {
        shouldReconnect.current = false
        clearTimeout(reconnectTimer.current)
        wsRef.current?.close()
    }, [])

    // ── Send helpers ────────────────────────────────────────────────────────

    const sendJSON = useCallback((payload) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(payload))
        } else {
            addLog('error', 'Not connected.')
        }
    }, []) // eslint-disable-line

    /**
     * sendStepAck — called by AgentDialog after a step's narration audio finishes.
     * This is the signal that tells the backend to perform the Playwright action.
     */
    const sendStepAck = useCallback((taskId, stepIndex) => {
        sendJSON({ type: 'step_ack', task_id: taskId, step_index: stepIndex })
    }, [sendJSON])

    // ── Message handler ─────────────────────────────────────────────────────

    const handleServerMessage = useCallback((msg) => {
        switch (msg.type) {

            case 'session_init':
                setSessionId(msg.session_id)
                addLog('system', `Session: ${msg.session_id}`)
                break

            case 'transcript':
                // STT result — show what the user said
                setTranscript(msg.text)
                addLog('ack', `You said: "${msg.text}"`)
                break

            case 'task_start':
                // Agent has classified intent and is starting the tutorial
                resetTask()
                setCurrentTask({ task_id: msg.task_id, page: msg.page, intent_summary: msg.intent_summary })
                addLog('step', `Starting task: ${msg.intent_summary} on ${msg.page}`)
                break

            case 'task_steps':
                // All steps + pre-generated narration audios received at once
                // AgentDialog will play them sequentially and ACK each one
                setTaskSteps(msg.steps)
                setCurrentStepIndex(0)
                addLog('system', `${msg.steps.length} steps ready — starting tutorial…`)
                break

            case 'step_done':
                // Backend confirms Playwright action for step_index is complete
                // AgentDialog advances to the next step after receiving this
                setCurrentStepIndex(msg.step_index + 1)
                break

            case 'task_end':
                addLog('result', 'Task complete. You can now perform the same action yourself.')
                resetTask()
                // Keep screencast visible briefly so user sees final state, then clear
                setTimeout(() => setVideoFrame(null), 2000)
                break

            case 'screencast_frame':
                setVideoFrame(`data:image/jpeg;base64,${msg.data}`)
                break

            case 'error':
                addLog('error', msg.text)
                break

            default:
                addLog('system', `[${msg.type}] ${msg.text || ''}`)
        }
    }, []) // eslint-disable-line

    // ── Audio playback (TTS narrations from task_steps) ─────────────────────

    /**
     * playStepAudio
     * Decodes a base64 WAV/audio chunk and plays it via Web Audio API.
     * Returns a Promise that resolves when playback ends.
     * AgentDialog awaits this before sending step_ack.
     */
    const playStepAudio = useCallback((audio_b64, mime_type = 'audio/wav') => {
        return new Promise((resolve, reject) => {
            try {
                const binary = atob(audio_b64)
                const bytes = new Uint8Array(binary.length)
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

                const AudioCtx = window.AudioContext || window.webkitAudioContext
                const ctx = new AudioCtx()

                ctx.decodeAudioData(bytes.buffer, (buffer) => {
                    const source = ctx.createBufferSource()
                    source.buffer = buffer
                    source.connect(ctx.destination)
                    source.start(0)
                    source.onended = () => { ctx.close(); resolve() }
                }, (err) => { reject(err) })
            } catch (err) {
                reject(err)
            }
        })
    }, [])

    // ── MediaRecorder ────────────────────────────────────────────────────────

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mimeType = [
                'audio/webm;codecs=opus', 'audio/webm',
                'audio/ogg;codecs=opus', 'audio/ogg',
            ].find(m => MediaRecorder.isTypeSupported(m)) || ''

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
            mediaRecorderRef.current = recorder
            audioChunksRef.current = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data)
            }

            recorder.onstop = () => {
                stream.getTracks().forEach(t => t.stop())
                const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' })
                const reader = new FileReader()
                reader.onloadend = () => {
                    const base64 = reader.result.split(',')[1]
                    sendJSON({
                        type: 'audio',
                        audio: base64,
                        mimeType: mimeType || 'audio/webm',
                        current_page: locationRef.current.pathname,
                    })
                    addLog('ack', `Audio sent (${(blob.size / 1024).toFixed(1)} KB) — processing…`)
                    setTranscript('Processing…')
                }
                reader.readAsDataURL(blob)
                audioChunksRef.current = []
            }

            recorder.start()
            setIsRecording(true)
            setTranscript('')
            addLog('system', 'Listening… (release to send)')
        } catch (err) {
            addLog('error', `Mic error: ${err.message}`)
        }
    }, [sendJSON]) // eslint-disable-line

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
        setIsRecording(false)
    }, [])

    const toggleRecording = useCallback(() => {
        if (isRecording) { isHoldRef.current = false; stopRecording() }
        else { isHoldRef.current = true; startRecording() }
    }, [isRecording, startRecording, stopRecording])

    // Spacebar push-to-talk
    useEffect(() => {
        const onDown = (e) => {
            if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName) && !isRecording) {
                e.preventDefault(); startRecording()
            }
        }
        const onUp = (e) => {
            if (e.code === 'Space' && !isHoldRef.current) stopRecording()
        }
        window.addEventListener('keydown', onDown)
        window.addEventListener('keyup', onUp)
        return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
    }, [isRecording, startRecording, stopRecording])

    return { connect, disconnect, startRecording, stopRecording, toggleRecording, playStepAudio, sendStepAck }
}