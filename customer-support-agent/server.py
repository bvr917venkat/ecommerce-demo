"""
Customer Support Agent — Web Server
Serves the chat UI and streams agent responses via SSE.

Run:  python server.py
Open: http://localhost:8001
"""

import json
import os
import time
from typing import Generator

from dotenv import load_dotenv
load_dotenv()

from flask import Flask, Response, request, jsonify
from flask_cors import CORS

import anthropic
from tools import TOOL_DEFINITIONS, execute_tool

app = Flask(__name__)
CORS(app)

MAX_TURNS = 15
MAX_REFUND_WITHOUT_APPROVAL = 500.00

SYSTEM_PROMPT = """You are a helpful customer support agent for ShopDemo, an eCommerce store.
You have access to tools to look up customers, view orders, process refunds, and escalate issues.

## Rules (MUST follow)
1. ALWAYS call get_customer first to verify the customer's identity before any account action.
2. NEVER process a refund without first successfully verifying the customer.
3. Refunds over $500 MUST be escalated — never attempt to process them directly.
4. Always confirm the refund amount with the customer before processing.
5. Be empathetic but concise.

## Escalation criteria
- Refund amount > $500
- Customer mentions lawyer, lawsuit, or legal action
- Customer explicitly asks to speak to a person
- Tool returns unresolvable error after one retry

## Test Customers
- CUST-001 / alice@example.com — Alice Johnson (VIP)
- CUST-002 / bob@example.com — Bob Martinez (GOLD)
- CUST-003 / carol@example.com — Carol White (SILVER)
- CUST-004 / david@example.com — David Lee (STANDARD)
"""


