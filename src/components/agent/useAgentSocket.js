import { useRef, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAgent } from '../../context/AgentContext.jsx'

const WS_URL = import.meta.env.VITE_AGENT_WS_URL || 'ws://localhost:8000/ws/agent'

/**
 * useAgentSocket
 *
 * Responsibilities:
 *   1. Manage a WebSocket connection to the FastAPI agent backend.
 *      Connection is initiated ONLY when the agent dialog is opened (not on mount).
 *      Connection is kept alive while the dialog remains open across navigations.
 *
 *   2. Capture mic audio using the MediaRecorder API.
 *      Audio is NOT transcribed in the browser.
 *      Instead, raw audio chunks are assembled into a Blob,
 *      encoded as Base64, and sent to the backend inside a JSON message.
 *
 *   3. Receive messages from the backend:
 *      - Text log messages (ack, step, result, error, system)
 *      - action messages  → execute on frontend (navigate, fill_form, click, speak)
 *      - audio messages   → Base64-encoded TTS audio, played via Web Audio API
 *
 * Audio message protocol (frontend → backend):
 *   {
 *     type: "audio",
 *     audio: "<base64-encoded webm/ogg audio>",
 *     mimeType: "audio/webm;codecs=opus",
 *     current_page: "/leaves"
 *   }
 *
 * Audio message protocol (backend → frontend):
 *   {
 *     type: "audio",
 *     audio: "<base64-encoded mp3/wav>",
 *     mimeType: "audio/mpeg",
 *     text: "optional transcript of what was spoken"
 *   }
 */
