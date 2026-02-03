# Claude Code Cockpit

> Next-generation real-time dashboard for Claude Code

[한국어](./README.ko.md)

Advanced HUD system for Claude Code featuring 5 themes, skill tracking, and detail mode.

## ✨ Features

- 🎨 **5 Themes**: Aurora, Neon, Mono, Zen, Retro
- 🔧 **Tool Tracking**: Monitor Read, Edit, Bash, Grep, and all tool activity
- 🤖 **Agent Tracking**: Real-time Task subagent monitoring
- ✅ **Todo Progress**: Track TodoWrite task status
- ⚡ **Skill Tracking**: Monitor /commit, /review-pr and other skill invocations
- 📊 **Git Status**: Branch name and dirty indicator
- 💰 **Cost Estimation**: Token-based cost calculation per model
- 🚨 **Smart Alerts**: Context/cost/session warnings
- 📱 **Responsive Layout**: Auto-adjusts to terminal width
- 🚀 **Zero Dependencies**: Uses only Node.js built-in modules

## 🚀 Installation

### From Marketplace (Recommended)

Run inside Claude Code:

```bash
# 1. Add marketplace source
/plugin marketplace add baeseokjae/claude-code-cockpit

# 2. Install plugin
/plugin install claude-code-cockpit

# 3. Configure statusline
/claude-code-cockpit:setup
```

### Local Development

```bash
# Clone repository
git clone https://github.com/baeseokjae/claude-code-cockpit.git
cd claude-code-cockpit

# Install dependencies and build
pnpm install
pnpm build

# Test locally
cc --plugin-dir .
```

## 📋 Commands

Claude Code Cockpit provides several interactive commands for detailed session monitoring:

### Session Monitoring Commands

- `/claude-code-cockpit:dashboard` - Show comprehensive session dashboard with all statistics
- `/claude-code-cockpit:tools` - Display detailed tool usage statistics and history
- `/claude-code-cockpit:agents` - Show agent execution details and status
- `/claude-code-cockpit:todos` - Display todo list with completion status
- `/claude-code-cockpit:usage` - Show API usage statistics and rate limits

### Configuration Commands

- `/claude-code-cockpit:setup` - Configure Claude Code statusline to use claude-code-cockpit
- `/claude-code-cockpit:configure` - Configure theme and display options interactively

All commands read from `/tmp/cockpit-session.md` which is automatically updated during your session.

## 🎨 Themes

### Aurora (Default)
Inspired by Aurora Borealis. Polar night sky with green-teal-purple aurora gradients.

**Example Output:**

![Aurora Theme](./assets/theme-aurora.svg)

### Neon
Cyberpunk neon sign aesthetic. High-contrast fluorescent green, cyan, and hot pink.

**Example Output:**

![Neon Theme](./assets/theme-neon.svg)

### Mono
Pure black & white minimal. ASCII-compatible, accessibility-first design.

**Example Output:**

![Mono Theme](./assets/theme-mono.svg)

### Zen
Ultra-minimal design. Calm tones inspired by traditional paper and ink.

**Example Output:**

![Zen Theme](./assets/theme-zen.svg)

### Retro
80s CRT phosphor monitor nostalgia. Green phosphor glow and vintage terminal vibes.

**Example Output:**

![Retro Theme](./assets/theme-retro.svg)

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
- **File modification statistics** - Track modified/added/deleted/untracked file counts
- **Monorepo support** - Display branches from multiple subdirectories
- **Clickable GitHub links** - Terminal-dependent hyperlinks to GitHub branch URLs

### Terminal Hyperlinks
- **Clickable file paths** - OSC 8 escape sequences for file:// protocol links
- **Clickable GitHub URLs** - Direct links to GitHub branch pages
- **Automatic compatibility detection** - Smart detection of terminal hyperlink support
- **Supported terminals**: iTerm2, Apple Terminal, VSCode Terminal, Kitty, Windows Terminal, Ghostty

### Session File Export
- **Auto-generated session summary** - Markdown file at `/tmp/cockpit-session.md`
- **Used by all commands** - All `/claude-code-cockpit:*` commands read this file
- **Comprehensive data** - Includes tools, agents, todos, usage statistics, git status

## ⚙️ Configuration

After installation, run `/claude-code-cockpit:configure` to set theme and display options, or use environment variables.

