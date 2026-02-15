# Claude Code Cockpit

<div align="center">

> Next-generation real-time dashboard for Claude Code

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/baeseokjae/claude-code-cockpit)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-321%20passing-brightgreen.svg)](#-development)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

[English](./README.md) • [한국어](./README.ko.md)

</div>

Advanced HUD system for Claude Code featuring 5 customizable themes, comprehensive session monitoring, and zero dependencies.

---

## 📑 Table of Contents

- [Quick Start](#-quick-start)
- [Features](#-features)
  - [Core Features](#core-features)
  - [Advanced Features](#advanced-features-v20)
- [Installation](#-installation)
- [Commands](#-commands)
- [Themes](#-themes)
- [Detailed Features](#-detailed-features)
- [Configuration](#️-configuration)
- [Alerts](#-alerts)
- [Development](#-development)
- [Project Structure](#-project-structure)
- [Changelog](#-changelog)
- [Inspired By](#-inspired-by)
- [License](#-license)

---

## 🚀 Quick Start

```bash
# Install plugin
/plugin install claude-code-cockpit

# Configure statusline
/claude-code-cockpit:setup

# View dashboard
/claude-code-cockpit:dashboard
```

That's it! Your Claude Code statusline is now enhanced with real-time monitoring.

## ✨ Features

### Why Claude Code Cockpit?

Claude Code Cockpit transforms your Claude Code experience by providing **real-time visibility** into every aspect of your AI-powered development session. Monitor tools, agents, costs, and code quality—all in a beautiful, customizable HUD.

### Core Features

#### 🎨 Visual & Theming
- **5 Premium Themes**: Aurora (default), Neon, Mono, Zen, Retro
- **Responsive Layout**: Auto-adjusts to terminal width (3 tiers)
- **WCAG Compliant**: Accessibility-first color palettes
- **Terminal Hyperlinks**: Clickable file paths and GitHub URLs
- **Unicode & Nerd Font Support**: Beautiful icons when available

#### 🔧 Real-time Monitoring
- **Tool Tracking**: Monitor Read, Edit, Bash, Grep, and all tool activity with status indicators (◐ in progress, ✓ success, ✗ error)
- **Tool Statistics**: Overall tool success/failure rate (e.g., ✓87% ✗13%)
- **Agent Tracking**: Real-time Task subagent monitoring with model display ([h]aiku, [s]onnet, [o]pus)
- **Todo Progress**: Track TodoWrite task status with completion percentage
- **Skill Tracking**: Monitor /commit, /review-pr and other skill invocations

#### 📊 Git Integration
- **Branch Status**: Current branch with dirty indicator
- **Git Activity**: Count commits and PRs created during session
- **Git Tag**: Latest release tag next to branch name
- **File Stats**: Track modified/added/deleted/untracked files
- **Monorepo Support**: Display branches from multiple subdirectories
- **Worktree Support**: Track multiple git worktrees

#### 💰 Cost & Performance
- **Cost Estimation**: Token-based cost calculation per model (Opus/Sonnet/Haiku)
- **Token Speed**: Real-time tok/s tracking for input/output
- **Cache Metrics**: Cache hit rate and estimated savings display
- **Session Duration**: Track how long your session has been running
- **API Usage**: Monitor 5-hour and 7-day rate limits with reset timers

#### 📝 Code Analysis
- **Lines Widget**: Track code additions/removals (+152 -48)
- **Bash Error Tracking**: Failed commands with exit codes
- **Configuration Counts**: Display count of .claude.md, rules, MCP servers, hooks

#### 🚨 Smart Alerts
- **Context Warnings**: Alert when context usage is high (75%+, 90%+)
- **Cost Warnings**: Alert when cost exceeds thresholds
- **Session Warnings**: Alert for long-running sessions (30m+)
- **Compact Suggestions**: Recommend `/compact` when tool calls exceed threshold

#### 🚀 Technical Excellence
- **Zero Dependencies**: Uses only Node.js built-in modules
- **Fast Performance**: < 50ms render cycle, < 50MB memory
- **321 Tests Passing**: Comprehensive test coverage with Vitest
- **Type-Safe**: Written in TypeScript 5.x

### Advanced Features (v2.0)

Claude Code Cockpit includes cutting-edge analysis features for power users:

#### 💡 Intelligent Suggestions
- **Strategic Compact Suggestion**: Analyzes tool call count and suggests `/compact` mode when threshold exceeded (e.g., `⚠️ 75 calls try /compact`)
- **Context Optimization**: Helps prevent context window exhaustion

#### 🔍 Code Quality & Security
- **Rule Violations Detection**: Real-time detection of:
  - Hardcoded secrets (API keys, tokens, credentials)
  - Console.log and debug statements
  - Large files (>1MB)
  - TODO/FIXME comments
  - Severity-based icons (🔴 critical, 🟡 medium, 🔵 low)

#### 🔄 Workflow Intelligence
- **Workflow Phase Detection**: Auto-detect PLAN/IMPLEMENT/REVIEW phases
  - Analyzes recent 20 tool calls for patterns
  - Confidence scoring (0-100%)
  - Todo status integration
  - Displays as `[PLAN]`, `[IMPLEMENT]`, or `[REVIEW]`

#### 🧪 Testing & Quality Metrics
- **Test Coverage Analysis**: Framework-agnostic coverage display
  - Auto-detects: vitest, jest, mocha, ava
  - Displays: statements, branches, functions, lines
  - Color-coded: Green (80%+), Yellow (60-79%), Red (<60%)
- **Pass@k Metrics**: AI code generation quality measurement
  - Pass@1: First-attempt success rate
  - Pass@3: Success within 3 attempts
  - Pass@5: Success within 5 attempts
  - Average attempts to success
  - Recent success rate (last 10 sequences)

#### 🔌 MCP (Model Context Protocol)
- **MCP Status**: Per-server tool usage statistics
  - Track tool calls by MCP server
  - Success rates per server
  - Identify most-used MCP tools
  - Display: `MCP: 3 servers (45 calls)`
- **MCP Impact Tracking**: Configuration and tool count estimation
- **Performance Metrics**: Build and test performance tracking (experimental)

#### 🌳 Advanced Git Features
- **Git Worktree Support**: Track multiple worktrees
  - Detects all git worktrees
  - Shows path, branch, commit, dirty status
  - Display: `3 worktrees (1 dirty)`

#### 🔗 Multi-Instance Support
- **Instance Sync**: Multi-instance synchronization (basic structure, experimental)
  - Instance discovery
  - Current instance tracking

## 🚀 Installation

### Prerequisites

- **Claude Code**: Version 2.0+ required
- **Node.js**: Version 18.0.0 or higher
- **Terminal**: Modern terminal with ANSI color support (recommended: iTerm2, VSCode Terminal, Windows Terminal, Kitty)

### Method 1: From Marketplace (Recommended)

The easiest way to install Claude Code Cockpit:

```bash
# Inside Claude Code, run:
/plugin install claude-code-cockpit

# Configure statusline (one-time setup)
/claude-code-cockpit:setup

# Verify installation
/claude-code-cockpit:dashboard
```

### Method 2: Manual Installation

For manual installation or contribution:

```bash
# Clone repository
git clone https://github.com/baeseokjae/claude-code-cockpit.git
cd claude-code-cockpit

# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Run tests (optional)
pnpm test

# Install locally
pnpm link --global
```

Then in Claude Code:
```bash
/plugin install <path-to-cloned-repo>
/claude-code-cockpit:setup
```

### Method 3: Development Mode

For active development:

```bash
# In project directory
pnpm dev  # Watch mode

# In another terminal, test locally
cc --plugin-dir .

# Or test stdin directly
echo '{"model":{"display_name":"Opus"}}' | node dist/index.js
```

## 📋 Commands

Claude Code Cockpit provides **7 interactive commands** for detailed session monitoring and configuration. All commands read from `/tmp/cockpit-session.md`, which is automatically updated during your session.

### Session Monitoring Commands

#### `/claude-code-cockpit:dashboard`
**Show comprehensive session dashboard with all statistics**

Displays a complete overview of your current session including:
- Model and session information
- Token usage and costs
- All tool calls with status
- Agent executions
- Todo list progress
- Skill invocations
- Git status and activity
- API usage limits
- Advanced metrics (workflow phase, test coverage, Pass@k, etc.)

**Example output:**
```markdown
# Claude Code Session Dashboard

## Session Info
- Model: Opus 4.6
- Session: groovy-juggling-acorn
- Duration: 15m 32s
- Cost: $0.47

## Tools (87% success rate)
- Read: 12 calls (✓11 ✗1)
- Edit: 8 calls (✓8 ✗0)
- Bash: 5 calls (✓3 ✗2)
...
```

#### `/claude-code-cockpit:tools`
**Display detailed tool usage statistics and history**

Shows granular tool usage data:
- Tool call counts
- Success/failure rates per tool
- Recent tool history
- Error details for failed calls

#### `/claude-code-cockpit:agents`
**Show agent execution details and status**

Lists all Task subagents spawned during the session:
- Agent name and description
- Model used (Haiku/Sonnet/Opus)
- Status (in progress, completed, failed)
- Execution duration
- Output summary

#### `/claude-code-cockpit:todos`
**Display todo list with completion status**

Shows TodoWrite task progress:
- Task list with completion checkboxes
- Overall completion percentage
- Task descriptions and status
- Hierarchical task structure

#### `/claude-code-cockpit:usage`
**Show API usage statistics and rate limits**

Displays API usage information:
- 5-hour usage window (requests, tokens)
- 7-day usage window (requests, tokens)
- Percentage used for each window
- Time until reset
- Cost breakdown by model

### Configuration Commands

#### `/claude-code-cockpit:setup`
**Configure Claude Code statusline (one-time setup)**

Automatically configures your `~/.claude/settings.json` to use claude-code-cockpit as the statusline plugin. This is required after installation.

**What it does:**
1. Reads current settings
2. Updates `statusline` configuration
3. Backs up existing settings
4. Writes new settings

**Example:**
```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/plugins/claude-code-cockpit/dist/index.js"
  }
}
```

#### `/claude-code-cockpit:configure`
**Configure theme and display options interactively**

Interactive configuration wizard for customizing your cockpit:
- **Theme selection**: Choose from 5 themes (Aurora, Neon, Mono, Zen, Retro)
- **Detail mode**: Enable/disable detail mode
- **Display options**: Toggle individual widgets (tools, agents, todos, skills, etc.)
- **Advanced features**: Enable/disable v2.0 features (workflow phase, test coverage, Pass@k, etc.)
- **Performance settings**: Set max tools/agents to track

**Usage:**
```bash
/claude-code-cockpit:configure

# The command will guide you through:
# 1. Select theme (aurora/neon/mono/zen/retro)
# 2. Enable detail mode? (y/n)
# 3. Show git status? (y/n)
# 4. Show tools? (y/n)
# ... (continues for all options)
```

Configuration is saved to `~/.claude/plugins/claude-code-cockpit/config.json`.

## 🎨 Themes

Claude Code Cockpit features **5 premium themes**, each carefully designed with unique aesthetics and WCAG-compliant color palettes.

### 🌌 Aurora (Default)
**Inspired by Aurora Borealis**

Polar night sky with green-teal-purple aurora gradients. Balanced contrast with jewel-toned accents.

**Best for:** General use, long sessions, eye comfort

![Aurora Theme](./assets/theme-aurora.svg)

---

### ⚡ Neon
**Cyberpunk neon sign aesthetic**

High-contrast fluorescent green, cyan, and hot pink on deep black. Bold and vibrant.

**Best for:** High-visibility, dark environments, modern terminals

![Neon Theme](./assets/theme-neon.svg)

---

### ⚫ Mono
**Pure black & white minimal**

ASCII-compatible, accessibility-first design. No color, maximum compatibility.

**Best for:** Accessibility, legacy terminals, e-ink displays, minimal distraction

![Mono Theme](./assets/theme-mono.svg)

---

### 🧘 Zen
**Ultra-minimal tranquility**

Calm earth tones inspired by traditional paper and ink. Subtle and refined.

**Best for:** Focused work, reduced visual noise, calm environments

![Zen Theme](./assets/theme-zen.svg)

---

### 📺 Retro
**80s CRT phosphor monitor nostalgia**

Green phosphor glow on black. Classic terminal aesthetic.

**Best for:** Retro lovers, vintage terminal feel, nostalgia

![Retro Theme](./assets/theme-retro.svg)

---

### Switching Themes

**Method 1: Interactive (Recommended)**
```bash
/claude-code-cockpit:configure
# Select theme: aurora, neon, mono, zen, or retro
```

**Method 2: Environment Variable**
```bash
export COCKPIT_THEME=neon
```

**Method 3: Configuration File**
Edit `~/.claude/plugins/claude-code-cockpit/config.json`:
```json
{
  "theme": "zen"
}
```

### Theme Comparison

| Theme | Contrast | Colors | Use Case | Accessibility |
|-------|----------|--------|----------|---------------|
| **Aurora** | Medium | 🌈 Multi-color | General, balanced | ✅ WCAG AA |
| **Neon** | High | 🎨 Bright neon | High-viz, dark mode | ✅ WCAG AAA |
| **Mono** | High | ⚫⚪ B&W only | Maximum compat | ✅ WCAG AAA |
| **Zen** | Low | 🎨 Earth tones | Focus, minimal | ✅ WCAG AA |
| **Retro** | Medium | 💚 Green mono | Nostalgia | ✅ WCAG AA |

## 🌟 Detailed Features

### Real-time Monitoring
- **Session duration tracking** - Track how long your current session has been running
- **Token usage** - Monitor input/output/cache tokens in real-time
- **Cost calculation** - Automatic cost estimation based on model and token usage
- **API rate limit monitoring** - Track 5-hour and 7-day API usage windows with reset timers

### Interactive Commands
- **Comprehensive dashboard** - `/claude-code-cockpit:dashboard` for full session overview
- **Tool usage statistics** - `/claude-code-cockpit:tools` for detailed tool call history
- **Agent execution tracking** - `/claude-code-cockpit:agents` for subagent status and descriptions
- **Todo list monitoring** - `/claude-code-cockpit:todos` for task progress tracking
- **API usage analysis** - `/claude-code-cockpit:usage` for rate limit and usage statistics

### Token Speed Tracking
- **Output token generation speed** - Real-time tok/s calculation
- **Input token processing speed** - Monitor input processing rate
- **Configurable display** - Toggle via `showTokenSpeed` option

### Git Integration
- **Current branch and dirty status** - See your current git branch with uncommitted changes indicator
- **Latest tag display** - Show most recent git tag next to branch name
- **File modification statistics** - Track modified/added/deleted/untracked file counts
- **Monorepo support** - Display branches from multiple subdirectories
- **Clickable GitHub links** - Terminal-dependent hyperlinks to GitHub branch URLs

### Lines Widget
- **Code changes tracking** - Display added/removed lines (+152 -48)
- **Compact format** - Large numbers shown as 5.0k for readability
- **Configurable display** - Toggle via `showLines` option

### Cache Metrics
- **Cache hit rate** - Percentage of input from cache reads
- **Estimated savings** - Cost savings from prompt caching
- **Model-aware pricing** - Supports Sonnet, Opus, Haiku pricing
- **Configurable display** - Toggle via `showCacheMetrics` option

### Terminal Hyperlinks
- **Clickable file paths** - OSC 8 escape sequences for file:// protocol links
- **Clickable GitHub URLs** - Direct links to GitHub branch pages
- **Automatic compatibility detection** - Smart detection of terminal hyperlink support
- **Supported terminals**: iTerm2, Apple Terminal, VSCode Terminal, Kitty, Windows Terminal, Ghostty

### Session File Export
- **Auto-generated session summary** - Markdown file at `/tmp/cockpit-session.md`
- **Used by all commands** - All `/claude-code-cockpit:*` commands read this file
- **Comprehensive data** - Includes tools, agents, todos, usage statistics, git status

### Advanced Analysis Features (v2.0)

#### Workflow Phase Detection
- **Automatic phase detection** - Analyzes tool patterns to detect PLAN/IMPLEMENT/REVIEW phases
- **Confidence scoring** - Shows confidence percentage for detected phase
- **Tool pattern analysis** - Uses recent 20 tool calls to determine phase
- **Todo status integration** - Considers todo completion for phase determination

#### Test Coverage Analysis
- **Framework auto-detection** - Supports vitest, jest, mocha, ava
- **Coverage metrics** - Displays statements, branches, functions, lines
- **Color coding** - Green (80%+), Yellow (60-79%), Red (<60%)

#### Pass@k Metrics
- **AI quality measurement** - Tracks code generation success rates
- **Multiple k values** - Pass@1 (first try), Pass@3 (within 3 tries), Pass@5 (within 5 tries)
- **Average attempts** - Shows average attempts needed for success
- **Recent success rate** - Tracks success of last 10 attempts

## ⚙️ Configuration

Claude Code Cockpit is highly configurable. You can customize every aspect through the interactive wizard, configuration file, or environment variables.

### Quick Configuration

**Recommended: Interactive Wizard**
```bash
/claude-code-cockpit:configure
```

This command guides you through all configuration options with clear prompts and descriptions.

### Environment Variables

For quick overrides without editing config files:

```bash
# Theme selection
export COCKPIT_THEME=aurora        # Options: aurora, neon, mono, zen, retro

# Preset selection (applies a bundle of display settings)
export COCKPIT_PRESET=developer    # Options: minimal, developer, full

# Enable detail mode (advanced features)
export COCKPIT_DETAIL=1            # 0=off, 1=on

# Path display depth
export COCKPIT_PATH_LEVELS=2       # Number of directory levels to show
```

These environment variables take precedence over config file settings.

### Configuration File

`~/.claude/plugins/claude-code-cockpit/config.json`:

```json
{
  "theme": "aurora",
  "preset": "developer",
  "detailMode": false,
  "pathLevels": 1,
  "rightMargin": 2,
  "maxActivityWidgets": 8,
  "display": {
    "showGit": true,
    "showTools": true,
    "showAgents": true,
    "showTodos": true,
    "showSkills": false,
    "showUsage": true,
    "showConfigCounts": false,
    "showCost": true,
    "showAbsoluteTokens": false,
    "showSessionName": true,
    "showTokenSpeed": false,
    "showGitFileStats": false,
    "showAllBranches": false,
    "showAllBranchesDepth": 2,
    "showLines": true,
    "showCacheMetrics": false,
    "showGitTag": false,
    "showGitActivity": false,
    "showToolStats": false,
    "showBashErrors": true,
    "showCompactSuggestion": true,
    "showViolations": true,
    "showMcpImpact": false,
    "showWorkflowPhase": false,
    "showTestCoverage": false,
    "showPassAtK": false,
    "showGitWorktrees": false,
    "showPerformanceMetrics": false,
    "showMcpStatus": false,
    "showInstanceSync": false,
    "sevenDayThreshold": 80
  },
  "usage": {
    "enabled": true,
    "cacheMinutes": 10
  },
  "notifications": {
    "enabled": false,
    "compactWarningThreshold": 75,
    "compactSuggestionEnabled": true,
    "compactSuggestionThreshold": 50
  },
  "performance": {
    "maxTools": 20,
    "maxAgents": 20
  }
}
```

### Presets

Presets apply a predefined bundle of display settings. Individual display options can still override preset values.

| Preset | Description |
|--------|-------------|
| `minimal` | Core only: model, context%, cost, duration. Alerts (bashErrors, compactSuggestion, violations) always on |
| `developer` | Default + gitActivity, toolStats enabled |
| `full` | All display options enabled |

Set via config file (`"preset": "developer"`) or env var (`COCKPIT_PRESET=developer`).

**Priority:** Default → Preset → User overrides

### Display Options

All display options can be toggled individually. Here's a complete reference:

#### Basic Display

| Option | Default | Description |
|--------|---------|-------------|
| `showGit` | ✅ true | Git branch and status |
| `showTools` | ✅ true | Tool usage (Read, Edit, Bash, etc.) |
| `showAgents` | ✅ true | Agent execution status |
| `showTodos` | ✅ true | Todo progress tracking |
| `showSkills` | ❌ false | Skill invocations (/commit, /review-pr) |
| `showUsage` | ✅ true | API usage statistics |
| `showCost` | ✅ true | Cost estimation |

#### Token & Session Display

| Option | Default | Description |
|--------|---------|-------------|
| `showAbsoluteTokens` | ❌ false | Show absolute token counts instead of percentages |
| `showTokenSpeed` | ❌ false | Token generation speed (tok/s) |
| `showSessionName` | ✅ true | Session/plan name in status bar |

#### Git Information

| Option | Default | Description |
|--------|---------|-------------|
| `showGitTag` | ❌ false | Latest git tag next to branch |
| `showGitActivity` | ❌ false | Commits and PRs created during session |
| `showGitFileStats` | ❌ false | Modified/added/deleted file counts |
| `showAllBranches` | ❌ false | Branches from subdirectories (monorepo) |
| `showAllBranchesDepth` | 2 | Maximum depth for subdirectory scanning |
| `showGitWorktrees` | ❌ false | Git worktree status (advanced) |

#### Code Metrics

| Option | Default | Description |
|--------|---------|-------------|
| `showLines` | ✅ true | Code additions/removals (+152 -48) |
| `showCacheMetrics` | ❌ false | Cache hit rate and savings |
| `showConfigCounts` | ❌ false | Count of .claude.md, rules, MCP, hooks |

#### Activity Tracking

| Option | Default | Description |
|--------|---------|-------------|
| `showToolStats` | ❌ false | Overall tool success/failure rate |
| `showBashErrors` | ✅ true | Failed bash commands with exit codes |

#### Advanced Analysis (v2.0)

| Option | Default | Description |
|--------|---------|-------------|
| `showCompactSuggestion` | ✅ true | `/compact` suggestion when threshold exceeded |
| `showViolations` | ✅ true | Code violations (secrets, console.log) |
| `showMcpImpact` | ❌ false | MCP server configuration and tool count |
| `showWorkflowPhase` | ❌ false | Current workflow phase (PLAN/IMPLEMENT/REVIEW) |
| `showTestCoverage` | ❌ false | Test coverage percentage |
| `showPassAtK` | ❌ false | Pass@k code generation quality metrics |
| `showMcpStatus` | ❌ false | MCP server usage statistics |
| `showPerformanceMetrics` | ❌ false | Build/test performance (experimental) |
| `showInstanceSync` | ❌ false | Multi-instance sync (experimental) |

#### Usage Warnings

| Option | Default | Description |
|--------|---------|-------------|
| `sevenDayThreshold` | 80 | Percentage threshold for showing 7-day usage warning (0-100) |

### Notification Options

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | ❌ false | Enable desktop notifications (experimental) |
| `compactWarningThreshold` | 75 | Context percentage for compact warning |
| `compactSuggestionEnabled` | ✅ true | Enable `/compact` suggestions |
| `compactSuggestionThreshold` | 50 | Tool call count to trigger suggestion |

### Usage Options

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | ✅ true | Enable API usage tracking |
| `cacheMinutes` | 10 | Cache duration for usage data (minutes) |

### Performance Options

| Option | Default | Description |
|--------|---------|-------------|
| `maxTools` | 20 | Maximum number of tools to track |
| `maxAgents` | 20 | Maximum number of agents to track |

**Note:** Reducing `maxTools` and `maxAgents` can improve performance on slower systems or with very long sessions.

### Additional Options

| Option | Default | Description |
|--------|---------|-------------|
| `rightMargin` | 2 | Right margin columns reserved to prevent terminal wrapping |
| `maxActivityWidgets` | 8 | Maximum number of activity widgets per line |
| `pathLevels` | 1 | Number of parent directory levels to show in project path |

### Example Configuration Presets

#### Minimal (Performance-focused)
```json
{
  "theme": "mono",
  "detailMode": false,
  "display": {
    "showGit": true,
    "showTools": true,
    "showAgents": false,
    "showTodos": false,
    "showSkills": false,
    "showUsage": false,
    "showCost": true,
    "showBashErrors": true,
    "showCompactSuggestion": true,
    "showViolations": true,
    "showWorkflowPhase": false,
    "showTestCoverage": false,
    "showPassAtK": false
  },
  "performance": {
    "maxTools": 10,
    "maxAgents": 5
  }
}
```

#### Full-Featured (Power User)
```json
{
  "theme": "aurora",
  "preset": "full",
  "detailMode": true,
  "display": {
    "showGit": true,
    "showTools": true,
    "showAgents": true,
    "showTodos": true,
    "showSkills": true,
    "showUsage": true,
    "showCost": true,
    "showCompactSuggestion": true,
    "showViolations": true,
    "showMcpImpact": true,
    "showWorkflowPhase": true,
    "showTestCoverage": true,
    "showPassAtK": true,
    "showMcpStatus": true,
    "showGitActivity": true,
    "showToolStats": true,
    "showBashErrors": true,
    "showGitTag": true,
    "showAllBranches": true,
    "showGitWorktrees": true,
    "showPerformanceMetrics": true,
    "showInstanceSync": true,
    "showCacheMetrics": true,
    "showTokenSpeed": true
  },
  "performance": {
    "maxTools": 50,
    "maxAgents": 50
  }
}
```

#### Security-Focused (Custom Example)
```json
{
  "theme": "neon",
  "detailMode": true,
  "display": {
    "showViolations": true,
    "showBashErrors": true,
    "showMcpImpact": false,
    "showWorkflowPhase": false
  }
}
```
**Note:** This is a user configuration example, not a built-in preset. Available presets are: `minimal`, `developer`, `full`.

## 🚨 Smart Alerts

Claude Code Cockpit includes intelligent alert system that warns you about important thresholds:

### Context Usage Alerts

| Alert Level | Threshold | Display | Description |
|-------------|-----------|---------|-------------|
| 🔴 **Critical** | 90%+ | `⚠ CTX 95%!` (red bold) | Context window nearly full, consider `/compact` |
| 🟡 **Warning** | 75-89% | `⚠ CTX 80%` (yellow) | Context usage high, plan compaction soon |
| 🟢 **Normal** | < 75% | Standard display | Context usage healthy |

### Cost Alerts

| Alert Level | Threshold | Display | Description |
|-------------|-----------|---------|-------------|
| 💰 **High Cost** | $1.00+ | Cost highlighted | Session cost exceeds $1 |
| 💵 **Medium Cost** | $0.50-$0.99 | Cost displayed | Session cost moderate |
| 💚 **Low Cost** | < $0.50 | Standard display | Session cost low |

### Session Duration Alerts

| Alert Level | Threshold | Display | Description |
|-------------|-----------|---------|-------------|
| ⏰ **Long Session** | 30m+ | Session time highlighted | Consider breaks for long sessions |
| 🔴 **Very Long** | 60m+ | Session time in red | Very long session, consider checkpoints |

### Compact Mode Suggestion

When `showCompactSuggestion` is enabled:

| Condition | Display | Action |
|-----------|---------|--------|
| Tool calls > threshold | `⚠️ 75 calls try /compact` | Suggests running `/compact` to reduce context |

**Default threshold:** 50 tool calls (configurable via `compactSuggestionThreshold`)

### API Usage Alerts

Displayed when usage approaches limits:

| Window | Threshold | Display |
|--------|-----------|---------|
| 5-hour | 80%+ | `⚠️ 5h:85%` in yellow/red |
| 7-day | 80%+ | `⚠️ 7d:89%` in yellow/red |

**Note:** API usage alerts require `showUsage: true` in configuration.

### Customizing Alerts

Edit `~/.claude/plugins/claude-code-cockpit/config.json`:

```json
{
  "notifications": {
    "enabled": false,
    "compactWarningThreshold": 75,        // Context % for warning
    "compactSuggestionEnabled": true,      // Enable /compact suggestions
    "compactSuggestionThreshold": 50       // Tool calls before suggesting
  },
  "display": {
    "sevenDayThreshold": 80                // % before showing 7-day usage
  }
}
```

## 📦 Development

### Getting Started

1. **Clone and install**
```bash
git clone https://github.com/baeseokjae/claude-code-cockpit.git
cd claude-code-cockpit
pnpm install
```

2. **Build and watch**
```bash
# Build once
pnpm build

# Watch mode (auto-rebuild on changes)
pnpm dev
```

3. **Run tests**
```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Update snapshots
pnpm test:update-snapshots
```

### Testing

Claude Code Cockpit has **comprehensive test coverage** with 321 tests across 27 test files:

| Test Suite | Tests | Coverage |
|------------|-------|----------|
| **Unit Tests** | 270+ | Core functionality |
| **Integration Tests** | 16 | End-to-end scenarios |
| **Theme Tests** | 25 | All 5 themes |

**Test categories:**
- `tests/unit/` - Unit tests for individual modules
- `tests/integration/` - Integration tests
- `tests/*.test.ts` - Feature-specific tests (git, cache, workflow, etc.)

**Running specific tests:**
```bash
# Run specific test file
pnpm test tests/theme-helpers.test.ts

# Run with pattern
pnpm test --grep "workflow"

# Debug mode
DEBUG=* pnpm test
```

### Manual Testing

Test the statusline with sample stdin:

```bash
# Basic test
echo '{"model":{"display_name":"Opus"},"context_window":{"used_percentage":45},"cwd":"/test"}' | node dist/index.js

# Debug mode (shows internal logging)
echo '{"model":{"display_name":"Opus"}}' | DEBUG=* node dist/index.js

# Test with transcript
echo '{"model":{"display_name":"Sonnet"},"transcript_path":"./tests/fixtures/sample.jsonl","cwd":"/test"}' | node dist/index.js
```

### Theme Preview

**Note:** The theme preview script is currently unavailable. You can test themes by changing the `theme` setting in your config and running manual tests with sample stdin (see examples above).

### Type Checking

```bash
# Type check without building
pnpm lint
```

### Debugging

Enable debug logging with the `DEBUG` environment variable:

```bash
# All debug output
DEBUG=* node dist/index.js < sample.json

# Specific modules
DEBUG=main,git,transcript node dist/index.js < sample.json

# Common debug namespaces:
# - main: Main entry point
# - git: Git operations
# - transcript: Transcript parsing
# - config: Configuration loading
# - themes: Theme rendering
# - usage-api: API usage fetching
# (27 namespaces available - use DEBUG=* to see all)
```


### Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork and clone** the repository
2. **Create a branch** for your feature (`git checkout -b feature/amazing-feature`)
3. **Write tests** for your changes
4. **Ensure tests pass** (`pnpm test`)
5. **Type check** (`pnpm lint`)
6. **Commit your changes** with clear messages
7. **Push to your fork** and **create a Pull Request**

**Code style:**
- Use TypeScript
- Follow existing code conventions
- Add JSDoc comments for public APIs
- Write tests for new features
- Update documentation as needed

**Pull Request checklist:**
- [ ] Tests pass (`pnpm test`)
- [ ] Type check passes (`pnpm lint`)
- [ ] Documentation updated
- [ ] Follows existing code style

## 📁 Project Structure

```
claude-code-cockpit/
├── .claude-plugin/          # Plugin metadata
│   ├── plugin.json          # Plugin manifest (name, version, commands)
│   └── marketplace.json     # Marketplace metadata
│
├── commands/                # Interactive command scripts
│   ├── dashboard.md         # /claude-code-cockpit:dashboard
│   ├── tools.md             # /claude-code-cockpit:tools
│   ├── agents.md            # /claude-code-cockpit:agents
│   ├── todos.md             # /claude-code-cockpit:todos
│   ├── usage.md             # /claude-code-cockpit:usage
│   ├── setup.md             # /claude-code-cockpit:setup
│   └── configure.md         # /claude-code-cockpit:configure
│
├── src/                     # Source code (TypeScript)
│   ├── index.ts             # Main entry point and orchestration
│   │
│   ├── types/               # TypeScript type definitions
│   │   ├── index.ts         # Main types export
│   │   ├── stdin.ts         # Stdin JSON schema
│   │   ├── transcript.ts    # Transcript types
│   │   ├── theme.ts         # Theme system types
│   │   ├── config.ts        # Configuration types
│   │   └── ...              # Feature-specific types
│   │
│   ├── input/               # Input processing
│   │   ├── stdin.ts         # Read and parse stdin JSON
│   │   ├── transcript.ts    # Parse transcript.jsonl
│   │   ├── config-reader.ts # Count .claude.md, rules, MCP, hooks
│   │   ├── mcp-reader.ts    # Read .claude.json for MCP config
│   │   └── cli.ts           # CLI argument parsing
│   │
│   ├── data/                # Data extraction and calculation
│   │   ├── git.ts           # Git status, branch, tag, worktrees
│   │   ├── time.ts          # Session duration formatting
│   │   ├── cost.ts          # Cost calculation per model
│   │   ├── usage-api.ts     # Fetch API usage limits
│   │   ├── speed-tracker.ts # Token speed calculation
│   │   ├── lines.ts         # Code lines added/removed
│   │   ├── cache-metrics.ts # Cache hit rate and savings
│   │   ├── git-activity.ts  # Commits and PRs created
│   │   ├── tool-stats.ts    # Tool success/failure rates
│   │   ├── bash-errors.ts   # Bash error tracking
│   │   ├── compact-suggestion.ts # /compact suggestion logic
│   │   ├── rule-violations.ts   # Code quality violations
│   │   ├── workflow-phase.ts    # PLAN/IMPLEMENT/REVIEW detection
│   │   ├── test-coverage.ts     # Test coverage parsing
│   │   ├── pass-at-k.ts         # Pass@k metrics
│   │   ├── mcp-status.ts        # MCP server statistics
│   │   ├── performance-metrics.ts # Build/test performance
│   │   ├── instance-sync.ts     # Multi-instance sync
│   │   └── session-time.ts      # Session time calculation
│   │
│   ├── config/              # Configuration management
│   │   ├── loader.ts        # Load config from file/env
│   │   ├── defaults.ts      # Default configuration values
│   │   └── presets.ts       # Configuration presets
│   │
│   ├── themes/              # Theme system
│   │   ├── index.ts         # Theme loader
│   │   ├── aurora.ts        # Aurora theme (default)
│   │   ├── neon.ts          # Neon theme
│   │   ├── mono.ts          # Mono theme
│   │   ├── zen.ts           # Zen theme
│   │   ├── retro.ts         # Retro theme
│   │   ├── helpers.ts       # Shared theme utilities
│   │   ├── icons.ts         # Icon definitions
│   │   └── palettes/        # Color palettes
│   │       ├── aurora.ts
│   │       ├── neon.ts
│   │       ├── mono.ts
│   │       ├── zen.ts
│   │       └── retro.ts
│   │
│   ├── render/              # Rendering utilities
│   │   ├── colors.ts        # ANSI color functions
│   │   ├── superscript.ts   # Superscript number conversion
│   │   ├── links.ts         # OSC 8 hyperlink generation
│   │   ├── usage.ts         # API usage rendering
│   │   └── utils.ts         # General rendering helpers
│   │
│   ├── output/              # Output handling
│   │   ├── writer.ts        # Write to stdout
│   │   └── session-file.ts  # Write /tmp/cockpit-session.md
│   │
│   └── utils/               # Utility functions
│       ├── debug.ts         # Debug logging
│       ├── constants.ts     # Constants (model IDs, pricing, etc.)
│       ├── cache.ts         # File caching
│       ├── font-detect.ts   # Terminal font detection
│       └── terminal-width.ts # Terminal width utilities
│
├── tests/                   # Test suite (Vitest)
│   ├── unit/                # Unit tests
│   │   ├── config/
│   │   ├── data/
│   │   ├── input/
│   │   ├── render/
│   │   └── themes/
│   ├── fixtures/            # Test fixtures
│   │   ├── config/
│   │   ├── stdin/
│   │   └── transcript/
│   └── *.test.ts            # Feature tests (321 tests total)
│
├── assets/                  # Theme screenshots
│   ├── theme-aurora.svg
│   ├── theme-neon.svg
│   ├── theme-mono.svg
│   ├── theme-zen.svg
│   └── theme-retro.svg
│
├── dist/                    # Build output (generated)
│   ├── index.js             # Compiled entry point
│   └── ...                  # Compiled modules
│
├── package.json             # NPM package configuration
├── tsconfig.json            # TypeScript configuration
├── vitest.config.ts         # Vitest test configuration
├── LICENSE                  # MIT license
└── README.md                # This file
```

### Key Directories

- **`src/`**: All TypeScript source code
  - **`input/`**: Parse stdin and transcript
  - **`data/`**: Extract and calculate metrics
  - **`themes/`**: Theme rendering logic
  - **`output/`**: Write statusline and session file
- **`tests/`**: Comprehensive test suite (321 tests)
- **`commands/`**: Interactive command scripts for Claude Code

## 📋 Changelog

### Recent Changes (Unreleased v2.0)

**Phase 1-5 Enhancements:**
- ✨ Strategic compact suggestion with threshold-based alerts
- 🔍 Rule violations detection (secrets, console.log, large files)
- 🔄 Workflow phase detection (PLAN/IMPLEMENT/REVIEW)
- 🧪 Test coverage analysis (framework-agnostic)
- 📊 Pass@k metrics for AI code quality
- 🌳 Git worktree support
- 🔌 MCP status and per-server statistics
- 🔗 Instance synchronization (experimental)

**v1.0.0 Initial Release:**
- 🎨 5 premium themes (Aurora, Neon, Mono, Zen, Retro)
- 🔧 Comprehensive tool tracking
- 🤖 Agent monitoring
- 📊 Git integration
- 💰 Cost estimation
- 🚨 Smart alerts

## ❓ FAQ

### General Questions

**Q: What is Claude Code Cockpit?**
A: Claude Code Cockpit is a statusline plugin for Claude Code that provides real-time monitoring of your AI-powered development session. It displays tools, agents, costs, git status, and much more in a beautiful, customizable HUD.

**Q: Is it free?**
A: Yes, Claude Code Cockpit is 100% free and open-source under the MIT license.

**Q: Does it require any API keys or external services?**
A: No, Claude Code Cockpit has zero external dependencies and works entirely with Node.js built-in modules. It reads data from Claude Code's stdin and transcript.

### Installation & Setup

**Q: How do I install it?**
A: Simply run `/plugin install claude-code-cockpit` inside Claude Code, then run `/claude-code-cockpit:setup` to configure the statusline.

**Q: Can I use it with Claude Code CLI only?**
A: Yes, Claude Code Cockpit works with both Claude Code CLI and any IDE integration.

**Q: Which terminals are supported?**
A: Any terminal with ANSI color support. For best experience, use iTerm2, VSCode Terminal, Windows Terminal, Kitty, or Ghostty. These terminals also support clickable hyperlinks.

### Configuration

**Q: How do I change the theme?**
A: Run `/claude-code-cockpit:configure` and select your preferred theme, or set `COCKPIT_THEME` environment variable (aurora/neon/mono/zen/retro).

**Q: Can I disable specific features?**
A: Yes, run `/claude-code-cockpit:configure` to interactively toggle features, or edit `~/.claude/plugins/claude-code-cockpit/config.json` directly.

**Q: What is "detail mode"?**
A: Detail mode enables additional advanced features like workflow phase detection, test coverage, and Pass@k metrics. Enable it via `/claude-code-cockpit:configure` or set `COCKPIT_DETAIL=1`.

### Features

**Q: What are the different tiers?**
A: Claude Code Cockpit has 3 responsive tiers based on terminal width:
- **Tier 1 (< 80 cols)**: Minimal - Model, context, git, time
- **Tier 2 (80-120 cols)**: Compact - Tier 1 + tools, agents, todos
- **Tier 3 (120+ cols)**: Full - Tier 2 + box layout, tokens, cost, advanced features

**Q: How does cost estimation work?**
A: Cost is calculated based on token usage and official Anthropic pricing for each model (Opus/Sonnet/Haiku). It includes both input and output tokens.

**Q: What is Pass@k?**
A: Pass@k is a metric that measures AI code generation quality. Pass@1 is the success rate on the first attempt, Pass@3 is success within 3 attempts, etc. Higher values indicate better code generation.

**Q: How does workflow phase detection work?**
A: The plugin analyzes your recent tool usage patterns to detect whether you're in PLAN (Read-heavy), IMPLEMENT (Edit/Write-heavy), or REVIEW (Test/Grep-heavy) phase. It shows confidence percentage.

### Troubleshooting

**Q: The statusline isn't showing up**
A:
1. Check that statusline is enabled: run `/claude-code-cockpit:setup`
2. Verify installation: `/plugin list` should show claude-code-cockpit
3. Check Claude Code version: requires v2.0+
4. Restart Claude Code

**Q: Colors look wrong**
A:
1. Ensure your terminal supports 256 colors or true color
2. Try a different theme: `/claude-code-cockpit:configure`
3. Check terminal settings for color support

**Q: Performance is slow**
A:
1. Disable advanced features you don't need via `/claude-code-cockpit:configure`
2. Reduce `maxTools` and `maxAgents` in config
3. Disable `showGitWorktrees` if you don't use worktrees
4. Use Tier 1 or 2 by resizing your terminal width

**Q: The `/tmp/cockpit-session.md` file is missing**
A: The session file is generated automatically when the statusline runs. If missing:
1. Ensure statusline is active (run any command in Claude Code)
2. Check write permissions for `/tmp/`
3. Try running `/claude-code-cockpit:dashboard` to regenerate

### Development

**Q: How can I contribute?**
A: See the [Development](#-development) section above. We welcome bug reports, feature requests, and pull requests!

**Q: How do I report a bug?**
A: Open an issue on [GitHub Issues](https://github.com/baeseokjae/claude-code-cockpit/issues) with:
- Claude Code version
- Node.js version
- Terminal type
- Steps to reproduce
- Expected vs actual behavior

**Q: Can I create my own theme?**
A: Yes! See `src/themes/` for theme examples. Copy an existing theme, customize colors, and submit a PR!

## 🙏 Inspired By

Claude Code Cockpit stands on the shoulders of giants. Special thanks to these projects:

- **[jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud)** – Original inspiration for terminal-based HUD plugin for Claude Code
- **Terminal powerline tools** – Inspired the multi-tier responsive layout system

## 🤝 Contributing

We welcome contributions! Whether it's:
- 🐛 Bug reports
- 💡 Feature requests
- 📖 Documentation improvements
- 🎨 New themes
- ✨ Code contributions

Please see the [Development](#-development) section for guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

Copyright (c) 2026 baeseokjae

---

<div align="center">

**[⬆ Back to Top](#claude-code-cockpit)**

Made with ❤️ for the Claude Code community

</div>
