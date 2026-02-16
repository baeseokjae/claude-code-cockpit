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

## 🎨 Themes

5 premium themes, each WCAG-compliant.

### 🌌 Aurora (Default)
Polar night sky with aurora gradients — balanced contrast, eye comfort.

![Aurora Theme](./assets/theme-aurora.svg)

### ⚡ Neon
Cyberpunk fluorescent on deep black — high visibility, bold.

![Neon Theme](./assets/theme-neon.svg)

### ⚫ Mono
Pure black & white — ASCII-compatible, maximum accessibility.

![Mono Theme](./assets/theme-mono.svg)

### 🧘 Zen
Calm earth tones — focused work, minimal distraction.

![Zen Theme](./assets/theme-zen.svg)

### 📺 Retro
Green phosphor on black — classic CRT nostalgia.

![Retro Theme](./assets/theme-retro.svg)

### Theme Comparison

| Theme | Contrast | Colors | Use Case | Accessibility |
|-------|----------|--------|----------|---------------|
| **Aurora** | Medium | 🌈 Multi-color | General, balanced | ✅ WCAG AA |
| **Neon** | High | 🎨 Bright neon | High-viz, dark mode | ✅ WCAG AAA |
| **Mono** | High | ⚫⚪ B&W only | Maximum compat | ✅ WCAG AAA |
| **Zen** | Low | 🎨 Earth tones | Focus, minimal | ✅ WCAG AA |
| **Retro** | Medium | 💚 Green mono | Nostalgia | ✅ WCAG AA |

### Switching Themes

```bash
# Interactive (recommended)
/claude-code-cockpit:configure

# Environment variable
export COCKPIT_THEME=neon

# Config file (~/.claude/plugins/claude-code-cockpit/config.json)
{ "theme": "zen" }
```

## ✨ Features

- **5 Premium Themes** — Aurora, Neon, Mono, Zen, Retro with responsive 3-tier layout
- **Tool Tracking** — Monitor all tool activity with status indicators (◐ in progress, ✓ success, ✗ error) and success rates
- **Agent Tracking** — Real-time Task subagent monitoring with model display ([h]aiku, [s]onnet, [o]pus)
- **Todo Progress** — Track TodoWrite task status with completion percentage
- **Skill Tracking** — Monitor /commit, /review-pr and other skill invocations
- **Git Integration** — Branch status, dirty indicator, tags, file stats, monorepo & worktree support
- **Cost Estimation** — Token-based cost calculation per model (Opus/Sonnet/Haiku)
- **Token Speed** — Real-time tok/s tracking for input/output
- **Cache Metrics** — Cache hit rate and estimated savings display
- **API Usage** — 5-hour and 7-day rate limits with reset timers
- **Lines Widget** — Code additions/removals (+152 -48)
- **Bash Error Tracking** — Failed commands with exit codes
- **Smart Alerts** — Context, cost, session duration warnings with configurable thresholds
- **Compact Suggestion** — Recommends `/compact` when tool calls exceed threshold
- **Code Violations** — Detect hardcoded secrets, console.log, large files, TODO/FIXME
- **Workflow Phase** — Auto-detect PLAN/IMPLEMENT/REVIEW phases with confidence scoring
- **Test Coverage** — Framework-agnostic coverage display (vitest, jest, mocha, ava)
- **Pass@k Metrics** — AI code generation quality measurement
- **MCP Status** — Per-server tool usage statistics and impact tracking
- **Terminal Hyperlinks** — Clickable file paths and GitHub URLs (OSC 8)
- **Zero Dependencies** — Uses only Node.js built-in modules, < 50ms render, 321 tests passing

## 📋 Commands

| Command | Description |
|---------|-------------|
| `/claude-code-cockpit:dashboard` | Full session overview with all statistics |
| `/claude-code-cockpit:tools` | Detailed tool usage statistics and history |
| `/claude-code-cockpit:agents` | Agent execution details and status |
| `/claude-code-cockpit:todos` | Todo list with completion status |
| `/claude-code-cockpit:usage` | API usage statistics and rate limits |
| `/claude-code-cockpit:setup` | Configure statusline (one-time setup) |
| `/claude-code-cockpit:configure` | Interactive theme and display options wizard |

