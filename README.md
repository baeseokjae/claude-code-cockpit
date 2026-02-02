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
    "showUsage": false,
    "showCost": true
  }
}
```

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
