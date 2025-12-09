/**
 * DummyAdapter - Mock LLM adapter for development and testing
 * Returns echoed prompt without making actual API calls
 */

import type { LLMAdapter, LLMResponse, GenerationOptions } from "./types.js";

/**
 * A mock LLM adapter that echoes prompts for testing
 */
export class DummyAdapter implements LLMAdapter {
  /**
   * Get the name of the dummy model
   * @returns The model identifier
   */
  getModelName(): string {
    return "dummy";
  }

  /**
   * Generate a completion by echoing the prompt (for testing)
   * @param prompt - The input prompt
   * @param options - Generation options (unused in dummy adapter)
   * @returns A mock response with echoed content
   */
  async generateCompletion(
    prompt: string,
    options: GenerationOptions
  ): Promise<LLMResponse> {
    // Echo first 200 chars of prompt for testing
    const content = `ECHO: ${prompt.slice(0, 200)}${prompt.length > 200 ? "..." : ""}`;
    // Estimate tokens as 1 token per 4 characters
    const tokens_used = Math.min(1000, Math.ceil(content.length / 4));

    return {
      content,
      tokens_used,
      model: this.getModelName(),
    };
  }
}
