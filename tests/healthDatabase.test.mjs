import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';

// Optional PostgreSQL WASM integration harness, kept out of production dependencies.
// PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node --test tests/healthDatabase.test.mjs
const modulePath = process.env.PGLITE_MODULE;
test('database enforces token scope, RLS, idempotency, snapshot order and revocation', { skip: !modulePath }, async () => {
  const { PGlite } = await import(modulePath);
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
    const sql = fs.readFileSync(new URL('../supabase/migrations/0015_health_shortcut.sql', import.meta.url), 'utf8');
    await db.exec(sql);
    await db.exec(sql); // SQL Editor reruns are safe.
    const a = '11111111-1111-4111-8111-111111111111', b = '22222222-2222-4222-8222-222222222222';
    const tokenA = 'a'.repeat(64), tokenB = 'b'.repeat(64);
    const hash = t => createHash('sha256').update(t).digest('hex');
    await db.query('insert into auth.users values ($1),($2)', [a, b]);
    await db.query('insert into public.health_sync_tokens(user_id,token_hash) values ($1,$2),($3,$4)', [a, hash(tokenA), b, hash(tokenB)]);
    const time = new Date(Date.now() - 60000).toISOString();
    const call = async (token, steps, observed = time, kcal = null, weight = null) => db.query('select public.receive_health_snapshot($1,current_date,$2,$3,$4,$5,$6) as result', [token, observed, steps, kcal, weight, 'test source']);
    await db.exec('set role anon');
    await assert.rejects(call('c'.repeat(64), 123), e => e.code === '28000');
    assert.equal((await call(tokenA, 5000, time, 400, 97)).rows[0].result, 'updated');
    assert.equal((await call(tokenA, 5000)).rows[0].result, 'unchanged');
    assert.equal((await call(tokenA, 4000, new Date(Date.parse(time) - 1000).toISOString())).rows[0].result, 'unchanged');
    assert.equal((await call(tokenA, 6000, new Date(Date.parse(time) + 1000).toISOString())).rows[0].result, 'updated');
    await assert.rejects(call(tokenA, -1), e => e.code === '22023');
    await assert.rejects(call(tokenA, null, time, 'NaN'), e => e.code === '22023');
    await assert.rejects(call(tokenA, null), e => e.code === '22023');
    await assert.rejects(call(tokenA, 1, 'infinity'), e => e.code === '22023');
    await assert.rejects(db.query('select * from public.health_daily'), e => e.code === '42501');
    await assert.rejects(db.query('select * from public.health_sync_tokens'), e => e.code === '42501');
    await db.exec('reset role');
    const row = (await db.query('select * from public.health_daily')).rows[0];
    assert.equal(row.user_id, a); assert.equal(row.steps, 6000);
    assert.equal(Number(row.active_kcal), 400); assert.equal(Number(row.weight_kg), 97);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [b]);
    await db.exec('set role authenticated');
    assert.equal((await db.query('select * from public.health_daily')).rows.length, 0);
    assert.equal((await db.query('select * from public.health_sync_tokens')).rows.length, 1);
    assert.equal((await db.query('delete from public.health_sync_tokens where user_id=$1 returning user_id', [a])).rows.length, 0);
    await assert.rejects(db.query('update public.health_daily set steps=1'), e => e.code === '42501');
    await assert.rejects(db.query('insert into public.health_sync_tokens(user_id,token_hash) values($1,$2)', [a, hash('d'.repeat(64))]), e => e.code === '42501');
    await db.exec('reset role');
    // Rotate then revoke owner A's credential; imported history survives both.
    await db.query('update public.health_sync_tokens set token_hash=$1 where user_id=$2', [hash('d'.repeat(64)), a]);
    await db.exec('set role anon');
    await assert.rejects(call(tokenA, 1), e => e.code === '28000');
    assert.equal((await call('d'.repeat(64), 1)).rows[0].result, 'unchanged');
    await db.exec('reset role');
    await db.query('delete from public.health_sync_tokens where user_id=$1', [a]);
    await db.exec('set role anon');
    await assert.rejects(call('d'.repeat(64), 1), e => e.code === '28000');
    await db.exec('reset role');
    assert.equal((await db.query('select count(*) as count from public.health_daily')).rows[0].count, 1);
  } finally { await db.close(); }
});
