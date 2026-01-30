---
description: Configure claude-code-cockpit theme and display options
allowed-tools: AskUserQuestion, Write, Bash(*)
---

# Configure Claude Code Cockpit

Customize your statusline appearance and display options.

## Configuration Options

Let me help you set up your preferences.

!`AskUserQuestion`
```json
{
  "questions": [
    {
      "question": "Which theme do you want to use?",
      "header": "Theme",
      "multiSelect": false,
      "options": [
        {
          "label": "Aurora (Recommended)",
          "description": "Northern lights inspired - teal, green, purple gradients"
        },
        {
          "label": "Neon",
          "description": "Cyberpunk high-contrast - neon green, cyan, hot pink"
        },
        {
          "label": "Mono",
          "description": "Pure black & white - ASCII compatible, accessibility first"
        },
        {
          "label": "Zen",
          "description": "Ultra minimal - muted natural tones, essential info only"
        },
        {
          "label": "Retro",
          "description": "80s CRT terminal - phosphor green, vintage aesthetic"
        }
      ]
    },
    {
      "question": "What information do you want to display?",
      "header": "Display",
      "multiSelect": true,
      "options": [
        {
          "label": "Git Status",
          "description": "Show branch name and dirty indicator"
        },
        {
          "label": "Tools",
          "description": "Show Read, Edit, Bash activity"
        },
        {
          "label": "Agents",
          "description": "Show Task subagent status"
        },
        {
          "label": "Todos",
          "description": "Show TodoWrite progress"
        },
        {
          "label": "Skills",
          "description": "Show /commit, /review-pr calls"
        },
        {
          "label": "Cost",
          "description": "Show estimated session cost"
        }
      ]
    },
    {
      "question": "Enable detail mode for tool file lists?",
      "header": "Detail Mode",
      "multiSelect": false,
      "options": [
        {
          "label": "No",
          "description": "Compact view (Read ×3)"
        },
        {
          "label": "Yes",
          "description": "Show file lists (Read: file1.ts, file2.ts, ...)"
        }
      ]
    }
  ]
}
```

## Save Configuration

Create configuration directory:
```bash
!`mkdir -p ~/.claude/plugins/claude-code-cockpit`
```

Generate configuration file based on selections:

```json
{
  "theme": "<selected_theme_lowercase>",
  "detailMode": <true_if_detail_yes>,
  "display": {
    "showGit": <true_if_selected>,
    "showTools": <true_if_selected>,
    "showAgents": <true_if_selected>,
    "showTodos": <true_if_selected>,
    "showSkills": <true_if_selected>,
    "showUsage": false,
    "showConfigCounts": true,
    "showCost": <true_if_selected>
  },
  "pathLevels": 1,
  "usage": {
    "enabled": false,
    "cacheMinutes": 10
  },
  "extraCmd": null,
  "notifications": {
    "enabled": true,
    "compactWarningThreshold": 75
  },
  "performance": {
    "maxTools": 20,
    "maxAgents": 10
  }
}
```

Write to: `~/.claude/plugins/claude-code-cockpit/config.json`

---

## Success

✓ Configuration saved!

Your settings:
- **Theme**: <selected_theme>
- **Detail Mode**: <enabled_or_disabled>
- **Display**: <list_of_enabled_items>

**Next steps:**
- Settings take effect immediately (no restart needed)
- Change theme anytime: `COCKPIT_THEME=<name>`
- Edit config manually: `~/.claude/plugins/claude-code-cockpit/config.json`

---

## Environment Variable Override

You can temporarily override settings with environment variables:

```bash
# Change theme for current session
export COCKPIT_THEME=neon

# Enable detail mode
export COCKPIT_DETAIL=1

# Adjust path display depth
export COCKPIT_PATH_LEVELS=2
```

---

## Advanced Configuration

For advanced users, edit `~/.claude/plugins/claude-code-cockpit/config.json` directly.

Available themes: `aurora`, `neon`, `mono`, `zen`, `retro`

See documentation: https://github.com/baeseokjae/claude-code-cockpit#configuration
