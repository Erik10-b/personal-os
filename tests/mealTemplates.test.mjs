import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';
const filename = fileURLToPath(new URL('../lib/mealTemplates.ts', import.meta.url));
const compiled = { exports: {} };
new Function('exports', ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(compiled.exports);
const { starterMealTemplates, recipeBatchMacros, templateMealMacros, validateTemplate, validMealDate } = compiled.exports;
const macros = { kcal: 200, protein_g: 20, carbs_g: 15, fat_g: 5 };
const recipe = { key: 'test', name: 'Mealprep', mode: 'ingredients', servings: 3, batchWeightG: 900, totalMacros: null, ingredients: [{ name: 'Ingredient A', grams: 300, per100: macros }, { name: 'Ingredient B', grams: 150, per100: { kcal: 100, protein_g: 0, carbs_g: 20, fat_g: 2 } }] };

test('six starter dishes contain no invented nutrition values', () => {
  assert.equal(starterMealTemplates.length, 6);
  assert.ok(starterMealTemplates.some(t => t.key === 'skyr-pesto-haehnchen'));
  assert.equal(starterMealTemplates.find(t => t.key === 'quark-muesli').ingredients[0].grams, 500);
  for (const t of starterMealTemplates) { validateTemplate(t); assert.equal(recipeBatchMacros(t), null); }
});
test('batch totals and portions scale without premature rounding', () => {
  assert.deepEqual(recipeBatchMacros(recipe), { kcal: 750, protein_g: 60, carbs_g: 75, fat_g: 18 });
  assert.deepEqual(templateMealMacros(recipe, 1), { kcal: 250, protein_g: 20, carbs_g: 25, fat_g: 6 });
  assert.equal(templateMealMacros(recipe, 1.5).kcal, 375);
  assert.equal(templateMealMacros(recipe, 0.5).kcal, 125);
});
test('grams use measured cooked weight, not summed raw weights', () => {
  assert.equal(templateMealMacros(recipe, 1, 450).kcal, 375);
  assert.throws(() => templateMealMacros({ ...recipe, batchWeightG: null }, 1, 450));
});
test('individual amounts calculate exactly once and do not modify the recipe', () => {
  const before = JSON.stringify(recipe);
  assert.deepEqual(templateMealMacros(recipe, 2, undefined, [100, 50]), { kcal: 250, protein_g: 20, carbs_g: 25, fat_g: 6 });
  assert.equal(JSON.stringify(recipe), before);
  assert.throws(() => templateMealMacros(recipe, 1, 300, [100, 50]));
});
test('drafts and invalid quantity overrides cannot be logged', () => {
  assert.throws(() => templateMealMacros(starterMealTemplates[0], 1));
  for (const n of [0, -1, NaN, Infinity, 101]) assert.throws(() => templateMealMacros(recipe, n));
  assert.throws(() => templateMealMacros(recipe, 1, undefined, [100]));
  assert.throws(() => templateMealMacros(recipe, 1, undefined, [-100, 50]));
});
test('known total macros support batch portions; missing values stay unknown', () => {
  assert.equal(templateMealMacros({ ...recipe, mode: 'totals', totalMacros: macros }, 3).kcal, 200);
  assert.equal(recipeBatchMacros({ ...recipe, mode: 'totals', totalMacros: null }), null);
  assert.throws(() => validateTemplate({ ...recipe, totalMacros: { ...macros, kcal: NaN } }));
});
test('an unused optional ingredient can be excluded without guessing its nutrition', () => {
  const withUnused = { ...recipe, ingredients: [...recipe.ingredients, { name: 'Optional', grams: 0, per100: null }] };
  assert.equal(recipeBatchMacros(withUnused).kcal, 750);
  assert.throws(() => templateMealMacros(withUnused, 1, undefined, [100, 50, 10]));
});
test('recipe validation bounds input and discards extra properties', () => {
  assert.throws(() => validateTemplate({ ...recipe, servings: 0 }));
  assert.throws(() => validateTemplate({ ...recipe, key: '../escape' }));
  assert.throws(() => validateTemplate({ ...recipe, ingredients: [{ ...recipe.ingredients[0], grams: -1 }] }));
  const saved = validateTemplate({ ...recipe, user_id: 'someone-else' });
  assert.equal(saved.user_id, undefined);
});
test('dates reject rollover, invalid days and non-date strings', () => {
  for (const date of ['2026-02-29', '2026-02-31', 'invalid', '2026-1-1']) assert.equal(validMealDate(date), false);
  for (const date of ['2024-02-29', '2026-11-02']) assert.equal(validMealDate(date), true);
});
