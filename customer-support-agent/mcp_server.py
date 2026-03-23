"""
MCP Server for Customer Support Agent.
Exposes 4 tools via stdio that call the Spring Boot backend.

Started automatically by the Agent SDK as a subprocess.
"""

import asyncio
import json
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types

from tools import execute_tool, TOOL_DEFINITIONS

app = Server("customer-support-tools")


@app.list_tools()
async def list_tools() -> list[types.Tool]:
    result = []
    for td in TOOL_DEFINITIONS:
        result.append(types.Tool(
            name=td["name"],
            description=td["description"],
            inputSchema=td["input_schema"],
        ))
    return result


@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    result = execute_tool(name, arguments)
    return [types.TextContent(type="text", text=json.dumps(result))]


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
