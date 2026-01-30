/**
 * Cost estimation logic based on model pricing
 */

import { createDebug } from '../utils/debug.js';

const debug = createDebug('cost');

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Claude 4 Opus
  'claude-opus-4-5-20251101': { input: 15.0, output: 75.0 },
  'claude-opus-4-20250514': { input: 15.0, output: 75.0 },

  // Claude 4 Sonnet
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },

  // Claude 3.5 Series
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4.0 },

  // Claude 3 Series
  'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
  'claude-3-sonnet-20240229': { input: 3.0, output: 15.0 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
};

const DEFAULT_PRICING = { input: 3.0, output: 15.0 };

export interface CostInfo {
  estimatedCost: number;
  inputTokens: number;
  outputTokens: number;
  modelId: string;
  pricePerInputMToken: number;
  pricePerOutputMToken: number;
}

export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): CostInfo {
  const pricing = getModelPricing(modelId);

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const estimatedCost = inputCost + outputCost;

  debug(`cost calculation: model=${modelId}, input=${inputTokens}, output=${outputTokens}, cost=$${estimatedCost.toFixed(4)}`);

  return {
    estimatedCost,
    inputTokens,
    outputTokens,
    modelId,
    pricePerInputMToken: pricing.input,
    pricePerOutputMToken: pricing.output,
  };
}

function getModelPricing(modelId: string): { input: number; output: number } {
  if (MODEL_PRICING[modelId]) {
    return MODEL_PRICING[modelId];
  }
  const normalizedId = modelId.toLowerCase();

  if (normalizedId.includes('opus-4-5') || normalizedId.includes('opus-4.5')) {
    return MODEL_PRICING['claude-opus-4-5-20251101'];
  }
  if (normalizedId.includes('opus-4') || normalizedId.includes('opus4')) {
    return MODEL_PRICING['claude-opus-4-20250514'];
  }
  if (normalizedId.includes('sonnet-4') || normalizedId.includes('sonnet4')) {
    return MODEL_PRICING['claude-sonnet-4-20250514'];
  }
  if (normalizedId.includes('3-5-sonnet') || normalizedId.includes('3.5-sonnet')) {
    return MODEL_PRICING['claude-3-5-sonnet-20241022'];
  }
  if (normalizedId.includes('3-5-haiku') || normalizedId.includes('3.5-haiku')) {
    return MODEL_PRICING['claude-3-5-haiku-20241022'];
  }
  if (normalizedId.includes('3-opus') || normalizedId.includes('opus')) {
    return MODEL_PRICING['claude-3-opus-20240229'];
  }
  if (normalizedId.includes('3-sonnet') || normalizedId.includes('sonnet')) {
    return MODEL_PRICING['claude-sonnet-4-20250514'];
  }
  if (normalizedId.includes('haiku')) {
    return MODEL_PRICING['claude-3-5-haiku-20241022'];
  }

  debug(`unknown model: ${modelId}, using default pricing`);
  return DEFAULT_PRICING;
}

export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  if (cost < 1) {
    return `$${cost.toFixed(3)}`;
  }
  return `$${cost.toFixed(2)}`;
}

export function formatCostShort(cost: number): string {
  if (cost < 0.01) {
    return `<1¢`;
  }
  if (cost < 1) {
    return `${Math.round(cost * 100)}¢`;
  }
  return `$${cost.toFixed(2)}`;
}

export function getShortModelName(modelId: string): string {
  const lower = modelId.toLowerCase();

  if (lower.includes('opus-4-5') || lower.includes('opus-4.5')) return 'opus-4.5';
  if (lower.includes('opus-4') || lower.includes('opus4')) return 'opus-4';
  if (lower.includes('sonnet-4') || lower.includes('sonnet4')) return 'sonnet-4';
  if (lower.includes('3-5-sonnet') || lower.includes('3.5-sonnet')) return 'sonnet-3.5';
  if (lower.includes('3-5-haiku') || lower.includes('3.5-haiku')) return 'haiku-3.5';
  if (lower.includes('3-opus')) return 'opus-3';
  if (lower.includes('3-sonnet')) return 'sonnet-3';
  if (lower.includes('3-haiku')) return 'haiku-3';
  if (lower.includes('opus')) return 'opus';
  if (lower.includes('sonnet')) return 'sonnet';
  if (lower.includes('haiku')) return 'haiku';

  return modelId.split('-')[0] || 'unknown';
}
