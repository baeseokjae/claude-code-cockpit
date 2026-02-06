/**
 * MCP configuration reader
 * Reads MCP server configuration and counts available tools
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('mcp-reader');

export interface McpToolInfo {
  serverCount: number;
  estimatedToolCount: number;
  servers: string[];
}

const ESTIMATED_TOOLS_PER_SERVER = 10; // Conservative estimate

export function readMcpConfig(cwd?: string): McpToolInfo {
  const paths = [
    cwd ? join(cwd, '.claude.json') : null,
    join(homedir(), '.claude.json'),
  ].filter(Boolean) as string[];

  let serverCount = 0;
  const servers: string[] = [];

  for (const path of paths) {
    if (!existsSync(path)) continue;

    try {
      const content = readFileSync(path, 'utf8');
      const config = JSON.parse(content);

      if (config.mcpServers) {
        const serverNames = Object.keys(config.mcpServers);
        serverCount += serverNames.length;
        servers.push(...serverNames);
        debug(`found ${serverNames.length} MCP servers in ${path}`);
      }
    } catch (error) {
      debug(`failed to read MCP config from ${path}:`, error);
    }
  }

  return {
    serverCount,
    estimatedToolCount: serverCount * ESTIMATED_TOOLS_PER_SERVER,
    servers,
  };
}
