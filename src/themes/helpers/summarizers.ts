/**
 * Compact summarizers and expanded line renderers
 */

import type { RenderContext, ColorPalette, IconSet } from '../../types/index.js';
import { formatCount } from '../../render/superscript.js';
import { bold, underline, hex } from '../../render/colors.js';
import type { TextTransform } from './data-extraction.js';

export interface CompactStyledOptions {
  palette: ColorPalette;
  icons: IconSet;
  transform?: TextTransform;
}

export function summarizeToolsStyled(ctx: RenderContext, opts: CompactStyledOptions): string {
  const { palette, icons, transform } = opts;
  const toolCounts = new Map<string, number>();
  let runningTool: string | null = null;

  for (const tool of ctx.transcript.tools) {
    toolCounts.set(tool.name, (toolCounts.get(tool.name) || 0) + 1);
    if (tool.status === 'running') runningTool = tool.name;
  }

  const toolItems: string[] = [];
  for (const [name, count] of toolCounts) {
    const isRunning = runningTool === name;
    const icon = isRunning ? icons.running : icons.success;
    const iconColor = isRunning ? palette.yellow : palette.green;
    const countStr = formatCount(count);

    if (transform?.case === 'upper') {
      // Neon style: color the whole item
      toolItems.push(hex(iconColor, `${name}${icon}${countStr}`));
    } else {
      // Aurora style: separate colors
      toolItems.push(hex(palette.text, name) + hex(iconColor, icon) + hex(palette.muted, countStr));
    }
  }

  return hex(palette.categoryTools, icons.categoryTools) + ' ' + toolItems.join(' ');
}

export function summarizeAgentsStyled(ctx: RenderContext, opts: CompactStyledOptions): string {
  const { palette, icons, transform } = opts;
  const agentItems: string[] = [];

  for (const agent of ctx.transcript.agents.slice(0, 2)) {
    const statusColor = agent.status === 'error' ? palette.red : agent.status === 'running' ? palette.yellow : palette.green;
    const modelChar = agent.model ? agent.model[0].toUpperCase() : '';
    const modelAbbr = modelChar
      ? `[${modelChar}]`
      : '';
    const subTools = agent.subagentToolCount && agent.subagentToolCount > 0
      ? hex(palette.teal, `⚡${agent.subagentToolCount}`)
      : '';

    if (transform?.case === 'upper') {
      // Neon style
      agentItems.push(hex(statusColor, agent.type.toUpperCase()) + hex(palette.muted, modelAbbr) + subTools);
    } else {
      // Aurora style
      agentItems.push(hex(statusColor, agent.type) + hex(palette.muted, modelAbbr) + subTools);
    }
  }

  return hex(palette.categoryAgents, icons.categoryAgents) + ' ' + agentItems.join(' ');
}

export function summarizeTodosStyled(ctx: RenderContext, opts: CompactStyledOptions): string {
  const { palette, icons, transform } = opts;
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const inProgress = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  const todoLabel = transform?.case === 'upper' ? 'TODOS:' : 'Todos:';
  const label = hex(palette.categoryTodos, icons.categoryTodos + ' ' + todoLabel);

  if (inProgress) {
    const shortContent = inProgress.content.substring(0, 20);
    const displayContent = transform?.case === 'upper' ? shortContent.toUpperCase() : shortContent;

    if (transform?.case === 'upper') {
      // Neon style: yellow for both marker and content
      return label + ' ' + hex(palette.yellow, `▸ ${displayContent}`) + hex(palette.muted, ` ${completed}/${total}`);
    }
    // Aurora style
    return label + ' ' + hex(palette.yellow, '▸ ') + hex(palette.text, displayContent) + hex(palette.muted, ` ${completed}/${total}`);
  }

  return label + ' ' + hex(palette.muted, `${completed}/${total}`);
}

export function summarizeSkillsStyled(ctx: RenderContext, opts: CompactStyledOptions): string {
  const { palette, icons, transform } = opts;
  const skillItems: string[] = [];

  for (const skill of ctx.transcript.skills.slice(0, 3)) {
    const icon = skill.status === 'running' ? icons.running : icons.success;
    const iconColor = skill.status === 'running' ? palette.yellow : palette.green;
    const displayName = transform?.case === 'upper' ? skill.name.toUpperCase() : skill.name;

    if (transform?.case === 'upper') {
      // Neon style
      skillItems.push(hex(iconColor, `${displayName}${icon}`));
    } else {
      // Aurora style
      skillItems.push(hex(palette.text, displayName) + hex(iconColor, icon));
    }
  }

  return hex(palette.mauve, icons.skill) + ' ' + skillItems.join(' ');
}

