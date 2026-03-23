import { useState, useRef, useEffect } from 'react'

const API = 'http://localhost:8080/api/support/chat'

const QUICK_PROMPTS = [
  "Where is my order?",
  "I want to return an item",
  "My order arrived damaged",
  "I need to cancel my order",
]

export default function SupportChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      type: 'text',
      text: "Hi! I'm your ShopDemo support assistant. How can I help you today?\n\nYou can ask about your orders, request refunds, or any other issue.",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!open && messages.length > 1) setUnread(0)
  }, [open])

  function addMessage(msg) {
    setMessages(prev => [...prev, msg])
  }

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    setLoading(true)

    addMessage({ role: 'user', type: 'text', text: msg })

    try {
      const resp = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })

      if (!resp.ok) {
        addMessage({ role: 'agent', type: 'error', text: `Server error (${resp.status}). Is the backend running?` })
        return
      }

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop()
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const json = line.replace(/^data:\s*/, '')
              const ev = JSON.parse(json)
              handleEvent(ev)
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      addMessage({ role: 'agent', type: 'error', text: `Connection failed. Make sure the backend is running on port 8080.` })
    } finally {
      setLoading(false)
    }
  }

  function handleEvent(ev) {
    switch (ev.type) {
      case 'text':
        addMessage({ role: 'agent', type: 'text', text: ev.text })
        break
      case 'tool_call':
        addMessage({ role: 'agent', type: 'tool_call', name: ev.name, input: ev.input })
        break
      case 'tool_result':
        addMessage({ role: 'agent', type: 'tool_result', name: ev.name, result: ev.result })
        break
      case 'customer_verified':
        addMessage({ role: 'agent', type: 'badge', badge: 'verified', text: `✓ Identity verified: ${ev.name} (${ev.tier})` })
        break
      case 'hook_blocked':
        addMessage({ role: 'agent', type: 'badge', badge: 'blocked', text: `🚫 ${ev.reason}` })
        break
      case 'error':
        addMessage({ role: 'agent', type: 'error', text: ev.message })
        break
      default:
        break
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        className="support-fab"
        onClick={() => { setOpen(o => !o); setUnread(0) }}
        aria-label="Customer support"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
        {!open && unread > 0 && <span className="support-badge">{unread}</span>}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="support-panel">
          <div className="support-header">
            <div className="support-header-info">
              <div className="support-avatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <div className="support-header-name">Support Agent</div>
                <div className="support-header-sub">Powered by Claude</div>
              </div>
            </div>
            <button className="support-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="support-messages">
            {messages.map((m, i) => (
              <MessageRow key={i} msg={m} />
            ))}
            {loading && (
              <div className="support-msg agent">
                <div className="support-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts — only before first user message */}
          {messages.length === 1 && (
            <div className="support-quick">
              {QUICK_PROMPTS.map(p => (
                <button key={p} className="support-quick-btn" onClick={() => send(p)}>{p}</button>
              ))}
            </div>
          )}

          <div className="support-input-row">
            <input
              className="support-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Type your message…"
              disabled={loading}
            />
            <button className="support-send" onClick={() => send()} disabled={loading || !input.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function MessageRow({ msg }) {
  if (msg.type === 'badge') {
    return (
      <div className={`support-badge-row ${msg.badge}`}>
        {msg.text}
      </div>
    )
  }

  if (msg.type === 'tool_call') {
    return (
      <div className="support-tool-card">
        <div className="support-tool-name">🔧 {msg.name}</div>
        <pre className="support-tool-body">{JSON.stringify(msg.input, null, 2)}</pre>
      </div>
    )
  }

  if (msg.type === 'tool_result') {
    const ok = msg.result?.success !== false
    return (
      <div className={`support-tool-result ${ok ? 'ok' : 'err'}`}>
        <pre>{JSON.stringify(msg.result, null, 2)}</pre>
      </div>
    )
  }

  if (msg.type === 'error') {
    return (
      <div className="support-error-msg">{msg.text}</div>
    )
  }

  return (
    <div className={`support-msg ${msg.role}`}>
      <div className="support-bubble">{msg.text}</div>
    </div>
  )
}
