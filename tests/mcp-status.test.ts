/**
 * mcp-status.test.ts
 * MCP status analysis tests
 */

import { describe, it, expect } from 'vitest';
import { analyzeMcpStatus } from '../src/data/mcp-status.js';
import type { ToolEntry } from '../src/types/index.js';
import type { McpToolInfo } from '../src/input/mcp-reader.js';

const createMcpTool = (name: string, status: 'completed' | 'error' = 'completed'): ToolEntry => ({
  id: `tool-${Math.random()}`,
  name,
  status,
  target: null as any,
  startTime: new Date(),
});

const defaultMcpInfo: McpToolInfo = {
  serverCount: 2,
  estimatedToolCount: 20,
  servers: ['filesystem', 'web'],
};

describe('analyzeMcpStatus', () => {
  it('should return null when no mcpInfo', () => {
    const result = analyzeMcpStatus([], null);
    expect(result).toBeNull();
  });

  it('should return null when serverCount is 0', () => {
    const result = analyzeMcpStatus([], { serverCount: 0, estimatedToolCount: 0, servers: [] });
    expect(result).toBeNull();
  });

  it('should track MCP tool usage with colon separator', () => {
    const tools = [
      createMcpTool('filesystem:read'),
      createMcpTool('filesystem:write'),
      createMcpTool('web:fetch'),
    ];

    const result = analyzeMcpStatus(tools, defaultMcpInfo);

    expect(result).not.toBeNull();
    expect(result!.totalToolCalls).toBe(3);
    expect(result!.servers.length).toBe(2);
  });

  it('should track mcp- prefixed tools', () => {
    const tools = [
      createMcpTool('mcp-filesystem:read'),
      createMcpTool('mcp-filesystem:write'),
    ];

    const result = analyzeMcpStatus(tools, defaultMcpInfo);

    expect(result).not.toBeNull();
    expect(result!.totalToolCalls).toBe(2);
    // Server name should have mcp- prefix stripped
    const server = result!.servers.find(s => s.serverName === 'filesystem');
    expect(server).toBeDefined();
    expect(server!.totalCalls).toBe(2);
  });

  it('should ignore non-MCP tools', () => {
    const tools = [
      createMcpTool('Read'),
      createMcpTool('Edit'),
      createMcpTool('Write'),
    ];

    const result = analyzeMcpStatus(tools, defaultMcpInfo);

    expect(result).not.toBeNull();
    expect(result!.totalToolCalls).toBe(0);
    expect(result!.servers.length).toBe(0);
  });

  it('should calculate success rates', () => {
    const tools = [
      createMcpTool('filesystem:read', 'completed'),
      createMcpTool('filesystem:read', 'completed'),
      createMcpTool('filesystem:read', 'error'),
    ];

    const result = analyzeMcpStatus(tools, defaultMcpInfo);

    expect(result).not.toBeNull();
    const server = result!.servers.find(s => s.serverName === 'filesystem');
    expect(server).toBeDefined();
    expect(server!.successRate).toBe(67); // 2/3 = 66.67 -> rounds to 67
  });

  it('should find most used tool', () => {
    const tools = [
      createMcpTool('filesystem:read'),
      createMcpTool('filesystem:read'),
      createMcpTool('filesystem:read'),
      createMcpTool('web:fetch'),
    ];

    const result = analyzeMcpStatus(tools, defaultMcpInfo);

    expect(result).not.toBeNull();
    expect(result!.mostUsedTool).not.toBeNull();
    expect(result!.mostUsedTool!.toolName).toBe('read');
    expect(result!.mostUsedTool!.callCount).toBe(3);
  });

  it('should handle empty tools with valid mcpInfo', () => {
    const result = analyzeMcpStatus([], defaultMcpInfo);

    expect(result).not.toBeNull();
    expect(result!.hasServers).toBe(false);
    expect(result!.totalToolCalls).toBe(0);
  });
});
