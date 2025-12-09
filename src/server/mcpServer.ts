/**
 * MCP Server Entry Point
 * Lightweight development server that mimics MCP behavior
 * In production, replace with real MCP SDK server using StdioServerTransport
 */

import "dotenv/config";
import { setUpToolHandlers } from "../core/mcpHandlers.js";

/**
 * Minimal server implementation for development
 * Provides tool handler registration without MCP SDK dependencies
 */
class DevServer {
  private handlers = new Map<string, Function>();

  /**
   * Register a request handler for a given method
   * @param name - Handler name (e.g., "tools/list", "tools/call")
   * @param fn - Async function to handle the request
   */
  setRequestHandler(name: string, fn: Function): void {
    this.handlers.set(name, fn);
    console.log(`[FlowKit] registered handler: ${name}`);
  }

  /**
   * Invoke a registered handler
   * @param name - Handler name
   * @param payload - Request payload
   * @returns Handler result
   * @throws Error if handler not found
   */
  async call(name: string, payload: any): Promise<any> {
    const h = this.handlers.get(name);
    if (!h) throw new Error(`handler ${name} not found`);
    return h(payload);
  }
}

/**
 * Start the development server
 * Registers handlers and keeps the process alive for testing
 */
async function start(): Promise<void> {
  try {
    const server = new DevServer();
    setUpToolHandlers(server as any);
    console.log(
      "[FlowKit] Dev MCP server ready. Use server.call('tools/list') or server.call('tools/call', {tool:'flowkit', input:{...}}) to test."
    );
    process.stdin.resume();
  } catch (err) {
    console.error("[FlowKit] startup error:", err);
    process.exit(1);
  }
}

start().catch((err) => {
  console.error("[FlowKit] startup error:", err);
  process.exit(1);
});
