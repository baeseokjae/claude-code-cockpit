/**
 * Segment system types
 *
 * Segments are the building blocks of the statusline.
 * Each segment represents a single piece of information (model, git, cost, etc.)
 * that can be rendered independently and composed together.
 */

import type { RenderContext } from './context.js';

/**
 * Output from a rendered segment
 */
export interface SegmentOutput {
  /**
   * Rendered text with ANSI color codes
   */
  text: string;

  /**
   * Raw text without ANSI codes (for length calculation)
   */
  rawText: string;

  /**
   * Display priority (higher = more important)
   * Used to determine which segments to drop when space is limited
   */
  priority: number;

  /**
   * Minimum width required to display this segment
   */
  minWidth: number;
}

/**
 * Rendering mode for segments
 */
export type SegmentMode = 'minimal' | 'compact' | 'full';

/**
 * A segment is a self-contained rendering unit
 */
export interface Segment {
  /**
   * Unique segment identifier
   */
  name: string;

  /**
   * Check if this segment should be displayed
   * @param ctx - Render context
   * @returns true if segment should be displayed
   */
  enabled: (ctx: RenderContext) => boolean;

  /**
   * Render the segment
   * @param ctx - Render context
   * @param mode - Rendering mode
   * @returns Segment output or null if nothing to display
   */
  render: (ctx: RenderContext, mode: SegmentMode) => SegmentOutput | null;
}

/**
 * Registry for managing segments
 */
export interface SegmentRegistry {
  /**
   * Register a segment
   */
  register(segment: Segment): void;

  /**
   * Get a segment by name
   */
  get(name: string): Segment | undefined;

  /**
   * Get all registered segments
   */
  getAll(): Segment[];

  /**
   * Check if a segment is registered
   */
  has(name: string): boolean;
}
