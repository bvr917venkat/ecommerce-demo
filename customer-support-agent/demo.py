"""
Demo script — runs 4 pre-canned scenarios to showcase exam concepts.

Run:  python demo.py

Scenarios:
  1. Happy path refund  (verifies: prerequisite check, agentic loop, tool use)
  2. Refund > $500      (verifies: escalation criteria, PostToolUse hook)
  3. No customer found  (verifies: structured error with errorCategory + isRetryable)
  4. Legal threat       (verifies: few-shot escalation, priority = URGENT)
"""

import json
import os
import sys
from agent import run_support_agent

# Pre-seed an order so we have real data to work with.
# In production you'd just use orders from the UI; here we seed via API.
import requests

BACKEND = "http://localhost:8080/api"

def seed_test_order(customer_id: str, total: float) -> str:
    """Place a test order and return the order ID."""
    payload = {
        "items": [{"productId": 1, "quantity": 1}],
        "shippingAddress": {
            "fullName": "Test Customer",
            "street": "123 Main St",
            "city": "Springfield",
            "state": "IL",
            "zip": "62701",
            "country": "USA"
        },
        "cardNumber": "4111111111111234",
        "promoCode": ""
    }
    try:
        resp = requests.post(f"{BACKEND}/orders", json=payload, timeout=5)
        return resp.json().get("orderId", "ORD-UNKNOWN")
    except Exception as e:
        print(f"[seed] Could not place test order: {e}")
        return "ORD-UNKNOWN"


def run_scenario(title: str, message: str, num: int):
    sep = "█" * 70
    print(f"\n{sep}")
    print(f"  SCENARIO {num}: {title}")
    print(sep)
    print(f"\n  Customer says: \"{message}\"\n")
    result = run_support_agent(message, verbose=True)
    print(f"\n  ✅ FINAL AGENT RESPONSE:\n  {result}\n")


def main():
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("ERROR: Set ANTHROPIC_API_KEY environment variable first.")
        sys.exit(1)

    # Seed a real order for Scenarios 1 & 2
    print("Seeding test orders...")
    order_id = seed_test_order("CUST-003", 89.99)
    print(f"  Seeded order: {order_id}")

    # ── Scenario 1: Happy-path refund ─────────────────────────────────────────
    run_scenario(
        title="Happy Path — Standard Refund",
        message=(
            f"Hi, I'm Carol White (carol@example.com). "
            f"My order {order_id} arrived damaged. I'd like a refund please."
        ),
        num=1
    )

    # ── Scenario 2: High-value refund → must escalate ────────────────────────
    # We'll reference a different order; agent should escalate based on amount
    run_scenario(
        title="High-Value Refund → Escalation Required",
        message=(
            "I'm Alice Johnson, customer ID CUST-001. "
            "I need a refund on my recent order — it was $850 and the item never arrived."
        ),
        num=2
    )

    # ── Scenario 3: Customer not found ───────────────────────────────────────
    run_scenario(
        title="Customer Not Found — Structured Error",
        message="My customer ID is CUST-999 and I want to return my order.",
        num=3
    )

    # ── Scenario 4: Legal threat → urgent escalation ─────────────────────────
    run_scenario(
        title="Legal Threat → Urgent Escalation",
        message=(
            "I'm Bob Martinez, CUST-002. This is completely unacceptable. "
            "My order still hasn't arrived and I'm going to sue you if this "
            "isn't resolved TODAY."
        ),
        num=4
    )

    print("\n" + "█"*70)
    print("  All scenarios complete.")
    print("█"*70)


if __name__ == "__main__":
    main()