export function useAgentSocket() {
    const {
        isOpen,
        setIsConnected,
        setIsRecording,
        setTranscript,
        addLog,
        dispatchAction,
        isRecording,
    } = useAgent()

    const navigate = useNavigate()
    const location = useLocation()
    const locationRef = useRef(location)

    // Keep locationRef current so audio callbacks always have the latest pathname
    useEffect(() => { locationRef.current = location }, [location])

    const wsRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])
    const isHoldRef = useRef(false)
    const reconnectTimer = useRef(null)
    const shouldReconnect = useRef(false) // only reconnect while dialog is open

    // ── WebSocket lifecycle ────────────────────────────────────────────────

    const connect = useCallback(() => {
        // Prevent duplicate connections
        if (wsRef.current && (
            wsRef.current.readyState === WebSocket.OPEN ||
            wsRef.current.readyState === WebSocket.CONNECTING
        )) return

        shouldReconnect.current = true
        addLog('system', 'Connecting to agent backend…')

        const ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onopen = () => {
            setIsConnected(true)
            addLog('system', 'Connected.')
        }

        ws.onclose = () => {
            setIsConnected(false)
            addLog('system', 'Disconnected.')
            if (shouldReconnect.current) {
                addLog('system', 'Reconnecting in 3s…')
                reconnectTimer.current = setTimeout(connect, 3000)
            }
        }

        ws.onerror = () => {
            addLog('error', 'WebSocket error.')
        }

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data)
                handleServerMessage(msg)
            } catch {
                addLog('error', `Bad message: ${event.data}`)
            }
        }
    }, [])

    const disconnect = useCallback(() => {
        shouldReconnect.current = false
        clearTimeout(reconnectTimer.current)
        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }
        setIsConnected(false)
    }, [])

    // Connect when dialog opens, disconnect when it closes
    useEffect(() => {
        if (isOpen) {
            connect()
        } else {
            // Stop any active recording if dialog is closed
            stopRecording()
        }
        // We intentionally don't disconnect on close so the agent can finish
        // speaking. Uncomment the line below to disconnect on close instead:
        // else { disconnect() }
    }, [isOpen])

    // Cleanup on unmount (app close / hot reload)
    useEffect(() => {
        return () => {
            shouldReconnect.current = false
            clearTimeout(reconnectTimer.current)
            wsRef.current?.close()
        }
    }, [])

    // ── Send helper ────────────────────────────────────────────────────────

    const sendJSON = useCallback((payload) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(payload))
        } else {
            addLog('error', 'Not connected. Open the agent dialog first.')
        }
    }, [])

    // ── Handle messages from backend ────────────────────────────────────────

    /**
     * handleServerMessage — processes every message from FastAPI.
     *
     * Supported types:
     * - ack    → backend acknowledged the audio/text input
     * - step   → agent reasoning step (shown in log as purple)
     * - result → final text answer (shown in log as green)
     * - error  → error from backend (shown in log as red)
     * - system → informational message (shown in log as grey)
     * - audio  → Base64 TTS audio to play in browser
     * - action → structured command to execute on the frontend
     * 
     * Message shapes (all text frames):
     * - `{ type: 'ack',       text }`           → user speech echoed back after STT
     * - `{ type: 'step',      text }`           → agent thinking / tool call step
     * - `{ type: 'transcript',text }`           → live interim transcript from STT
     * - `{ type: 'action',    action, payload}` → frontend action to execute
     * - `{ type: 'action', action: 'navigate', payload: { target: '/leaves' } }`
     * - `{ type: 'action', action: 'fill_form', payload: { field, value } }`
     * - `{ type: 'action', action: 'speak',    payload: { text } }`
     * - `{ type: 'result',    text }`           → final agent response text
     * - `{ type: 'error',     text }`           → backend error
     * - `{ type: 'audio_end'               }`   → TTS stream ended (all audio sent)
     */
    const handleServerMessage = useCallback((msg) => {
        switch (msg.type) {
            case 'ack':
                addLog('ack', msg.text)
                // If backend echoes the STT transcript, show it
                if (msg.transcript) setTranscript(msg.transcript)
                break

            case 'step':
                addLog('step', msg.text)
                break

            case 'result':
                addLog('result', msg.text)
                break

            case 'error':
                addLog('error', msg.text)
                break

            case 'system':
                addLog('system', msg.text)
                break

            case 'audio':
                // Backend sends TTS audio as Base64
                if (msg.text) {
                    setTranscript(msg.text)
                    addLog('result', msg.text)
                }
                playBase64Audio(msg.audio, msg.mimeType || 'audio/mpeg')
                break

            case 'action':
                addLog('step', `⚡ ${msg.action}`)
                executeAction(msg.action, msg.payload)
                break

            default:
                addLog('system', `Unknown: ${msg.type}`)
        }
    }, [])

    // ── Play Base64 audio received from backend (TTS) ───────────────────────

    const playBase64Audio = useCallback((base64String, mimeType) => {
        try {
            // Decode Base64 → ArrayBuffer
            const binary = atob(base64String)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

            // Use Web Audio API to decode and play
            const AudioContext = window.AudioContext || window.webkitAudioContext
            const ctx = new AudioContext()

            ctx.decodeAudioData(bytes.buffer, (buffer) => {
                const source = ctx.createBufferSource()
                source.buffer = buffer
                source.connect(ctx.destination)
                source.start(0)
                source.onended = () => ctx.close()
            }, (err) => {
                addLog('error', `Audio decode failed: ${err.message}`)
            })
        } catch (err) {
            addLog('error', `Audio playback error: ${err.message}`)
        }
    }, [])

    // ── Execute frontend actions from agent backend ──────────────────────────

    const executeAction = useCallback((action, payload) => {
        switch (action) {
            case 'navigate':
                addLog('ack', `→ Navigating to ${payload.target}`)
                navigate(payload.target)
                break

            case 'speak':
                // Text-only speak fallback (if TTS is disabled on backend)
                addLog('result', payload.text)
                break

            /**
             * click — click a DOM element by CSS selector.
             * No visual dot, just a direct programmatic click.
             * Used for confirmations / form submits after the user has seen the dot.
             */
            case 'click': {
                const { selector } = payload
                setTimeout(() => {
                    try {
                        const el = document.querySelector(selector)
                        if (el && typeof el.click === 'function') {
                            el.click()
                            addLog('ack', `Clicked: ${selector}`)
                        } else {
                            addLog('error', `Selector not found: ${selector}`)
                        }
                    } catch (err) {
                        addLog('error', `click failed: ${err.message}`)
                    }
                }, 100)
                break
            }

            /**
             * click_dot — draw a red dot at (x, y) then perform the actual DOM click.
             *
             * Backend sends:
             *   { action: "click_dot", payload: { x: 320, y: 180, label: "Submit", selector?: "#submit-btn" } }
             *
             * Steps:
             *   1. Dispatch to ClickDot component → shows the red dot at (x, y)
             *   2. After a short visual delay (300ms), attempt the DOM click:
             *      a. If selector is provided, use querySelector
             *      b. Otherwise use document.elementFromPoint(x, y)
             */
            case 'click_dot': {
                const { x, y, selector, label } = payload

                // Step 1: show the dot (ClickDot component reads pendingAction)
                dispatchAction({ type: 'click_dot', payload: { x, y, label } })

                // Step 2: perform the actual DOM click after dot appears
                setTimeout(() => {
                    try {
                        let el = null
                        if (selector) {
                            el = document.querySelector(selector)
                        }
                        if (!el) {
                            el = document.elementFromPoint(x, y)
                        }
                        if (el && typeof el.click === 'function') {
                            el.click()
                            addLog('ack', `Clicked: ${label || selector || `(${x}, ${y})`}`)
                        } else {
                            addLog('error', `No element found at (${x}, ${y})`)
                        }
                    } catch (err) {
                        addLog('error', `Click failed: ${err.message}`)
                    }
                }, 300)
                break
            }
            
            default:
                // fill_form, open_modal, click, etc. → dispatched to page via AgentContext
                dispatchAction({ type: action, payload })
                break
        }
    }, [navigate])

    // ── MediaRecorder — capture audio and send as Base64 JSON ───────────────

    /**
     * `startRecording`
     * 
     * Asks for microphone permission, starts MediaRecorder.
     * 
     * On stop, assembles all chunks into one Blob, converts to Base64,
     * and sends a JSON message to the backend:
     * 
     *   `{
     *      type: "audio",
     *      audio: "<base64>",
     *      mimeType: "audio/webm;codecs=opus",
     *      current_page: "/leaves"
     *   }`
     */
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            // Pick best supported MIME type
            const mimeType = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/ogg;codecs=opus',
                'audio/ogg',
            ].find(m => MediaRecorder.isTypeSupported(m)) || ''

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
            mediaRecorderRef.current = recorder
            audioChunksRef.current = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data)
            }

            recorder.onstop = () => {
                // Stop all mic tracks so the browser mic indicator turns off
                stream.getTracks().forEach(t => t.stop())

                const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' })
                const reader = new FileReader()

                reader.onloadend = () => {
                    // reader.result = "data:audio/webm;base64,AAAA..."
                    // We strip the data-URL prefix to get the raw Base64 string
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
    }, [sendJSON])

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
        setIsRecording(false)
    }, [])

    /**
     * toggleRecording — click-to-toggle mode.
     * First click starts, second click stops and sends.
     */
    const toggleRecording = useCallback(() => {
        if (isRecording) {
            isHoldRef.current = false
            stopRecording()
        } else {
            isHoldRef.current = true
            startRecording()
        }
    }, [isRecording, startRecording, stopRecording])

    // ── Spacebar push-to-talk ────────────────────────────────────────────────

    useEffect(() => {
        const onKeyDown = (e) => {
            if (
                e.code === 'Space' &&
                e.target.tagName !== 'INPUT' &&
                e.target.tagName !== 'TEXTAREA' &&
                !isRecording
            ) {
                e.preventDefault()
                startRecording()
            }
        }
        const onKeyUp = (e) => {
            if (e.code === 'Space' && !isHoldRef.current) {
                stopRecording()
            }
        }
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
        }
    }, [isRecording, startRecording, stopRecording])

    return {
        connect,
        disconnect,
        startRecording,
        stopRecording,
        toggleRecording,
    }
}



