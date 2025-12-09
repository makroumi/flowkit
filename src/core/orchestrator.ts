/**
 * Orchestrator Module
 * Executes multi-step workflows defined in flow.yaml with step chaining,
 * validation, and RAG context injection
 */

import * as fs from "fs";
import yaml from "yaml";
import { createLLMAdapter } from "../adapters/adapterFactory.js";
import { validateStepOutput } from "./validation.js";
import type { LLMResponse } from "../adapters/types.js";

/**
 * A single step in a workflow
 */
export interface FlowStep {
  id?: string;
  name?: string;
  prompt: string;
  use_previous_output?: boolean;
  validation?: any;
  max_tokens?: number;
  temperature?: number;
}

/**
 * Execute a workflow defined in flow.yaml
 * @param input - Orchestration input parameters
 * @returns Result of workflow execution
 */
export async function executeOrchestration(input: any) {
  const flowName = input.flow_name || "code-review-and-refactor";
  const targetModel =
    input.target_model || process.env.LLM_PROVIDER || "dummy";
  const adapter = createLLMAdapter(targetModel);

  // Load flows from flow.yaml
  let flows: any[] = [];
  try {
    if (fs.existsSync("flow.yaml")) {
      const doc = yaml.parse(fs.readFileSync("flow.yaml", "utf8"));
      flows = doc?.flows ?? [];
    }
  } catch (err) {
    console.warn("[orchestrator] failed to parse flow.yaml:", String(err));
    flows = [];
  }

  const flow = flows.find((f: any) => f.name === flowName);
  if (!flow) {
    throw new Error(`Flow '${flowName}' not found in flow.yaml`);
  }

  const steps: FlowStep[] = flow.steps ?? [];
  const outputs: any[] = [];
  const startTs = Date.now();

  let previousOutput = "";

  for (const step of steps) {
    const promptTemplate = step.prompt || "";
    const prompt = promptTemplate
      .replace(/\{\{language\}\}/g, input.language ?? "javascript")
      .replace(/\{\{test_framework\}\}/g, input.test_framework ?? "jest")
      .replace(/\{\{previous_output\}\}/g, previousOutput);

    const resp: LLMResponse = await adapter.generateCompletion(prompt, {
      max_tokens: step.max_tokens ?? 512,
      temperature: step.temperature ?? 0.3,
    });

    const validation = step.validation ?? null;
    let validationResult: any = null;
    if (validation) {
      validationResult = await validateStepOutput(resp.content, validation);
      if (
        validationResult &&
        validationResult.passed === false &&
        validation.halt_on_failure
      ) {
        outputs.push({
          step_id: step.id ?? step.name,
          output: resp.content,
          validation: validationResult,
        });
        return {
          flow_name: flowName,
          target_model: targetModel,
          steps_executed: outputs,
          total_duration_ms: Date.now() - startTs,
          success: false,
        };
      }
    }

    outputs.push({
      step_id: step.id ?? step.name,
      output: resp.content,
      tokens: resp.tokens_used,
      validation: validationResult,
    });
    previousOutput = resp.content;
  }

  return {
    flow_name: flowName,
    target_model: targetModel,
    steps_executed: outputs,
    total_duration_ms: Date.now() - startTs,
    success: true,
    final_output: previousOutput,
  };
}
