/**
 * Validation Module
 * Provides validation hooks for LLM step outputs
 * Supports regex, length, contains, and external command validators
 */

import { execSync } from "child_process";

/**
 * Configuration for step output validation
 */
export type StepValidation =
  | {
      type: "regex";
      rule: string;
      error_message?: string;
      continue_on_failure?: boolean;
    }
  | {
      type: "length";
      rule: number;
      error_message?: string;
      continue_on_failure?: boolean;
    }
  | {
      type: "contains";
      rule: string;
      error_message?: string;
      continue_on_failure?: boolean;
    }
  | {
      type: "external_command";
      rule: string;
      error_message?: string;
      continue_on_failure?: boolean;
    };

/**
 * Validate LLM step output according to specified rules
 * @param output - The LLM output to validate
 * @param validation - Validation configuration
 * @returns Validation result with passed status and optional error message
 */
export async function validateStepOutput(
  output: string,
  validation: StepValidation
): Promise<{ passed: boolean; error?: string }> {
  try {
    switch (validation.type) {
      case "regex": {
        const regex = new RegExp(validation.rule);
        if (!regex.test(output)) {
          return {
            passed: false,
            error:
              validation.error_message ||
              `Output does not match pattern: ${validation.rule}`,
          };
        }
        break;
      }

      case "length": {
        const minLength = validation.rule;
        if (output.length < minLength) {
          return {
            passed: false,
            error:
              validation.error_message ||
              `Output length ${output.length} is below minimum ${minLength}`,
          };
        }
        break;
      }

      case "contains": {
        const requiredText = validation.rule;
        if (!output.includes(requiredText)) {
          return {
            passed: false,
            error:
              validation.error_message ||
              `Output does not contain required text: "${requiredText}"`,
          };
        }
        break;
      }

      case "external_command": {
        const command = validation.rule;
        try {
          // Security: Check if external commands are enabled
          if (process.env.ALLOW_EXTERNAL_COMMANDS === "false") {
            return {
              passed: false,
              error:
                "External command validation is disabled (ALLOW_EXTERNAL_COMMANDS=false)",
            };
          }

          // Execute command with output passed to stdin with timeout for security
          execSync(command, {
            input: output,
            encoding: "utf-8",
            stdio: "pipe",
            timeout: 30000, // 30 second timeout
          });
        } catch (err: any) {
          return {
            passed: false,
            error:
              validation.error_message ||
              `External validation failed: ${err?.message ?? String(err)}`,
          };
        }
        break;
      }

      default:
        return { passed: false, error: `Unknown validation type` };
    }

    return { passed: true };
  } catch (err: any) {
    return {
      passed: false,
      error: `Validation error: ${err?.message ?? String(err)}`,
    };
  }
}