// AgentSocket sending audio as audio frames version

// import { useRef, useCallback, useEffect } from 'react'
// import { useNavigate, useLocation } from 'react-router-dom'
// import { useAgent } from '../../context/AgentContext.jsx'

// const WS_URL = import.meta.env.VITE_AGENT_WS_URL || 'ws://localhost:8000/ws/agent'

// /**
//  * useAgentSocket
//  * ─────────────────────────────────────────────────────────────────────────────
//  * Manages:
//  *   1. WebSocket connection to FastAPI agent backend (persistent, auto-reconnect)
//  *   2. Audio capture via MediaRecorder (raw audio chunks → binary WS frames)
//  *   3. Audio playback for TTS audio received from backend (binary WS frames)
//  *
//  * STT and TTS both happen SERVER-SIDE:
//  *   Frontend  → sends raw audio binary (PCM/webm/ogg) over WebSocket
//  *   Backend   → transcribes (Whisper), runs agent, synthesises speech (TTS)
//  *   Backend   → sends back JSON action messages + binary audio frames
//  *   Frontend  → plays back received audio via Web Audio API
//  * ─────────────────────────────────────────────────────────────────────────────
//  */
// export function useAgentSocket() {
//     const {
//         setIsConnected,
//         setIsRecording,
//         setTranscript,
//         addLog,
//         dispatchAction,
//         isRecording,
//     } = useAgent()

