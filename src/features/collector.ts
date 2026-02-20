/**
 * Feature Collector: 조건부 데이터 수집을 레지스트리 기반으로 실행
 */

import type { FeatureDef, CollectEnv } from './types.js';
import { createDebug } from '../utils/debug.js';

const debug = createDebug('collector');

function isEnabled(feature: FeatureDef, env: CollectEnv): boolean {
  if (feature.configFlag && !env.config.display[feature.configFlag]) return false;
  if (feature.minTier && env.tier < feature.minTier) return false;
  if (feature.requireDetailed && !env.isDetailed) return false;
  return true;
}

export async function collectFeatures(
  features: readonly FeatureDef[],
  env: CollectEnv,
): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> = {};

  const phase1 = features.filter(f => (f.phase ?? 1) === 1);
  const phase2 = features.filter(f => f.phase === 2);

  // Phase 1: 독립 feature 병렬 수집
  await Promise.allSettled(phase1.map(async (f) => {
    if (!isEnabled(f, env)) {
      results[f.key] = f.disabledDefault ?? null;
      return;
    }
    try {
      results[f.key] = await f.collect(env, results);
    } catch (err) {
      debug('feature %s failed: %O', f.key, err);
      results[f.key] = f.disabledDefault ?? null;
    }
  }));

  // Phase 2: 의존성 있는 feature 순차 수집 (Phase 1 결과 접근 가능)
  for (const f of phase2) {
    if (!isEnabled(f, env)) {
      results[f.key] = f.disabledDefault ?? null;
      continue;
    }
    try {
      results[f.key] = await f.collect(env, results);
    } catch (err) {
      debug('feature %s failed: %O', f.key, err);
      results[f.key] = f.disabledDefault ?? null;
    }
  }

  return results;
}

export { isEnabled as _isEnabled };  // 테스트용 export
