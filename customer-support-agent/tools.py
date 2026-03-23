"""
MCP tool definitions + implementations for the Customer Support Agent.
Each function calls the Spring Boot backend REST API.
"""

import requests
from typing import Any

BACKEND_URL = "http://localhost:8080/api"


# ── Tool schema definitions (passed to Claude) ────────────────────────────────

TOOL_DEFINITIONS = [
    {
        "name": "get_customer",
        "description": (
            "Look up a customer by their customer ID or email address. "
            "ALWAYS call this first to verify the customer's identity before "
            "taking any actions on their account."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {
                    "type": "string",
                    "description": "Customer ID in format CUST-XXX (e.g. CUST-001). Provide this OR email."
                },
                "email": {
                    "type": "string",
                    "description": "Customer email address. Provide this OR customer_id."
                }
            }
        }
    },
    {
        "name": "lookup_order",
        "description": (
            "Retrieve full details of an order including items, pricing, status, "
            "and shipping address. Use this to investigate order issues."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "string",
                    "description": "Order ID in format ORD-XXXX (e.g. ORD-1001)"
                }
            },
            "required": ["order_id"]
        }
    },
    {
        "name": "process_refund",
        "description": (
            "Process a full refund for an order. "
            "Prerequisites: customer must be verified via get_customer first. "
            "Only eligible for orders with status CONFIRMED or SHIPPED. "
            "Refunds over $500 require manager approval — escalate instead."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "string",
                    "description": "Order ID to refund"
                },
                "reason": {
                    "type": "string",
                    "description": "Reason for the refund (e.g. 'damaged item', 'wrong item shipped')"
                },
                "customer_id": {
                    "type": "string",
                    "description": "Customer ID — must match the order's customer"
                }
            },
            "required": ["order_id", "reason", "customer_id"]
        }
    },
    {
        "name": "escalate_to_human",
        "description": (
            "Escalate the issue to a human support agent and create a ticket. "
            "Use when: (1) refund amount > $500, (2) customer is threatening legal action, "
            "(3) issue cannot be resolved with available tools, "
            "(4) customer has requested to speak to a person, "
            "(5) fraud suspected."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "customer_id": {
                    "type": "string",
                    "description": "Customer ID"
                },
                "order_id": {
                    "type": "string",
                    "description": "Related order ID (if applicable)"
                },
                "reason": {
                    "type": "string",
                    "description": "Detailed reason for escalation"
                },
                "priority": {
                    "type": "string",
                    "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"],
                    "description": "Priority level for the human agent"
                }
            },
            "required": ["customer_id", "reason", "priority"]
        }
    }
]


# ── Tool implementations ───────────────────────────────────────────────────────

def get_customer(customer_id: str = None, email: str = None) -> dict:
    """Call backend to look up a customer."""
    try:
        if customer_id:
            resp = requests.get(f"{BACKEND_URL}/customers/{customer_id}", timeout=5)
        elif email:
            resp = requests.get(f"{BACKEND_URL}/customers", params={"email": email}, timeout=5)
        else:
            return {
                "success": False,
                "errorCategory": "INVALID_INPUT",
                "isRetryable": False,
                "message": "Either customer_id or email is required."
            }

        if resp.status_code == 404:
            return {
                "success": False,
                "errorCategory": "CUSTOMER_NOT_FOUND",
                "isRetryable": False,
                "message": f"No customer found with {'ID ' + customer_id if customer_id else 'email ' + email}."
            }

        data = resp.json()
        return {
            "success": True,
            "customerId": data["customerId"],
            "name": data["name"],
            "email": data["email"],
            "phone": data["phone"],
            "tier": data["tier"],
            "since": data["since"],
            "totalOrders": data["totalOrders"],
            "lifetimeValue": data["lifetimeValue"]
        }
    except requests.RequestException as e:
        return {
            "success": False,
            "errorCategory": "SERVICE_UNAVAILABLE",
            "isRetryable": True,
            "message": f"Backend unavailable: {str(e)}"
        }


def lookup_order(order_id: str) -> dict:
    """Call backend to retrieve order details."""
    try:
        resp = requests.get(f"{BACKEND_URL}/orders/{order_id}", timeout=5)
        if resp.status_code == 404:
            return {
                "success": False,
                "errorCategory": "ORDER_NOT_FOUND",
                "isRetryable": False,
                "message": f"Order {order_id} not found."
            }
        data = resp.json()
        return {"success": True, **data}
    except requests.RequestException as e:
        return {
            "success": False,
            "errorCategory": "SERVICE_UNAVAILABLE",
            "isRetryable": True,
            "message": f"Backend unavailable: {str(e)}"
        }


def process_refund(order_id: str, reason: str, customer_id: str) -> dict:
    """Call backend to process a refund."""
    try:
        resp = requests.post(
            f"{BACKEND_URL}/orders/{order_id}/refund",
            json={"reason": reason, "agentId": "CLAUDE-AGENT"},
            timeout=5
        )
        data = resp.json()
        return {
            "success": data.get("success", False),
            "refundId": data.get("refundId"),
            "refundAmount": data.get("refundAmount"),
            "orderId": data.get("orderId"),
            "message": data.get("message"),
            "errorCategory": data.get("errorCategory"),
            "isRetryable": data.get("retryable", False)
        }
    except requests.RequestException as e:
        return {
            "success": False,
            "errorCategory": "SERVICE_UNAVAILABLE",
            "isRetryable": True,
            "message": f"Backend unavailable: {str(e)}"
        }


def escalate_to_human(customer_id: str, reason: str, priority: str,
                      order_id: str = None) -> dict:
    """Log escalation to the backend and return ticket info."""
    try:
        resp = requests.post(
            f"{BACKEND_URL}/support/escalate",
            json={
                "customerId": customer_id,
                "orderId": order_id or "",
                "reason": reason,
                "priority": priority
            },
            timeout=5
        )
        import json as _json
        data = _json.loads(resp.text)
        return {
            "success": True,
            "ticketId": data.get("ticketId"),
            "message": data.get("message")
        }
    except requests.RequestException as e:
        return {
            "success": False,
            "errorCategory": "SERVICE_UNAVAILABLE",
            "isRetryable": True,
            "message": f"Backend unavailable: {str(e)}"
        }


# ── Router: dispatch tool name → implementation ───────────────────────────────

def execute_tool(tool_name: str, tool_input: dict) -> Any:
    """Route a tool call to its implementation."""
    if tool_name == "get_customer":
        return get_customer(**tool_input)
    elif tool_name == "lookup_order":
        return lookup_order(**tool_input)
    elif tool_name == "process_refund":
        return process_refund(**tool_input)
    elif tool_name == "escalate_to_human":
        return escalate_to_human(**tool_input)
    else:
        return {"success": False, "message": f"Unknown tool: {tool_name}"}
