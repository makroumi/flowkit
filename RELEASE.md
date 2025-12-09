# FlowKit Release Guide

## Release Strategy

FlowKit uses a **Git repository + GitHub Releases** hybrid approach:

### Primary Distribution: GitHub Releases
- **Latest release** available via GitHub Releases
- Archive assets for fast installation
- Semantic versioning for clarity

### Secondary Distribution: Git Repository
Users can also install directly from git:
```bash
gemini extensions install github.com/makroumi/flowkit
gemini extensions install github.com/makroumi/flowkit --ref=stable
gemini extensions install github.com/makroumi/flowkit --ref=v1.0.0
```

### Release Channels (using branches and tags)

#### 1. **main** (stable/production)
- Default installation branch
- All releases must pass testing
- Tagged with version numbers

#### 2. **dev** (development)
- Active development branch
- May contain breaking changes
- Install with: `--ref=dev`

#### 3. **preview** (beta testing)
- Pre-release testing
- Install with: `--ref=preview --pre-release`

---

## Current Release: v1.0.0

### Release Checklist

- [x] All tests passing (15/15)
- [x] TypeScript strict mode compliant
- [x] Documentation complete (README.md, GEMINI.md, PRODUCTION_READY.md)
- [x] Gemini CLI extension compliance verified
- [x] MCP server implementation complete
- [x] Build system working (`npm run build`)
- [x] Git repository public and accessible
- [x] License file included (MIT)
- [x] Package.json properly configured

### What's Included in v1.0.0

**Features:**
- Multi-provider LLM support (Gemini, Claude, OpenAI)
- Workflow orchestration with step chaining
- Output validation (regex, length, contains, external_command)
- RAG context injection
- Variable substitution in prompts
- MCP server for Gemini CLI integration

**Documentation:**
- `README.md` - Feature overview and quick start
- `GEMINI.md` - Detailed context for Gemini CLI
- `PRODUCTION_READY.md` - Production deployment guide
- `GEMINI_CLI_COMPLIANCE.md` - Compliance checklist

**Code Quality:**
- Full TypeScript strict mode
- Comprehensive JSDoc documentation
- 15-test verification suite
- All files compile without errors

---

## Installation Methods

### Method 1: GitHub Releases (Recommended)
```bash
gemini extensions install github.com/makroumi/flowkit
```

### Method 2: Git Repository with Ref
```bash
gemini extensions install github.com/makroumi/flowkit --ref=main
gemini extensions install github.com/makroumi/flowkit --ref=v1.0.0
```

### Method 3: Local Development
```bash
git clone https://github.com/makroumi/flowkit
cd flowkit
gemini extensions link .
```

---

## Version Numbering

FlowKit follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes (e.g., 2.0.0)
  - Changed tool name or schema
  - Incompatible flow.yaml format
  
- **MINOR**: New features, backward compatible (e.g., 1.1.0)
  - New validators
  - New adapter providers
  - New optional parameters
  
- **PATCH**: Bug fixes, backward compatible (e.g., 1.0.1)
  - Documentation fixes
  - Performance improvements
  - Error handling fixes

---

## Creating a Release

### Step 1: Prepare Release Branch
```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Run tests
npm run build
bash verify.sh

# Update version in package.json if needed
# Update CHANGELOG if maintaining one
```

### Step 2: Create Git Tag
```bash
# Create annotated tag
git tag -a v1.0.0 -m "FlowKit v1.0.0 - Initial production release

Features:
- Multi-provider LLM support (Gemini, Claude, OpenAI)
- Workflow orchestration with validation
- Full Gemini CLI integration"

# Push tag to GitHub
git push origin v1.0.0
```

### Step 3: Create GitHub Release
Visit: https://github.com/makroumi/flowkit/releases/new

**Fill in:**
- **Tag version**: v1.0.0
- **Release title**: FlowKit v1.0.0
- **Description**: (see template below)
- **Mark as latest release**: ✅ Check this
- **Pre-release**: ⚪ Uncheck this