export function renderToolsLineStyled(ctx: RenderContext, opts: CompactStyledOptions): string {
  const { palette, icons, transform } = opts;
  const parts: string[] = [];

  for (const tool of ctx.transcript.tools.slice(0, 5)) {
    const icon = tool.status === 'running' ? icons.running : tool.status === 'error' ? icons.error : icons.success;
    const iconColor = tool.status === 'running' ? palette.yellow : tool.status === 'error' ? palette.red : palette.green;
    const targetName = tool.target ? tool.target.split('/').pop() : '';
    const target = targetName ? ` ${targetName}` : '';
    parts.push(hex(palette.text, tool.name) + hex(iconColor, icon) + hex(palette.muted, target));
  }

  const labelText = transform?.case === 'upper' ? 'TOOLS: ' : 'Tools: ';
  return hex(palette.categoryTools, icons.categoryTools + ' ' + labelText) + parts.join('   ');
}

export function renderAgentsLineStyled(ctx: RenderContext, opts: CompactStyledOptions): string {
  const { palette, icons, transform } = opts;
  const agentParts: string[] = [];

  for (const agent of ctx.transcript.agents.slice(0, 3)) {
    const statusColor = agent.status === 'running' ? palette.yellow : agent.status === 'error' ? palette.red : palette.green;
    const displayType = transform?.case === 'upper' ? agent.type.toUpperCase() : agent.type;
    const modelText = agent.model
      ? (transform?.case === 'upper' ? `[${agent.model.toUpperCase()}]` : `[${agent.model}]`)
      : '';
    const subTools = agent.subagentToolCount && agent.subagentToolCount > 0
      ? hex(palette.teal, `⚡${agent.subagentToolCount}`)
      : '';
    const desc = agent.description
      ? ` ${transform?.case === 'upper' ? agent.description.substring(0, 40).toUpperCase() : agent.description.substring(0, 40)}`
      : '';
    agentParts.push(hex(statusColor, displayType) + subTools + hex(palette.muted, ` ${modelText}`) + hex(palette.muted, desc));
  }

  const labelText = transform?.case === 'upper' ? 'AGENTS: ' : 'Agents: ';
  return hex(palette.categoryAgents, icons.categoryAgents + ' ' + labelText) + agentParts.join('   ');
}

export function renderTodosLineStyled(ctx: RenderContext, opts: CompactStyledOptions): string {
  const { palette, icons, transform } = opts;
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const inProgress = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  const labelText = transform?.case === 'upper' ? 'TODOS: ' : 'Todos: ';
  const label = hex(palette.categoryTodos, icons.categoryTodos + ' ' + labelText);

  if (inProgress) {
    const filledChar = transform?.case === 'upper' ? '█' : '●';
    const emptyChar = transform?.case === 'upper' ? '░' : '○';
    const progressBar = filledChar.repeat(completed) + emptyChar.repeat(total - completed);
    const displayContent = transform?.case === 'upper' ? inProgress.content.toUpperCase() : inProgress.content;
    return label + hex(palette.yellow, '▸ ') + hex(palette.text, displayContent) + hex(palette.muted, ` (${completed}/${total}) ${progressBar}`);
  }

  const completedText = transform?.case === 'upper' ? 'ALL TASKS COMPLETED' : 'All tasks completed';
  return label + hex(palette.green, '✓ ') + hex(palette.text, completedText) + hex(palette.muted, ` (${total}/${total})`);
}

export function renderSkillsLineStyled(ctx: RenderContext, opts: CompactStyledOptions): string {
  const { palette, icons, transform } = opts;
  const parts: string[] = [];

  for (const skill of ctx.transcript.skills.slice(0, 5)) {
    const icon = skill.status === 'running' ? icons.running : skill.status === 'error' ? icons.error : icons.success;
    const iconColor = skill.status === 'running' ? palette.yellow : skill.status === 'error' ? palette.red : palette.green;
    const displayName = transform?.case === 'upper' ? skill.name.toUpperCase() : skill.name;
    const args = skill.args
      ? ` ${transform?.case === 'upper' ? skill.args.toUpperCase() : skill.args}`
      : '';
    parts.push(hex(palette.text, displayName) + hex(iconColor, icon) + hex(palette.muted, args));
  }

  const labelText = transform?.case === 'upper' ? 'SKILLS: ' : 'Skills: ';
  return hex(palette.mauve, icons.skill + ' ' + labelText) + parts.join('   ');
}

export interface CompactPlainOptions {
  transform?: TextTransform;
}

