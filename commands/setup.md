---
description: Configure Claude Code statusline to use claude-code-cockpit
allowed-tools: Read, Write, Bash(*)
---

# Setup Claude Code Cockpit Statusline

This command configures your Claude Code statusline to display the claude-code-cockpit dashboard.

## Steps

1. **Detect runtime and platform**
2. **Generate statusline command**
3. **Update ~/.claude/settings.json**

---

## 1. Detect Runtime

Check for Bun (preferred) or Node.js:

```bash
!`which bun >/dev/null 2>&1 && echo "bun" || echo "node"`
```

- **Bun**: Faster startup, can run TypeScript directly
- **Node.js**: Standard runtime, uses compiled JavaScript

---

## 2. Generate Statusline Command

The command dynamically finds the latest installed plugin version:

### macOS/Linux

**With Bun:**
```bash
bash -c '"$(which bun)" "$(ls -td ~/.claude/plugins/cache/claude-code-cockpit/claude-code-cockpit/*/ 2>/dev/null | head -1)src/index.ts"'
```

**With Node:**
```bash
bash -c '"$(which node)" "$(ls -td ~/.claude/plugins/cache/claude-code-cockpit/claude-code-cockpit/*/ 2>/dev/null | head -1)dist/index.js"'
```

### Windows

**With Bun (PowerShell):**
```powershell
powershell -Command "& {$p=(Get-ChildItem $env:USERPROFILE\.claude\plugins\cache\claude-code-cockpit\claude-code-cockpit | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName; & bun (Join-Path $p 'src\index.ts')}"
```

**With Node (PowerShell):**
```powershell
powershell -Command "& {$p=(Get-ChildItem $env:USERPROFILE\.claude\plugins\cache\claude-code-cockpit\claude-code-cockpit | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName; & node (Join-Path $p 'dist\index.js')}"
```

---

## 3. Update Settings

Read current settings:
```bash
!`cat ~/.claude/settings.json 2>/dev/null || echo "{}"`
```

Merge with new statusLine configuration and write back to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "<GENERATED_COMMAND>"
  }
}
```

---

## Success

✓ Statusline configured successfully!

The generated command automatically finds the latest plugin version. Updates are automatic - no need to re-run setup after plugin updates.

**Next steps:**
- Restart Claude Code to see the new statusline
- Run `/claude-code-cockpit:configure` to customize themes and display options
- Check `~/.claude/plugins/claude-code-cockpit/config.json` for advanced settings

---

## Troubleshooting

If statusline doesn't appear:
1. Verify settings: `cat ~/.claude/settings.json`
2. Test command manually: `<GENERATED_COMMAND>`
3. Check plugin is built: `ls ~/.claude/plugins/cache/claude-code-cockpit/*/dist/index.js`
