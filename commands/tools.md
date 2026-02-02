---
description: Show detailed tool usage statistics and history
allowed-tools: Read
---

# Tool Usage Details

Read `/tmp/cockpit-session.md` and display detailed tool information.

## Instructions

1. Read `/tmp/cockpit-session.md`
2. Extract tool usage data from "## 도구 사용" section
3. Parse both the table and summary sections

## Output Format

### 🔧 Tool Usage Report

#### Summary
Display total tool calls from section header.

#### By Tool (sorted by count)
Extract from "### 도구별 사용 횟수" section:
- Create table with columns: Rank, Tool, Count, Percentage
- Sort by count descending
- Calculate percentage of total

Example:
| # | Tool | Count | % |
|---|------|-------|---|
| 1 | Read | 15 | 48% |
| 2 | Edit | 8 | 26% |
| 3 | Bash | 5 | 16% |

#### Recent Calls
Extract from "## 도구 사용 (N회)" table:
- Show last 10 tool calls
- Display: Number, Tool, Target, Status (✅/❌/🔄)

Format as a clean markdown table.
