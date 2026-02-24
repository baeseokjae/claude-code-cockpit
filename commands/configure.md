---
description: Configure claude-code-cockpit theme and display options
allowed-tools: Read, Write, AskUserQuestion
---

# Configure Claude Code Cockpit

Customize your statusline appearance and display options.

---

## Step 1: Load Current Configuration

Try to read the existing configuration file:

**macOS/Linux:**
```
Read ~/.claude/plugins/claude-code-cockpit/config.json
```

**Windows:**
```
Read $env:USERPROFILE\.claude\plugins\claude-code-cockpit\config.json
```

If the file doesn't exist, use default values. Store current settings for reference.

---

## Step 2: Ask User Preferences

Use AskUserQuestion to gather user preferences:

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
      "question": "Which preset do you want as a starting point?",
      "header": "Preset",
      "multiSelect": false,
      "options": [
        {
          "label": "None (manual)",
          "description": "Configure display options individually below"
        },
        {
          "label": "minimal",
          "description": "Core only: model, context%, cost, duration — no git/tools/agents"
        },
        {
          "label": "developer",
          "description": "Default + git activity and tool stats"
        },
        {
          "label": "full",
          "description": "All optional features enabled"
        }
      ]
    },
    {
      "question": "Which basic display items do you want to show?",
      "header": "Display — Basic",
      "multiSelect": true,
      "options": [
        {
          "label": "Git Status",
          "description": "showGit — branch name and dirty indicator"
        },
        {
          "label": "Tools",
          "description": "showTools — Read, Edit, Bash activity"
        },
        {
          "label": "Agents",
          "description": "showAgents — Task subagent status"
        },
        {
          "label": "Todos",
          "description": "showTodos — TodoWrite progress"
        },
        {
          "label": "Skills",
          "description": "showSkills — /commit, /review-pr calls"
        },
        {
          "label": "Cost",
          "description": "showCost — estimated session cost"
        },
        {
          "label": "Usage",
          "description": "showUsage — token usage bar"
        },
        {
          "label": "Config Counts",
          "description": "showConfigCounts — CLAUDE.md, rules, MCP, hooks counts"
        },
        {
          "label": "Bash Errors",
          "description": "showBashErrors — highlight bash command errors"
        },
        {
          "label": "Violations",
          "description": "showViolations — safety/policy violation indicators"
        },
        {
          "label": "Compact Suggestion",
          "description": "showCompactSuggestion — prompt to run /compact when context is high"
        }
      ]
    },
    {
      "question": "Which advanced display items do you want to show?",
      "header": "Display — Advanced",
      "multiSelect": true,
      "options": [
        {
          "label": "Token Speed",
          "description": "showTokenSpeed — tokens per second"
        },
        {
          "label": "Absolute Tokens",
          "description": "showAbsoluteTokens — raw token counts instead of percentage"
        },
        {
          "label": "Session Name",
          "description": "showSessionName — current session identifier"
        },
        {
          "label": "Cache Metrics",
          "description": "showCacheMetrics — prompt cache hit/miss stats"
        },
        {
          "label": "Lines",
          "description": "showLines — lines of code changed"
        }
      ]
    },
    {
      "question": "Which git extended display items do you want to show?",
      "header": "Display — Git Extended",
      "multiSelect": true,
      "options": [
        {
          "label": "Git File Stats",
          "description": "showGitFileStats — per-file change counts"
        },
        {
          "label": "All Branches",
          "description": "showAllBranches — list recent branches"
        },
        {
          "label": "Git Tag",
          "description": "showGitTag — nearest tag"
        },
        {
          "label": "Git Activity",
          "description": "showGitActivity — recent commit activity graph"
        },
        {
          "label": "Git Worktrees",
          "description": "showGitWorktrees — active worktrees"
        }
      ]
    },
    {
      "question": "Which monitoring display items do you want to show?",
      "header": "Display — Monitoring",
      "multiSelect": true,
      "options": [
        {
          "label": "Tool Stats",
          "description": "showToolStats — aggregate tool usage counts"
        },
        {
          "label": "Workflow Phase",
          "description": "showWorkflowPhase — current agent workflow phase"
        }
      ]
    },
    {
      "question": "Which integration display items do you want to show?",
      "header": "Display — Integration",
      "multiSelect": true,
      "options": [
        {
          "label": "MCP Impact",
          "description": "showMcpImpact — MCP server token cost impact"
        },
        {
          "label": "MCP Status",
          "description": "showMcpStatus — connected MCP server status"
        },
        {
          "label": "Test Coverage",
          "description": "showTestCoverage — test coverage percentage"
        },
        {
          "label": "Pass@k",
          "description": "showPassAtK — pass@k metric for code generation"
        },
        {
          "label": "Instance Sync",
          "description": "showInstanceSync — multi-instance synchronization state"
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

---

## Step 3: Generate Configuration

Based on user selections, create the configuration object. Omit `preset` if the user chose "None (manual)". Set each `show*` field according to the user's selections — fields not selected should be `false`.

```json
{
  "theme": "<selected_theme_lowercase>",
  "preset": "<selected_preset_or_omit_if_none>",
  "display": {
    "showGit": "<true_if_selected>",
    "showTools": "<true_if_selected>",
    "showAgents": "<true_if_selected>",
    "showTodos": "<true_if_selected>",
    "showSkills": "<true_if_selected>",
    "showUsage": "<true_if_selected>",
    "showConfigCounts": "<true_if_selected>",
    "showCost": "<true_if_selected>",
    "showAbsoluteTokens": "<true_if_selected>",
    "showSessionName": "<true_if_selected>",
    "showTokenSpeed": "<true_if_selected>",
    "sevenDayThreshold": 80,
    "showGitFileStats": "<true_if_selected>",
    "showAllBranches": "<true_if_selected>",
    "showAllBranchesDepth": 2,
    "showLines": "<true_if_selected>",
    "showCacheMetrics": "<true_if_selected>",
    "showGitTag": "<true_if_selected>",
    "showGitActivity": "<true_if_selected>",
    "showToolStats": "<true_if_selected>",
    "showBashErrors": "<true_if_selected>",
    "showCompactSuggestion": "<true_if_selected>",
    "showViolations": "<true_if_selected>",
    "showMcpImpact": "<true_if_selected>",
    "showWorkflowPhase": "<true_if_selected>",
    "showTestCoverage": "<true_if_selected>",
    "showPassAtK": "<true_if_selected>",
    "showGitWorktrees": "<true_if_selected>",
    "showMcpStatus": "<true_if_selected>",
    "showInstanceSync": "<true_if_selected>"
  },
  "detailMode": "<true_if_detail_yes>",
  "pathLevels": 1,
  "usage": {
    "enabled": true,
    "cacheMinutes": 10
  },
  "extraCmd": null,
  "notifications": {
    "enabled": false,
    "compactWarningThreshold": 75,
    "compactSuggestionEnabled": true,
    "compactSuggestionThreshold": 50
  },
  "rightMargin": 2,
  "maxActivityWidgets": 8
}
```

---

## Step 4: Save Configuration

Use the Write tool to save the configuration:

**macOS/Linux:**
```
Write ~/.claude/plugins/claude-code-cockpit/config.json
```

**Windows:**
```
Write $env:USERPROFILE\.claude\plugins\claude-code-cockpit\config.json
```

The Write tool will automatically create the directory if it doesn't exist.

**Note:** If no changes were made from the current configuration, skip writing and inform the user.

---

## Step 5: Confirm Success

After saving, display a summary:

Configuration saved!

**Your settings:**
- **Theme**: <selected_theme>
- **Preset**: <selected_preset_or_none>
- **Detail Mode**: <enabled_or_disabled>
- **Display**: <list_of_enabled_items>

**Next steps:**
- Settings take effect immediately (no restart needed)
- Change theme anytime: `export COCKPIT_THEME=<name>`
- Edit config manually: `~/.claude/plugins/claude-code-cockpit/config.json`

---

## Environment Variable Override

You can temporarily override settings with environment variables:

```bash
# Change theme for current session
export COCKPIT_THEME=neon           # aurora | neon | mono | zen | retro

# Apply a display preset
export COCKPIT_PRESET=developer     # minimal | developer | full

# Enable/disable Nerd Font icons
export COCKPIT_NERD_FONT=1          # 1 to enable, 0 to disable

# Enable detail mode
export COCKPIT_DETAIL=1

# Adjust path display depth
export COCKPIT_PATH_LEVELS=2

# Override the ~/.claude directory location (multi-profile support)
export CLAUDE_CONFIG_DIR=/path/to/custom/.claude
```

---

## Advanced Configuration

For advanced users, edit `~/.claude/plugins/claude-code-cockpit/config.json` directly.

Available themes: `aurora`, `neon`, `mono`, `zen`, `retro`

Available presets: `minimal`, `developer`, `full`

See documentation: https://github.com/baeseokjae/claude-code-cockpit#configuration
