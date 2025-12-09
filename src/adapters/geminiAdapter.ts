/**
 * GeminiAdapter - LLM adapter for Google's Gemini models
 * Currently provides fallback responses. Real API implementation planned
 */

import type { LLMAdapter, LLMResponse, GenerationOptions } from "./types.js";

/**
 * Adapter for Google's Gemini LLM API
 */
export class GeminiAdapter implements LLMAdapter {
  /**
   * Initialize the Gemini adapter
   * @param apiKey - Optional Google API key
   * @param model - Optional Gemini model identifier (e.g., 'gemini-2.5-pro')
   */
  constructor(private apiKey?: string, private model?: string) {}

  /**
   * Get the name of the current model
   * @returns The Gemini model identifier
   */
  getModelName(): string {
    return this.model ?? "gemini";
  }

  /**
   * Generate a completion using the Gemini API
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
        "[GeminiAdapter] No API key configured, returning fallback response"
      );
      return {
        content: `gemini-fallback: ${prompt.slice(0, 200)}`,
        tokens_used: 0,
        model: this.getModelName(),
      };
    }

    // TODO: Implement real Gemini API call
    // Reference: https://ai.google.dev/api/rest
    console.warn(
      "[GeminiAdapter] Real API implementation pending, returning fallback"
    );
    return {
      content: `gemini-fallback: ${prompt.slice(0, 200)}`,
      tokens_used: 0,
      model: this.getModelName(),
    };
  }
}
