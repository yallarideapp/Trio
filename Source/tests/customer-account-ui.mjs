// Exercise actual account event handlers with controlled API response ordering.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { formatJD } from '../shared/pricing.js';
import { forwardArrow } from '../shared/navigation.js';

const alice = { id: 'a'.repeat(32), name: 'Alice', email: 'alice@example.test', mobile: '0791234567' };
const bob = { id: 'b'.repeat(32), name: 'Bob', email: 'bob@example.test', mobile: '' };
const order = (number) => ({ number, createdAt: '2026-10-18T10:00:00Z', status: 'new', totalFils: 28000, lines: [{ name: 'AirTag', nameAr: 'إيرتاغ', storage: '', qty: 1 }] });
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const session = (customer = alice) => ({ configured: true, signedIn: !!customer, customer });

function mount(overrides = {}) {
  const handlers = new Map();
  class Element {
    constructor(selector, dataset = {}) { this.selector = selector; this.dataset = dataset; }
    closest(selector) { return this.selector === selector ? this : null; }
  }
  class HTMLFormElement extends Element {
    constructor(action, values) {
      super(''); this.dataset = { accountForm: action };
      this.elements = { namedItem: (name) => ({ value: values[name] || '' }) };
    }
    reset() {}
  }
  const account = {
    session: async () => session(), orders: async () => ({ orders: [], nextBefore: null }),
    logout: async () => ({ ok: true }), profile: async () => ({ customer: alice }),
    register: async () => ({ customer: alice }), login: async () => ({ customer: alice }), password: async () => ({ ok: true }),
    ...overrides,
  };
  const source = readFileSync(new URL('../site/src/account.js', import.meta.url), 'utf8').replace(/^import[^\n]*\n/gm, '').replace(/^export /gm, '');
  const context = vm.createContext({ api: { account }, formatJD, forwardArrow, Element, HTMLFormElement, document: { addEventListener: (name, handler) => handlers.set(name, handler) }, Intl, console });
  vm.runInContext(source + '\nglobalThis.ui = { state, renderAccount, loadAccount, bindAccount, customerProfile, accountLabel };', context);
  const ui = context.ui;
  ui.bindAccount(() => {}); ui.renderAccount('en');
  return {
    ...ui, account,
    click: (selector, dataset) => handlers.get('click')({ target: new Element(selector, dataset) }),
    submit: (action, values) => handlers.get('submit')({ target: new HTMLFormElement(action, values), preventDefault() {} }),
  };
}

