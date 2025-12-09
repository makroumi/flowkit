#!/usr/bin/env node

/**
 * FlowKit Verification Test
 * Tests core functionality without requiring real API keys
 */

import { createLLMAdapter } from "./dist/adapters/adapterFactory.js";
import { validateStepOutput } from "./dist/core/validation.js";
import { executeOrchestration } from "./dist/core/orchestrator.js";
import * as fs from "fs";

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log("\n🧪 FlowKit Verification Test Suite\n");
  console.log("=".repeat(50));

  for (const t of tests) {
    try {
      await t.fn();
      console.log(`✅ ${t.name}`);
      passed++;
    } catch (err) {
      console.log(`❌ ${t.name}`);
      console.log(`   Error: ${err.message}`);
      failed++;
    }
  }

  console.log("=".repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

// ============================================================================
// TEST 1: Adapter Factory
// ============================================================================
test("Adapter Factory - Create DummyAdapter", () => {
  const adapter = createLLMAdapter("dummy");
  if (!adapter || !adapter.generateCompletion) {
    throw new Error("DummyAdapter not created properly");
  }
  const model = adapter.getModelName();
  if (model !== "dummy") {
    throw new Error(`Expected model 'dummy', got '${model}'`);
  }
});

test("Adapter Factory - Create GeminiAdapter", () => {
  const adapter = createLLMAdapter("gemini-2.5-pro");
  if (!adapter || !adapter.generateCompletion) {
    throw new Error("GeminiAdapter not created properly");
  }
  const model = adapter.getModelName();
  if (!model.includes("gemini")) {
    throw new Error(`Expected gemini model, got '${model}'`);
  }
});

test("Adapter Factory - Create ClaudeAdapter", () => {
  const adapter = createLLMAdapter("claude-3-opus");
  if (!adapter || !adapter.generateCompletion) {
    throw new Error("ClaudeAdapter not created properly");
  }
  const model = adapter.getModelName();
  if (!model.includes("claude")) {
    throw new Error(`Expected claude model, got '${model}'`);
  }
});

test("Adapter Factory - Create OpenAIAdapter", () => {
  const adapter = createLLMAdapter("gpt-4");
  if (!adapter || !adapter.generateCompletion) {
    throw new Error("OpenAIAdapter not created properly");
  }
  const model = adapter.getModelName();
  if (!model.includes("gpt")) {
    throw new Error(`Expected gpt model, got '${model}'`);
  }
});

// ============================================================================
// TEST 2: LLM Completion Generation
// ============================================================================
test("DummyAdapter - Generate Completion", async () => {
  const adapter = createLLMAdapter("dummy");
  const response = await adapter.generateCompletion("test prompt", {
    max_tokens: 100,
    temperature: 0.5,
  });

  if (!response.content || typeof response.content !== "string") {
    throw new Error("Response content missing or invalid");
  }
  if (!response.content.includes("test prompt")) {
    throw new Error("Response does not echo back the input");
  }
  if (response.tokens_used === undefined) {
    throw new Error("Tokens used not returned");
  }
  if (!response.model) {
    throw new Error("Model name not returned");
  }
});

// ============================================================================
// TEST 3: Output Validation - Regex
// ============================================================================
test("Validation - Regex Validator (Pass)", async () => {
  const result = await validateStepOutput("hello world", {
    type: "regex",
    rule: "world",
  });
  if (!result.passed) {
    throw new Error("Regex validation should pass");
  }
});

test("Validation - Regex Validator (Fail)", async () => {
  const result = await validateStepOutput("hello world", {
    type: "regex",
    rule: "xyz",
  });
  if (result.passed) {
    throw new Error("Regex validation should fail");
  }
  if (!result.error) {
    throw new Error("Error message should be provided");
  }
});

// ============================================================================
// TEST 4: Output Validation - Length
// ============================================================================
test("Validation - Length Validator (Pass)", async () => {
  const result = await validateStepOutput("hello world", {
    type: "length",
    rule: 5,
  });
  if (!result.passed) {
    throw new Error("Length validation should pass");
  }
});

test("Validation - Length Validator (Fail)", async () => {
  const result = await validateStepOutput("hi", {
    type: "length",
    rule: 10,
  });
  if (result.passed) {
    throw new Error("Length validation should fail");
  }
});

// ============================================================================
// TEST 5: Output Validation - Contains
// ============================================================================
test("Validation - Contains Validator (Pass)", async () => {
  const result = await validateStepOutput("hello world", {
    type: "contains",
    rule: "world",
  });
  if (!result.passed) {
    throw new Error("Contains validation should pass");
  }
});

test("Validation - Contains Validator (Fail)", async () => {
  const result = await validateStepOutput("hello world", {
    type: "contains",
    rule: "xyz",
  });
  if (result.passed) {
    throw new Error("Contains validation should fail");
  }
});

// ============================================================================
// TEST 6: Orchestration Engine
// ============================================================================
test("Orchestration - Execute Flow", async () => {
  // Create a minimal flow.yaml for testing
  const flowContent = `
flows:
  - name: test-flow
    description: Test workflow
    steps:
      - id: step1
        name: Test Step
        prompt: "Analyze this: {{language}}"
        use_previous_output: false
        max_tokens: 100
        temperature: 0.3
`;
  fs.writeFileSync("flow.yaml", flowContent);

  const result = await executeOrchestration({
    flow_name: "test-flow",
    target_model: "dummy",
    variables: { language: "TypeScript" },
  });

  if (!result.success) {
    throw new Error("Flow execution failed");
  }
  if (!result.steps_executed || result.steps_executed.length === 0) {
    throw new Error("No steps executed");
  }
  if (!result.final_output) {
    throw new Error("No final output");
  }
  if (result.total_duration_ms < 0) {
    throw new Error("Invalid duration");
  }

  // Cleanup
  fs.unlinkSync("flow.yaml");
});

test("Orchestration - Flow Not Found", async () => {
  const flowContent = `
flows:
  - name: other-flow
    steps:
      - id: step1
        name: Test
        prompt: "test"
`;
  fs.writeFileSync("flow.yaml", flowContent);

  try {
    await executeOrchestration({
      flow_name: "missing-flow",
      target_model: "dummy",
    });
    throw new Error("Should have thrown error for missing flow");
  } catch (err) {
    if (err.message.includes("not found")) {
      // Expected
    } else {
      throw err;
    }
  } finally {
    fs.unlinkSync("flow.yaml");
  }
});

// ============================================================================
// TEST 7: File Structure
// ============================================================================
test("File Structure - All compiled files exist", () => {
  const files = [
    "dist/adapters/types.js",
    "dist/adapters/dummyAdapter.js",
    "dist/adapters/geminiAdapter.js",
    "dist/adapters/claudeAdapter.js",
    "dist/adapters/openaiAdapter.js",
    "dist/adapters/adapterFactory.js",
    "dist/core/validation.js",
    "dist/core/orchestrator.js",
    "dist/core/mcpHandlers.js",
    "dist/server/mcpServer.js",
  ];

  for (const file of files) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing compiled file: ${file}`);
    }
  }
});

test("File Structure - package.json is valid", () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
  if (pkg.name !== "flowkit") {
    throw new Error(`Package name should be 'flowkit', got '${pkg.name}'`);
  }
  if (!pkg.description.includes("model-agnostic")) {
    throw new Error("Package description should mention model-agnostic");
  }
});

// ============================================================================
// RUN ALL TESTS
// ============================================================================
runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
