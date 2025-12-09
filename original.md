here;s the original code, just make sure the name is FlowKit
###############

1. Extension Manifest (gemini-extension.json)
json{
  "name": "@acme-flow/orchestrator",
  "version": "1.0.0",
  "description": "Model-agnostic workflow orchestration engine for multi-step AI development tasks with local RAG and validation hooks",
  "author": "ACME Flow Team",
  "license": "MIT",
  "engines": {
    "gemini-cli": ">=1.0.0"
  },
  "mcpServers": {
    "flow-orchestrator": {
      "command": "node",
      "args": [
        "${extensionPath}/dist/server.js"
      ],
      "cwd": "${workspacePath}",
      "env": {
        "NODE_ENV": "production",
        "WORKSPACE_ROOT": "${workspacePath}",
        "EXTENSION_PATH": "${extensionPath}"
      }
    }
  },
  "activationEvents": [
    "onCommand:acme-flow.orchestrate",
    "onFileExists:flow.yaml"
  ],
  "contributes": {
    "commands": [
      {
        "command": "acme-flow.orchestrate",
        "title": "ACME Flow: Run Workflow",
        "description": "Execute a multi-step workflow from flow.yaml"
      }
    ],
    "configuration": {
      "title": "ACME Flow Orchestrator",
      "properties": {
        "acmeFlow.defaultModel": {
          "type": "string",
          "default": "gemini-2.5-pro",
          "description": "Default LLM model for workflow execution"
        },
        "acmeFlow.flowFilePath": {
          "type": "string",
          "default": "./flow.yaml",
          "description": "Path to the workflow definition file"
        },
        "acmeFlow.enableValidation": {
          "type": "boolean",
          "default": true,
          "description": "Enable validation hooks between workflow steps"
        }
      }
    }
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "yaml": "^2.3.4",
    "zod": "^3.22.4"
  },
  "keywords": [
    "mcp",
    "workflow",
    "automation",
    "orchestration",
    "model-agnostic",
    "rag"
  ]
}
2. MCP Server Tool Definition (TypeScript)
typescriptimport { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Tool Input Schema using Zod
const OrchestrateFlowSchema = z.object({
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

type OrchestrateFlowInput = z.infer<typeof OrchestrateFlowSchema>;

// MCP Server Setup
const server = new Server(
  {
    name: "flow-orchestrator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool Registration
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "orchestrate_flow",
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

// Tool Execution Handler
server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "orchestrate_flow") {
    try {
      const args = OrchestrateFlowSchema.parse(request.params.arguments);
      const result = await executeOrchestration(args);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
  
  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start Server
const transport = new StdioServerTransport();
await server.connect(transport);
3. Core Orchestration Logic (Conceptual Pseudocode)
typescriptimport * as fs from "fs/promises";
import * as path from "path";
import * as yaml from "yaml";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface FlowDefinition {
  name: string;
  description?: string;
  steps: FlowStep[];
  validation?: ValidationConfig;
}

interface FlowStep {
  id: string;
  name: string;
  prompt: string;
  use_previous_output: boolean;
  validation?: StepValidation;
  max_tokens?: number;
  temperature?: number;
}

interface StepValidation {
  type: "regex" | "length" | "contains" | "external_command";
  rule: string | number;
  error_message?: string;
  continue_on_failure?: boolean;
}

interface ValidationConfig {
  enabled: boolean;
  halt_on_failure: boolean;
}

interface ExecutionResult {
  flow_name: string;
  target_model: string;
  steps_executed: StepResult[];
  total_duration_ms: number;
  success: boolean;
  final_output?: string;
}

interface StepResult {
  step_id: string;
  step_name: string;
  input_prompt: string;
  output: string;
  validation_passed: boolean;
  validation_error?: string;
  duration_ms: number;
  tokens_used?: number;
}

// ============================================================================
// MODEL ADAPTER INTERFACE (Strategy Pattern)
// ============================================================================

interface LLMAdapter {
  generateCompletion(prompt: string, options: GenerationOptions): Promise<LLMResponse>;
  getModelName(): string;
}

interface GenerationOptions {
  max_tokens?: number;
  temperature?: number;
  system_prompt?: string;
}

interface LLMResponse {
  content: string;
  tokens_used: number;
  model: string;
}

// ============================================================================
// CONCRETE ADAPTER IMPLEMENTATIONS
// ============================================================================

class GeminiAdapter implements LLMAdapter {
  private apiKey: string;
  private modelId: string;

  constructor(apiKey: string, modelId: string = "gemini-2.5-pro") {
    this.apiKey = apiKey;
    this.modelId = modelId;
  }

  async generateCompletion(
    prompt: string,
    options: GenerationOptions
  ): Promise<LLMResponse> {
    // PSEUDOCODE: Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${this.modelId}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": this.apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: options.max_tokens || 2048,
            temperature: options.temperature || 0.7,
          },
        }),
      }
    );

    const data = await response.json();
    return {
      content: data.candidates[0].content.parts[0].text,
      tokens_used: data.usageMetadata.totalTokenCount,
      model: this.modelId,
    };
  }

  getModelName(): string {
    return this.modelId;
  }
}

class ClaudeAdapter implements LLMAdapter {
  private apiKey: string;
  private modelId: string;

  constructor(apiKey: string, modelId: string = "claude-3-opus-20240229") {
    this.apiKey = apiKey;
    this.modelId = modelId;
  }

  async generateCompletion(
    prompt: string,
    options: GenerationOptions
  ): Promise<LLMResponse> {
    // PSEUDOCODE: Call Anthropic Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.modelId,
        max_tokens: options.max_tokens || 2048,
        temperature: options.temperature || 0.7,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    return {
      content: data.content[0].text,
      tokens_used: data.usage.input_tokens + data.usage.output_tokens,
      model: this.modelId,
    };
  }

  getModelName(): string {
    return this.modelId;
  }
}

class OpenAIAdapter implements LLMAdapter {
  private apiKey: string;
  private modelId: string;

  constructor(apiKey: string, modelId: string = "gpt-4") {
    this.apiKey = apiKey;
    this.modelId = modelId;
  }

  async generateCompletion(
    prompt: string,
    options: GenerationOptions
  ): Promise<LLMResponse> {
    // PSEUDOCODE: Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelId,
        messages: [{ role: "user", content: prompt }],
        max_tokens: options.max_tokens || 2048,
        temperature: options.temperature || 0.7,
      }),
    });

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      tokens_used: data.usage.total_tokens,
      model: this.modelId,
    };
  }

  getModelName(): string {
    return this.modelId;
  }
}

