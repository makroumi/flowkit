# FlowKit - Model-Agnostic Workflow Orchestration

FlowKit is a comprehensive workflow orchestration engine that enables multi-step AI-driven development tasks across any LLM provider (Gemini, Claude, OpenAI).

## What is FlowKit?

FlowKit allows you to:

- **Chain AI Steps**: Execute multiple LLM calls in sequence, with each step's output feeding into the next
- **Use Any Model**: Target Gemini, Claude, OpenAI, or add custom providers
- **Validate Outputs**: Enforce quality checks between steps using regex, length, content, or custom validators
- **Inject Context**: Automatically include local files as RAG context in workflows
- **Substitute Variables**: Use template variables like `{{language}}` in prompts

## Key Features

### 1. Multi-Step Workflows
Define complex workflows that break large problems into smaller steps:
- Step 1: Analyze code quality
- Step 2: Generate refactored version
- Step 3: Create unit tests

### 2. Model Flexibility
Target any LLM with a unified interface:
```
target_model: "gemini-2.5-pro"      // Google Gemini
target_model: "claude-3-opus"       // Anthropic Claude
target_model: "gpt-4"               // OpenAI GPT
```

### 3. Output Validation
Ensure each step produces valid output:
```yaml
validation:
  type: "contains"
  rule: "## Issues Found"
  error_message: "Analysis must include '## Issues Found' section"
```

### 4. RAG Context Injection
Include file content in the first step automatically:
```
context_file_path: "src/app.ts"  // Content injected into step 1
```

### 5. Variable Substitution
Use template variables in prompts:
```yaml
prompt: "Review this {{language}} code and suggest improvements"
```
Pass: `variables={"language": "TypeScript"}`

## Usage Examples

### Example 1: Code Review Workflow
```
flowkit(
  flow_name="code-review-and-refactor",
  target_model="gemini-2.5-pro",
  context_file_path="src/main.ts"
)
```

This executes a 3-step workflow:
1. **Analyze**: Review the code and identify issues
2. **Generate**: Create refactored version fixing the issues
3. **Test**: Generate unit tests for the refactored code

### Example 2: With Variables
```
flowkit(
  flow_name="code-review-and-refactor",
  target_model="claude-3-opus",
  context_file_path="src/utils.js",
  variables={
    "language": "JavaScript",
    "test_framework": "Mocha"
  }
)
```

### Example 3: API Documentation
```
flowkit(
  flow_name="api-documentation-generator",
  target_model="gpt-4",
  context_file_path="src/routes"
)
```

## Defining Workflows

Workflows are defined in `flow.yaml` in your project:

```yaml
flows:
  - name: "code-review-and-refactor"
    description: "Analyzes code, identifies issues, generates refactored version"
    validation:
      enabled: true
      halt_on_failure: true
    steps:
      - id: "step1"
        name: "Analyze Code Quality"
        prompt: |
          You are a senior code reviewer. Analyze the code and identify:
          1. Code smells and anti-patterns
          2. Performance bottlenecks
          3. Security vulnerabilities
          
          Provide a structured report.
        use_previous_output: false
        max_tokens: 2048
        temperature: 0.3
        validation:
          type: "contains"
          rule: "## Issues Found"

      - id: "step2"
        name: "Generate Refactored Code"
        prompt: |
          Based on the review, generate a refactored version that:
          - Fixes all issues
          - Follows {{language}} best practices
          - Includes explanatory comments
          
          Output only the code in a single code block.
        use_previous_output: true  # Include previous step's output
        max_tokens: 4096
        temperature: 0.2
        validation:
          type: "regex"
          rule: "^```[a-z]+\\n[\\s\\S]+\\n```$"

      - id: "step3"
        name: "Generate Tests"
        prompt: |
          Generate comprehensive unit tests for the code above.
          Use {{test_framework}} framework.
          Cover edge cases and error handling.
        use_previous_output: true
        max_tokens: 3072
        temperature: 0.4
```

## Validator Types

### Regex Validation
Ensure output matches a pattern:
```yaml
validation:
  type: "regex"
  rule: "^```[a-z]+\\n[\\s\\S]+\\n```$"
  error_message: "Output must be a valid code block"
```

