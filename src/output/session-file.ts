/**
 * Session information file writer
 * Writes detailed session info to /tmp/cockpit-session.md
 */

import { writeFileSync } from 'node:fs';
import type { RenderContext } from '../types/index.js';
import { getModelName, getContextPercent } from '../input/stdin.js';
import { formatResetTime } from '../data/usage-api.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('session-file');

const SESSION_FILE_PATH = '/tmp/cockpit-session.md';

export function writeSessionFile(ctx: RenderContext): void {
  try {
    const content = generateSessionMarkdown(ctx);
    writeFileSync(SESSION_FILE_PATH, content, 'utf8');
    debug('session file written to', SESSION_FILE_PATH);
  } catch (error) {
    debug('failed to write session file:', error);
  }
}

function generateSessionMarkdown(ctx: RenderContext): string {
  const model = getModelName(ctx.stdin);
  const percent = getContextPercent(ctx.stdin);
  const percentStr = percent !== null ? `${Math.round(percent)}%` : 'N/A';
  const cost = ctx.stdin.cost?.total_cost_usd;
  const costStr = cost !== undefined ? `$${cost.toFixed(2)}` : 'N/A';
  const duration = ctx.sessionDuration;

  let md = `# Claude Code Session\n\n`;
  md += `## 기본 정보\n\n`;
  md += `- **Model**: ${model}\n`;
  md += `- **Context**: ${percentStr}\n`;
  md += `- **Cost**: ${costStr}\n`;
  md += `- **Duration**: ${duration}\n`;

  if (ctx.stdin.cwd) {
    md += `- **Directory**: ${ctx.stdin.cwd}\n`;
  }

  if (ctx.gitStatus?.branch) {
    const dirty = ctx.gitStatus.isDirty ? ' (dirty)' : '';
    md += `- **Git Branch**: ${ctx.gitStatus.branch}${dirty}\n`;
  }

  md += `\n---\n\n`;

  // Tools
  if (ctx.transcript.tools.length > 0) {
    md += `## 도구 사용 (${ctx.transcript.tools.length}회)\n\n`;
    md += `| # | 도구 | 대상 | 상태 |\n`;
    md += `|---|------|------|------|\n`;

    ctx.transcript.tools.forEach((tool, idx) => {
      const status = tool.status === 'running' ? '🔄' :
                     tool.status === 'error' ? '❌' : '✅';
      const target = tool.target || '-';
      md += `| ${idx + 1} | ${tool.name} | ${target} | ${status} |\n`;
    });

    md += `\n`;

    // Tools summary
    const toolCounts = new Map<string, number>();
    for (const tool of ctx.transcript.tools) {
      toolCounts.set(tool.name, (toolCounts.get(tool.name) || 0) + 1);
    }

    md += `### 도구별 사용 횟수\n\n`;
    const sorted = [...toolCounts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [name, count] of sorted) {
      md += `- **${name}**: ${count}회\n`;
    }

    md += `\n---\n\n`;
  }

  // Agents
  if (ctx.transcript.agents.length > 0) {
    md += `## 에이전트 (${ctx.transcript.agents.length}개)\n\n`;

    ctx.transcript.agents.forEach((agent, idx) => {
      const status = agent.status === 'running' ? '🔄 Running' :
                     agent.status === 'error' ? '❌ Error' : '✅ Completed';
      const model = agent.model ? ` (${agent.model})` : '';
      const desc = agent.description || '';

      md += `### ${idx + 1}. ${agent.type}${model}\n\n`;
      md += `- **Status**: ${status}\n`;
      if (desc) {
        md += `- **Description**: ${desc}\n`;
      }
      md += `\n`;
    });

    md += `---\n\n`;
  }

  // Todos
  if (ctx.transcript.todos.length > 0) {
    const total = ctx.transcript.todos.length;
    const completed = ctx.transcript.todos.filter(t => t.status === 'completed').length;
    md += `## 할일 (${completed}/${total})\n\n`;

    ctx.transcript.todos.forEach((todo, idx) => {
      const icon = todo.status === 'completed' ? '✅' :
                   todo.status === 'in_progress' ? '🔄' : '⬜';
      md += `${icon} ${idx + 1}. ${todo.content}\n`;
    });

    md += `\n---\n\n`;
  }

  // Usage
  if (ctx.usageData) {
    md += `## 사용량\n\n`;

    const fiveReset = formatResetTime(ctx.usageData.fiveHourResetAt);
    const sevenReset = formatResetTime(ctx.usageData.sevenDayResetAt);

    md += `- **5시간**: ${Math.round(ctx.usageData.fiveHour)}%`;
    if (fiveReset) {
      md += ` (리셋까지 ${fiveReset})`;
    }
    md += `\n`;

    md += `- **7일**: ${Math.round(ctx.usageData.sevenDay)}%`;
    if (sevenReset) {
      md += ` (리셋까지 ${sevenReset})`;
    }
    md += `\n`;

    if (ctx.usageData.fiveHourResetAt) {
      md += `- **5시간 리셋**: ${ctx.usageData.fiveHourResetAt}\n`;
    }
    if (ctx.usageData.sevenDayResetAt) {
      md += `- **7일 리셋**: ${ctx.usageData.sevenDayResetAt}\n`;
    }

    md += `\n---\n\n`;
  }

  // Git Activity
  if (ctx.gitActivity && (ctx.gitActivity.commits > 0 || ctx.gitActivity.pullRequests > 0)) {
    md += `## Git Activity\n\n`;
    if (ctx.gitActivity.commits > 0) {
      md += `- **Commits**: ${ctx.gitActivity.commits}\n`;
    }
    if (ctx.gitActivity.pullRequests > 0) {
      md += `- **Pull Requests**: ${ctx.gitActivity.pullRequests}\n`;
    }
    md += `\n---\n\n`;
  }

  // Tool Statistics
  if (ctx.toolStats && ctx.toolStats.total > 0) {
    md += `## Tool Statistics\n\n`;
    md += `- **Total**: ${ctx.toolStats.total}\n`;
    md += `- **Success**: ${ctx.toolStats.success} (${ctx.toolStats.successRate}%)\n`;
    md += `- **Errors**: ${ctx.toolStats.error} (${100 - ctx.toolStats.successRate}%)\n`;
    md += `\n---\n\n`;
  }

  // Bash Errors
  if (ctx.bashErrors && ctx.bashErrors.length > 0) {
    md += `## Bash Errors\n\n`;
    ctx.bashErrors.forEach((error, idx) => {
      md += `### ${idx + 1}. Exit Code ${error.exitCode}\n\n`;
      md += `- **Command**: \`${error.command}\`\n`;
      md += `- **Output**: ${error.output}\n`;
      md += `- **Time**: ${error.timestamp.toISOString()}\n`;
      md += `\n`;
    });
    md += `---\n\n`;
  }

  // Workflow Phase
  if (ctx.workflowState && ctx.workflowState.currentPhase !== 'UNKNOWN') {
    md += `## Workflow Phase\n\n`;
    md += `- **Current Phase**: ${ctx.workflowState.currentPhase}\n`;
    md += `- **Confidence**: ${ctx.workflowState.confidence}%\n`;
    if (ctx.workflowState.phaseDuration > 0) {
      const durationMin = Math.floor(ctx.workflowState.phaseDuration / 60000);
      const durationSec = Math.floor((ctx.workflowState.phaseDuration % 60000) / 1000);
      md += `- **Phase Duration**: ${durationMin}m ${durationSec}s\n`;
    }

    if (ctx.workflowState.phaseHistory.length > 0) {
      md += `\n### Phase History\n\n`;
      ctx.workflowState.phaseHistory.forEach((entry, idx) => {
        const duration = entry.duration ? ` (${Math.floor(entry.duration / 60000)}m)` : '';
        md += `${idx + 1}. **${entry.phase}**${duration}\n`;
      });
    }

    md += `\n---\n\n`;
  }

  // Violations
  if (ctx.violations && ctx.violations.total > 0) {
    md += `## Code Violations (${ctx.violations.total})\n\n`;

    const violationsByType = [
      { type: 'hardcoded_secret', label: '🔴 Hardcoded Secrets', emoji: '🔴' },
      { type: 'console_log', label: '🟡 Console Logs', emoji: '🟡' },
      { type: 'large_file', label: '🟡 Large Files', emoji: '🟡' },
      { type: 'debug_statement', label: '🟡 Debug Statements', emoji: '🟡' },
      { type: 'todo_comment', label: '🔵 TODO Comments', emoji: '🔵' },
      { type: 'fixme_comment', label: '🔵 FIXME Comments', emoji: '🔵' },
    ];

    violationsByType.forEach(({ type, label }) => {
      const count = ctx.violations!.byType.get(type as any) || 0;
      if (count > 0) {
        md += `- **${label}**: ${count}\n`;
      }
    });

    if (ctx.violations.violations.length > 0) {
      md += `\n### Violation Details\n\n`;
      ctx.violations.violations.forEach((violation, idx) => {
        md += `#### ${idx + 1}. ${violation.type.replace('_', ' ').toUpperCase()}\n\n`;
        if (violation.file) {
          md += `- **File**: \`${violation.file}\`\n`;
        }
        if (violation.line) {
          md += `- **Line**: ${violation.line}\n`;
        }
        md += `- **Message**: ${violation.message}\n`;
        md += `- **Severity**: ${violation.severity}\n`;
        md += `\n`;
      });
    }

    md += `---\n\n`;
  }

  // Compact Suggestion
  if (ctx.compactSuggestion && ctx.compactSuggestion.shouldSuggest) {
    md += `## ⚠️ Compact Mode Suggestion\n\n`;
    md += `현재 세션에서 **${ctx.compactSuggestion.totalToolCalls}개**의 도구 호출이 발생했습니다.\n\n`;
    md += `컨텍스트를 효율적으로 관리하기 위해 **/compact** 모드 사용을 권장합니다.\n\n`;
    md += `- **Threshold**: ${ctx.compactSuggestion.threshold}\n`;
    md += `- **Current**: ${ctx.compactSuggestion.totalToolCalls}\n`;
    md += `\n---\n\n`;
  }

  // MCP Impact
  if (ctx.mcpInfo && ctx.mcpInfo.serverCount > 0) {
    md += `## MCP Configuration\n\n`;
    md += `- **Servers**: ${ctx.mcpInfo.serverCount}\n`;
    md += `- **Estimated Tools**: ~${ctx.mcpInfo.estimatedToolCount}\n`;
    if (ctx.mcpInfo.servers.length > 0) {
      md += `\n### Active Servers\n\n`;
      ctx.mcpInfo.servers.forEach((name: string) => {
        md += `- ${name}\n`;
      });
    }
    md += `\n---\n\n`;
  }

  // Test Coverage
  if (ctx.testCoverage && ctx.testCoverage.coverage?.hasData) {
    md += `## Test Coverage\n\n`;
    const { overall } = ctx.testCoverage.coverage;
    md += `- **Statements**: ${overall.statements}%\n`;
    md += `- **Branches**: ${overall.branches}%\n`;
    md += `- **Functions**: ${overall.functions}%\n`;
    md += `- **Lines**: ${overall.lines}%\n`;
    md += `- **Framework**: ${ctx.testCoverage.testFramework}\n`;
    md += `\n---\n\n`;
  }

  // Pass@k Metrics
  if (ctx.passAtK && ctx.passAtK.hasData && ctx.passAtK.metrics) {
    md += `## Code Generation Quality (Pass@k)\n\n`;
    const { passAt1, passAt3, passAt5, totalAttempts, successfulAttempts, failedAttempts, averageAttemptsToSuccess } = ctx.passAtK.metrics;
    md += `- **Pass@1**: ${passAt1}% (success on first attempt)\n`;
    md += `- **Pass@3**: ${passAt3}% (success within 3 attempts)\n`;
    md += `- **Pass@5**: ${passAt5}% (success within 5 attempts)\n`;
    md += `- **Total Attempts**: ${totalAttempts}\n`;
    md += `- **Successful**: ${successfulAttempts}\n`;
    md += `- **Failed**: ${failedAttempts}\n`;
    md += `- **Avg Attempts to Success**: ${averageAttemptsToSuccess}\n`;
    md += `- **Recent Success Rate**: ${ctx.passAtK.recentSuccessRate}% (last 10)\n`;
    md += `\n---\n\n`;
  }

  // Git Worktrees
  if (ctx.gitStatus?.worktrees && ctx.gitStatus.worktrees.length > 0) {
    md += `## Git Worktrees (${ctx.gitStatus.worktrees.length})\n\n`;
    ctx.gitStatus.worktrees.forEach((wt, idx) => {
      const status = wt.isDirty ? '(dirty)' : '(clean)';
      const main = wt.isMain ? ' [MAIN]' : '';
      md += `### ${idx + 1}. ${wt.branch}${main}\n\n`;
      md += `- **Path**: ${wt.path}\n`;
      md += `- **Commit**: ${wt.commit}\n`;
      md += `- **Status**: ${status}\n`;
      md += `\n`;
    });
    md += `---\n\n`;
  }

  // MCP Status
  if (ctx.mcpStatus && ctx.mcpStatus.hasServers) {
    md += `## MCP Status\n\n`;
    md += `- **Servers**: ${ctx.mcpStatus.serverCount}\n`;
    md += `- **Total Tool Calls**: ${ctx.mcpStatus.totalToolCalls}\n\n`;

    if (ctx.mcpStatus.servers.length > 0) {
      md += `### Server Details\n\n`;
      ctx.mcpStatus.servers.forEach((server) => {
        md += `#### ${server.serverName}\n\n`;
        md += `- **Active**: ${server.isActive ? 'Yes' : 'No'}\n`;
        md += `- **Tool Count**: ${server.toolCount}\n`;
        md += `- **Total Calls**: ${server.totalCalls}\n`;
        md += `- **Success Rate**: ${server.successRate}%\n`;
        md += `\n`;
      });
    }

    if (ctx.mcpStatus.mostUsedTool) {
      md += `### Most Used Tool\n\n`;
      md += `- **Tool**: ${ctx.mcpStatus.mostUsedTool.toolName}\n`;
      md += `- **Server**: ${ctx.mcpStatus.mostUsedTool.serverName}\n`;
      md += `- **Call Count**: ${ctx.mcpStatus.mostUsedTool.callCount}\n`;
      md += `- **Success Rate**: ${Math.round((ctx.mcpStatus.mostUsedTool.successCount / ctx.mcpStatus.mostUsedTool.callCount) * 100)}%\n`;
      md += `\n`;
    }

    md += `---\n\n`;
  }

  // Instance Sync
  if (ctx.instanceSync && ctx.instanceSync.hasMultipleInstances) {
    md += `## Instance Sync\n\n`;
    md += `- **Multiple Instances**: Yes\n`;
    md += `- **Instance Count**: ${ctx.instanceSync.instanceCount}\n`;
    md += `- **Sync Enabled**: ${ctx.instanceSync.syncEnabled ? 'Yes' : 'No'}\n`;
    md += `- **Active Team**: ${ctx.instanceSync.hasActiveTeam ? 'Yes' : 'No'}\n`;
    md += `- **Conflicts**: ${ctx.instanceSync.conflictCount}\n\n`;

    if (ctx.instanceSync.status.instances.length > 0) {
      md += `### Active Instances\n\n`;
      ctx.instanceSync.status.instances.forEach((instance, idx) => {
        const isCurrent = instance.sessionId === ctx.instanceSync!.status.currentInstance.sessionId;
        const marker = isCurrent ? ' [CURRENT]' : '';
        md += `#### ${idx + 1}. ${instance.hostname}${marker}\n\n`;
        md += `- **Session**: ${instance.sessionId}\n`;
        md += `- **Project**: ${instance.projectPath}\n`;
        md += `- **Branch**: ${instance.branch}\n`;
        md += `- **Last Active**: ${instance.lastActive.toISOString()}\n`;
        md += `\n`;
      });
    }

    if (ctx.instanceSync.status.conflicts.length > 0) {
      md += `### Conflicts\n\n`;
      ctx.instanceSync.status.conflicts.forEach((conflict, idx) => {
        md += `#### ${idx + 1}. ${conflict.projectPath} @ ${conflict.branch}\n\n`;
        md += `**${conflict.instances.length} instances** working on the same project and branch:\n\n`;
        conflict.instances.forEach((inst) => {
          md += `- Session \`${inst.sessionId}\` on ${inst.hostname}\n`;
        });
        md += `\n`;
      });
    }

    md += `---\n\n`;
  }

  // Quick Commands & Aliases
  md += `## Quick Commands\n\n`;
  md += `### Session Management\n`;
  md += `- \`/compact\` - Enable compact mode to reduce context usage\n`;
  md += `- \`/clear\` - Clear conversation history\n`;
  md += `- \`/help\` - Show help information\n\n`;

  md += `### Cockpit Commands\n`;
  md += `- \`/claude-code-cockpit:dashboard\` - Show comprehensive dashboard\n`;
  md += `- \`/claude-code-cockpit:usage\` - Show API usage statistics\n`;
  md += `- \`/claude-code-cockpit:todos\` - Show todo list\n`;
  md += `- \`/claude-code-cockpit:agents\` - Show agent details\n`;
  md += `- \`/claude-code-cockpit:tools\` - Show tool statistics\n`;
  md += `- \`/claude-code-cockpit:configure\` - Configure theme and options\n\n`;

  if (ctx.violations && ctx.violations.total > 0) {
    md += `### Recommended Actions\n`;
    if ((ctx.violations.byType.get('hardcoded_secret') || 0) > 0) {
      md += `- ⚠️ **Remove hardcoded secrets** before committing\n`;
    }
    if ((ctx.violations.byType.get('console_log') || 0) > 0) {
      md += `- 🔍 **Remove debug console.log statements** for production\n`;
    }
    if ((ctx.violations.byType.get('large_file') || 0) > 0) {
      md += `- 📦 **Review large files** for optimization opportunities\n`;
    }
    md += `\n`;
  }

  md += `---\n\n`;

  md += `*Generated by claude-code-cockpit*\n`;

  return md;
}