//     const navigate = useNavigate()
//     const location = useLocation()
//     const locationRef = useRef(location.pathname)

//     const wsRef = useRef(null)
//     const mediaRecRef = useRef(null)   // MediaRecorder instance
//     const streamRef = useRef(null)   // MediaStream (microphone)
//     const audioCtxRef = useRef(null)   // Web Audio API context
//     const audioQueueRef = useRef([])     // queued ArrayBuffers for TTS playback
//     const isPlayingRef = useRef(false)  // prevents overlapping playback
//     const toggleModeRef = useRef(false)  // true = click-toggle, false = push-to-talk

//     // Keep location ref in sync so callbacks always have latest pathname
//     useEffect(() => { locationRef.current = location.pathname }, [location.pathname])

//     // ── Helpers ──────────────────────────────────────────────────────────────

//     const getAudioContext = useCallback(() => {
//         if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
//             audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
//         }
//         return audioCtxRef.current
//     }, [])

//     // ── Audio playback queue ─────────────────────────────────────────────────
//     /**
//      * Backend sends TTS audio as binary WebSocket frames (MP3 or WAV).
//      * We buffer them and play sequentially so they don't overlap.
//      */
//     const playNextAudio = useCallback(async () => {
//         if (isPlayingRef.current || audioQueueRef.current.length === 0) return
//         isPlayingRef.current = true

//         const arrayBuffer = audioQueueRef.current.shift()
//         try {
//             const ctx = getAudioContext()
//             // Resume context if suspended (browser autoplay policy)
//             if (ctx.state === 'suspended') await ctx.resume()

//             const decoded = await ctx.decodeAudioData(arrayBuffer)
//             const source = ctx.createBufferSource()
//             source.buffer = decoded
//             source.connect(ctx.destination)
//             source.onended = () => {
//                 isPlayingRef.current = false
//                 playNextAudio() // play next queued chunk
//             }
//             source.start(0)
//         } catch (err) {
//             addLog('error', `Audio playback error: ${err.message}`)
//             isPlayingRef.current = false
//             playNextAudio()
//         }
//     }, [getAudioContext, addLog])

//     const enqueueAudio = useCallback((arrayBuffer) => {
//         audioQueueRef.current.push(arrayBuffer)
//         playNextAudio()
//     }, [playNextAudio])

