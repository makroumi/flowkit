/**
 * OpenAIAdapter - LLM adapter for OpenAI's GPT models
 * Currently provides fallback responses. Real API implementation planned
 */

import type { LLMAdapter, LLMResponse, GenerationOptions } from "./types.js";
import fetch from "node-fetch";

/**
 * Adapter for OpenAI's GPT LLM API
 */
export class OpenAIAdapter implements LLMAdapter {
  /**
   * Initialize the OpenAI adapter
   * @param apiKey - Optional OpenAI API key
   * @param model - Optional OpenAI model identifier (e.g., 'gpt-4-turbo')
   */
  constructor(private apiKey?: string, private model?: string) {}

  /**
   * Get the name of the current model
   * @returns The OpenAI model identifier
   */
  getModelName(): string {
    return this.model ?? "gpt-4";
  }

  /**
   * Generate a completion using the OpenAI API
   * @param prompt - The input prompt
   * @param options - Generation options (max_tokens, temperature)
   * @returns The LLM response with generated content
   * @throws Error if API key is missing or API call fails
   */
  async generateCompletion(
    prompt: string,
    options: GenerationOptions
  ): Promise<LLMResponse> {
    if (!this.apiKey) {
      console.warn(
        "[OpenAIAdapter] No API key configured, returning fallback response"
      );
      return {
        content: `openai-fallback: ${prompt.slice(0, 200)}`,
        tokens_used: 0,
        model: this.getModelName(),
      };
    }

    // TODO: Implement real OpenAI API call using fetch
    // Reference: https://platform.openai.com/docs/api-reference/chat/create
    console.warn(
      "[OpenAIAdapter] Real API implementation pending, returning fallback"
    );
    return {
      content: `openai-placeholder: ${prompt.slice(0, 200)}`,
      tokens_used: 0,
      model: this.getModelName(),
    };
  }
}