All commands read from `/tmp/cockpit-session.md`, which is automatically updated during your session.

## ⚙️ Configuration

### Environment Variables

```bash
export COCKPIT_THEME=aurora        # aurora, neon, mono, zen, retro
export COCKPIT_PRESET=developer    # minimal, developer, full
export COCKPIT_DETAIL=1            # 0=off, 1=on (advanced features)
export COCKPIT_PATH_LEVELS=2       # directory levels to show
```

### Presets

| Preset | Description |
|--------|-------------|
| `minimal` | Core only: model, context%, cost, duration. Alerts always on |
| `developer` | Default + gitActivity, toolStats enabled |
| `full` | All display options enabled |

**Priority:** Default → Preset → User overrides

### Config File

`~/.claude/plugins/claude-code-cockpit/config.json`:

```json
{
  "theme": "aurora",
  "preset": "developer",
  "detailMode": false,
  "display": {
    "showGit": true,
    "showTools": true,
    "showAgents": true,
    "showTodos": true,
    "showCost": true,
    "showUsage": true,
    "showBashErrors": true,
    "showCompactSuggestion": true,
    "showViolations": true
  }
}
```

<details>
<summary><strong>Full Display Options Reference</strong></summary>

| Option | Default | Description |
|--------|---------|-------------|
| `showGit` | ✅ | Git branch and status |
| `showTools` | ✅ | Tool usage (Read, Edit, Bash, etc.) |
| `showAgents` | ✅ | Agent execution status |
| `showTodos` | ✅ | Todo progress tracking |
| `showSkills` | ❌ | Skill invocations (/commit, /review-pr) |
| `showUsage` | ✅ | API usage statistics |
| `showCost` | ✅ | Cost estimation |
| `showAbsoluteTokens` | ❌ | Absolute token counts instead of percentages |
| `showTokenSpeed` | ❌ | Token generation speed (tok/s) |
| `showSessionName` | ✅ | Session/plan name in status bar |
| `showGitTag` | ❌ | Latest git tag next to branch |
| `showGitActivity` | ❌ | Commits and PRs created during session |
| `showGitFileStats` | ❌ | Modified/added/deleted file counts |
| `showAllBranches` | ❌ | Branches from subdirectories (monorepo) |
| `showAllBranchesDepth` | 2 | Max depth for subdirectory scanning |
| `showGitWorktrees` | ❌ | Git worktree status |
| `showLines` | ✅ | Code additions/removals (+152 -48) |
| `showCacheMetrics` | ❌ | Cache hit rate and savings |
| `showConfigCounts` | ❌ | Count of .claude.md, rules, MCP, hooks |
| `showToolStats` | ❌ | Overall tool success/failure rate |
| `showBashErrors` | ✅ | Failed bash commands with exit codes |
| `showCompactSuggestion` | ✅ | `/compact` suggestion when threshold exceeded |
| `showViolations` | ✅ | Code violations (secrets, console.log) |
| `showMcpImpact` | ❌ | MCP server configuration and tool count |
| `showWorkflowPhase` | ❌ | Current workflow phase (PLAN/IMPLEMENT/REVIEW) |
| `showTestCoverage` | ❌ | Test coverage percentage |
| `showPassAtK` | ❌ | Pass@k code generation quality metrics |
| `showMcpStatus` | ❌ | MCP server usage statistics |
| `showPerformanceMetrics` | ❌ | Build/test performance (experimental) |
| `showInstanceSync` | ❌ | Multi-instance sync (experimental) |
| `sevenDayThreshold` | 80 | % threshold for 7-day usage warning |

**Notification options:** `compactWarningThreshold` (default: 75), `compactSuggestionThreshold` (default: 50)

**Usage options:** `usage.enabled` (default: true), `usage.cacheMinutes` (default: 10)

**Performance options:** `maxTools` (default: 20), `maxAgents` (default: 20)

**Additional options:** `rightMargin` (default: 2), `maxActivityWidgets` (default: 8), `pathLevels` (default: 1)

</details>

<details>
<summary><strong>Example Configurations</strong></summary>

