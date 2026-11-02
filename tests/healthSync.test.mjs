import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const exports = {};
new Function('exports', ts.transpileModule(fs.readFileSync(new URL('../lib/healthSync.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(exports);
const { validateHealthSnapshot, readLimitedJson } = exports;
const now = new Date('2026-11-02T12:00:00Z');
const valid = { date: '2026-11-02', observed_at: '2026-11-02T12:00:00Z', source: 'iPhone', steps: 5000 };

test('accepts local midnight offsets and partial snapshots without inventing zero values', () => {
  assert.deepEqual(validateHealthSnapshot(valid, now), valid);
  assert.equal(validateHealthSnapshot({ ...valid, steps: 0 }, now).steps, 0);
  assert.equal(validateHealthSnapshot({ ...valid, date: '2026-11-03', observed_at: '2026-11-03T00:00:00+12:00' }, now).date, '2026-11-03');
  const weight = { ...valid, weight_kg: 97.2 }; delete weight.steps;
  assert.equal(validateHealthSnapshot(weight, now).steps, undefined);
});
test('rejects invalid dates, stale/future observations, units, foreign user IDs and unsafe numeric values', () => {
  for (const patch of [
    { date: '2026-02-30' }, { date: '2026-09-01' }, { date: '2026-11-04' },
    { observed_at: '2026-11-02T12:00:00' }, { observed_at: '2026-11-02T13:00:00Z' },
    { steps: '5000' }, { steps: 2.5 }, { steps: -1 }, { steps: 200001 }, { steps: null },
    { active_kcal: NaN }, { active_kcal: Infinity }, { weight_kg: 0 }, { weight_kg: 401 },
    { user_id: 'someone-else' }, { source: ' ' }, { source: 'a'.repeat(121) },
  ]) assert.throws(() => validateHealthSnapshot({ ...valid, ...patch }, now), JSON.stringify(patch));
  const empty = { ...valid }; delete empty.steps;
  assert.throws(() => validateHealthSnapshot(empty, now));
});
test('bounded body reader rejects oversized streamed bodies without Content-Length', async () => {
  const request = new Request('https://example.test', { method: 'POST', body: JSON.stringify(valid) });
  assert.deepEqual(await readLimitedJson(request), valid);
  await assert.rejects(readLimitedJson(new Request('https://example.test', { method: 'POST', body: 'a'.repeat(4097) })), /too_large/);
  await assert.rejects(readLimitedJson(new Request('https://example.test', { method: 'POST', body: '{' })));
});

// Route tests use a fake DB: auth/validation failures must never call it.
const routeExports = {};
let rpcCalls = 0;
let rpcResult = { data: 'updated', error: null };
new Function('require', 'exports', ts.transpileModule(fs.readFileSync(new URL('../app/api/health/sync/route.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(name => {
  if (name === '@/lib/healthSync') return exports;
  if (name === '@supabase/supabase-js') return { createClient: () => ({ rpc: async () => { rpcCalls++; return rpcResult; } }) };
  throw new Error(name);
}, routeExports);
const token = 'a'.repeat(64);
const send = (headers, body) => routeExports.POST(new Request('https://example.test/api/health/sync', { method: 'POST', headers, body }));
const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

test('route rejects unauthenticated/invalid requests before touching database and returns safe errors', async () => {
  assert.equal((await send({}, '{}')).status, 401);
  assert.equal((await send({ authorization: `Bearer ${token}` }, '{}')).status, 415);
  assert.equal((await send(headers, '{')).status, 400);
  assert.equal((await send(headers, 'a'.repeat(4097))).status, 413);
  assert.equal((await send(headers, '{}')).status, 400);
  assert.equal(rpcCalls, 0);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-public-key';
  const current = { ...valid, date: new Date().toISOString().slice(0, 10), observed_at: new Date().toISOString() };
  const response = await send(headers, JSON.stringify(current));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await response.json()).ok, true);
  rpcResult = { data: null, error: { code: '28000', message: 'SECRET' } };
  assert.equal((await send(headers, JSON.stringify(current))).status, 401);
  rpcResult = { data: null, error: { code: 'PGRST202', message: 'SECRET' } };
  const failed = await send(headers, JSON.stringify(current));
  assert.equal(failed.status, 503);
  assert.ok(!(await failed.text()).includes('SECRET'));
});
