---
description: Show API usage statistics and rate limits
allowed-tools: Read
---

# API Usage

Read `/tmp/cockpit-session.md` and display usage information.

## Instructions

1. Read `/tmp/cockpit-session.md`
2. Extract usage data from "## 사용량" section
3. Parse percentages and reset times

## Output Format

### 📊 API Usage Statistics

#### 5-Hour Window
Extract from "- **5시간**: X%":
- Current usage percentage
- Create progress bar (10 blocks): ▰▰▰▰▰▰▰▱▱▱
- Reset time from "- **5시간 리셋**: {time}"

Example:
```
▰▰▰▰▰▰▰▱▱▱ 72%
```
Resets in: 2h 15m

#### 7-Day Window
Extract from "- **7일**: X%":
- Current usage percentage
- Create progress bar (10 blocks)
- Reset time from "- **7일 리셋**: {time}"

Example:
```
▰▰▰▱▱▱▱▱▱▱ 28%
```
Resets in: 4d 12h

#### Status Indicator
Add warning if usage is high:
- 🟢 < 50%: Normal
- 🟡 50-80%: Moderate
- 🔴 > 80%: High

#### Notes
- Usage is approximate and may not reflect real-time data
- Pro plan limits apply
- Data cached for 1 minute for performance