#### Minimal (Performance-focused)
```json
{
  "theme": "mono",
  "detailMode": false,
  "display": {
    "showGit": true, "showTools": true, "showAgents": false,
    "showTodos": false, "showUsage": false, "showCost": true
  },
  "performance": { "maxTools": 10, "maxAgents": 5 }
}
```

#### Full-Featured (Power User)
```json
{
  "theme": "aurora",
  "preset": "full",
  "detailMode": true,
  "performance": { "maxTools": 50, "maxAgents": 50 }
}
```

#### Security-Focused
```json
{
  "theme": "neon",
  "detailMode": true,
  "display": { "showViolations": true, "showBashErrors": true }
}
```

</details>

## 🚨 Alerts

| Alert | Threshold | Display |
|-------|-----------|---------|
| 🔴 Context Critical | 90%+ | `⚠ CTX 95%!` (red bold) |
| 🟡 Context Warning | 75-89% | `⚠ CTX 80%` (yellow) |
| 💰 High Cost | $1.00+ | Cost highlighted |
| ⏰ Long Session | 30m+ / 60m+ | Session time highlighted |
| 📦 Compact Suggestion | 50+ tool calls | `⚠️ 75 calls try /compact` |
| 📊 API Usage | 80%+ (5h/7d) | `⚠️ 5h:85%` in yellow/red |

Configure thresholds in `notifications` section of config file.

## 🚀 Installation

### Prerequisites

- **Claude Code** 2.0+
- **Node.js** 18.0.0+
- **Terminal** with ANSI color support (recommended: iTerm2, VSCode Terminal, Windows Terminal, Kitty)

### Method 1: From Marketplace (Recommended)

```bash
/plugin install claude-code-cockpit
/claude-code-cockpit:setup
/claude-code-cockpit:dashboard
```

### Method 2: Manual Installation

```bash
git clone https://github.com/baeseokjae/claude-code-cockpit.git
cd claude-code-cockpit
pnpm install
pnpm build
pnpm link --global
```

Then in Claude Code:
```bash
/plugin install <path-to-cloned-repo>
/claude-code-cockpit:setup
```

### Method 3: Development Mode

```bash
pnpm dev  # Watch mode

# In another terminal
cc --plugin-dir .

# Or test stdin directly
echo '{"model":{"display_name":"Opus"}}' | node dist/index.js
```

## 📦 Development

### Getting Started

```bash
git clone https://github.com/baeseokjae/claude-code-cockpit.git
cd claude-code-cockpit
pnpm install
pnpm build    # Build once
pnpm dev      # Watch mode
```

### Testing

321 tests across 27 test files (270+ unit, 16 integration, 25 theme tests).

```bash
pnpm test                    # Run all tests
pnpm test:watch              # Watch mode
pnpm test:coverage           # Coverage report
pnpm test:update-snapshots   # Update snapshots
pnpm lint                    # Type check
```

<details>
<summary><strong>Manual Testing & Debugging</strong></summary>

```bash
# Basic test
echo '{"model":{"display_name":"Opus"},"context_window":{"used_percentage":45},"cwd":"/test"}' | node dist/index.js

# Debug mode
echo '{"model":{"display_name":"Opus"}}' | DEBUG=* node dist/index.js

# Specific debug namespaces
DEBUG=main,git,transcript node dist/index.js < sample.json
# (27 namespaces available - use DEBUG=* to see all)
```

</details>

### Contributing

1. Fork and clone the repository
2. Create a branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure tests pass (`pnpm test`) and type check (`pnpm lint`)
5. Commit and create a Pull Request

**PR checklist:**
- [ ] Tests pass (`pnpm test`)
- [ ] Type check passes (`pnpm lint`)
- [ ] Documentation updated
- [ ] Follows existing code style

## 🙏 Inspired By

- **[jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud)** – Original inspiration for terminal-based HUD plugin for Claude Code
- **Terminal powerline tools** – Inspired the multi-tier responsive layout system

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

Copyright (c) 2026 baeseokjae

---

<div align="center">

**[⬆ Back to Top](#claude-code-cockpit)**

Made with ❤️ for the Claude Code community

</div>