//     // ── WebSocket ─────────────────────────────────────────────────────────────

//     const connect = useCallback(() => {
//         if (wsRef.current?.readyState === WebSocket.OPEN) return

//         addLog('system', 'Connecting to agent backend...')
//         const ws = new WebSocket(WS_URL)

//         /**
//          * IMPORTANT: We receive two frame types from backend:
//          *   • Text frames  → JSON action/log messages
//          *   • Binary frames → TTS audio bytes (MP3/WAV)
//          * The backend must prefix binary frames OR use a separate channel.
//          * Recommended: backend sends binary audio as-is (ArrayBuffer),
//          * and wraps all JSON in text frames. The browser distinguishes
//          * them automatically via event.data type.
//          */
//         ws.binaryType = 'arraybuffer'
//         wsRef.current = ws

//         ws.onopen = () => {
//             setIsConnected(true)
//             addLog('system', 'Connected to agent backend.')
//             // Send a handshake so backend knows client capabilities
//             ws.send(JSON.stringify({ type: 'hello', client: 'hr-portal-web' }))
//         }

//         ws.onclose = () => {
//             setIsConnected(false)
//             addLog('system', 'Disconnected. Reconnecting in 3s...')
//             // Attempt reconnect after 3s
//             setTimeout(connect, 3000)
//         }

//         ws.onerror = () => addLog('error', 'WebSocket error.')

//         ws.onmessage = (event) => {
//             if (event.data instanceof ArrayBuffer) {
//                 // Binary frame = TTS audio from backend
//                 enqueueAudio(event.data)
//             } else {
//                 // Text frame = JSON message
//                 try {
//                     handleServerMessage(JSON.parse(event.data))
//                 } catch {
//                     addLog('error', `Bad JSON: ${event.data}`)
//                 }
//             }
//         }
//     }, []) // eslint-disable-line react-hooks/exhaustive-deps

//     // ── Handle JSON messages from backend ────────────────────────────────────
//     /**
//      * Message shapes (all text frames):
//      * - `{ type: 'ack',       text }`           → user speech echoed back after STT
//      * - `{ type: 'step',      text }`           → agent thinking / tool call step
//      * - `{ type: 'transcript',text }`           → live interim transcript from STT
//      * - `{ type: 'action',    action, payload}` → frontend action to execute
//      * - `{ type: 'action', action: 'navigate', payload: { target: '/leaves' } }`
//      * - `{ type: 'action', action: 'fill_form', payload: { field, value } }`
//      * - `{ type: 'action', action: 'speak',    payload: { text } }`
//      * - `{ type: 'result',    text }`           → final agent response text
//      * - `{ type: 'error',     text }`           → backend error
//      * - `{ type: 'audio_end'               }`   → TTS stream ended (all audio sent)
//      */
//     const handleServerMessage = useCallback((msg) => {
//         switch (msg.type) {
//             case 'transcript':
//                 // Live STT result from backend (Whisper streaming or final)
//                 setTranscript(msg.text)
//                 break

//             case 'ack':
//                 setTranscript(msg.text)
//                 addLog('ack', `You: "${msg.text}"`)
//                 break

//             case 'step':
//                 addLog('step', msg.text)
//                 break

//             case 'result':
//                 addLog('result', msg.text)
//                 // TTS audio for this result will arrive as subsequent binary frame(s)
//                 break

//             case 'error':
//                 addLog('error', msg.text)
//                 break

//             case 'action':
//                 addLog('step', `⟶ ${msg.action}`)
//                 executeAction(msg.action, msg.payload)
//                 break

//             case 'audio_end':
//                 addLog('system', 'Response complete.')
//                 break

//             default:
//                 addLog('system', `[${msg.type}] ${msg.text || ''}`)
//         }
//     }, []) // eslint-disable-line react-hooks/exhaustive-deps

