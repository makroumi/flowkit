# FlowKit
The ultimate, model-agnostic workflow orchestrator for AI CLIs. Define multi-step processes, chain AI outputs, and integrate local tools with flow.yaml.

## Overview
**FlowKit** is a model-agnostic, multi-step AI workflow orchestration engine built for the Gemini CLI. It enables reproducible, validated, and observable developer workflows that chain multiple LLM interactions, inject local RAG context, run non-AI validation hooks, and operate directly in your project workspace.

## Key Features
- **Model Agnostic** — Works with Gemini, Claude, OpenAI and any MCP compatible model.
- **Local RAG Integration** — Inject local files as context into workflow steps.
- **Intelligent Step Chaining** — Output from one step becomes input for the next.
- **Validation Hooks** — Regex, length, contains, and external command validators to stop broken outputs.
- **Workspace Aware** — Runs from your project directory with direct file access.
- **Reproducible Workflows** — Define flows as code in `flow.yaml` for version control.
- **Observable** — Structured output, logging, timing metrics, and token usage.
- **Enterprise Ready** — TypeScript MCP server, robust error handling, production tested.

---

## Quick Start
1. **Install the extension**
```bash
gemini extension install flowkit/orchestrator
```

2. **Create a workflow file** named `flow.yaml` in your project root. Example minimal flow:
```yaml
flows:
  - name: "quick-review"
    description: "Fast code quality check"
    steps:
      - id: "analyze"
        name: "Code Analysis"
        prompt: |
          Review this code for:
          1. Security vulnerabilities
          2. Performance issues
          3. Best practice violations
          
          Be concise and actionable.
        use_previous_output: false
        max_tokens: 1024
        temperature: 0.3
```

3. **Run the workflow from Gemini CLI**
```gemini-cli
orchestrate_flow \
  flow_name="quick-review" \
  target_model="gemini-2.5-pro" \
  context_file_path="./src/app.js"
```

4. **Inspect results** The orchestrator returns structured JSON with step outputs, validation status, durations, and token usage.

---

## Installation

### Prerequisites
- **Gemini CLI** v1.0.0 or higher
- **Node.js** v18 or higher for MCP server runtime
- API keys for your target models set in environment variables

### Option 1 Marketplace
```bash
gemini extension install flowkit/orchestrator
```

### Option 2 Manual
```bash
git clone https://github.com/acme-flow/orchestrator.git
cd orchestrator
npm install
npm run build
gemini extension link .
```

### Option 3 NPM
```bash
npm install -g flowkit/orchestrator
gemini extension install flowkit/orchestrator
```

---

## Configuration

### Environment Variables
Create a `.env` file in your project root and set required API keys and optional overrides:
```code
GOOGLE_API_KEY=your_gemini_api_key
ANTHROPIC_API_KEY=your_claude_api_key
OPENAI_API_KEY=your_openai_api_key

ACME_FLOW_DEFAULT_MODEL=gemini-2.5-pro
ACME_FLOW_FILE_PATH=./custom-flows.yaml
ACME_FLOW_ENABLE_VALIDATION=true
ACME_FLOW_LOG_LEVEL=info
```

### Extension Settings
You can configure defaults via Gemini CLI settings or `settings.json`:
```json
{
  "acmeFlow.defaultModel": "gemini-2.5-pro",
  "acmeFlow.flowFilePath": "./flow.yaml",
  "acmeFlow.enableValidation": true,
  "acmeFlow.maxRetries": 3,
  "acmeFlow.timeoutMs": 300000,
  "acmeFlow.logLevel": "info"
}
```

---

## Flow Definition Guide

### Basic Flow Structure
A `flow.yaml` contains one or more flows. Each flow has metadata and an ordered list of steps. Example structure:
```yaml
flows:
  - name: "flow-identifier"
    description: "Human readable desc"
    validation:
      enabled: true
      halt_on_failure: true
    steps:
      - id: "step1"
        name: "Step Display Name"
        prompt: "Your AI prompt here"
        use_previous_output: false
        max_tokens: 2048
        temperature: 0.7
        validation:
          type: "regex"
          rule: "^[a-z]+$"
          error_message: "Custom error"
```

### Prompt Best Practices
- **Be explicit** about role, task, and output format.
- **Provide examples** of expected output when possible.
- **Use variables** for reusable templates like `{{language}}` or `{{framework}}`.
- **Prefer low temperature** for deterministic tasks and higher temperature for creative drafts.

### Step Chaining Patterns
- **Linear Pipeline** — Each step consumes previous output when `use_previous_output: true`.
- **Parallel Analysis** — Run multiple independent analysis steps (currently executed sequentially; parallel execution planned).
- **Iterative Refinement** — Draft, critique, and improve cycles with varying temperatures.

---

## Validation Hooks

Supported validation types:
- **regex** — Ensure output matches a pattern.
- **length** — Minimum length checks.
- **contains** — Ensure required text is present.
- **external_command** — Run linters, compilers, or custom scripts; receives step output on stdin.

Example regex validation rule:
```yaml
validation:
  type: "regex"
  rule: "^```typescript\\n[\\s\\S]+\\n```$"
  error_message: "Must output valid TypeScript code block"
```

