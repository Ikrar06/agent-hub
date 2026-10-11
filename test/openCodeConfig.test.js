// test/openCodeConfig.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadOpenCodeConfig, getAgentConfig } from '../src/openCodeConfig.js';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';

describe('openCodeConfig', () => {
  it('should generate configuration from template and values', async () => {
    const templatePath = join(process.cwd(), 'opencode', 'opencode.template.json');
    const values = {
      provider: 'llama.cpp',
      modelId: 'qwen3-6b-35b'
    };
    const config = await loadOpenCodeConfig(templatePath, values);
    assert.deepEqual(config, {
      provider: 'llama.cpp',
      model: { id: 'qwen3-6b-35b' }
    });
  });

  it('should get agent config for all agent types', async () => {
    const templatePath = join(process.cwd(), 'opencode', 'opencode.template.json');
    const values = {
      provider: 'llama.cpp',
      modelId: 'qwen3-6b-35b'
    };
    const baseConfig = await loadOpenCodeConfig(templatePath, values);

    // Test all agent types
    const agentTypes = ['lead', 'coder', 'tester', 'fixer', 'reviewer', 'documenter', 'pr-writer'];
    for (const agentType of agentTypes) {
      const agentConfig = getAgentConfig(agentType, baseConfig);
      assert.deepEqual(agentConfig, {
        provider: 'llama.cpp',
        model: { id: 'qwen3-6b-35b' },
        agentType: agentType
      });
    }
  });

  it('should handle missing values gracefully', async () => {
    const templatePath = join(process.cwd(), 'opencode', 'opencode.template.json');
    const values = {}; // Empty values
    const config = await loadOpenCodeConfig(templatePath, values);
    // Should still return valid config based on template defaults
    assert.ok(config);
    assert.ok(config.provider || config.model);
  });

  it('should not contain hardcoded global OpenCode path', async () => {
    // Check that the source file does not contain a hardcoded path to OpenCode global
    const content = await readFile(join(process.cwd(), 'src', 'openCodeConfig.js'), 'utf8');
    // We expect no string like '/usr/local/lib/node_modules/opencode' or similar hardcoded global path
    // We'll just check that it doesn't contain a obvious hardcoded absolute path to opencode
    const hardcodedPathPattern = /\/[^\s]*opencode[^\s]*/;
    // This is a heuristic; we assume that if there is a hardcoded global path, it would be an absolute path containing 'opencode'
    // We'll allow relative paths like './opencode' or '../opencode' but not absolute paths starting with /
    const lines = content.split('\n');
    for (const line of lines) {
      if (hardcodedPathPattern.test(line)) {
        // Check if the matched string is an absolute path (starts with /) and not a relative path like ./opencode
        const match = line.match(hardcodedPathPattern)[0];
        if (match.startsWith('/') && !match.startsWith('/usr/env')) { // /usr/env is from the shebang, we allow that
          // We'll allow the shebang line? Actually we don't have a shebang in this file.
          // We'll just fail if we find an absolute path that looks like a hardcoded global opencode path.
          // For safety, we'll also check if the path contains 'node_modules' which is typical for global installs.
          if (match.includes('node_modules')) {
            assert.fail(`Found hardcoded global OpenCode path: ${match}`);
          }
        }
      }
    }
  });
});