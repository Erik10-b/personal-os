import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const runtimeRequire = createRequire(import.meta.url);
const testDirectory = path.dirname(fileURLToPath(import.meta.url));
// Run the project's pure TypeScript helpers with Node's built-in test runner.
const cache = new Map();
function load(file) {
  const filename = path.resolve(testDirectory, '..', file);
  if (cache.has(filename)) return cache.get(filename).exports;
  const compiledModule = { exports: {} }; cache.set(filename, compiledModule);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const resolve = name => name.startsWith('@/') ? load(name.slice(2) + '.ts') : runtimeRequire(name);
  new Function('require', 'module', 'exports', code)(resolve, compiledModule, compiledModule.exports);
  return compiledModule.exports;
}
const { validSetInput, nextPlannedSet, exerciseComparison, effortLevels } = load('lib/workoutFlow.ts');

test('accepts bodyweight sets and fractional weights without rounding to 0.25kg', () => {
  assert.deepEqual(validSetInput(0, 12), { weight_kg: 0, reps: 12 });
  assert.deepEqual(validSetInput(11.25, 10), { weight_kg: 11.25, reps: 10 });
});
test('rejects invalid, missing, negative and out-of-range values', () => {
  for (const [weight, reps] of [[null, 10], ['', 10], [' ', 10], [-1, 10], [NaN, 10], [Infinity, 10], [10000, 10], [20, 0], [20, 3.5], [20, 1001]]) {
    assert.throws(() => validSetInput(weight, reps));
  }
});
test('next set follows exercise order and set positions, skipping performed sets', () => {
  const exercises = [{ name: 'A', sets_list: [{ id: '2', position: 2, is_done: false }, { id: '1', position: 1, is_done: true }] }, { name: 'B', sets_list: [{ id: '3', position: 1, is_done: false }] }];
  assert.equal(nextPlannedSet(exercises).set.id, '2');
  exercises[0].sets_list[0].is_done = true;
  assert.equal(nextPlannedSet(exercises).exercise.name, 'B');
  assert.equal(nextPlannedSet([]), null);
});
test('legacy sets do not become pending; planned sets do', () => {
  assert.equal(nextPlannedSet([{ sets_list: [{ id: 'old', position: 1 }] }]), null);
  assert.equal(nextPlannedSet([{ sets_list: [{ id: 'new', position: 1, is_done: false }] }]).set.id, 'new');
});
test('comparison distinguishes first entry, identical performance and progress', () => {
  assert.equal(exerciseComparison([{ weight_kg: 20, reps: 10 }]), 'Erstmals erfasst');
  assert.equal(exerciseComparison([{ weight_kg: 20, reps: 10 }], [{ weight_kg: 20, reps: 10 }]), 'Gleiches Niveau');
  assert.match(exerciseComparison([{ weight_kg: 22, reps: 10 }], [{ weight_kg: 20, reps: 10 }]), /^\+10%/);
  assert.equal(effortLevels.length, 10);
});