//     // ── Execute frontend actions from agent ───────────────────────────────────
//     const executeAction = useCallback((action, payload) => {
//         switch (action) {
//             case 'navigate':
//                 addLog('ack', `Navigating → ${payload.target}`)
//                 navigate(payload.target)
//                 break
//             default:
//                 // fill_form, click, open_modal etc. → dispatched to page via context
//                 dispatchAction({ type: action, payload })
//                 break
//         }
//     }, [navigate, dispatchAction, addLog])

//     // ── Send JSON metadata over WebSocket ────────────────────────────────────
//     const sendJSON = useCallback((obj) => {
//         if (wsRef.current?.readyState === WebSocket.OPEN) {
//             wsRef.current.send(JSON.stringify(obj))
//         } else {
//             addLog('error', 'Not connected.')
//         }
//     }, [addLog])

//     // ── Audio capture ─────────────────────────────────────────────────────────
//     /**
//      * Capture flow:
//      * 1. `getUserMedia()` → MediaStream
//      * 2. MediaRecorder collects ~250ms audio chunks
//      * 3. Each chunk (Blob) is converted to ArrayBuffer and sent as
//      *    a binary WebSocket frame to the backend
//      * 4. On stop, send `{ type: 'audio_end' }` JSON to signal end of utterance
//      *
//      * Backend receives binary frames → feeds to Whisper → transcribes →
//      * runs LLM agent → synthesises TTS → sends binary audio back.
//      */
//     const startRecording = useCallback(async () => {
//         try {
//             const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
//             streamRef.current = stream

//             // Prefer codecs the server can decode easily
//             const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
//                 ? 'audio/webm;codecs=opus'
//                 : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
//                     ? 'audio/ogg;codecs=opus'
//                     : 'audio/webm'

//             const rec = new MediaRecorder(stream, { mimeType })
//             mediaRecRef.current = rec

//             rec.ondataavailable = async (e) => {
//                 if (e.data.size === 0) return
//                 if (wsRef.current?.readyState !== WebSocket.OPEN) return
//                 // Convert Blob → ArrayBuffer → send as binary frame
//                 const buf = await e.data.arrayBuffer()
//                 wsRef.current.send(buf)
//             }

//             rec.onstart = () => {
//                 setIsRecording(true)
//                 setTranscript('')
//                 // Tell backend audio is starting + page context
//                 sendJSON({
//                     type: 'audio_start',
//                     mime_type: mimeType,
//                     current_page: locationRef.current,
//                 })
//                 addLog('system', 'Recording started...')
//             }

//             rec.onstop = () => {
//                 // Signal end of utterance so backend can finalise STT
//                 sendJSON({ type: 'audio_end', current_page: locationRef.current })
//                 setIsRecording(false)
//                 // Release mic
//                 streamRef.current?.getTracks().forEach(t => t.stop())
//                 streamRef.current = null
//                 addLog('system', 'Processing...')
//             }

//             rec.onerror = (e) => {
//                 addLog('error', `Recorder error: ${e.error?.message}`)
//                 setIsRecording(false)
//             }

//             // Emit chunks every 250ms for low-latency streaming to Whisper
//             rec.start(250)

//         } catch (err) {
//             addLog('error', `Mic access denied: ${err.message}`)
//             setIsRecording(false)
//         }
//     }, [sendJSON, addLog, setIsRecording, setTranscript])

//     const stopRecording = useCallback(() => {
//         if (mediaRecRef.current?.state === 'recording') {
//             mediaRecRef.current.stop()
//         }
//         toggleModeRef.current = false
//     }, [])

//     const toggleRecording = useCallback(() => {
//         if (isRecording) {
//             toggleModeRef.current = false
//             stopRecording()
//         } else {
//             toggleModeRef.current = true
//             startRecording()
//         }
//     }, [isRecording, startRecording, stopRecording])

