---
description: Show agent execution details and status
allowed-tools: Read
---

# Agent Details

Read `/tmp/cockpit-session.md` and display agent information.

## Instructions

1. Read `/tmp/cockpit-session.md`
2. Extract agent data from "## 에이전트" section
3. Parse each agent block (### 1. type (model))

## Output Format

### 🤖 Agent Report

#### Total Agents
Display count from section header.

#### Agent List
Create table with all agents:
| # | Type | Model | Status | Description |
|---|------|-------|--------|-------------|
| 1 | Explore | haiku | ✅ Completed | {description} |
| 2 | Plan | sonnet | 🔄 Running | {description} |

Extract from each agent block:
- Number (from ### heading)
- Type (from first line)
- Model (from parentheses if present)
- Status (from "**Status**:" line with icon)
- Description (from "**Description**:" line if present)

#### By Type
Count and group agents by type:
- Explore: {count}
- Plan: {count}
- Test: {count}
- etc.

Sort by count descending.
