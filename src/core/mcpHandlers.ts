/**
 * MCP Handler Setup Module
 * Registers FlowKit tool handlers for the MCP server
 * Provides tools/list and tools/call RPC methods
 */

import { z } from "zod";
import type { Server as MCPServer } from "@modelcontextprotocol/sdk/server";
import { executeOrchestration } from "./orchestrator.js";

/**
 * Zod schema for validating flowkit tool input
 * Ensures type safety and provides runtime validation
 */
const FlowkitSchema = z.object({
  flow_name: z.string().describe("Name of the workflow defined in flow.yaml"),
  context_file_path: z
    .string()
    .optional()
    .describe(
      "Relative path to a file for RAG context injection into first step"
    ),
  target_model: z
    .string()
    .describe(
      "Target LLM model (e.g., 'gemini-2.5-pro', 'claude-3-opus', 'gpt-4')"
    ),
  variables: z
    .record(z.string())
    .optional()
    .describe("Key-value pairs for variable substitution in prompts"),
});

/** Type-safe input parameters inferred from Zod schema */
export type FlowkitInput = z.infer<typeof FlowkitSchema>;

/**
 * Registers MCP tool handlers on the provided server instance
 * Sets up two RPC methods:
 * - tools/list: Advertises available tools and their schemas
 * - tools/call: Executes tools with validated input
 * @param server - MCP server instance (accepts any type for flexibility)
 */
export function setUpToolHandlers(server: any) {
  // tools/list handler - advertise available tools
  (server as any).setRequestHandler("tools/list", async () => {
    return {
      tools: [
        {
          name: "flowkit",
          description:
            "Executes a multi-step, model-agnostic developer workflow defined in a local flow.yaml file, handling step chaining, validation, and context injection.",
          inputSchema: {
            type: "object",
            properties: {
              flow_name: {
                type: "string",
                description: "Name of the workflow defined in flow.yaml",
              },
              context_file_path: {
                type: "string",
                description:
                  "Relative path to a file for RAG context injection into first step",
              },
              target_model: {
                type: "string",
                description:
                  "Target LLM model (e.g., 'gemini-2.5-pro', 'claude-3-opus', 'gpt-4')",
              },
              variables: {
                type: "object",
                description: "Key-value pairs for variable substitution in prompts",
                additionalProperties: { type: "string" },
              },
            },
            required: ["flow_name", "target_model"],
          },
        },
      ],
    };
  });

  // tools/call handler - execute tools with validated input
  (server as any).setRequestHandler("tools/call", async (request: any) => {
    try {
      if (!request || request.tool !== "flowkit") {
        return { error: "unsupported tool" };
      }
      // Validate input shape (best-effort)
      const input = request.input ?? {};
      const parsed = FlowkitSchema.safeParse(input);
      if (!parsed.success) {
        return { error: "invalid input", details: parsed.error.format() };
      }

      const result = await executeOrchestration(parsed.data);
      return { result };
    } catch (err: any) {
      return { error: String(err?.message ?? err) };
    }
  });

  console.log("[FlowKit] tool handlers set up");
}