//     // ── Spacebar push-to-talk ─────────────────────────────────────────────────
//     useEffect(() => {
//         const onDown = (e) => {
//             if (e.code !== 'Space') return
//             if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
//             e.preventDefault()
//             if (!isRecording && !toggleModeRef.current) startRecording()
//         }
//         const onUp = (e) => {
//             if (e.code !== 'Space') return
//             if (!toggleModeRef.current) stopRecording()
//         }
//         window.addEventListener('keydown', onDown)
//         window.addEventListener('keyup', onUp)
//         return () => {
//             window.removeEventListener('keydown', onDown)
//             window.removeEventListener('keyup', onUp)
//         }
//     }, [isRecording, startRecording, stopRecording])

//     return { connect, sendJSON, startRecording, stopRecording, toggleRecording }
// }




// AgentSocket with in browser Speech Recognition

// import { useRef, useCallback, useEffect } from 'react'
// import { useNavigate, useLocation } from 'react-router-dom'
// import { useAgent } from '../../context/AgentContext.jsx'

// const WS_URL = import.meta.env.VITE_AGENT_WS_URL || 'ws://localhost:8000/ws/agent'

// /**
//  * useAgentSocket:
//  * 
//  * Manages the WebSocket connection to the agent backend and
//  * the Web Speech API for voice capture.
//  *
//  * Call connect() once (e.g. on app mount or first dialog open).
//  * 
//  * startRecording() / stopRecording() toggle the mic.
//  */
// export function useAgentSocket() {
//     const {
//         setIsConnected,
//         setIsRecording,
//         setTranscript,
//         addLog,
//         dispatchAction,
//         isRecording,
//     } = useAgent()

//     const navigate = useNavigate()
//     const location = useLocation()

//     const wsRef = useRef(null)
//     const recognitionRef = useRef(null)
//     const toggleActiveRef = useRef(false) // track click-toggle vs hold mode

//     // ── WebSocket ────────────────────────────────────────────────────────────

//     const connect = useCallback(() => {
//         if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return

//         addLog('system', `Connecting to agent backend...`)
//         const ws = new WebSocket(WS_URL)
//         wsRef.current = ws

//         ws.onopen = () => {
//             setIsConnected(true)
//             addLog('system', 'Connected to agent backend.')
//         }

//         ws.onclose = () => {
//             setIsConnected(false)
//             addLog('system', 'Disconnected from agent backend.')
//             // Attempt reconnect after 3s
//             setTimeout(connect, 3000)
//         }

//         ws.onerror = () => {
//             addLog('error', 'WebSocket error. Retrying...')
//         }

//         ws.onmessage = (event) => {
//             try {
//                 const msg = JSON.parse(event.data)
//                 handleServerMessage(msg)
//             } catch {
//                 addLog('error', `Malformed message: ${event.data}`)
//             }
//         }
//     }, [])

//     const sendMessage = useCallback((payload) => {
//         if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//             wsRef.current.send(JSON.stringify(payload))
//         } else {
//             addLog('error', 'Not connected to agent backend.')
//         }
//     }, [])

//     // ── Handle incoming server messages ─────────────────────────────────────

//     const handleServerMessage = useCallback((msg) => {
//         /*
//          * Expected message shapes from FastAPI:
//          *   { type: 'ack',    text: '...' }           — backend acknowledged input
//          *   { type: 'step',   text: '...' }           — agent thinking step
//          *   { type: 'action', action: 'navigate', payload: { target: '/leaves' } }
//          *   { type: 'action', action: 'fill_form', payload: { field, value } }
//          *   { type: 'action', action: 'speak',    payload: { text } }
//          *   { type: 'result', text: '...' }           — final result
//          *   { type: 'error',  text: '...' }           — backend error
//          */
//         switch (msg.type) {
//             case 'ack':
//                 addLog('ack', msg.text)
//                 break

//             case 'step':
//                 addLog('step', msg.text)
//                 break

//             case 'result':
//                 addLog('result', msg.text)
//                 break

