// src/core/mcpHandlers.ts
import { z } from "zod";
import type { Server as MCPServer } from "@modelcontextprotocol/sdk/server";
import { executeOrchestration } from "./orchestrator.js";

/**
 * Zod schema for the flowkit tool input
 */
const FlowkitSchema = z.object({
  flow_name: z.string().describe("Name of the workflow defined in flow.yaml"),
  context_file_path: z
    .string()
    .optional()
    .describe("Relative path to a file for RAG context injection into first step"),
  target_model: z
    .string()
    .describe("Target LLM model (e.g., 'gemini-2.5-pro', 'claude-3-opus', 'gpt-4')"),
  variables: z
    .record(z.string())
    .optional()
    .describe("Key-value pairs for variable substitution in prompts"),
});

export type FlowkitInput = z.infer<typeof FlowkitSchema>;

/**
 * Registers MCP tool handlers on the provided server instance.
 * - tools/list: advertises the 'flowkit' tool and its input schema
 * - tools/call: executes the flowkit tool when invoked
 */
export function setUpToolHandlers(server: MCPServer) {
  // tools/list handler
  (server as any).setRequestHandler("tools/list", async () => {
    return {
      tools: [
        {
          name: "flowkit",
          description:
            "Executes a multi-step, model-agnostic developer workflow defined in a local flow.yaml file, handling step chaining, validation, and context injection.",
          inputSchema: FlowkitSchema,
        },
      ],
    };
  });

  // tools/call handler
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

  console.log("[FLOWKIT] tool handlers set up");
}