export function summarizeToolsPlain(ctx: RenderContext, opts: CompactPlainOptions = {}): string {
  const { transform } = opts;
  const toolCounts = new Map<string, number>();
  let running: string | null = null;

  for (const tool of ctx.transcript.tools) {
    toolCounts.set(tool.name, (toolCounts.get(tool.name) || 0) + 1);
    if (tool.status === 'running') running = tool.name;
  }

  const parts: string[] = [];
  for (const [name, count] of toolCounts) {
    const isRunning = running === name;
    const marker = isRunning ? '~' : '+';
    const displayName = transform?.case === 'upper' ? name.toUpperCase() : name;
    const text = `${displayName}${marker}${count}`;
    parts.push(isRunning ? bold(text) : text);
  }

  return '\u25CF ' + parts.join(' ');
}

export function summarizeAgentsPlain(ctx: RenderContext, opts: CompactPlainOptions = {}): string {
  const { transform } = opts;
  const limit = transform?.case === 'upper' ? 3 : 2;
  const agentItems = ctx.transcript.agents
    .slice(0, limit)
    .map((a) => {
      const modelChar = a.model ? a.model[0].toUpperCase() : '';
      const model = modelChar
        ? `[${modelChar}]`
        : '';
      const subTools = a.subagentToolCount && a.subagentToolCount > 0
        ? `#${a.subagentToolCount}`
        : '';
      const displayType = transform?.case === 'upper' ? a.type.toUpperCase() : a.type;
      const text = `${displayType}${model}${subTools}`;
      if (a.status === 'error') return underline(text);
      if (a.status === 'running') return bold(text);
      return text;
    })
    .join(' ');

  return '\u25CF ' + agentItems;
}

export function summarizeTodosPlain(ctx: RenderContext, opts: CompactPlainOptions = {}): string {
  const { transform } = opts;
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const current = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  if (current) {
    const maxLen = transform?.case === 'upper' ? 25 : 15;
    const shortContent = current.content.substring(0, maxLen);
    const displayContent = transform?.case === 'upper' ? shortContent.toUpperCase() : shortContent;
    const suffix = transform?.case === 'upper' ? `... (${completed}/${total})` : `... ${completed}/${total}`;
    return `\u25CF >${displayContent}${suffix}`;
  }
  return `\u25CF ${completed}/${total}`;
}

export function summarizeSkillsPlain(ctx: RenderContext, opts: CompactPlainOptions = {}): string {
  const { transform } = opts;
  const skillItems = ctx.transcript.skills
    .slice(0, 3)
    .map((s) => {
      const marker = s.status === 'running' ? '~' : '+';
      const displayName = transform?.case === 'upper' ? s.name.toUpperCase() : s.name;
      return `${displayName}${marker}`;
    })
    .join(' ');

  return '\u25CF ' + skillItems;
}

export function renderToolsLinePlain(ctx: RenderContext): string {
  const tools = ctx.transcript.tools
    .slice(0, 6)
    .map((t) => {
      const marker = t.status === 'running' ? '~' : t.status === 'error' ? 'x' : '+';
      const target = t.target ? ` ${t.target.split('/').pop()}` : '';
      const text = `${t.name}${marker}${target}`;

      if (t.status === 'error') return underline(text);
      if (t.status === 'running') return bold(text);
      return text;
    })
    .join('  ');

  return '\u25CF Tools: ' + tools;
}

export function renderAgentsLinePlain(ctx: RenderContext): string {
  const agents = ctx.transcript.agents
    .slice(0, 3)
    .map((agent) => {
      const model = agent.model ? `[${agent.model}]` : '';
      const subTools = agent.subagentToolCount && agent.subagentToolCount > 0
        ? `#${agent.subagentToolCount}`
        : '';
      const desc = agent.description ? ` ${agent.description.substring(0, 30)}` : '';
      const text = `${agent.type}${subTools} ${model}${desc}`;

      if (agent.status === 'error') return underline(text);
      if (agent.status === 'running') return bold(text);
      return text;
    })
    .join('  ');

  return '\u25CF Agents: ' + agents;
}

export function renderTodosLinePlain(ctx: RenderContext): string {
  const total = ctx.transcript.todos.length;
  const completed = ctx.transcript.todos.filter((t) => t.status === 'completed').length;
  const current = ctx.transcript.todos.find((t) => t.status === 'in_progress');

  if (current) {
    const bar = '#'.repeat(completed) + '-'.repeat(total - completed);
    return `\u25CF Todos: > ${current.content} [${bar}] ${completed}/${total}`;
  }
  return `\u25CF Todos: + All done (${total}/${total})`;
}

export function renderSkillsLinePlain(ctx: RenderContext): string {
  const skills = ctx.transcript.skills
    .slice(0, 5)
    .map((skill) => {
      const marker = skill.status === 'running' ? '~' : skill.status === 'error' ? 'x' : '+';
      const args = skill.args ? ` ${skill.args}` : '';
      return `${skill.name}${marker}${args}`;
    })
    .join('  ');

  return '\u25CF Skills: ' + skills;
}
