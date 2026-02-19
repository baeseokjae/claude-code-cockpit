/**
 * Cost estimation logic based on model pricing
 */
import { createDebug } from '../utils/debug.js';
import { getModelInfo } from './models.js';

const debug = createDebug('cost');

export type { ModelInfo } from './models.js';
export { getShortModelName } from './models.js';

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
  const pricing = getModelInfo(modelId);

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
