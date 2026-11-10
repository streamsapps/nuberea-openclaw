import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { NuBerea } from '@nuberea/sdk';
import plugin from '../dist/plugin.js';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(readFileSync(new URL('../openclaw.plugin.json', import.meta.url), 'utf8'));

function tools() {
  const registered = [];
  plugin.register({ registerTool(tool) { registered.push(tool); } });
  return registered;
}

test('release versions and all host declarations agree on the patched baseline', () => {
  assert.equal(pkg.version, manifest.version);
  assert.equal(pkg.devDependencies.openclaw, '2026.11.2');
  assert.equal(pkg.openclaw.compat.minGatewayVersion, '2026.11.2');
  assert.equal(pkg.openclaw.compat.pluginApi, '>=2026.11.2');
  assert.equal(pkg.openclaw.install.minHostVersion, '>=2026.11.2');
  assert.equal(pkg.openclaw.build.openclawVersion, '2026.11.2');
  assert.equal(pkg.openclaw.build.pluginSdkVersion, '2026.11.2');
  assert.equal(pkg.engines.node, '>=24.16.0 <25 || >=26.1.0');
});

test('the compiled entry registers all seven manifest tools against the pinned host SDK', () => {
  assert.equal(plugin.id, manifest.id);
  const registered = tools();
  assert.equal(registered.length, 7);
  assert.deepEqual(registered.map(tool => tool.name), manifest.contracts.tools);
  for (const tool of registered) {
    assert.equal(typeof tool.execute, 'function');
    assert.equal(tool.parameters.type, 'object');
  }
});

test('the development host resolves patched Zod and minimatch APIs', () => {
  const hostRequire = createRequire(import.meta.resolve('openclaw'));
  const { z } = hostRequire('zod');
  const { minimatch } = hostRequire('minimatch');
  assert.equal(z.object({ id: z.string() }).safeParse({ id: 'nuberea' }).success, true);
  assert.equal(z.object({ id: z.string() }).safeParse({ id: 1 }).success, false);
  assert.equal(minimatch('dist/plugin.js', 'dist/**/*.js'), true);
  assert.equal(minimatch('src/plugin.ts', 'dist/**/*.js'), false);
  const zod = hostRequire('zod/package.json');
  const minimatchPackage = hostRequire('minimatch/package.json');
  assert.ok(zod.version.localeCompare('4.6.6', 'en', { numeric: true }) >= 0);
  assert.ok(minimatchPackage.version.localeCompare('11.0.1', 'en', { numeric: true }) >= 0);
});

test('the SDK update preserves every tool request and its default limits', async () => {
  const original = NuBerea.prototype.tool;
  const calls = [];
  NuBerea.prototype.tool = async function (name, args) {
    calls.push({ name, args });
    return { content: [{ type: 'text', text: 'test response' }] };
  };
  try {
    const registered = tools();
    const verse = { book: 'John', chapter: 1, verse: 1 };
    const cases = [
      ['nuberea_verse', verse, 'bible_kjv_get_verse', verse],
      ['nuberea_bible_search', { query: 'light' }, 'bible_kjv_search_text', { query: 'light', limit: 10 }],
      ['nuberea_greek_lookup', { term: 'logos' }, 'lexicon_lsj_lookup', { term: 'logos' }],
      ['nuberea_hebrew_lookup', { strong: 'H1254' }, 'lexicon_bdb_search_strong', { strong: 'H1254' }],
      ['nuberea_greek_morphology', verse, 'macula_greek_query_verse', verse],
      ['nuberea_hebrew_morphology', verse, 'macula_hebrew_query_verse', verse],
      ['nuberea_query', { sql: 'SELECT 1' }, 'analytics_query', { sql: 'SELECT 1', limit: 100 }],
      ['nuberea_query', { sql: 'SELECT 1', limit: 2 }, 'analytics_query', { sql: 'SELECT 1', limit: 2 }],
    ];
    for (const [toolName, input, name, args] of cases) {
      const tool = registered.find(tool => tool.name === toolName);
      assert.deepEqual(await tool.execute('test-call', input), {
        content: [{ type: 'text', text: 'test response' }],
      });
      assert.deepEqual(calls.at(-1), { name, args });
    }
  } finally {
    NuBerea.prototype.tool = original;
  }
});

test('authentication failures retain the sign-in guidance', async () => {
  const original = NuBerea.prototype.tool;
  NuBerea.prototype.tool = async function () { throw new Error('401 Unauthorized'); };
  try {
    const response = await tools()[0].execute('test-auth', { book: 'John', chapter: 1, verse: 1 });
    assert.match(response.content[0].text, /npx @nuberea\/sdk login/);
  } finally {
    NuBerea.prototype.tool = original;
  }
});