//             case 'error':
//                 addLog('error', msg.text)
//                 break

//             case 'action':
//                 addLog('step', `Action: ${msg.action}`)
//                 executeAction(msg.action, msg.payload)
//                 break

//             default:
//                 addLog('system', `Unknown message type: ${msg.type}`)
//         }
//     }, [])

//     // ── Execute action on the frontend ──────────────────────────────────────

//     const executeAction = useCallback((action, payload) => {
//         switch (action) {
//             case 'navigate':
//                 addLog('ack', `Navigating to ${payload.target}`)
//                 navigate(payload.target)
//                 break

//             case 'speak':
//                 addLog('result', payload.text)
//                 if ('speechSynthesis' in window) {
//                     const utterance = new SpeechSynthesisUtterance(payload.text)
//                     utterance.rate = 1.05
//                     window.speechSynthesis.speak(utterance)
//                 }
//                 break

//             // fill_form, click, etc. — dispatched to page via AgentContext
//             default:
//                 dispatchAction({ type: action, payload })
//                 break
//         }
//     }, [navigate])

//     // ── Web Speech API ───────────────────────────────────────────────────────

//     const initRecognition = useCallback(() => {
//         const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
//         if (!SpeechRecognition) {
//             addLog('error', 'Speech recognition not supported in this browser.')
//             return null
//         }

//         const rec = new SpeechRecognition()
//         rec.lang = 'en-US'
//         rec.interimResults = true
//         rec.continuous = false

//         rec.onresult = (event) => {
//             let interim = ''
//             let final = ''
//             for (let i = event.resultIndex; i < event.results.length; i++) {
//                 const t = event.results[i][0].transcript
//                 if (event.results[i].isFinal) final += t
//                 else interim += t
//             }
//             setTranscript(interim || final)
//             if (final) {
//                 sendMessage({
//                     text: final,
//                     current_page: location.pathname,
//                 })
//                 addLog('ack', `You: "${final}"`)
//             }
//         }

//         rec.onerror = (e) => {
//             if (e.error !== 'aborted') addLog('error', `Mic error: ${e.error}`)
//             setIsRecording(false)
//         }

//         rec.onend = () => {
//             if (toggleActiveRef.current) return // don't reset if toggle-mode
//             setIsRecording(false)
//         }

//         return rec
//     }, [location.pathname, sendMessage])

//     const startRecording = useCallback(() => {
//         const rec = initRecognition()
//         if (!rec) return
//         recognitionRef.current = rec
//         rec.start()
//         setIsRecording(true)
//         setTranscript('')
//         addLog('system', 'Listening...')
//     }, [initRecognition])

//     const stopRecording = useCallback(() => {
//         if (recognitionRef.current) {
//             recognitionRef.current.stop()
//             recognitionRef.current = null
//         }
//         setIsRecording(false)
//         toggleActiveRef.current = false
//     }, [])

//     // Toggle click mode
//     const toggleRecording = useCallback(() => {
//         if (isRecording) {
//             toggleActiveRef.current = false
//             stopRecording()
//         } else {
//             toggleActiveRef.current = true
//             startRecording()
//         }
//     }, [isRecording, startRecording, stopRecording])

//     // Spacebar push-to-talk
//     useEffect(() => {
//         const onKeyDown = (e) => {
//             if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
//                 e.preventDefault()
//                 if (!isRecording) startRecording()
//             }
//         }
//         const onKeyUp = (e) => {
//             if (e.code === 'Space' && !toggleActiveRef.current) {
//                 stopRecording()
//             }
//         }
//         window.addEventListener('keydown', onKeyDown)
//         window.addEventListener('keyup', onKeyUp)
//         return () => {
//             window.removeEventListener('keydown', onKeyDown)
//             window.removeEventListener('keyup', onKeyUp)
//         }
//     }, [isRecording, startRecording, stopRecording])

//     return { connect, sendMessage, startRecording, stopRecording, toggleRecording }
// }