Example external command validation:
```yaml
validation:
  type: "external_command"
  rule: "npx eslint --stdin --stdin-filename code.js"
  error_message: "Code has linting errors"
  continue_on_failure: false
```

---

## Advanced Features

### Local RAG Context
Inject a local file into the first step as context using `context_file_path`. For multi-file context, concatenate files into a single context cache and pass that path.

### Dynamic Variable Injection
Pass runtime variables to make flows reusable:
```yaml
orchestrate_flow \
  flow_name="deploy-workflow" \
  target_model="gemini-2.5-pro" \
  variables='{
    "environment": "production",
    "region": "us-east-1",
    "version": "v2.3.1",
    "author": "jane.doe@company.com"
  }'
```

Reference variables in prompts as `{{version}}`, `{{environment}}`, etc.

### Error Handling and Retries
Configure retry behavior:
```yaml
{
  "acmeFlow.maxRetries": 3,
  "acmeFlow.retryDelayMs": 1000,
  "acmeFlow.retryBackoffMultiplier": 2.0
}
```
The orchestrator retries on network failures, rate limits, and transient API errors.

### Streaming Output
Streaming support is planned for future releases to stream tokens as they are generated.

---

## Model Support and Cost Tips

### Supported Models
- **gemini-2.5-pro** — 2M token context, best for large codebases.
- **gemini-2.0-flash** — 1M token context, fast iterations.
- **claude-3-opus** — high-quality code generation.
- **gpt-4-turbo** — 128K token context, broad compatibility.
- **gpt-4** — 8K token context, stable and reliable.

### Cost Optimization
- Use smaller models for drafts and larger models for final passes.
- Tune `max_tokens` per step aggressively.
- Use lower `temperature` for deterministic tasks.

---

## Use Cases and Example Flows

### Code Review Pipeline
A multi-step flow that runs security, quality, and performance analyses, then synthesizes an executive PR comment. Use RAG context with a diff file to analyze PR changes.

### Documentation Generator
Extract endpoints, convert to OpenAPI spec, generate developer guide, and produce Postman collection. Validate OpenAPI with `swagger-cli`.

### Test Generation
Analyze code to identify public API surface, generate unit and integration tests, and create fixtures. Validate generated tests with linters.

### Database Migration Generator
Compare old and new schemas, generate up and down migrations with rollback safety, and produce migration tests. Validate SQL with a dry-run command.

### Incident Response
Parse logs, assess impact, propose immediate mitigation and hotfix plans, and draft a post-mortem.

---

## API Reference

### Tool orchestrate_flow
Execute a multi-step workflow defined in `flow.yaml`.

**Input schema**
```yaml
{
  "flow_name": "string",
  "context_file_path": "string optional",
  "target_model": "string",
  "variables": { "key": "value" } optional
}
```

**Output schema**
``` yaml
{
  "flow_name": "string",
  "target_model": "string",
  "steps_executed": [
    {
      "step_id": "string",
      "step_name": "string",
      "input_prompt": "string",
      "output": "string",
      "validation_passed": true,
      "validation_error": "string optional",
      "duration_ms": 123,
      "tokens_used": 456
    }
  ],
  "total_duration_ms": 1234,
  "success": true,
  "final_output": "string optional"
}
```

**Example CLI usage**
#
orchestrate_flow flow_name="code-review" target_model="gemini-2.5-pro"
#

**Example MCP usage snippet**
``` yaml
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const client = new Client({
  name: "my-orchestrator-client",
  version: "1.0.0",
});

const result = await client.callTool({
  name: "orchestrate_flow",
  arguments: {
    flow_name: "code-review",
    target_model: "gemini-2.5-pro"
  }
});
```

---

## Extension Manifest and MCP Server Notes
The extension ships with a `gemini-extension.json` manifest that defines the MCP server entrypoint and activation events. The MCP server exposes a `tools/list` and `tools/call` interface and validates inputs with Zod schemas. Adapters implement a strategy pattern to support Gemini, Claude, and OpenAI.

---

## Troubleshooting

- **Flow not found** — Ensure `flow.yaml` exists at workspace root and `flow_name` matches a defined flow.
- **Context file load failure** — Confirm `context_file_path` is correct and readable.
- **Validation failures** — Inspect `validation_error` in step results and run the external command locally to reproduce.
- **API key errors** — Verify environment variables `GOOGLE_API_KEY`, `ANTHROPIC_API_KEY`, and `OPENAI_API_KEY` are set.
- **Rate limits** — Use retry settings and exponential backoff in configuration.

---

## Contributing
- **Code style** — TypeScript, follow existing patterns and tests.
- **Tests** — Add unit tests for new features and validation logic.
- **Docs** — Update `README.md` and example `flow.yaml` for new capabilities.
- **Pull requests** — Open PRs against `main` with a clear description and changelog entry.

---

## License
**MIT License**. See the `LICENSE` file in the repository for full terms.

---

## Contact
For questions or support open an issue in the repository or contact the ACME Flow Team via your internal channels.


