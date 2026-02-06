/**
 * MCP (Model Context Protocol) status type definitions
 */

export interface McpToolUsage {
  toolName: string;
  serverName: string;
  callCount: number;
  successCount: number;
  errorCount: number;
  lastUsed: Date | null;
}

export interface McpServerStatus {
  serverName: string;
  isActive: boolean;
  toolCount: number;
  totalCalls: number;
  successRate: number;
  tools: McpToolUsage[];
}

export interface McpStatus {
  hasServers: boolean;
  serverCount: number;
  totalToolCalls: number;
  servers: McpServerStatus[];
  mostUsedTool: McpToolUsage | null;
}
