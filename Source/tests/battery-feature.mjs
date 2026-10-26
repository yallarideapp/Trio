// Exercise the editor's form parser: battery readings belong to one used
// option, and changing that option back to New removes its old readings.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { validBatteryHealth, validBatteryCycles } from '../shared/battery.js';
import { validStockQuantity, validOfferPrice } from '../shared/pricing.js';
import { conditionGroup, notes as noteLabels } from '../shared/labels.js';
import { applyHomePlacement } from '../shared/home-placement.js';

export function verifyBatteryEditorBehavior() {
  const source = readFileSync(new URL('../site/admin/src/admin.js', import.meta.url), 'utf8');
  const parser = source.slice(source.indexOf('function readDeviceForm(form)'), source.indexOf('async function resizeImage(file)'));
  assert(parser.startsWith('function readDeviceForm(form)'), 'battery behavior exercises the actual device form parser');
  const product = {
    id: 'battery-test', name: { ar: 'جهاز', en: 'Device' }, brand: 'Apple', category: 'phones',
    featured: false, hidden: false, offer: false, technical: { summary: { ar: '', en: '' }, specs: [] },
    variants: [
      { key: 'new-256', storage: '256GB', condition: 'new', price: 600, notes: [], warranty: '', batteryHealth: 100, batteryCycles: 10 },
      { key: 'used-256', storage: '256GB', condition: 'used-agency', price: 500, notes: [], warranty: '', batteryHealth: null, batteryCycles: null },
      { key: 'used-512', storage: '512GB', condition: 'like-new', price: 550, notes: [], warranty: '', batteryHealth: 95, batteryCycles: 321 },
    ],
  };
  const state = { draft: { products: [product] }, editing: { index: 0 } };
  let saved;
  const context = vm.createContext({
    state, USE_TECHNICAL: true, conditionGroup, noteLabels, applyHomePlacement,
    validStockQuantity, validOfferPrice, validBatteryHealth, validBatteryCycles,
    saveDraft: () => { saved = structuredClone(product); },
  });
  vm.runInContext(parser + '\n globalThis.readBatteryForm = readDeviceForm;', context);

  const input = (value = '', checked = false) => ({ value: String(value ?? ''), checked, attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } });
  const elements = {
    'name.ar': input(product.name.ar), 'name.en': input(product.name.en), brand: input(product.brand),
    category: input('phones'), featured: input('', false), hidden: input('', false), offer: input('', false),
    'technical.summary.ar': input(''), 'technical.summary.en': input(''),
  };
  const fieldsets = product.variants.map(() => ({ hidden: false, disabled: false }));
  for (const [index, option] of product.variants.entries()) {
    for (const key of ['storage', 'condition', 'warranty', 'price', 'offerPrice', 'stockQuantity', 'batteryHealth', 'batteryCycles']) elements[`v.${index}.${key}`] = input(option[key]);
    elements[`v.${index}.soldOut`] = input('', false);
    for (const key of Object.keys(noteLabels)) elements[`v.${index}.note.${key}`] = input('', false);
  }
  const form = { elements, querySelector: (selector) => fieldsets[Number(selector.match(/"(\d+)"/)[1])] };
  const set = (index, key, value) => { elements[`v.${index}.${key}`].value = String(value ?? ''); };
  const read = () => context.readBatteryForm(form);

  // Native input and change events both call this parser. Independent readings
  // must remain independent even when another option has the same capacity.
  set(1, 'batteryHealth', 91); set(1, 'batteryCycles', 0);
  read();
  assert.equal(saved.variants[1].batteryHealth, 91);
  assert.equal(saved.variants[1].batteryCycles, 0, 'zero cycles is a recorded measurement, not an unknown value');
  assert.equal(saved.variants[2].batteryHealth, 95);
  assert.equal(saved.variants[2].batteryCycles, 321, 'editing one used option does not copy readings into another');
  assert.deepEqual(fieldsets.map((field) => [field.hidden, field.disabled]), [[true, true], [false, false], [false, false]], 'only used options expose editable battery fields');
  assert.equal(saved.variants[0].batteryHealth, null);
  assert.equal(saved.variants[0].batteryCycles, null, 'stale measurements are removed from New options');

  set(1, 'batteryHealth', ''); set(1, 'batteryCycles', 42); read();
  assert.equal(saved.variants[1].batteryHealth, null, 'a missing health reading stays unknown');
  assert.equal(saved.variants[1].batteryCycles, 42, 'cycles can be entered without inventing health');
  set(1, 'batteryHealth', 0); set(1, 'batteryCycles', ''); read();
  assert.equal(saved.variants[1].batteryHealth, 0);
  assert.equal(saved.variants[1].batteryCycles, null, 'health can be entered without inventing cycles');

  set(1, 'batteryHealth', '99.5'); set(1, 'batteryCycles', '-1'); read();
  assert.equal(saved.variants[1].batteryHealth, '99.5');
  assert.equal(saved.variants[1].batteryCycles, '-1', 'invalid pending input is retained for correction rather than rounded or discarded');
  assert.equal(elements['v.1.batteryHealth'].attributes['aria-invalid'], 'true');
  assert.equal(elements['v.1.batteryCycles'].attributes['aria-invalid'], 'true');
  assert(!validBatteryHealth(saved.variants[1].batteryHealth) && !validBatteryCycles(saved.variants[1].batteryCycles), 'publish validation can reject both invalid readings');

  set(1, 'batteryHealth', 100); set(1, 'batteryCycles', Number.MAX_SAFE_INTEGER); read();
  assert.equal(saved.variants[1].batteryHealth, 100);
  assert.equal(saved.variants[1].batteryCycles, Number.MAX_SAFE_INTEGER);
  assert.equal(elements['v.1.batteryHealth'].attributes['aria-invalid'], 'false');
  assert.equal(elements['v.1.batteryCycles'].attributes['aria-invalid'], 'false');

  set(1, 'condition', 'new'); read();
  assert(fieldsets[1].hidden && fieldsets[1].disabled, 'choosing New hides and disables the battery inputs immediately');
  assert.equal(elements['v.1.batteryHealth'].value, '');
  assert.equal(elements['v.1.batteryCycles'].value, '');
  assert.equal(saved.variants[1].batteryHealth, null);
  assert.equal(saved.variants[1].batteryCycles, null, 'changing condition does not leave stale used readings on a New option');
  set(1, 'condition', 'like-new'); read();
  assert(!fieldsets[1].hidden && !fieldsets[1].disabled, 'choosing Used like new reveals the inputs immediately');
  assert.equal(saved.variants[1].batteryHealth, null);
  assert.equal(saved.variants[1].batteryCycles, null, 'switching back to Used does not fabricate replacement readings');
  console.log('battery editor behavior checks passed');
}
