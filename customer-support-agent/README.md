# Customer Support Resolution Agent

Implements **Scenario 1** from the Claude Certified Architect – Foundations Exam:
> Customer Support Resolution Agent — MCP tools, escalation, agentic loops

## Exam Concepts Demonstrated

| Concept | Where in Code |
|---------|---------------|
| Agentic loop with `stop_reason` handling | `agent.py` → `run_support_agent()` |
| Tool use (`tool_use` / `end_turn`) | `agent.py` lines 95–130 |
| Programmatic prerequisites | `agent.py` — blocks `process_refund` before `get_customer` |
| PostToolUse hook | `agent.py` → `post_tool_use_hook()` |
| Structured errors (`errorCategory`, `isRetryable`) | `tools.py` — all tool implementations |
| Escalation criteria + few-shot examples | `agent.py` → `SYSTEM_PROMPT` |
| Adaptive thinking | `agent.py` → `thinking={"type": "adaptive"}` |

## Setup

```bash
cd customer-support-agent
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY=your-key-here
```

## Run

```bash
# Start Spring Boot backend first (from /backend directory):
mvn spring-boot:run

# Then run the demo (4 pre-canned scenarios):
python demo.py

# Or interactive mode:
python agent.py
```

## Architecture

```
User message
  → agent.py (Claude claude-opus-4-6, adaptive thinking)
      ↔ tools.py (4 MCP tool implementations)
          → Spring Boot backend (http://localhost:8080)
              GET  /api/customers/{id}         ← get_customer
              GET  /api/customers?email=...    ← get_customer (by email)
              GET  /api/orders/{id}            ← lookup_order
              POST /api/orders/{id}/refund     ← process_refund
              POST /api/support/escalate       ← escalate_to_human
```

## Test Customers

| ID | Name | Tier | LTV |
|----|------|------|-----|
| CUST-001 | Alice Johnson | VIP | $3,842 |
| CUST-002 | Bob Martinez | GOLD | $1,547 |
| CUST-003 | Carol White | SILVER | $621 |
| CUST-004 | David Lee | STANDARD | $89 |
| CUST-005 | Emma Davis | VIP | $9,215 |
