/**
 * LLM Adapter Type Definitions
 * Interface contracts for all LLM adapter implementations
 */

/**
 * Options for controlling LLM generation behavior
 */
export interface GenerationOptions {
  /** Maximum number of tokens to generate */
  max_tokens?: number;
  /** Temperature for sampling (0.0 = deterministic, 1.0+ = creative) */
  temperature?: number;
  /** System prompt to provide context to the model */
  system_prompt?: string;
}

/**
 * Response from an LLM API call
 */
export interface LLMResponse {
  /** Generated content from the model */
  content: string;
  /** Number of tokens used in the request+response */
  tokens_used: number;
  /** Model identifier that was used */
  model: string;
}

/**
 * Abstract interface for LLM adapters
 * Implementations should handle API calls, authentication, and error handling
 */
export interface LLMAdapter {
  /**
   * Generate a completion for the given prompt
   * @param prompt - The input prompt
   * @param options - Generation options
   * @returns The LLM response
   */
  generateCompletion(
    prompt: string,
    options: GenerationOptions
  ): Promise<LLMResponse>;

  /**
   * Get the name of the current model
   * @returns The model identifier
   */
  getModelName(): string;
}
