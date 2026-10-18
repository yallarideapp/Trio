// Exercise actual account event handlers with controlled API response ordering.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { formatJD } from '../shared/pricing.js';

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
  const context = vm.createContext({ api: { account }, formatJD, Element, HTMLFormElement, document: { addEventListener: (name, handler) => handlers.set(name, handler) }, Intl, console });
  vm.runInContext(source + '\nglobalThis.ui = { state, renderAccount, loadAccount, bindAccount, customerProfile, accountLabel };', context);
  const ui = context.ui;
  ui.bindAccount(() => {}); ui.renderAccount('en');
  return {
    ...ui, account,
    click: (selector, dataset) => handlers.get('click')({ target: new Element(selector, dataset) }),
    submit: (action, values) => handlers.get('submit')({ target: new HTMLFormElement(action, values), preventDefault() {} }),
  };
}

async function verifyOfflineAdapter() {
  const oldFetch = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  let network = 0;
  try {
    globalThis.fetch = () => { network++; throw new Error('Pages must not request customer APIs'); };
    const url = new URL('../site/src/store.js', import.meta.url);
    const source = readFileSync(url, 'utf8').replace(/\b__MODE__\b/g, JSON.stringify('pages')).replace(/from '([^']+)'/g, (_, ref) => `from ${JSON.stringify(new URL(ref, url).href)}`);
    const { api } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
    const ui = mount(api.account);
    await ui.loadAccount();
    assert.equal(ui.state.configured, false);
    assert.equal(ui.customerProfile(), null);
    assert(ui.renderAccount('en').includes('<fieldset disabled>'), 'Pages authentication fields are disabled');
    await ui.submit('register', { name: 'Example', email: 'test@example.test', password: 'a-valid-test-password', repeat: 'a-valid-test-password' });
    assert.equal(ui.customerProfile(), null, 'Pages cannot create a simulated customer');
    await assert.rejects(api.account.login({}), (error) => error.code === 'accounts-unavailable');
    assert.equal(network, 0, 'Pages account UI and unavailable adapter never contact an API');
  } finally {
    if (oldFetch) Object.defineProperty(globalThis, 'fetch', oldFetch); else delete globalThis.fetch;
  }
}

export async function verifyCustomerAccountUI() {
  await verifyOfflineAdapter();

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
  console.log('Customer account UI passed: unavailable Pages adapter, account forms, password mapping, private history, request races,401 clearing, and connection retries');
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) await verifyCustomerAccountUI();