async function verifyBrowserDemoAdapter() {
  const originals = Object.fromEntries(['fetch', 'localStorage', 'location', 'navigator'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const values = new Map();
  let network = 0;
  try {
    // Browsers (and Node 24) have Web Locks; Node 20/22 do not, so queue calls the same way.
    if (!globalThis.navigator?.locks) {
      const queues = new Map();
      Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks: { request(name, options, callback) {
        const result = (queues.get(name) || Promise.resolve()).then(callback);
        queues.set(name, result.catch(() => {})); return result;
      } } } });
    }
    globalThis.fetch = () => { network++; throw new Error('Pages must not request customer APIs'); };
    globalThis.location = { search: '' };
    globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
    const url = new URL('../site/src/store.js', import.meta.url);
    const source = readFileSync(url, 'utf8').replace(/\b__MODE__\b/g, JSON.stringify('pages')).replace(/from '([^']+)'/g, (_, ref) => `from ${JSON.stringify(new URL(ref, url).href)}`);
    const { api } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
    const ui = mount(api.account);
    await ui.loadAccount();
    assert.equal(ui.state.configured, true);
    assert.equal(ui.customerProfile(), null);
    assert.equal((await api.account.session()).demo, true, 'Pages accounts identify browser demo behavior');
    await ui.click('[data-account-tab]', { accountTab: 'create' });
    for (const language of ['ar', 'en']) {
      const html = ui.renderAccount(language);
      assert(!html.includes('<fieldset disabled>'), `${language}: browser demo registration is enabled`);
      assert(html.includes('data-account-form="register"'), `${language}: account creation is available`);
      assert(/demo|عرض|تجريبي/i.test(html), `${language}: account forms explain demo behavior`);
    }
    const email = 'preview@example.test';
    const password = 'a-valid-test-password';
    await ui.submit('register', { name: 'Example', email, password, repeat: password });
    assert.equal(ui.customerProfile().email, email, 'the real Pages adapter creates an account through actual form handlers');
    const customerId = ui.customerProfile().id;
    await ui.submit('profile', { name: 'Edited Example', mobile: '+962 79 123 4567' });
    assert.equal(ui.customerProfile().name, 'Edited Example');
    assert.equal(ui.customerProfile().mobile, '0791234567');
    const receipt = await api.placeOrder({
      token: 'a'.repeat(32), elapsedMs: 5000, website: '', lang: 'en', fulfilment: 'pickup',
      customer: { name: 'Edited Example', mobile: '0791234567', governorate: '', address: '', notes: '' },
      lines: [{ id: 'airtag:one', qty: 2 }], totalFils: 56000,
    });
    assert.match(receipt.number, /^DEMO-/);
    assert.equal(receipt.totalFils, 56000);
    await ui.loadAccount();
    assert.deepEqual(Array.from(ui.state.orders, (item) => item.number), [receipt.number], 'checkout appears automatically in the signed-in browser account history');
    assert((await api.demoOrders.orders()).orders.some((item) => item.number === receipt.number), 'the owner demo receives the same checkout order');
    for (const language of ['ar', 'en']) assert(ui.renderAccount(language).includes(receipt.number), `${language}: account history renders the checkout receipt`);
    const reopened = mount(api.account);
    await reopened.loadAccount();
    assert.equal(reopened.customerProfile().id, customerId, 'the demo session survives a page reload');
    await ui.submit('password', { current: password, newPassword: 'another-valid-test-password' });
    await ui.click('[data-account-logout]');
    assert.equal(ui.customerProfile(), null);
    await ui.submit('login', { email, password });
    assert.equal(ui.customerProfile(), null, 'the replaced demo password no longer signs in');
    await ui.submit('login', { email, password: 'another-valid-test-password' });
    assert.equal(ui.customerProfile().id, customerId, 'the changed password signs in to the same account');
    assert.deepEqual(Array.from(ui.state.orders, (item) => item.number), [receipt.number], 'signing back in restores private demo history');
    assert.equal(network, 0, 'browser demo signup, profile, password, checkout, history and owner orders never contact an API');
  } finally {
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

export async function verifyCustomerAccountUI() {
  await verifyBrowserDemoAdapter();

  const pendingProfile = deferred();
  const profileRace = mount({ profile: () => pendingProfile.promise });
  await profileRace.loadAccount();
  const saving = profileRace.submit('profile', { name: 'Updated Alice', mobile: '' });
  await profileRace.click('[data-account-logout]');
  assert.equal(profileRace.customerProfile(), null);
  pendingProfile.resolve({ customer: { ...alice, name: 'Updated Alice' } });
  await saving;
  assert.equal(profileRace.customerProfile(), null, 'a late profile result cannot restore the customer after logout');
  assert.equal(profileRace.state.busy, false);

  const pendingHistory = deferred();
  let historyCalls = 0;
  const historyRace = mount({
    orders: async () => { historyCalls++; if (historyCalls === 1) return { orders: [order('ALICE-1')], nextBefore: 101 }; if (historyCalls === 2) return pendingHistory.promise; return { orders: [order('BOB-1')], nextBefore: null }; },
    login: async () => ({ customer: bob }),
  });
  await historyRace.loadAccount();
  const paging = historyRace.click('[data-account-more]');
  await historyRace.click('[data-account-logout]');
  await historyRace.submit('login', { email: bob.email, password: 'a-valid-test-password' });
  pendingHistory.resolve({ orders: [order('ALICE-OLDER')], nextBefore: 50 });
  await paging;
  assert.equal(historyRace.customerProfile().id, bob.id);
  assert.deepEqual(Array.from(historyRace.state.orders, (item) => item.number), ['BOB-1'], 'late history cannot cross into another customer account');
  assert.equal(historyRace.state.nextBefore, null);

  const pendingSession = deferred();
  let sessionCalls = 0;
  const refreshRace = mount({ session: () => ++sessionCalls === 1 ? pendingSession.promise : Promise.resolve(session(bob)) });
  const olderRefresh = refreshRace.loadAccount();
  await refreshRace.loadAccount();
  pendingSession.resolve(session(alice));
  await olderRefresh;
  assert.equal(refreshRace.customerProfile().id, bob.id, 'a stale session refresh cannot replace the latest identity');

  const pendingLogin = deferred();
  let loginCalls = 0;
  let refreshCalls = 0;
  const loginRefresh = mount({ session: async () => { refreshCalls++; return session(null); }, login: () => { loginCalls++; return pendingLogin.promise; } });
  await loginRefresh.loadAccount();
  const signingIn = loginRefresh.submit('login', { email: alice.email, password: 'a-valid-test-password' });
  await loginRefresh.loadAccount();
  await loginRefresh.submit('login', { email: bob.email, password: 'another-valid-password' });
  assert.equal(refreshCalls, 1, 'route refreshes cannot preempt an active authentication request');
  assert.equal(loginCalls, 1, 'a pending cookie response keeps subsequent logins locked');
  pendingLogin.resolve({ customer: alice });
  await signingIn;
  assert.equal(loginRefresh.customerProfile().id, alice.id);

  let failHistory = true;
  const retryHistory = mount({ orders: async () => { if (failHistory) throw { code: 'network' }; return { orders: [order('RETRY-1')], nextBefore: null }; } });
  await retryHistory.loadAccount();
  assert.equal(retryHistory.state.configured, true, 'history failure does not disable authentication');
  assert.equal(retryHistory.customerProfile().id, alice.id);
  assert(retryHistory.renderAccount('en').includes('data-account-retry-orders'), 'history has its own retry action');
  assert(!retryHistory.renderAccount('en').includes('No orders are linked'), 'failed history is not presented as an empty order book');
  failHistory = false;
  await retryHistory.click('[data-account-retry-orders]');
  assert.equal(retryHistory.state.historyError, '');
  assert.equal(retryHistory.state.orders[0].number, 'RETRY-1');

  let failSession = true;
  const retrySession = mount({ session: async () => { if (failSession) throw { code: 'network' }; return session(null); } });
  await retrySession.loadAccount();
  assert.equal(retrySession.state.configured, false);
  assert(retrySession.renderAccount('en').includes('data-account-retry'), 'session connection failures can be retried');
  failSession = false;
  await retrySession.click('[data-account-retry]');
  assert.equal(retrySession.state.configured, true);
  assert(!retrySession.renderAccount('en').includes('<fieldset disabled>'), 'successful retry re-enables sign-in');

  const expiredHistory = mount({ orders: async () => { throw { status: 401, code: 'signed-out' }; } });
  await expiredHistory.loadAccount();
  assert.equal(expiredHistory.customerProfile(), null);
  assert.equal(expiredHistory.state.orders.length, 0);
  assert.equal(expiredHistory.state.error, 'signed-out');
  assert.equal(expiredHistory.state.configured, true);
  const expiredProfile = mount({ profile: async () => { throw { status: 401, code: 'signed-out' }; } });
  await expiredProfile.loadAccount();
  await expiredProfile.submit('profile', { name: 'Alice', mobile: '' });
  assert.equal(expiredProfile.customerProfile(), null, 'profile401 clears private identity');
  assert.equal(expiredProfile.state.orders.length, 0);

  let registrations = 0;
  let passwordBody;
  const forms = mount({ session: async () => session(null), register: async () => { registrations++; return { customer: { ...alice, name: '<script>Example</script>' } }; }, password: async (body) => { passwordBody = body; return { ok: true }; } });
  await forms.loadAccount();
  await forms.submit('register', { name: 'Example', email: alice.email, password: 'a-valid-test-password', repeat: 'mismatch' });
  assert.equal(registrations, 0, 'password confirmation is checked before registration');
  await forms.submit('register', { name: 'Example', email: alice.email, password: 'a-valid-test-password', repeat: 'a-valid-test-password' });
  assert.equal(registrations, 1);
  for (const language of ['ar', 'en']) {
    const html = forms.renderAccount(language);
    assert(html.includes('&lt;script&gt;Example&lt;/script&gt;'), `${language}: profile values are escaped`);
    assert(!html.includes('type="email"'), `${language}: profile email is read-only`);
  }
  await forms.submit('password', { current: 'old-test-password', newPassword: 'a-new-valid-password' });
  assert.equal(passwordBody.current, 'old-test-password');
  assert.equal(passwordBody.password, 'a-new-valid-password');
  assert.equal(forms.state.busy, false);
  console.log('Customer account UI passed: real Pages demo signup/signin/profile/password/checkout/history, account forms, request races,401 clearing, and connection retries');
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) await verifyCustomerAccountUI();