// ============================================================================
// ADAPTER FACTORY
// ============================================================================

function createLLMAdapter(targetModel: string): LLMAdapter {
  const apiKey = getAPIKeyForModel(targetModel);

  if (targetModel.startsWith("gemini")) {
    return new GeminiAdapter(apiKey, targetModel);
  } else if (targetModel.startsWith("claude")) {
    return new ClaudeAdapter(apiKey, targetModel);
  } else if (targetModel.startsWith("gpt")) {
    return new OpenAIAdapter(apiKey, targetModel);
  } else {
    throw new Error(`Unsupported model: ${targetModel}`);
  }
}

function getAPIKeyForModel(model: string): string {
  // PSEUDOCODE: Retrieve API keys from environment or config
  if (model.startsWith("gemini")) {
    return process.env.GOOGLE_API_KEY || "";
  } else if (model.startsWith("claude")) {
    return process.env.ANTHROPIC_API_KEY || "";
  } else if (model.startsWith("gpt")) {
    return process.env.OPENAI_API_KEY || "";
  }
  throw new Error(`No API key found for model: ${model}`);
}

// ============================================================================
// VALIDATION ENGINE
// ============================================================================

async function validateStepOutput(
  output: string,
  validation: StepValidation
): Promise<{ passed: boolean; error?: string }> {
  try {
    switch (validation.type) {
      case "regex":
        const regex = new RegExp(validation.rule as string);
        if (!regex.test(output)) {
          return {
            passed: false,
            error: validation.error_message || `Output does not match pattern: ${validation.rule}`,
          };
        }
        break;

      case "length":
        const minLength = validation.rule as number;
        if (output.length < minLength) {
          return {
            passed: false,
            error:
              validation.error_message ||
              `Output length ${output.length} is below minimum ${minLength}`,
          };
        }
        break;

      case "contains":
        const requiredText = validation.rule as string;
        if (!output.includes(requiredText)) {
          return {
            passed: false,
            error:
              validation.error_message ||
              `Output does not contain required text: "${requiredText}"`,
          };
        }
        break;

      case "external_command":
        // PSEUDOCODE: Execute external validation command
        const command = validation.rule as string;
        const { execSync } = require("child_process");
        
        try {
          // Pass output via stdin to the validation command
          execSync(command, { input: output, encoding: "utf-8" });
          // If command exits with 0, validation passed
        } catch (error) {
          return {
            passed: false,
            error: validation.error_message || `External validation failed: ${error}`,
          };
        }
        break;

      default:
        throw new Error(`Unknown validation type: ${validation.type}`);
    }

    return { passed: true };
  } catch (error) {
    return {
      passed: false,
      error: `Validation error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ============================================================================
// MAIN ORCHESTRATION FUNCTION
// ============================================================================

async function executeOrchestration(
  input: OrchestrateFlowInput
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const workspaceRoot = process.env.WORKSPACE_ROOT || process.cwd();
  
  console.log(`[ORCHESTRATOR] Starting flow: ${input.flow_name}`);
  console.log(`[ORCHESTRATOR] Target model: ${input.target_model}`);
  console.log(`[ORCHESTRATOR] Workspace: ${workspaceRoot}`);

  // STEP 1: Parse flow.yaml
  const flowFilePath = path.join(workspaceRoot, "flow.yaml");
  const flowFileContent = await fs.readFile(flowFilePath, "utf-8");
  const flowDefinitions = yaml.parse(flowFileContent) as { flows: FlowDefinition[] };
  
  const flow = flowDefinitions.flows.find((f) => f.name === input.flow_name);
  if (!flow) {
    throw new Error(`Flow '${input.flow_name}' not found in flow.yaml`);
  }

  console.log(`[ORCHESTRATOR] Loaded flow: ${flow.name} (${flow.steps.length} steps)`);

  // STEP 2: Initialize Model Adapter (Strategy Pattern)
  const adapter = createLLMAdapter(input.target_model);
  console.log(`[ORCHESTRATOR] Initialized adapter for: ${adapter.getModelName()}`);

  // STEP 3: RAG Context Injection (if provided)
  let ragContext = "";
  if (input.context_file_path) {
    const contextPath = path.join(workspaceRoot, input.context_file_path);
    console.log(`[ORCHESTRATOR] Loading RAG context from: ${contextPath}`);
    
    try {
      ragContext = await fs.readFile(contextPath, "utf-8");
      console.log(`[ORCHESTRATOR] Loaded ${ragContext.length} characters of context`);
    } catch (error) {
      console.warn(`[ORCHESTRATOR] Warning: Could not load context file: ${error}`);
    }
  }

  // STEP 4: Execute Flow Steps
  const stepResults: StepResult[] = [];
  let previousOutput = "";

  for (let i = 0; i < flow.steps.length; i++) {
    const step = flow.steps[i];
    const stepStartTime = Date.now();
    
    console.log(`\n[ORCHESTRATOR] Executing Step ${i + 1}/${flow.steps.length}: ${step.name}`);

    // Build the prompt with variable substitution
    let prompt = step.prompt;
    
    // Substitute variables
    if (input.variables) {
      for (const [key, value] of Object.entries(input.variables)) {
        prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
      }
    }

    // Inject RAG context into FIRST step only
    if (i === 0 && ragContext) {
      prompt = `# Context from ${input.context_file_path}:\n\`\`\`\n${ragContext}\n\`\`\`\n\n${prompt}`;
      console.log(`[ORCHESTRATOR] Injected RAG context into first step`);
    }

    // Chain previous output if configured
    if (step.use_previous_output && previousOutput) {
      prompt = `# Output from previous step:\n${previousOutput}\n\n${prompt}`;
      console.log(`[ORCHESTRATOR] Chained previous step output`);
    }

    // Generate completion
    console.log(`[ORCHESTRATOR] Calling LLM...`);
    const response = await adapter.generateCompletion(prompt, {
      max_tokens: step.max_tokens,
      temperature: step.temperature,
    });

    console.log(`[ORCHESTRATOR] Received response (${response.tokens_used} tokens)`);

    // STEP 5: Validation Hook (Critical Feature)
    let validationPassed = true;
    let validationError: string | undefined;

    if (step.validation && (flow.validation?.enabled ?? true)) {
      console.log(`[ORCHESTRATOR] Running validation: ${step.validation.type}`);
      
      const validationResult = await validateStepOutput(
        response.content,
        step.validation
      );

      validationPassed = validationResult.passed;
      validationError = validationResult.error;

      if (!validationPassed) {
        console.error(`[ORCHESTRATOR] ❌ Validation failed: ${validationError}`);
        
        // Halt if configured
        if (flow.validation?.halt_on_failure && !step.validation.continue_on_failure) {
          throw new Error(`Step ${step.id} validation failed: ${validationError}`);
        } else {
          console.warn(`[ORCHESTRATOR] ⚠️  Continuing despite validation failure`);
        }
      } else {
        console.log(`[ORCHESTRATOR] ✅ Validation passed`);
      }
    }

    // Record step result
    const stepDuration = Date.now() - stepStartTime;
    stepResults.push({
      step_id: step.id,
      step_name: step.name,
      input_prompt: prompt,
      output: response.content,
      validation_passed: validationPassed,
      validation_error: validationError,
      duration_ms: stepDuration,
      tokens_used: response.tokens_used,
    });

    // Update context for next step
    previousOutput = response.content;
  }

  const totalDuration = Date.now() - startTime;
  
  console.log(`\n[ORCHESTRATOR] Flow completed in ${totalDuration}ms`);
  console.log(
    `[ORCHESTRATOR] Total tokens used: ${stepResults.reduce((sum, r) => sum + (r.tokens_used || 0), 0)}`
  );

  return {
    flow_name: input.flow_name,
    target_model: input.target_model,
    steps_executed: stepResults,
    total_duration_ms: totalDuration,
    success: stepResults.every((r) => r.validation_passed),
    final_output: stepResults[stepResults.length - 1]?.output,
  };
}
4. Example flow.yaml File
yamlflows:
  - name: "code-review-and-refactor"
    description: "Analyzes code, identifies issues, and generates refactored version"
    validation:
      enabled: true
      halt_on_failure: true
    steps:
      - id: "step1"
        name: "Analyze Code Quality"
        prompt: |
          You are a senior code reviewer. Analyze the provided code and identify:
          1. Code smells and anti-patterns
          2. Performance bottlenecks
          3. Security vulnerabilities
          4. Maintainability issues
          
          Provide a structured report with specific line numbers.
        use_previous_output: false
        max_tokens: 2048
        temperature: 0.3
        validation:
          type: "contains"
          rule: "### Issues Found"
          error_message: "Analysis must include '### Issues Found' section"

      - id: "step2"
        name: "Generate Refactored Code"
        prompt: |
          Based on the code review above, generate a fully refactored version of the code that:
          - Fixes all identified issues
          - Follows best practices for {{language}}
          - Includes inline comments explaining changes
          
          Output ONLY the refactored code in a single code block.
        use_previous_output: true
        max_tokens: 4096
        temperature: 0.2
        validation:
          type: "regex"
          rule: "^```[a-z]+\\n[\\s\\S]+\\n```$"
          error_message: "Output must be a valid code block"

      - id: "step3"
        name: "Generate Test Cases"
        prompt: |
          Generate comprehensive unit tests for the refactored code above.
          Use the {{test_framework}} framework.
          Cover edge cases and error handling.
        use_previous_output: true
        max_tokens: 3072
        temperature: 0.4
        validation:
          type: "external_command"
          rule: "npx eslint --stdin --stdin-filename test.js"
          error_message: "Generated tests contain linting errors"
          continue_on_failure: true

  - name: "api-documentation-generator"
    description: "Generates OpenAPI specs from code"
    steps:
      - id: "extract"
        name: "Extract API Endpoints"
        prompt: "Analyze the code and list all HTTP endpoints with methods and parameters."
        use_previous_output: false
        
      - id: "generate"
        name: "Create OpenAPI Spec"
        prompt: "Convert the endpoint list above into a valid OpenAPI 3.0 specification in YAML format."
        use_previous_output: true
        validation:
          type: "external_command"
          rule: "npx @apidevtools/swagger-cli validate /dev/stdin"