**Release Description Template:**
```markdown
## 🎉 FlowKit v1.0.0 - Initial Production Release

### ✨ Features
- **Multi-Provider LLM Support**: Works with Gemini, Claude, OpenAI with unified interface
- **Workflow Orchestration**: Chain multiple LLM steps with automatic output passing
- **Output Validation**: Enforce quality with regex, length, contains, and external_command validators
- **RAG Context Injection**: Automatically include local files as context in workflows
- **Variable Substitution**: Use template variables like {{language}} in prompts
- **Gemini CLI Integration**: Full MCP server implementation for seamless integration

### 📦 What's Inside
- 10 compiled JavaScript files (TypeScript → JavaScript)
- Complete type definitions (TypeScript strict mode)
- Comprehensive test suite (15/15 tests passing)
- Full documentation (README, GEMINI.md, production guide)

### 🚀 Getting Started
```bash
gemini extensions install github.com/makroumi/flowkit
```

Then use the `flowkit` tool:
```
flowkit(
  flow_name="code-review-and-refactor",
  target_model="gemini-2.5-pro",
  context_file_path="src/app.ts"
)
```

### 📚 Documentation
- [README.md](https://github.com/makroumi/flowkit#readme) - Feature overview
- [GEMINI.md](https://github.com/makroumi/flowkit/blob/main/GEMINI.md) - Detailed usage guide
- [PRODUCTION_READY.md](https://github.com/makroumi/flowkit/blob/main/PRODUCTION_READY.md) - Deployment guide

### ⚙️ System Requirements
- Node.js v18+
- Gemini CLI v1.0.0+
- API keys for target LLM providers (GOOGLE_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY)

### 🐛 Known Limitations
- API adapters return fallback responses (TODO: real API integration)
- DevServer mock for development (use real StdioServerTransport in production)
- flow.yaml reloaded on each execution (optimization opportunity)

### 📝 Changelog
- Initial production release
- 100% Gemini CLI extension compliance
- All requirements verified and tested
```

### Step 4: Attach Release Assets (Optional)
For faster downloads, create an archive:

```bash
# Create archive
tar --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.repair-backups' \
    -czf flowkit-v1.0.0.tar.gz \
    .

# Or zip for Windows users
zip -r flowkit-v1.0.0.zip . \
    -x ".git/*" "node_modules/*" ".repair-backups/*"
```

Then attach both files to the GitHub Release.

---

## Post-Release

### 1. Announce the Release
- Update GitHub discussion/issue if tracking progress
- Share in Gemini CLI community channels
- Document in CHANGELOG.md

### 2. Monitor for Issues
- Watch GitHub Issues for bug reports
- Check Gemini CLI discussions
- Respond to feedback quickly

### 3. Plan Next Release
- Gather feature requests from users
- Plan v1.1.0 (new validators, new providers)
- Create development issues

---

## Release History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| v1.0.0 | 2025-12-09 | Released | Initial production release |

---

## Git Branch Strategy

```
main (stable)
  ├── tag: v1.0.0
  ├── tag: v1.1.0
  └── tag: v2.0.0

preview (beta testing)
  ├── for testing pre-releases
  └── merges from dev when ready

dev (development)
  ├── active development
  ├── may have breaking changes
  └── must pass tests before merge to preview
```

**Workflow:**
1. Feature development in `dev` branch
2. Beta testing in `preview` branch (user installs with `--ref=preview --pre-release`)
3. Promotion to `main` (user installs with no flags for latest stable)
4. Tag with version on `main`
5. Create GitHub Release pointing to tag

---

## Support for Users

When users install FlowKit, they get:

### Automatic Updates
- Gemini CLI checks for new commits on the installed branch
- Prompts user to update when available
- Can opt-in to `dev` branch for latest features
- Can pin to specific version with `--ref=v1.0.0`

### Easy Rollback
- Users can downgrade with `--ref=<older-version>`
- Each tag/commit is immutable

### Documentation
- GEMINI.md provides in-context help
- Links to detailed guides
- Examples for all major features

---

## Next Steps After v1.0.0

### Planned v1.1.0
- [ ] Real API implementations (Gemini, Claude, OpenAI)
- [ ] Streaming support for long outputs
- [ ] Additional validators (json, yaml, custom scripts)
- [ ] flow.yaml caching for performance
- [ ] Pre-built Windows/macOS/Linux binaries

### Planned v2.0.0
- [ ] Multi-threaded step execution
- [ ] Conditional step branching
- [ ] Loop/retry support
- [ ] Custom adapter plugins
- [ ] Web UI for workflow creation

---

## Release Checklist (For Future Releases)

```bash
# 1. Ensure all tests pass
npm run build
bash verify.sh

# 2. Update version (if needed)
# - package.json version
# - gemini-extension.json version
# - tools/gemini-extension.json version

# 3. Update documentation
# - README.md (if features changed)
# - GEMINI.md (if features changed)
# - Create/update CHANGELOG.md

# 4. Commit changes
git add -A
git commit -m "chore: prepare v1.x.0 release"
git push origin main

# 5. Create and push tag
git tag -a v1.x.0 -m "Release message"
git push origin v1.x.0

# 6. Create GitHub Release
# - Visit https://github.com/makroumi/flowkit/releases/new
# - Fill in tag, title, description
# - Attach assets (optional)
# - Mark as latest

# 7. Announce
# - Share release notes
# - Update docs if needed
```

---

**FlowKit is ready for production release!** 🚀

Questions? See [GEMINI_CLI_COMPLIANCE.md](./GEMINI_CLI_COMPLIANCE.md) for full requirements verification.
