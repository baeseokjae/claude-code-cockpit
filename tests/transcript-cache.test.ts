import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseTranscript } from '../src/input/transcript.js';
import { resetCacheState, flushCache } from '../src/utils/cache.js';
import { existsSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Transcript mtime caching', () => {
  const testDir = join(tmpdir(), 'cockpit-transcript-cache-test');
  const transcriptFile = join(testDir, 'test.jsonl');
  const CACHE_DIR = join(tmpdir(), 'claude-code-cockpit-cache');

  // A minimal transcript with a tool_use and tool_result
  const sampleTranscript = [
    JSON.stringify({
      timestamp: '2024-01-01T00:00:00Z',
      message: {
        content: [{
          type: 'tool_use',
          id: 'tool-1',
          name: 'Read',
          input: { file_path: '/tmp/test.ts' },
        }],
      },
    }),
    JSON.stringify({
      timestamp: '2024-01-01T00:00:01Z',
      message: {
        content: [{
          type: 'tool_result',
          tool_use_id: 'tool-1',
          is_error: false,
          content: 'file contents',
        }],
      },
    }),
  ].join('\n');

  beforeEach(() => {
    resetCacheState();
    try {
      if (existsSync(CACHE_DIR)) {
        rmSync(CACHE_DIR, { recursive: true, force: true });
      }
    } catch {}
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    writeFileSync(transcriptFile, sampleTranscript, 'utf8');
  });

  afterEach(() => {
    resetCacheState();
    try {
      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true, force: true });
      }
      if (existsSync(CACHE_DIR)) {
        rmSync(CACHE_DIR, { recursive: true, force: true });
      }
    } catch {}
  });

  it('parses transcript on first call (cache miss)', async () => {
    const result = await parseTranscript(transcriptFile);
    expect(result.tools.length).toBe(1);
    expect(result.tools[0].name).toBe('Read');
    expect(result.tools[0].status).toBe('completed');
  });

  it('returns cached result on second call (same mtime)', async () => {
    const result1 = await parseTranscript(transcriptFile);
    const result2 = await parseTranscript(transcriptFile);

    // Should return equivalent data
    expect(result2.tools.length).toBe(result1.tools.length);
    expect(result2.tools[0].name).toBe(result1.tools[0].name);
  });

  it('invalidates cache when file is modified', async () => {
    const result1 = await parseTranscript(transcriptFile);
    expect(result1.tools.length).toBe(1);

    // Wait to ensure mtime changes
    const start = Date.now();
    while (Date.now() - start < 10) {}

    // Write new content with additional tool
    const newTranscript = sampleTranscript + '\n' + JSON.stringify({
      timestamp: '2024-01-01T00:00:02Z',
      message: {
        content: [{
          type: 'tool_use',
          id: 'tool-2',
          name: 'Edit',
          input: { file_path: '/tmp/test.ts', old_string: 'a', new_string: 'b' },
        }],
      },
    });
    writeFileSync(transcriptFile, newTranscript, 'utf8');

    const result2 = await parseTranscript(transcriptFile);
    expect(result2.tools.length).toBe(2);
  });

  it('preserves Date instances through cache round-trip', async () => {
    // First parse
    const result1 = await parseTranscript(transcriptFile);
    expect(result1.tools[0].startTime).toBeInstanceOf(Date);
    expect(result1.tools[0].endTime).toBeInstanceOf(Date);

    // Flush to disk and reload
    flushCache();
    resetCacheState();

    // Second parse (cache hit from disk)
    const result2 = await parseTranscript(transcriptFile);
    expect(result2.tools[0].startTime).toBeInstanceOf(Date);
    expect(result2.tools[0].endTime).toBeInstanceOf(Date);

    // Verify .getTime() works (this is what downstream consumers use)
    expect(typeof result2.tools[0].startTime.getTime()).toBe('number');
    expect(result2.tools[0].startTime.getTime()).toBe(result1.tools[0].startTime.getTime());
  });
});
