"""
Customer Support Resolution Agent
==================================
Demonstrates for the Claude Certified Architect  Foundations exam:

  Domain 2  Agentic loop with stop_reason handling
  Domain 3  Tool use with programmatic prerequisites
  Domain 4  Hooks for business rule enforcement
  Domain 5  Escalation criteria with structured error responses

Architecture:
  User message
    → Claude (claude-opus-4-6, adaptive thinking)
       ↔ tools: get_customer / lookup_order / process_refund / escalate_to_human
          → Spring Boot backend (http://localhost:8080)
"""

import json
import os
from typing import Optional

import anthropic

from tools import TOOL_DEFINITIONS, execute_tool

# ── Constants ─────────────────────────────────────────────────────────────────

MAX_REFUND_WITHOUT_APPROVAL = 500.00   # PostToolUse hook blocks above this
MAX_TURNS = 15                          # Safety limit on the agentic loop


# ── System prompt with few-shot escalation examples ──────────────────────────

SYSTEM_PROMPT = """You are a helpful customer support agent for ShopDemo, an eCommerce store.
You have access to tools to look up customers, view orders, process refunds, and escalate issues.

## Rules (MUST follow)
1. ALWAYS call get_customer first to verify the customer's identity before any account action.
2. NEVER process a refund without first successfully verifying the customer.
3. Refunds over $500 MUST be escalated — never attempt to process them directly.
4. Always confirm the refund amount with the customer before processing.
5. Be empathetic but concise. Acknowledge the issue, then act.

## Escalation criteria (escalate_to_human when ANY of these apply)
- Refund amount > $500
- Customer mentions lawyer, lawsuit, or legal action
- Fraud suspected (customer unrecognized charges, account compromise)
- Customer explicitly asks to speak to a person
- Tool returns an unresolvable error after one retry

## Structured error handling
When a tool returns isRetryable: true, attempt once more before escalating.
When a tool returns isRetryable: false, explain the situation and suggest next steps.

## Few-shot escalation examples

Example 1 — High-value refund:
  Customer: "My $750 laptop order ORD-1234 arrived broken."
  Agent action: look up customer → look up order → escalate (amount > $500, priority HIGH)
  Agent says: "I've created escalation ticket ESC-XXXX. A manager will contact you within 2 hours."

Example 2 — Legal threat:
  Customer: "I'll sue you if this isn't resolved."
  Agent action: escalate immediately (priority URGENT, reason: legal threat)
  Agent says: "I understand your frustration. I've escalated this to our senior team immediately."

Example 3 — Standard refund:
  Customer: "My order ORD-1001 arrived damaged."
  Agent action: get_customer → lookup_order → confirm amount → process_refund
  Agent says: "I've processed your refund of $XX.XX. You'll see it in 3-5 business days."
"""


# ── PostToolUse Hook ──────────────────────────────────────────────────────────

def post_tool_use_hook(tool_name: str, tool_input: dict, tool_result: dict) -> Optional[str]:
    """
    Business rule enforcement after each tool call.
    Returns an override message if the action should be blocked, else None.

    This hook implements Domain 4 from the exam guide:
    "PostToolUse hooks for business rule enforcement"
    """
    if tool_name == "process_refund" and tool_result.get("success"):
        amount = tool_result.get("refundAmount", 0)
        if amount > MAX_REFUND_WITHOUT_APPROVAL:
            # This shouldn't happen if Claude follows instructions, but
            # the hook acts as a safety net.
            print(f"\n[HOOK] Blocked refund of ${amount:.2f} — exceeds ${MAX_REFUND_WITHOUT_APPROVAL}")
            return (
                f"BLOCKED BY BUSINESS RULE: Refund of ${amount:.2f} exceeds the "
                f"${MAX_REFUND_WITHOUT_APPROVAL:.0f} limit for automated processing. "
                "Escalate to a human agent instead."
            )

    if tool_name == "get_customer" and tool_result.get("success"):
        # Track that customer has been verified in this session
        print(f"\n[HOOK] Customer verified: {tool_result.get('name')} ({tool_result.get('tier')} tier)")

    return None  # No override — proceed normally


