/**
 * Session information file writer
 * Writes detailed session info to /tmp/cockpit-session.md
 */

import { writeFileSync } from 'node:fs';
import type { RenderContext } from '../types/index.js';
import type { ViolationType } from '../types/violations.js';
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

  const lines: string[] = [];
  lines.push('# Claude Code Session');
  lines.push('');
  lines.push('## 기본 정보');
  lines.push('');
  lines.push(`- **Model**: ${model}`);
  lines.push(`- **Context**: ${percentStr}`);
  lines.push(`- **Cost**: ${costStr}`);
  lines.push(`- **Duration**: ${duration}`);

  if (ctx.stdin.cwd) {
    lines.push(`- **Directory**: ${ctx.stdin.cwd}`);
  }

  if (ctx.gitStatus?.branch) {
    const dirty = ctx.gitStatus.isDirty ? ' (dirty)' : '';
    lines.push(`- **Git Branch**: ${ctx.gitStatus.branch}${dirty}`);
  }

  lines.push('', '---', '');

  // Tools
  if (ctx.transcript.tools.length > 0) {
    lines.push(`## 도구 사용 (${ctx.transcript.tools.length}회)`);
    lines.push('');
    lines.push(`| # | 도구 | 대상 | 상태 |`);
    lines.push(`|---|------|------|------|`);

    ctx.transcript.tools.forEach((tool, idx) => {
      const status = tool.status === 'running' ? '🔄' :
                     tool.status === 'error' ? '❌' : '✅';
      const target = tool.target || '-';
      lines.push(`| ${idx + 1} | ${tool.name} | ${target} | ${status} |`);
    });

    lines.push('');

    // Tools summary
    const toolCounts = new Map<string, number>();
    for (const tool of ctx.transcript.tools) {
      toolCounts.set(tool.name, (toolCounts.get(tool.name) || 0) + 1);
    }

    lines.push(`### 도구별 사용 횟수`);
    lines.push('');
    const sorted = [...toolCounts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [name, count] of sorted) {
      lines.push(`- **${name}**: ${count}회`);
    }

    lines.push('', '---', '');
  }

  // Agents
  if (ctx.transcript.agents.length > 0) {
    lines.push(`## 에이전트 (${ctx.transcript.agents.length}개)`);
    lines.push('');

    ctx.transcript.agents.forEach((agent, idx) => {
      const status = agent.status === 'running' ? '🔄 Running' :
                     agent.status === 'error' ? '❌ Error' : '✅ Completed';
      const model = agent.model ? ` (${agent.model})` : '';
      const desc = agent.description || '';

      lines.push(`### ${idx + 1}. ${agent.type}${model}`);
      lines.push('');
      lines.push(`- **Status**: ${status}`);
      if (desc) {
        lines.push(`- **Description**: ${desc}`);
      }
      lines.push('');
    });

    lines.push('---', '');
  }

  // Todos
  if (ctx.transcript.todos.length > 0) {
    const total = ctx.transcript.todos.length;
    const completed = ctx.transcript.todos.filter(t => t.status === 'completed').length;
    lines.push(`## 할일 (${completed}/${total})`);
    lines.push('');

    ctx.transcript.todos.forEach((todo, idx) => {
      const icon = todo.status === 'completed' ? '✅' :
                   todo.status === 'in_progress' ? '🔄' : '⬜';
      lines.push(`${icon} ${idx + 1}. ${todo.content}`);
    });

    lines.push('', '---', '');
  }

  // Usage
  if (ctx.usageData) {
    lines.push(`## 사용량`);
    lines.push('');

    const fiveReset = formatResetTime(ctx.usageData.fiveHourResetAt);
    const sevenReset = formatResetTime(ctx.usageData.sevenDayResetAt);

    let fiveLine = `- **5시간**: ${Math.round(ctx.usageData.fiveHour)}%`;
    if (fiveReset) {
      fiveLine += ` (리셋까지 ${fiveReset})`;
    }
    lines.push(fiveLine);

    let sevenLine = `- **7일**: ${Math.round(ctx.usageData.sevenDay)}%`;
    if (sevenReset) {
      sevenLine += ` (리셋까지 ${sevenReset})`;
    }
    lines.push(sevenLine);

    if (ctx.usageData.fiveHourResetAt) {
      lines.push(`- **5시간 리셋**: ${ctx.usageData.fiveHourResetAt}`);
    }
    if (ctx.usageData.sevenDayResetAt) {
      lines.push(`- **7일 리셋**: ${ctx.usageData.sevenDayResetAt}`);
    }

    lines.push('', '---', '');
  }

  // Git Activity
  if (ctx.gitActivity && (ctx.gitActivity.commits > 0 || ctx.gitActivity.pullRequests > 0)) {
    lines.push(`## Git Activity`);
    lines.push('');
    if (ctx.gitActivity.commits > 0) {
      lines.push(`- **Commits**: ${ctx.gitActivity.commits}`);
    }
    if (ctx.gitActivity.pullRequests > 0) {
      lines.push(`- **Pull Requests**: ${ctx.gitActivity.pullRequests}`);
    }
    lines.push('', '---', '');
  }

  // Tool Statistics
  if (ctx.toolStats && ctx.toolStats.total > 0) {
    lines.push(`## Tool Statistics`);
    lines.push('');
    lines.push(`- **Total**: ${ctx.toolStats.total}`);
    lines.push(`- **Success**: ${ctx.toolStats.success} (${ctx.toolStats.successRate}%)`);
    lines.push(`- **Errors**: ${ctx.toolStats.error} (${100 - ctx.toolStats.successRate}%)`);
    lines.push('', '---', '');
  }

  // Bash Errors
  if (ctx.bashErrors && ctx.bashErrors.length > 0) {
    lines.push(`## Bash Errors`);
    lines.push('');
    ctx.bashErrors.forEach((error, idx) => {
      lines.push(`### ${idx + 1}. Exit Code ${error.exitCode}`);
      lines.push('');
      lines.push(`- **Command**: \`${error.command}\``);
      lines.push(`- **Output**: ${error.output}`);
      lines.push(`- **Time**: ${error.timestamp.toISOString()}`);
      lines.push('');
    });
    lines.push('---', '');
  }

  // Workflow Phase
  if (ctx.workflowState && ctx.workflowState.currentPhase !== 'UNKNOWN') {
    lines.push(`## Workflow Phase`);
    lines.push('');
    lines.push(`- **Current Phase**: ${ctx.workflowState.currentPhase}`);
    lines.push(`- **Confidence**: ${ctx.workflowState.confidence}%`);
    if (ctx.workflowState.phaseDuration > 0) {
      const durationMin = Math.floor(ctx.workflowState.phaseDuration / 60000);
      const durationSec = Math.floor((ctx.workflowState.phaseDuration % 60000) / 1000);
      lines.push(`- **Phase Duration**: ${durationMin}m ${durationSec}s`);
    }

    if (ctx.workflowState.phaseHistory.length > 0) {
      lines.push('', '### Phase History', '');
      ctx.workflowState.phaseHistory.forEach((entry, idx) => {
        const duration = entry.duration ? ` (${Math.floor(entry.duration / 60000)}m)` : '';
        lines.push(`${idx + 1}. **${entry.phase}**${duration}`);
      });
    }

    lines.push('', '---', '');
  }

  // Violations
  if (ctx.violations && ctx.violations.total > 0) {
    lines.push(`## Code Violations (${ctx.violations.total})`);
    lines.push('');

    const violationsByType: Array<{ type: ViolationType; label: string }> = [
      { type: 'hardcoded_secret', label: '🔴 Hardcoded Secrets' },
      { type: 'console_log', label: '🟡 Console Logs' },
      { type: 'large_file', label: '🟡 Large Files' },
      { type: 'debug_statement', label: '🟡 Debug Statements' },
      { type: 'todo_comment', label: '🔵 TODO Comments' },
      { type: 'fixme_comment', label: '🔵 FIXME Comments' },
    ];

    violationsByType.forEach(({ type, label }) => {
      const count = ctx.violations!.byType.get(type) || 0;
      if (count > 0) {
        lines.push(`- **${label}**: ${count}`);
      }
    });

    if (ctx.violations.violations.length > 0) {
      lines.push('', '### Violation Details', '');
      ctx.violations.violations.forEach((violation, idx) => {
        lines.push(`#### ${idx + 1}. ${violation.type.replace('_', ' ').toUpperCase()}`);
        lines.push('');
        if (violation.file) {
          lines.push(`- **File**: \`${violation.file}\``);
        }
        if (violation.line) {
          lines.push(`- **Line**: ${violation.line}`);
        }
        lines.push(`- **Message**: ${violation.message}`);
        lines.push(`- **Severity**: ${violation.severity}`);
        lines.push('');
      });
    }

    lines.push('---', '');
  }

  // Compact Suggestion
  if (ctx.compactSuggestion && ctx.compactSuggestion.shouldSuggest) {
    lines.push(`## ⚠️ Compact Mode Suggestion`);
    lines.push('');
    lines.push(`현재 세션에서 **${ctx.compactSuggestion.totalToolCalls}개**의 도구 호출이 발생했습니다.`);
    lines.push('');
    lines.push(`컨텍스트를 효율적으로 관리하기 위해 **/compact** 모드 사용을 권장합니다.`);
    lines.push('');
    lines.push(`- **Threshold**: ${ctx.compactSuggestion.threshold}`);
    lines.push(`- **Current**: ${ctx.compactSuggestion.totalToolCalls}`);
    lines.push('', '---', '');
  }

  // MCP Impact
  if (ctx.mcpInfo && ctx.mcpInfo.serverCount > 0) {
    lines.push(`## MCP Configuration`);
    lines.push('');
    lines.push(`- **Servers**: ${ctx.mcpInfo.serverCount}`);
    lines.push(`- **Estimated Tools**: ~${ctx.mcpInfo.estimatedToolCount}`);
    if (ctx.mcpInfo.servers.length > 0) {
      lines.push('', '### Active Servers', '');
      ctx.mcpInfo.servers.forEach((name: string) => {
        lines.push(`- ${name}`);
      });
    }
    lines.push('', '---', '');
  }

  // Test Coverage
  if (ctx.testCoverage && ctx.testCoverage.coverage?.hasData) {
    lines.push(`## Test Coverage`);
    lines.push('');
    const { overall } = ctx.testCoverage.coverage;
    lines.push(`- **Statements**: ${overall.statements}%`);
    lines.push(`- **Branches**: ${overall.branches}%`);
    lines.push(`- **Functions**: ${overall.functions}%`);
    lines.push(`- **Lines**: ${overall.lines}%`);
    lines.push(`- **Framework**: ${ctx.testCoverage.testFramework}`);
    lines.push('', '---', '');
  }

  // Pass@k Metrics
  if (ctx.passAtK && ctx.passAtK.hasData && ctx.passAtK.metrics) {
    lines.push(`## Code Generation Quality (Pass@k)`);
    lines.push('');
    const { passAt1, passAt3, passAt5, totalAttempts, successfulAttempts, failedAttempts, averageAttemptsToSuccess } = ctx.passAtK.metrics;
    lines.push(`- **Pass@1**: ${passAt1}% (success on first attempt)`);
    lines.push(`- **Pass@3**: ${passAt3}% (success within 3 attempts)`);
    lines.push(`- **Pass@5**: ${passAt5}% (success within 5 attempts)`);
    lines.push(`- **Total Attempts**: ${totalAttempts}`);
    lines.push(`- **Successful**: ${successfulAttempts}`);
    lines.push(`- **Failed**: ${failedAttempts}`);
    lines.push(`- **Avg Attempts to Success**: ${averageAttemptsToSuccess}`);
    lines.push(`- **Recent Success Rate**: ${ctx.passAtK.recentSuccessRate}% (last 10)`);
    lines.push('', '---', '');
  }

  // Git Worktrees
  if (ctx.gitStatus?.worktrees && ctx.gitStatus.worktrees.length > 0) {
    lines.push(`## Git Worktrees (${ctx.gitStatus.worktrees.length})`);
    lines.push('');
    ctx.gitStatus.worktrees.forEach((wt, idx) => {
      const status = wt.isDirty ? '(dirty)' : '(clean)';
      const main = wt.isMain ? ' [MAIN]' : '';
      lines.push(`### ${idx + 1}. ${wt.branch}${main}`);
      lines.push('');
      lines.push(`- **Path**: ${wt.path}`);
      lines.push(`- **Commit**: ${wt.commit}`);
      lines.push(`- **Status**: ${status}`);
      lines.push('');
    });
    lines.push('---', '');
  }

  // MCP Status
  if (ctx.mcpStatus && ctx.mcpStatus.hasServers) {
    lines.push(`## MCP Status`);
    lines.push('');
    lines.push(`- **Servers**: ${ctx.mcpStatus.serverCount}`);
    lines.push(`- **Total Tool Calls**: ${ctx.mcpStatus.totalToolCalls}`);
    lines.push('');

    if (ctx.mcpStatus.servers.length > 0) {
      lines.push(`### Server Details`);
      lines.push('');
      ctx.mcpStatus.servers.forEach((server) => {
        lines.push(`#### ${server.serverName}`);
        lines.push('');
        lines.push(`- **Active**: ${server.isActive ? 'Yes' : 'No'}`);
        lines.push(`- **Tool Count**: ${server.toolCount}`);
        lines.push(`- **Total Calls**: ${server.totalCalls}`);
        lines.push(`- **Success Rate**: ${server.successRate}%`);
        lines.push('');
      });
    }

    if (ctx.mcpStatus.mostUsedTool) {
      lines.push(`### Most Used Tool`);
      lines.push('');
      lines.push(`- **Tool**: ${ctx.mcpStatus.mostUsedTool.toolName}`);
      lines.push(`- **Server**: ${ctx.mcpStatus.mostUsedTool.serverName}`);
      lines.push(`- **Call Count**: ${ctx.mcpStatus.mostUsedTool.callCount}`);
      lines.push(`- **Success Rate**: ${Math.round((ctx.mcpStatus.mostUsedTool.successCount / ctx.mcpStatus.mostUsedTool.callCount) * 100)}%`);
      lines.push('');
    }

    lines.push('---', '');
  }

  // Instance Sync
  if (ctx.instanceSync && ctx.instanceSync.hasMultipleInstances) {
    lines.push(`## Instance Sync`);
    lines.push('');
    lines.push(`- **Multiple Instances**: Yes`);
    lines.push(`- **Instance Count**: ${ctx.instanceSync.instanceCount}`);
    lines.push(`- **Sync Enabled**: ${ctx.instanceSync.syncEnabled ? 'Yes' : 'No'}`);
    lines.push(`- **Active Team**: ${ctx.instanceSync.hasActiveTeam ? 'Yes' : 'No'}`);
    lines.push(`- **Conflicts**: ${ctx.instanceSync.conflictCount}`);
    lines.push('');

    if (ctx.instanceSync.status.instances.length > 0) {
      lines.push(`### Active Instances`);
      lines.push('');
      ctx.instanceSync.status.instances.forEach((instance, idx) => {
        const isCurrent = instance.sessionId === ctx.instanceSync!.status.currentInstance.sessionId;
        const marker = isCurrent ? ' [CURRENT]' : '';
        lines.push(`#### ${idx + 1}. ${instance.hostname}${marker}`);
        lines.push('');
        lines.push(`- **Session**: ${instance.sessionId}`);
        lines.push(`- **Project**: ${instance.projectPath}`);
        lines.push(`- **Branch**: ${instance.branch}`);
        lines.push(`- **Last Active**: ${instance.lastActive.toISOString()}`);
        lines.push('');
      });
    }

    if (ctx.instanceSync.status.conflicts.length > 0) {
      lines.push(`### Conflicts`);
      lines.push('');
      ctx.instanceSync.status.conflicts.forEach((conflict, idx) => {
        lines.push(`#### ${idx + 1}. ${conflict.projectPath} @ ${conflict.branch}`);
        lines.push('');
        lines.push(`**${conflict.instances.length} instances** working on the same project and branch:`);
        lines.push('');
        conflict.instances.forEach((inst) => {
          lines.push(`- Session \`${inst.sessionId}\` on ${inst.hostname}`);
        });
        lines.push('');
      });
    }

    lines.push('---', '');
  }

  // Quick Commands & Aliases
  lines.push(`## Quick Commands`);
  lines.push('');
  lines.push(`### Session Management`);
  lines.push(`- \`/compact\` - Enable compact mode to reduce context usage`);
  lines.push(`- \`/clear\` - Clear conversation history`);
  lines.push(`- \`/help\` - Show help information`);
  lines.push('');

  lines.push(`### Cockpit Commands`);
  lines.push(`- \`/claude-code-cockpit:dashboard\` - Show comprehensive dashboard`);
  lines.push(`- \`/claude-code-cockpit:usage\` - Show API usage statistics`);
  lines.push(`- \`/claude-code-cockpit:todos\` - Show todo list`);
  lines.push(`- \`/claude-code-cockpit:agents\` - Show agent details`);
  lines.push(`- \`/claude-code-cockpit:tools\` - Show tool statistics`);
  lines.push(`- \`/claude-code-cockpit:configure\` - Configure theme and options`);
  lines.push('');

  if (ctx.violations && ctx.violations.total > 0) {
    lines.push(`### Recommended Actions`);
    if ((ctx.violations.byType.get('hardcoded_secret') || 0) > 0) {
      lines.push(`- ⚠️ **Remove hardcoded secrets** before committing`);
    }
    if ((ctx.violations.byType.get('console_log') || 0) > 0) {
      lines.push(`- 🔍 **Remove debug console.log statements** for production`);
    }
    if ((ctx.violations.byType.get('large_file') || 0) > 0) {
      lines.push(`- 📦 **Review large files** for optimization opportunities`);
    }
    lines.push('');
  }

  lines.push('---', '');

  lines.push(`*Generated by claude-code-cockpit*`);

  return lines.join('\n') + '\n';
}
