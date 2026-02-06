/**
 * MCP (Model Context Protocol) status analysis
 * Tracks MCP server and tool usage patterns
 */

import type { ToolEntry } from '../types/index.js';
import type { McpStatus, McpServerStatus, McpToolUsage } from '../types/mcp-status.js';
import type { McpToolInfo } from '../input/mcp-reader.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('mcp-status');

/**
 * Analyze MCP tool usage from transcript
 */
export function analyzeMcpStatus(tools: ToolEntry[], mcpInfo: McpToolInfo | null): McpStatus | null {
  if (!mcpInfo || mcpInfo.serverCount === 0) {
    return null;
  }

  // Track tool usage by server
  const toolUsageMap = new Map<string, McpToolUsage>();
  let totalToolCalls = 0;

  for (const tool of tools) {
    // MCP tools typically have a server prefix
    // Example: "mcp-filesystem:read", "mcp-web:fetch"
    if (tool.name.includes(':') || tool.name.startsWith('mcp-')) {
      const parts = tool.name.split(':');
      const serverName = parts[0].replace('mcp-', '');
      const toolName = parts[1] || tool.name;

      const key = `${serverName}:${toolName}`;
      const existing = toolUsageMap.get(key);

      if (existing) {
        existing.callCount++;
        if (tool.status === 'completed') existing.successCount++;
        if (tool.status === 'error') existing.errorCount++;
        if (tool.startTime && (!existing.lastUsed || tool.startTime > existing.lastUsed)) {
          existing.lastUsed = tool.startTime;
        }
      } else {
        toolUsageMap.set(key, {
          toolName,
          serverName,
          callCount: 1,
          successCount: tool.status === 'completed' ? 1 : 0,
          errorCount: tool.status === 'error' ? 1 : 0,
          lastUsed: tool.startTime || null,
        });
      }

      totalToolCalls++;
    }
  }

  // Group by server
  const serverMap = new Map<string, McpServerStatus>();

  for (const usage of toolUsageMap.values()) {
    const existing = serverMap.get(usage.serverName);

    if (existing) {
      existing.toolCount++;
      existing.totalCalls += usage.callCount;
      existing.tools.push(usage);
    } else {
      serverMap.set(usage.serverName, {
        serverName: usage.serverName,
        isActive: true,
        toolCount: 1,
        totalCalls: usage.callCount,
        successRate: 0,
        tools: [usage],
      });
    }
  }

  // Calculate success rates
  for (const server of serverMap.values()) {
    const totalSuccess = server.tools.reduce((sum, t) => sum + t.successCount, 0);
    const totalCalls = server.tools.reduce((sum, t) => sum + t.callCount, 0);
    server.successRate = totalCalls > 0 ? Math.round((totalSuccess / totalCalls) * 100) : 0;
  }

  const servers = Array.from(serverMap.values());

  // Find most used tool
  let mostUsedTool: McpToolUsage | null = null;
  let maxCalls = 0;

  for (const usage of toolUsageMap.values()) {
    if (usage.callCount > maxCalls) {
      maxCalls = usage.callCount;
      mostUsedTool = usage;
    }
  }

  debug('mcp status:', { serverCount: servers.length, totalToolCalls });

  return {
    hasServers: servers.length > 0,
    serverCount: servers.length,
    totalToolCalls,
    servers,
    mostUsedTool,
  };
}
