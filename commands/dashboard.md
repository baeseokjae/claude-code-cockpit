---
description: Show comprehensive session dashboard with all statistics
allowed-tools: Read
---

# Claude Code Cockpit Dashboard

Read the session file and display a comprehensive dashboard.

## Instructions

1. Read `/tmp/cockpit-session.md`
2. Parse and display the information in a clean, organized format
3. Show all sections: Session Info, Tools, Agents, Todos, Usage

## Output Format

Display the dashboard with these sections:

### 🎛️ Cockpit Dashboard

#### Session Info
Extract and display from "## 기본 정보" section:
- Model
- Context usage (%)
- Cost ($)
- Duration
- Directory
- Git Branch (if available)

#### Tools
Extract from "## 도구 사용" section:
- Total tool calls
- Top 5 tools by usage count with percentages
- Recent tool calls (last 5)

#### Agents
Extract from "## 에이전트" section:
- Total agents
- List each agent with status icon (✅/🔄/❌), type, and model

#### Todos
Extract from "## 할일" section:
- Completion ratio (completed/total)
- List all todos with status icons (✅/🔄/⬜)

#### Usage
Extract from "## 사용량" section:
- 5-Hour window: percentage + progress bar
- 7-Day window: percentage + progress bar
- Reset times

Format everything in clean markdown tables and use emojis for visual clarity.
