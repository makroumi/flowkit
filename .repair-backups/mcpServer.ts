// src/server/mcpServer.ts
import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server";
import { setUpToolHandlers } from "../core/mcpHandlers.js";

async function start() {
  const server = new Server(
    {
      name: "flowkit",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool handlers (tools/list, tools/call)
  setUpToolHandlers(server);

  // Connect stdio transport for MCP runtime
  const transport = new StdioServerTransport();

  try {
    await server.connect(transport);
    console.log("[FLOWKIT] MCP server started and connected to stdio transport");
  } catch (err) {
    console.error("[FLOWKIT] Failed to start MCP server:", err);
    process.exit(1);
  }
}

start().catch((err) => {
  console.error("[FLOWKIT] Unhandled error during startup:", err);
  process.exit(1);
});