# ── Core agentic loop ─────────────────────────────────────────────────────────

def run_support_agent(user_message: str, verbose: bool = True) -> str:
    """
    Runs the customer support agentic loop.

    stop_reason handling:
      "tool_use"  → execute tools, feed results back, continue loop
      "end_turn"  → Claude is done, return final text response
      "max_tokens"→ response was cut off, treat as error
    """
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    messages = [{"role": "user", "content": user_message}]

    # Track whether customer has been verified (programmatic prerequisite)
    customer_verified = False
    turn = 0

    while turn < MAX_TURNS:
        turn += 1

        if verbose:
            print(f"\n{'─'*60}")
            print(f"[Turn {turn}] Sending {len(messages)} message(s) to Claude...")

        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=4096,
            thinking={"type": "adaptive"},   # adaptive thinking for complex reasoning
            system=SYSTEM_PROMPT,
            tools=TOOL_DEFINITIONS,
            messages=messages,
        )

        stop_reason = response.stop_reason

        if verbose:
            print(f"[Turn {turn}] stop_reason = {stop_reason}")

        # ── Extract text blocks for display ──────────────────────────────────
        text_blocks = [b.text for b in response.content if b.type == "text"]
        if text_blocks and verbose:
            print(f"\n[Claude] {' '.join(text_blocks)}")

        # ── Natural completion ────────────────────────────────────────────────
        if stop_reason == "end_turn":
            final_text = " ".join(text_blocks) if text_blocks else "(no text response)"
            return final_text

        # ── Claude wants to use tools ─────────────────────────────────────────
        if stop_reason == "tool_use":
            tool_use_blocks = [b for b in response.content if b.type == "tool_use"]

            # Append assistant's response (including tool_use blocks)
            messages.append({"role": "assistant", "content": response.content})

            tool_results = []

            for tool_block in tool_use_blocks:
                tool_name = tool_block.name
                tool_input = tool_block.input

                if verbose:
                    print(f"\n[Tool call] {tool_name}({json.dumps(tool_input, indent=2)})")

                # ── Programmatic prerequisite check ──────────────────────────
                # Block process_refund if customer not yet verified
                if tool_name == "process_refund" and not customer_verified:
                    result = {
                        "success": False,
                        "errorCategory": "PREREQUISITE_NOT_MET",
                        "isRetryable": False,
                        "message": (
                            "Cannot process refund: customer identity has not been verified. "
                            "Call get_customer first."
                        )
                    }
                    if verbose:
                        print(f"[Prerequisite BLOCKED] process_refund called before get_customer")
                else:
                    # Execute the tool
                    result = execute_tool(tool_name, tool_input)

                    # Update verification state
                    if tool_name == "get_customer" and result.get("success"):
                        customer_verified = True

                if verbose:
                    print(f"[Tool result] {json.dumps(result, indent=2)}")

                # ── PostToolUse hook ──────────────────────────────────────────
                hook_override = post_tool_use_hook(tool_name, tool_input, result)
                if hook_override:
                    result = {
                        "success": False,
                        "errorCategory": "BUSINESS_RULE_VIOLATION",
                        "isRetryable": False,
                        "message": hook_override
                    }

                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": tool_block.id,
                    "content": json.dumps(result)
                })

            # Feed all results back as user message
            messages.append({"role": "user", "content": tool_results})
            continue  # next iteration

        # ── Unexpected stop reasons ───────────────────────────────────────────
        if stop_reason == "max_tokens":
            return "Error: Response was cut off. Please try a shorter query."

        return f"Unexpected stop reason: {stop_reason}"

    return "Error: Maximum turns reached without resolution. Escalating to human agent."


# ── CLI entry point ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    print("="*60)
    print("  Customer Support Resolution Agent")
    print("  (Type 'quit' to exit)")
    print("="*60)

    while True:
        print()
        user_input = input("Customer: ").strip()
        if user_input.lower() in ("quit", "exit", "q"):
            break
        if not user_input:
            continue

        print()
        result = run_support_agent(user_input, verbose=True)
        print(f"\n{'='*60}")
        print(f"[FINAL RESPONSE]\n{result}")
        print("="*60)