### Length Validation
Ensure minimum output length:
```yaml
validation:
  type: "length"
  rule: 100  # Minimum 100 characters
  error_message: "Response too short"
```

### Contains Validation
Ensure output includes required text:
```yaml
validation:
  type: "contains"
  rule: "## Summary"
  error_message: "Response must include '## Summary' section"
```

### External Command Validation
Run external tool for validation:
```yaml
validation:
  type: "external_command"
  rule: "npx eslint --stdin --stdin-filename test.js"
  error_message: "Generated code has linting errors"
  continue_on_failure: true
```

## Configuration

### Environment Variables
Set these for API key configuration:
```bash
export GOOGLE_API_KEY="your-gemini-key"
export ANTHROPIC_API_KEY="your-claude-key"
export OPENAI_API_KEY="your-openai-key"
```

### Extension Settings (in Gemini CLI)
```json
{
  "flowkit.defaultModel": "gemini-2.5-pro",
  "flowkit.flowFilePath": "./flow.yaml",
  "flowkit.enableValidation": true
}
```

## Best Practices

### 1. Start Simple
Begin with single-step workflows to test model behavior:
```yaml
flows:
  - name: "test-flow"
    steps:
      - id: "s1"
        name: "Test"
        prompt: "Summarize: {{content}}"
```

### 2. Use Validation
Add validators to stop broken outputs early:
```yaml
validation:
  type: "contains"
  rule: "## Summary"  # Ensure expected format
  halt_on_failure: true
```

### 3. Chain Outputs
Enable `use_previous_output` for complex workflows:
```yaml
- id: "step2"
  use_previous_output: true  # Includes step 1's output
```

### 4. Provide Context
Use `context_file_path` for better results:
```
context_file_path: "src/api.ts"  # Injected into step 1
```

### 5. Test Locally
Before deploying, test workflows:
```bash
bash verify.sh        # Run test suite
npm run build         # Compile TypeScript
node test-flowkit.js  # Run verification tests
```

### 6. Choose Appropriate Models
- **Fast**: use `gemini-2.5-pro` (Gemini)
- **Complex reasoning**: use `claude-3-opus` (Claude)
- **Balanced**: use `gpt-4` (OpenAI)

### 7. Set Appropriate Temperatures
- `0.1-0.3`: Analytical tasks (code review, analysis)
- `0.4-0.6`: Balanced generation (documentation)
- `0.7+`: Creative tasks (brainstorming)

## Workflow Output

Each workflow execution returns:
```json
{
  "flow_name": "code-review-and-refactor",
  "target_model": "gemini-2.5-pro",
  "success": true,
  "steps_executed": [
    {
      "step_id": "step1",
      "output": "... analysis results ...",
      "tokens_used": 1024,
      "validation_passed": true
    },
    {
      "step_id": "step2",
      "output": "... refactored code ...",
      "tokens_used": 2048,
      "validation_passed": true
    },
    {
      "step_id": "step3",
      "output": "... unit tests ...",
      "tokens_used": 1536,
      "validation_passed": true
    }
  ],
  "total_duration_ms": 15234,
  "final_output": "... output from step 3 ..."
}
```

## Troubleshooting

### Workflow not found
- Verify `flow.yaml` exists in your project root
- Check that `flow_name` matches a flow definition exactly

### Validation failures
- Check validator syntax in `flow.yaml`
- Ensure the regex pattern is correct
- Test with `continue_on_failure: true` to see error messages

### Model not supported
- Ensure API key environment variable is set
- Verify model name is correct (case-sensitive)
- Check that the provider's API is accessible

### Timeouts
- Reduce `max_tokens` value
- Break workflow into smaller steps
- Check network connectivity

## Resources

- **Repository**: https://github.com/makroumi/flowkit
- **Documentation**: See README.md for detailed API reference
- **Examples**: Check `orchestrator/flow-examples/` for sample workflows
- **Testing**: Run `bash verify.sh` to verify installation

## Support

For issues, questions, or feature requests, visit: https://github.com/makroumi/flowkit/issues

---

**FlowKit**: The ultimate, model-agnostic workflow orchestrator for modern AI development. 🚀
