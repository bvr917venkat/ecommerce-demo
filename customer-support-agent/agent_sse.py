"""
agent_sse.py — Customer Support Agent using Claude Agent SDK.

Uses CLAUDE_CODE_OAUTH_TOKEN (from `claude setup-token`) for authentication.
Custom tools are served via mcp_server.py (stdio MCP server).

Usage: python agent_sse.py "customer message here"
Outputs SSE lines to stdout: data: {"type": "...", ...}
"""

import json
import os
import sys
import anyio

from dotenv import load_dotenv
load_dotenv()

from claude_agent_sdk import (
    query,
    ClaudeAgentOptions,
    HookMatcher,
    ResultMessage,
    AssistantMessage,
    TextBlock,
    SystemMessage,
)

MAX_REFUND_WITHOUT_APPROVAL = 500.00

SYSTEM_PROMPT = """You are a helpful customer support agent for ShopDemo, an eCommerce store.
You have access to tools: get_customer, lookup_order, process_refund, escalate_to_human.

## Rules (MUST follow)
1. ALWAYS call get_customer first to verify the customer's identity before any account action.
2. NEVER process a refund without first successfully verifying the customer.
3. Refunds over $500 MUST be escalated — never attempt to process them directly.
4. Be empathetic but concise.

## Escalation criteria
- Refund amount > $500 → escalate_to_human (priority HIGH)
- Legal threat (sue/lawyer/lawsuit) → escalate_to_human (priority URGENT)
- Customer requests human agent → escalate_to_human

## Test customers
- CUST-001 / alice@example.com — Alice Johnson (VIP, LTV $3842)
- CUST-002 / bob@example.com — Bob Martinez (GOLD, LTV $1547)
- CUST-003 / carol@example.com — Carol White (SILVER, LTV $621)
- CUST-004 / david@example.com — David Lee (STANDARD, LTV $89)

## Example flows

Flow 1 — Standard refund:
  Customer: "I'm Carol White (carol@example.com). Order ORD-1001 arrived damaged."
  Steps: get_customer(email) → lookup_order → process_refund
  Say: "Refund of $XX processed. Ref: REF-XXXX. Allow 3-5 business days."

Flow 2 — High-value refund:
  Customer: "I'm Alice (CUST-001). My $850 order never arrived."
  Steps: get_customer → lookup_order → escalate_to_human(priority=HIGH)
  Say: "Escalated to manager. Ticket ESC-XXXX created."

Flow 3 — Legal threat:
  Customer: "I'm going to sue you!"
  Steps: get_customer → escalate_to_human(priority=URGENT)
  Say: "Senior agent notified immediately. Ticket ESC-XXXX."
"""


def emit(event_type: str, **kwargs):
    payload = json.dumps({"type": event_type, **kwargs})
    print(f"data: {payload}", flush=True)


async def run_agent(user_message: str):
    """Run the Agent SDK agentic loop and emit SSE events."""

    # ── Hooks for visibility into tool calls ──────────────────────────────────

    async def pre_tool_hook(input_data, tool_use_id, context):
        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})
        emit("tool_call", name=tool_name, input=tool_input)
        return {}

    async def post_tool_hook(input_data, tool_use_id, context):
        tool_name = input_data.get("tool_name", "")
        tool_response = input_data.get("tool_response", {})

        # Parse tool response (may be JSON string or dict)
        if isinstance(tool_response, str):
            try:
                tool_response = json.loads(tool_response)
            except Exception:
                tool_response = {"raw": tool_response}

        # Emit customer_verified badge when get_customer succeeds
        if tool_name == "get_customer":
            content = tool_response
            if isinstance(content, list) and content:
                try:
                    content = json.loads(content[0].get("text", "{}"))
                except Exception:
                    pass
            if isinstance(content, dict) and content.get("success"):
                emit("customer_verified",
                     name=content.get("name", ""),
                     tier=content.get("tier", ""))

        # Emit hook_blocked badge for high-value refunds
        if tool_name == "process_refund":
            content = tool_response
            if isinstance(content, list) and content:
                try:
                    content = json.loads(content[0].get("text", "{}"))
                except Exception:
                    pass
            if isinstance(content, dict) and content.get("success"):
                amount = content.get("refundAmount", 0)
                if amount > MAX_REFUND_WITHOUT_APPROVAL:
                    emit("hook_blocked",
                         reason=f"Refund ${amount:.2f} exceeds ${MAX_REFUND_WITHOUT_APPROVAL:.0f} automated limit")

        emit("tool_result", name=tool_name, result=tool_response)
        return {}

    # ── Path to the MCP server script ────────────────────────────────────────
    agent_dir = os.path.dirname(os.path.abspath(__file__))
    python_bin = os.path.join(agent_dir, "venv", "bin", "python3")
    mcp_script = os.path.join(agent_dir, "mcp_server.py")

    options = ClaudeAgentOptions(
        system_prompt=SYSTEM_PROMPT,
        permission_mode="bypassPermissions",
        mcp_servers={
            "customer-support": {
                "command": python_bin,
                "args": [mcp_script],
            }
        },
        hooks={
            "PreToolUse": [HookMatcher(matcher=".*", hooks=[pre_tool_hook])],
            "PostToolUse": [HookMatcher(matcher=".*", hooks=[post_tool_hook])],
        },
        max_turns=15,
    )

    try:
        async for message in query(prompt=user_message, options=options):
            if isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, TextBlock):
                        emit("text", text=block.text)
            elif isinstance(message, ResultMessage):
                emit("done")
                return
    except Exception as e:
        error_msg = str(e)
        if "authentication" in error_msg.lower() or "401" in error_msg or "token" in error_msg.lower():
            emit("error", message="Authentication failed. Run 'claude setup-token' and set CLAUDE_CODE_OAUTH_TOKEN in .env")
        else:
            emit("error", message=f"Agent error: {error_msg}")
        return

    emit("done")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        emit("error", message="No message provided.")
        sys.exit(1)

    user_msg = sys.argv[1]

    # Check for OAuth token
    oauth_token = os.environ.get("CLAUDE_CODE_OAUTH_TOKEN", "")
    if not oauth_token:
        emit("error", message="CLAUDE_CODE_OAUTH_TOKEN not set. Run 'claude setup-token' and add it to .env")
        sys.exit(1)

    anyio.run(run_agent, user_msg)