def stream_agent(user_message: str) -> Generator[str, None, None]:
    """Run the agentic loop and yield SSE events for each step."""

    def event(event_type: str, data: dict) -> str:
        return f"data: {json.dumps({'type': event_type, **data})}\n\n"

    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key or api_key.startswith("your-"):
        yield event("error", {"message": "ANTHROPIC_API_KEY not configured. Add it to customer-support-agent/.env"})
        return

    client = anthropic.Anthropic(api_key=api_key)
    messages = [{"role": "user", "content": user_message}]
    customer_verified = False
    turn = 0

    while turn < MAX_TURNS:
        turn += 1
        yield event("thinking", {"turn": turn})

        try:
            response = client.messages.create(
                model="claude-opus-4-6",
                max_tokens=4096,
                thinking={"type": "adaptive"},
                system=SYSTEM_PROMPT,
                tools=TOOL_DEFINITIONS,
                messages=messages,
            )
        except anthropic.AuthenticationError:
            yield event("error", {"message": "Invalid API key or insufficient credits. Check your ANTHROPIC_API_KEY."})
            return
        except anthropic.APIError as e:
            yield event("error", {"message": f"API error: {str(e)}"})
            return

        stop_reason = response.stop_reason

        # Stream any text blocks
        text_blocks = [b.text for b in response.content if b.type == "text"]
        for text in text_blocks:
            yield event("text", {"text": text})

        if stop_reason == "end_turn":
            yield event("done", {"message": " ".join(text_blocks)})
            return

        if stop_reason == "tool_use":
            tool_use_blocks = [b for b in response.content if b.type == "tool_use"]
            messages.append({"role": "assistant", "content": response.content})
            tool_results = []

            for tb in tool_use_blocks:
                tool_name = tb.name
                tool_input = tb.input

                yield event("tool_call", {"name": tool_name, "input": tool_input})

                # Programmatic prerequisite
                if tool_name == "process_refund" and not customer_verified:
                    result = {
                        "success": False,
                        "errorCategory": "PREREQUISITE_NOT_MET",
                        "isRetryable": False,
                        "message": "Cannot process refund: customer not verified. Call get_customer first."
                    }
                    yield event("hook_blocked", {"reason": "process_refund called before get_customer"})
                else:
                    result = execute_tool(tool_name, tool_input)

                    if tool_name == "get_customer" and result.get("success"):
                        customer_verified = True
                        yield event("customer_verified", {"name": result.get("name"), "tier": result.get("tier")})

                # PostToolUse hook — block high-value refunds
                if tool_name == "process_refund" and result.get("success"):
                    amount = result.get("refundAmount", 0)
                    if amount > MAX_REFUND_WITHOUT_APPROVAL:
                        yield event("hook_blocked", {"reason": f"Refund ${amount:.2f} exceeds ${MAX_REFUND_WITHOUT_APPROVAL:.0f} limit"})
                        result = {
                            "success": False,
                            "errorCategory": "BUSINESS_RULE_VIOLATION",
                            "isRetryable": False,
                            "message": f"Refund of ${amount:.2f} exceeds automated limit. Escalate to human agent."
                        }

                yield event("tool_result", {"name": tool_name, "result": result})

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tb.id,
                    "content": json.dumps(result)
                })

            messages.append({"role": "user", "content": tool_results})
            continue

        yield event("error", {"message": f"Unexpected stop_reason: {stop_reason}"})
        return

    yield event("error", {"message": "Max turns reached without resolution."})


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = (data or {}).get("message", "").strip()
    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    return Response(
        stream_agent(user_message),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


@app.route("/health")
def health():
    return jsonify({"status": "ok", "backend": "http://localhost:8080"})


@app.route("/")
def index():
    return HTML_PAGE


# ── Inline HTML UI ────────────────────────────────────────────────────────────

HTML_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ShopDemo — Customer Support Agent</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: #f0f2f5; height: 100vh; display: flex; flex-direction: column; }

  header { background: #1a1a2e; color: white; padding: 14px 20px;
           display: flex; align-items: center; gap: 12px; }
  header h1 { font-size: 1.1rem; font-weight: 600; }
  header span { font-size: 0.75rem; color: #a0aec0; background: #2d3748;
                padding: 3px 10px; border-radius: 12px; }

  .hint { background: #e8f4fd; border-left: 4px solid #3182ce;
          padding: 10px 16px; font-size: 0.82rem; color: #2d3748; }
  .hint b { color: #1a365d; }

  #chat { flex: 1; overflow-y: auto; padding: 20px; display: flex;
          flex-direction: column; gap: 14px; }

  .msg { max-width: 72%; }
  .msg.user { align-self: flex-end; }
  .msg.agent { align-self: flex-start; }
  .msg.system { align-self: center; max-width: 90%; }

  .bubble { padding: 12px 16px; border-radius: 16px; font-size: 0.9rem;
            line-height: 1.5; white-space: pre-wrap; }
  .user .bubble  { background: #3182ce; color: white; border-bottom-right-radius: 4px; }
  .agent .bubble { background: white; color: #1a202c; border-bottom-left-radius: 4px;
                   box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

  .tool-card { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 10px;
               padding: 10px 14px; font-size: 0.8rem; font-family: monospace; }
  .tool-card .tool-name { font-weight: 700; color: #553c9a; margin-bottom: 4px; }
  .tool-card .tool-input { color: #4a5568; }
  .tool-card .tool-result { margin-top: 6px; padding-top: 6px;
                             border-top: 1px solid #e2e8f0; color: #276749; }
  .tool-card .tool-result.error { color: #c53030; }
  .tool-card .hook-blocked { color: #c05621; font-weight: 600;
                              margin-top: 4px; }

  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px;
           font-size: 0.7rem; font-weight: 600; margin-bottom: 6px; }
  .badge.verified { background: #c6f6d5; color: #276749; }
  .badge.blocked  { background: #fed7d7; color: #9b2c2c; }
  .badge.escalated { background: #fefcbf; color: #744210; }

  .thinking-dot { display: inline-flex; gap: 4px; padding: 12px 16px;
                  background: white; border-radius: 16px; border-bottom-left-radius: 4px;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .thinking-dot span { width: 7px; height: 7px; background: #a0aec0; border-radius: 50%;
                        animation: bounce 1.2s infinite; }
  .thinking-dot span:nth-child(2) { animation-delay: 0.2s; }
  .thinking-dot span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }

  .error-msg { background: #fff5f5; border: 1px solid #fc8181; border-radius: 10px;
               padding: 10px 14px; font-size: 0.85rem; color: #c53030; }

  footer { padding: 16px; background: white; border-top: 1px solid #e2e8f0;
           display: flex; gap: 10px; }
  #input { flex: 1; padding: 12px 16px; border: 1px solid #cbd5e0; border-radius: 24px;
           font-size: 0.9rem; outline: none; }
  #input:focus { border-color: #3182ce; }
  #send { padding: 12px 24px; background: #3182ce; color: white; border: none;
          border-radius: 24px; font-size: 0.9rem; cursor: pointer; font-weight: 600; }
  #send:hover { background: #2b6cb0; }
  #send:disabled { background: #a0aec0; cursor: not-allowed; }

  .scenarios { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 20px;
               background: white; border-top: 1px solid #e2e8f0; }
  .scenarios span { font-size: 0.75rem; color: #718096; margin-right: 4px; }
  .scenario-btn { padding: 5px 12px; font-size: 0.78rem; border: 1px solid #cbd5e0;
                  border-radius: 16px; cursor: pointer; background: #f7fafc;
                  color: #4a5568; transition: all .15s; }
  .scenario-btn:hover { background: #ebf8ff; border-color: #3182ce; color: #2b6cb0; }
</style>
</head>
<body>

<header>
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
  <h1>ShopDemo Customer Support</h1>
  <span>Powered by Claude claude-opus-4-6</span>
</header>

<div class="hint">
  <b>Try asking:</b> &nbsp;
  "I'm Carol White (carol@example.com). My order ORD-1001 arrived damaged, I want a refund." &nbsp;|&nbsp;
  "Customer ID CUST-001, my $850 laptop never arrived." &nbsp;|&nbsp;
  "I'm going to sue if this isn't fixed today!"
</div>

<div id="chat"></div>

<div class="scenarios">
  <span>Quick scenarios:</span>
  <button class="scenario-btn" onclick="tryScenario(1)">✅ Happy path refund</button>
  <button class="scenario-btn" onclick="tryScenario(2)">💰 High-value → escalate</button>
  <button class="scenario-btn" onclick="tryScenario(3)">❓ Customer not found</button>
  <button class="scenario-btn" onclick="tryScenario(4)">⚠️ Legal threat</button>
</div>

<footer>
  <input id="input" type="text" placeholder="Describe your issue..." onkeydown="if(event.key==='Enter')send()">
  <button id="send" onclick="send()">Send</button>
</footer>

<script>
const SCENARIOS = {
  1: "Hi, I'm Carol White (carol@example.com). My order ORD-1001 arrived damaged. I'd like a refund please.",
  2: "I'm Alice Johnson, customer ID CUST-001. I need a refund — my order was $850 and the item never arrived.",
  3: "My customer ID is CUST-999 and I want to return my order ORD-9999.",
  4: "I'm Bob Martinez, CUST-002. This is completely unacceptable. I'm going to sue you if this isn't resolved TODAY."
};

function tryScenario(n) {
  document.getElementById('input').value = SCENARIOS[n];
  send();
}

const chat = document.getElementById('chat');
let currentToolCard = null;

function addMsg(role, html) {
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  div.innerHTML = html;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

function removeThinking() {
  const t = document.getElementById('thinking');
  if (t) t.remove();
}

function send() {
  const input = document.getElementById('input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  addMsg('user', `<div class="bubble">${escHtml(msg)}</div>`);

  // Thinking indicator
  const thinkEl = addMsg('agent', '<div id="thinking" class="thinking-dot"><span></span><span></span><span></span></div>');
  thinkEl.id = 'thinking-wrapper';
  document.getElementById('send').disabled = true;
  currentToolCard = null;

  const es = new EventSource('/chat?msg=' + encodeURIComponent(msg));

  // Use POST via fetch + ReadableStream instead
  es.close();
  streamChat(msg);
}

async function streamChat(msg) {
  try {
    const resp = await fetch('/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message: msg})
    });

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      buf += decoder.decode(value, {stream: true});
      const lines = buf.split('\\n');
      buf = lines.pop();
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            handleEvent(JSON.parse(line.slice(6)));
          } catch(e) {}
        }
      }
    }
  } catch(e) {
    removeThinking();
    addMsg('system', `<div class="error-msg">Connection error: ${escHtml(String(e))}</div>`);
  }
  document.getElementById('send').disabled = false;
}

function handleEvent(ev) {
  switch(ev.type) {
    case 'thinking':
      // keep dots showing
      break;

    case 'text':
      removeThinking();
      addMsg('agent', `<div class="bubble">${escHtml(ev.text)}</div>`);
      break;

    case 'tool_call':
      removeThinking();
      currentToolCard = document.createElement('div');
      currentToolCard.className = 'msg system';
      currentToolCard.innerHTML = `<div class="tool-card">
        <div class="tool-name">🔧 ${escHtml(ev.name)}</div>
        <div class="tool-input">${escHtml(JSON.stringify(ev.input, null, 2))}</div>
      </div>`;
      chat.appendChild(currentToolCard);
      chat.scrollTop = chat.scrollHeight;
      break;

    case 'tool_result':
      if (currentToolCard) {
        const resultDiv = document.createElement('div');
        const ok = ev.result.success !== false;
        resultDiv.className = 'tool-result' + (ok ? '' : ' error');
        resultDiv.textContent = JSON.stringify(ev.result, null, 2);
        currentToolCard.querySelector('.tool-card').appendChild(resultDiv);
        chat.scrollTop = chat.scrollHeight;
      }
      break;

    case 'customer_verified':
      addMsg('system', `<span class="badge verified">✓ Customer verified: ${escHtml(ev.name)} (${escHtml(ev.tier)})</span>`);
      break;

    case 'hook_blocked':
      addMsg('system', `<span class="badge blocked">🚫 Hook blocked: ${escHtml(ev.reason)}</span>`);
      break;

    case 'error':
      removeThinking();
      addMsg('system', `<div class="error-msg">⚠️ ${escHtml(ev.message)}</div>`);
      break;

    case 'done':
      removeThinking();
      break;
  }
}

function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
</script>
</body>
</html>
"""

if __name__ == "__main__":
    print("="*55)
    print("  Customer Support Agent — Web UI")
    print("  http://localhost:8001")
    print("="*55)
    app.run(port=8001, debug=False)
