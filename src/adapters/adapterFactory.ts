/**
 * LLM Adapter Factory
 * Creates and configures adapters for different LLM providers
 * Supports Gemini, Claude, and OpenAI with automatic provider detection
 */

import { DummyAdapter } from "./dummyAdapter.js";
import { GeminiAdapter } from "./geminiAdapter.js";
import { ClaudeAdapter } from "./claudeAdapter.js";
import { OpenAIAdapter } from "./openaiAdapter.js";
import type { LLMAdapter } from "./types.js";

/**
 * Get the API key for a given model provider
 * Determines provider from model identifier and reads from environment variables
 * @param model - The model identifier (e.g., 'gemini-2.5-pro', 'claude-3-opus', 'gpt-4')
 * @returns The API key from environment variables, or empty string if not found
 */
export function getAPIKeyForModel(model: string): string {
  if (!model) return "";

  const m = model.toLowerCase();

  if (m.startsWith("gemini")) {
    return process.env.GOOGLE_API_KEY ?? "";
  }

  if (m.startsWith("claude")) {
    return process.env.ANTHROPIC_API_KEY ?? "";
  }

  if (m.startsWith("gpt") || m.startsWith("openai")) {
    return process.env.OPENAI_API_KEY ?? "";
  }

  return "";
}

/**
 * Create an LLM adapter for the requested model
 * Automatically detects provider from model identifier and returns appropriate adapter
 * Falls back to DummyAdapter on any errors
 * @param targetModel - The target LLM model identifier
 * @returns An LLMAdapter instance ready for use
 */
export function createLLMAdapter(targetModel: string): LLMAdapter {
  const model = (targetModel || "").toLowerCase().trim();
  const apiKey = getAPIKeyForModel(model);

  try {
    if (model.startsWith("gemini")) {
      return new GeminiAdapter(apiKey, targetModel);
    }

    if (model.startsWith("claude")) {
      return new ClaudeAdapter(apiKey, targetModel);
    }

    if (model.startsWith("gpt") || model.startsWith("openai")) {
      return new OpenAIAdapter(apiKey, targetModel);
    }

    return new DummyAdapter();
  } catch (err) {
    console.warn(
      "[adapterFactory] adapter construction failed, falling back to DummyAdapter:",
      String(err)
    );
    return new DummyAdapter();
  }
}
