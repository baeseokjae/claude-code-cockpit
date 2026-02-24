---
description: Show todo list with completion status
allowed-tools: Read
---

# Todo List

Read `/tmp/cockpit-session.md` and display todo information.

## Instructions

1. Read `/tmp/cockpit-session.md`
2. Extract todos from "## 할일" section
3. Parse completion ratio from section header

## Output Format

### 📋 Todo List

#### Progress
Display completion ratio from header "## 할일 (X/Y)":
- Calculate percentage
- Show progress bar
- Example: "3/5 completed (60%)"

#### Tasks by Status

**✅ Completed**
List all completed tasks (✅ prefix)

**🔄 In Progress**
List all in-progress tasks (🔄 prefix)

**⬜ Pending**
List all pending tasks (⬜ prefix)

#### Summary Table
| Status | Count | % |
|--------|-------|---|
| ✅ Completed | {count} | {percent}% |
| 🔄 In Progress | {count} | {percent}% |
| ⬜ Pending | {count} | {percent}% |
| **Total** | {total} | 100% |

Format each todo as:
- Status icon
- Number (if present)
- Task description
