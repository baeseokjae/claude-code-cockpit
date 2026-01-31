---
description: Configure Claude Code statusline to use claude-code-cockpit
allowed-tools: Bash, Read, Edit, AskUserQuestion
---

# Setup Claude Code Cockpit Statusline

This command configures your Claude Code statusline to display the claude-code-cockpit dashboard.

---

## Step 1: Verify Plugin Installation

Check if the plugin is installed:

**macOS/Linux:**
```bash
ls -td ~/.claude/plugins/cache/claude-code-cockpit/claude-code-cockpit/*/ 2>/dev/null | head -1
```

**Windows (PowerShell):**
```powershell
(Get-ChildItem "$env:USERPROFILE\.claude\plugins\cache\claude-code-cockpit\claude-code-cockpit" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
```

If empty, stop and tell the user to install the plugin first:
```
/plugin marketplace add baeseokjae/claude-code-cockpit
/plugin install claude-code-cockpit
```

---

## Step 2: Detect Runtime

Check for Bun (preferred) or Node.js:

**macOS/Linux:**
```bash
command -v bun 2>/dev/null || command -v node 2>/dev/null
```

**Windows (PowerShell):**
```powershell
if (Get-Command bun -ErrorAction SilentlyContinue) { (Get-Command bun).Source } elseif (Get-Command node -ErrorAction SilentlyContinue) { (Get-Command node).Source }
```

If neither found, stop and tell the user to install Node.js or Bun.

Determine the source file:
- If runtime is **bun**: use `src/index.ts` (TypeScript support)
- If runtime is **node**: use `dist/index.js` (compiled JavaScript)

---

## Step 3: Generate Statusline Command

Based on platform and runtime, generate the appropriate command:

**macOS/Linux with Bun:**
```
bash -c '"{RUNTIME_PATH}" "$(ls -td ~/.claude/plugins/cache/claude-code-cockpit/claude-code-cockpit/*/ 2>/dev/null | head -1)src/index.ts"'
```

**macOS/Linux with Node:**
```
bash -c '"{RUNTIME_PATH}" "$(ls -td ~/.claude/plugins/cache/claude-code-cockpit/claude-code-cockpit/*/ 2>/dev/null | head -1)dist/index.js"'
```

**Windows with Bun:**
```
powershell -Command "& {$p=(Get-ChildItem $env:USERPROFILE\.claude\plugins\cache\claude-code-cockpit\claude-code-cockpit | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName; & '{RUNTIME_PATH}' (Join-Path $p 'src\index.ts')}"
```

**Windows with Node:**
```
powershell -Command "& {$p=(Get-ChildItem $env:USERPROFILE\.claude\plugins\cache\claude-code-cockpit\claude-code-cockpit | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName; & '{RUNTIME_PATH}' (Join-Path $p 'dist\index.js')}"
```

Replace `{RUNTIME_PATH}` with the detected runtime path.

---

## Step 4: Update Settings

Read the current settings file:

**macOS/Linux/Git Bash:**
```
Read ~/.claude/settings.json
```

**Windows (PowerShell):**
```
Read $env:USERPROFILE\.claude\settings.json
```

If the file doesn't exist, create a new configuration. If it exists, merge the statusLine configuration while preserving all existing settings.

Use the Edit tool to update the file with:

```json
{
  "statusLine": {
    "type": "command",
    "command": "{GENERATED_COMMAND}"
  }
}
```

**Note:** The generated command dynamically finds the latest installed plugin version. Updates are automatic - no need to re-run setup after plugin updates.

---

## Step 5: Verify

Use AskUserQuestion to confirm:
- Question: "Setup complete! Restart Claude Code to see the statusline. Is everything working?"
- Options: "Yes, statusline appears" / "No, need help"

If the user reports issues, guide them through troubleshooting:

1. **Verify settings were applied:**
   - Read `~/.claude/settings.json` and check statusLine.command exists

2. **Test command manually:**
   - Run the generated command and check for errors

3. **Common issues:**
   - Plugin not installed: reinstall via `/plugin install claude-code-cockpit`
   - Runtime path incorrect: re-detect runtime
   - Permission errors: check file permissions

---

## Success Message

✓ Statusline configured successfully!

**Next steps:**
- Restart Claude Code to see the new statusline
- Run `/claude-code-cockpit:configure` to customize themes and display options
- Set theme via environment: `export COCKPIT_THEME=neon`

Available themes: aurora, neon, mono, zen, retro
