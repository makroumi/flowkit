/**
 * ClaudeAdapter - LLM adapter for Anthropic's Claude models
 * Currently provides fallback responses. Real API implementation planned
 */

import type { LLMAdapter, LLMResponse, GenerationOptions } from "./types.js";

/**
 * Adapter for Anthropic's Claude LLM API
 */
export class ClaudeAdapter implements LLMAdapter {
  /**
   * Initialize the Claude adapter
   * @param apiKey - Optional Anthropic API key
   * @param model - Optional Claude model identifier (e.g., 'claude-3-opus')
   */
  constructor(private apiKey?: string, private model?: string) {}

  /**
   * Get the name of the current model
   * @returns The Claude model identifier
   */
  getModelName(): string {
    return this.model ?? "claude";
  }

  /**
   * Generate a completion using the Claude API
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
        "[ClaudeAdapter] No API key configured, returning fallback response"
      );
      return {
        content: `claude-fallback: ${prompt.slice(0, 200)}`,
        tokens_used: 0,
        model: this.getModelName(),
      };
    }

    // TODO: Implement real Claude API call
    // Reference: https://docs.anthropic.com/en/api/getting-started
    console.warn(
      "[ClaudeAdapter] Real API implementation pending, returning fallback"
    );
    return {
      content: `claude-fallback: ${prompt.slice(0, 200)}`,
      tokens_used: 0,
      model: this.getModelName(),
    };
  }
}