### Environment Variables

```bash
# Select theme
export COCKPIT_THEME=aurora   # aurora, neon, mono, zen, retro

# Enable detail mode
export COCKPIT_DETAIL=1

# Path display depth
export COCKPIT_PATH_LEVELS=2
```

### Configuration File

`~/.claude/plugins/claude-code-cockpit/config.json`:

```json
{
  "theme": "aurora",
  "detailMode": false,
  "display": {
    "showGit": true,
    "showTools": true,
    "showAgents": true,
    "showTodos": true,
    "showSkills": true,
    "showUsage": true,
    "showConfigCounts": true,
    "showCost": true,
    "showAbsoluteTokens": false,
    "showSessionName": true,
    "showTokenSpeed": true,
    "showGitFileStats": false,
    "showAllBranches": false,
    "showAllBranchesDepth": 2,
    "sevenDayThreshold": 80
  },
  "usage": {
    "enabled": true,
    "cacheMinutes": 10
  },
  "performance": {
    "maxTools": 20,
    "maxAgents": 10
  }
}
```

### Display Options

#### Basic Display
- `showGit` (default: true) - Show git branch and status
- `showTools` (default: true) - Show tool usage
- `showAgents` (default: true) - Show agent execution
- `showTodos` (default: true) - Show todo progress
- `showSkills` (default: true) - Show skill invocations
- `showUsage` (default: true) - Show API usage statistics
- `showCost` (default: true) - Show cost estimation

#### Token Display
- `showAbsoluteTokens` (default: false) - Show absolute token counts instead of percentages
- `showTokenSpeed` (default: true) - Show token generation speed (tok/s)

#### Session Information
- `showSessionName` (default: true) - Show session/plan name in status bar

#### Git Information
- `showGitFileStats` (default: false) - Show modified/added/deleted file counts
- `showAllBranches` (default: false) - Show branches from subdirectories (monorepo support)
- `showAllBranchesDepth` (default: 2) - Maximum depth for subdirectory git scanning

#### Configuration Counts
- `showConfigCounts` (default: true) - Show count of .claude.md, rules, MCP servers, hooks

#### Usage Warnings
- `sevenDayThreshold` (default: 80) - Percentage threshold for showing 7-day usage (0-100)

### Usage Options

- `enabled` (default: true) - Enable API usage tracking
- `cacheMinutes` (default: 10) - Cache duration for usage data in minutes

### Performance Options

- `maxTools` (default: 20) - Maximum number of tools to track
- `maxAgents` (default: 10) - Maximum number of agents to track

## 🚨 Alerts

Automatic warnings when context usage is high or cost exceeds thresholds:

- **Context Critical (90%+)**: Red bold `⚠ CTX 95%!`
- **Context Warning (75%+)**: Yellow `⚠ CTX 80%`
- **Cost Warning ($1+)**: Cost alert
- **Session Long (30m+)**: Session duration info

## 📦 Development

```bash
# Build
pnpm build

# Type check
pnpm lint

# Test
pnpm test

# Test stdin
echo '{"model":{"display_name":"Opus"},"context_window":{"used_percentage":45},"cwd":"/test"}' | node dist/index.js

# Debug mode
echo '{"model":{"display_name":"Opus"}}' | DEBUG=* node dist/index.js
```

## 📁 Project Structure

```
claude-code-cockpit/
├── .claude-plugin/
│   └── plugin.json      # Plugin manifest
├── commands/
│   ├── setup.md         # /claude-code-cockpit:setup
│   └── configure.md     # /claude-code-cockpit:configure
├── src/
│   ├── index.ts         # Main entry point
│   ├── types/           # Type definitions
│   ├── input/           # stdin, transcript parsing
│   ├── data/            # Git, time, cost, alerts
│   ├── config/          # Configuration loader
│   ├── themes/          # Theme system
│   ├── render/          # Rendering utilities
│   ├── output/          # Output handling
│   └── utils/           # Debug, constants
├── tests/               # Test files
└── dist/                # Build output
```

## 💡 Inspired By

Please check out these previous works that helped inspire the creation of claude-code-cockpit. 🙏

- [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud) – A terminal-based HUD plugin for Claude Code.
- Terminal powerline tools for status bar.

## 📄 License

MIT
