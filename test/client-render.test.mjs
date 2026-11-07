// Real render smoke test for the browser bundle.
//
// The tiers tab used to be a hardcoded pair of cards; it is now an editable list
// (add / rename / reorder / delete / disable). Static greps cannot prove that the
// page still renders and that the controls actually mutate config, so this file
// executes the real bundle with a tiny React stand-in: createElement builds plain
// trees, hooks keep a persistent state store, and clicking a control re-renders
// the same component exactly like React would.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { DEFAULT_CONFIG } from '../index.js';

function sampleConfig(extra = {}) {
  const config = structuredClone(DEFAULT_CONFIG);
  config.specialPersons = {
    apex: { handle: '4ggug', enabled: true, rules: { careEnabled: false }, replyStyle: '聊两性，撩骚' },
    yijing: { handle: 'mrchen1998', enabled: true, replyStyle: '遇到易经的帖子就跟它聊易经' },
    skipReplyHandles: ['grok'],
  };
  return { ...config, ...extra };
}

const sampleState = {
  ok: true, configSource: 'shared', platform: 'darwin', checkedAt: new Date().toISOString(),
  items: { comment: { priorityHandles: {} } }, dshModels: ['gpt-6-luna'], postQueue: [],
  postHistory: [], learnings: { patterns: [], bannedTopics: [], styleGuide: '', samples: [] },
  trends: {
    fetchedAt: '2026-11-06 16:00:00', topics: ['某地暴雨致列车停运', '某明星深夜聚餐', '央行宣布降准'],
    sources: [{ label: '微博', ok: true }], boards: [],
  },
  maintenance: {}, cruiseSweep: null, replyDiagnostics: null,
  configBackups: [], fieldSide: {}, workerAcceptance: {}, configHash: 'hash-1',
};

function textOf(node, out = []) {
  if (node === null || node === undefined || typeof node === 'boolean') return out;
  if (typeof node === 'string' || typeof node === 'number') { out.push(String(node)); return out; }
  if (Array.isArray(node)) { for (const item of node) textOf(item, out); return out; }
  if (typeof node !== 'object') return out;
  textOf(node.children, out);
  if (node.props && node.props.children !== undefined) textOf(node.props.children, out);
  return out;
}
const flatText = node => textOf(node).join(' ');

function elements(node, out = []) {
  if (node === null || node === undefined || typeof node !== 'object') return out;
  if (Array.isArray(node)) { for (const item of node) elements(item, out); return out; }
  out.push(node);
  elements(node.children, out);
  if (node.props && node.props.children !== undefined) elements(node.props.children, out);
  return out;
}

function mount({ config = sampleConfig(), state = sampleState, tab = 'tiers' } = {}) {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  const body = source.replace(/^window\.__ModuleLoader__\.load\(\{/, 'const __plugin = {').replace(/\}\);\s*$/, '};');

  const hooks = [];
  const requests = [];
  let hookIndex = 0;
  let rootComponent = null;

  const React = {
    createElement(type, props, ...children) {
      const flat = children.flat(Infinity);
      // React throws "Objects are not valid as a React child" for this, and the
      // real page dies behind its error boundary — so fail here instead. It is
      // how `dropped.map(chip)` with a 3-arg callback got shipped once.
      for (const child of flat) {
        if (child === null || child === undefined || typeof child === 'boolean') continue;
        if (typeof child === 'string' || typeof child === 'number') continue;
        if (typeof child === 'object' && 'type' in child) continue;
        throw new Error(`Invalid React child (would crash the panel): ${JSON.stringify(child).slice(0, 160)}`);
      }
      return { type, props: props || {}, children: flat };
    },
    useState(initial) {
      const index = hookIndex++;
      if (!(index in hooks)) hooks[index] = typeof initial === 'function' ? initial() : initial;
      return [hooks[index], value => { hooks[index] = typeof value === 'function' ? value(hooks[index]) : value; }];
    },
    useRef(initial) {
      const index = hookIndex++;
      if (!(index in hooks)) hooks[index] = { current: initial };
      return hooks[index];
    },
    useEffect() {},
    useCallback(fn) { return fn; },
    Component: class { constructor(props) { this.props = props; } },
    // useState slots are positional: 0 state, 1 error, 2 notice, 3 busy,
    // 4 updating, 5 config, 6 configHash, 7 draftDirty, 8 activeTab.
    __seed: undefined,
  };
  const seed = { 0: state, 5: config, 6: 'hash-1', 8: tab };
  for (const [index, value] of Object.entries(seed)) hooks[Number(index)] = value;

  const locale = { register() {}, bind() { return key => key; } };
  const slots = { inject(_name, fn) { fn(); }, register(definition, component) { if (definition && definition.name === 'main') rootComponent = component; } };
  const ctx = { effect(fn) { fn(); }, locale, slots };

  const moduleFactory = new Function('window', 'require', `${body}; return __plugin;`);
  const plugin = moduleFactory(
    { location: { protocol: 'http:' }, __ModuleLoader__: { load() {} } },
    id => (id === 'react' ? React : {}),
  );
  const exported = plugin.factory(id => (id === 'react' ? React : {}));
  exported.apply(ctx);
  assert.ok(rootComponent, 'client bundle must register a root component');

  const placeholders = [];
  globalThis.fetch = async (url, options = {}) => {
    if (options && options.method === 'POST') {
      requests.push(JSON.parse(options.body));
      return { ok: true, json: async () => ({ ok: true, value: { ok: true, config, configHash: 'hash-2', note: '已保存' } }) };
    }
    return { ok: true, json: async () => ({ ok: true, config, configHash: 'hash-1' }) };
  };
  const realSetInterval = globalThis.setInterval;
  const realClearInterval = globalThis.clearInterval;
  globalThis.setInterval = () => 0;
  globalThis.clearInterval = () => {};

  const render = () => {
    hookIndex = 0;
    let node = rootComponent();
    let guard = 0;
    while (node && typeof node === 'object' && typeof node.type === 'function' && node.type.name !== 'Panel') {
      if (guard++ > 20) throw new Error('component chain did not reach Panel');
      const type = node.type;
      // React merges children into props; the stand-in keeps them apart.
      const props = { ...(node.props || {}) };
      if (node.children && node.children.length && props.children === undefined) props.children = node.children.length === 1 ? node.children[0] : node.children;
      node = type.prototype && type.prototype.render ? new type(props).render() : type(props);
    }
    assert.ok(node && node.type && node.type.name === 'Panel', 'Panel component should be rendered');
    hookIndex = 0;
    return node.type(node.props);
  };

  const api = {
    React, hooks, requests, render,
    config: () => hooks[5],
    find: (tree, predicate) => elements(tree).find(predicate),
    findByText: (tree, text) => elements(tree).find(node => node.type && typeof node.type !== 'function' && flatText(node).includes(text)),
    click: async (tree, text) => {
      const node = elements(tree).find(item => item.type === 'button' && flatText(item).includes(text) && item.props && item.props.onClick);
      assert.ok(node, `button not found: ${text}`);
      await node.props.onClick({ preventDefault() {}, target: {} });
    },
    close() { globalThis.setInterval = realSetInterval; globalThis.clearInterval = realClearInterval; },
  };
  return api;
}

test('tiers tab renders editable special-person rows from a legacy config', () => {
  const app = mount();
  try {
    const tree = app.render();
    assert.match(flatText(tree), /关键特例人物专属回复配置/);
    assert.match(flatText(tree), /添加特例人物/);
    assert.match(flatText(tree), /@4ggug/);
    assert.match(flatText(tree), /@mrchen1998/);
    assert.match(flatText(tree), /专属回复规则 \/ 附加提示词/);
    // Two legacy people become two fully editable cards.
    const handleInputs = elements(tree).filter(node => node.type === 'input' && node.props?.placeholder === '例如 4ggug');
    assert.equal(handleInputs.length, 2);
    const styleBoxes = elements(tree).filter(node => node.type === 'textarea' && String(node.props?.placeholder || '').includes('聊两性'));
    assert.equal(styleBoxes.length, 2);
  } finally { app.close(); }
});

test('add, edit, reorder and delete all mutate the config that gets saved', async () => {
  const app = mount();
  try {
    let tree = app.render();

    // Add a row, then fill it in.
    await app.click(tree, '添加特例人物');
    tree = app.render();
    assert.equal(app.config().specialPersons.list.length, 3, 'list should carry the new row');

    const handleInputs = elements(tree).filter(node => node.type === 'input' && node.props?.placeholder === '例如 4ggug');
    const newHandle = handleInputs[handleInputs.length - 1];
    newHandle.props.onChange({ target: { value: 'Tea_Friend!' } });
    tree = app.render();
    const rows = app.config().specialPersons.list;
    assert.equal(rows[2].handle, 'tea_friend', 'handle input is normalised to a valid handle');

    const styleBoxes = elements(tree).filter(node => node.type === 'textarea' && String(node.props?.placeholder || '').includes('聊两性'));
    styleBoxes[styleBoxes.length - 1].props.onChange({ target: { value: '聊茶与旧书' } });
    tree = app.render();
    assert.equal(app.config().specialPersons.list[2].replyStyle, '聊茶与旧书');

    // Delete the legacy yijing row: it must disappear from the config.
    const deleteButtons = elements(tree).filter(node => node.type === 'button' && flatText(node).includes('🗑 删除'));
    assert.equal(deleteButtons.length, 3);
    await deleteButtons[1].props.onClick({ preventDefault() {}, target: {} });
    tree = app.render();
    const afterDelete = app.config().specialPersons.list;
    assert.equal(afterDelete.length, 2);
    assert.ok(!afterDelete.some(row => row.handle === 'mrchen1998'), 'deleted person is gone');

    // Save posts exactly that list, and keeps apex mirrored for the workers.
    await app.click(tree, '保存并写入共享配置');
    assert.equal(app.requests.length, 1, 'save posts one request');
    const posted = app.requests[0];
    assert.equal(posted.action, 'save-config');
    assert.equal(posted.config.specialPersons.list.length, 2);
    assert.deepEqual(posted.config.specialPersons.list.map(row => row.handle), ['4ggug', 'tea_friend']);
    assert.equal(posted.config.specialPersons.apex.handle, '4ggug');
    assert.equal(posted.config.specialPersons.apex.replyStyle, '聊两性，撩骚');
    // The deleted legacy person must stop injecting rules.
    assert.equal(posted.config.specialPersons.yijing.replyStyle, '');
  } finally { app.close(); }
});

test('hot board adopted list lets the operator strike a topic out, and undo it', async () => {
  const app = mount({ tab: 'learning' });
  try {
    let tree = app.render();
    assert.match(flatText(tree), /会被采用的/);
    assert.match(flatText(tree), /某地暴雨致列车停运/);
    assert.match(flatText(tree), /手动剔除的话题（0 条/);

    // Strike the first adopted headline out.
    const strikes = elements(tree).filter(node => node.type === 'button' && node.props?.title === '手动剔除，不再采用');
    assert.equal(strikes.length, 3, 'every adopted topic owns a strike button');
    await strikes[0].props.onClick({ preventDefault() {}, target: {} });
    tree = app.render();
    assert.deepEqual(app.config().postSettings.hotFilter.excludedTopics, ['某地暴雨致列车停运']);
    assert.match(flatText(tree), /手动剔除的话题（1 条/);
    // The struck headline left the adopted bucket and is marked as removed.
    assert.match(flatText(tree), /手动剔除/);

    // Undo from the manual list.
    const restores = elements(tree).filter(node => node.type === 'button' && node.props?.title === '恢复采用');
    assert.equal(restores.length, 1);
    await restores[0].props.onClick({ preventDefault() {}, target: {} });
    tree = app.render();
    assert.deepEqual(app.config().postSettings.hotFilter.excludedTopics, []);
    assert.match(flatText(tree), /手动剔除的话题（0 条/);
  } finally { app.close(); }
});

test('the panel version badge shows the installed version instead of a frozen string', () => {
  const app = mount({ state: { ...sampleState, pluginVersion: '9.9.9' } });
  try {
    const tree = app.render();
    assert.match(flatText(tree), /v9\.9\.9/);
    assert.doesNotMatch(flatText(tree), /v0\.19\.0/);
  } finally { app.close(); }
  // Without a host-provided version the badge says so instead of lying.
  const stale = mount();
  try {
    assert.match(flatText(stale.render()), /待宿主重载/);
  } finally { stale.close(); }
});

test('an invalid React child is rejected by the harness itself', () => {
  const app = mount();
  try {
    assert.throws(() => app.React.createElement('div', null, { topic: 'x', ok: true }), /Invalid React child/);
  } finally { app.close(); }
});

test('ops panel wires the login probe and the cookie sync button', async () => {
  const app = mount({ tab: 'general' });
  try {
    let tree = app.render();
    assert.match(flatText(tree), /拉起全部 Chrome/);
    assert.match(flatText(tree), /检查 X 登录状态/);
    assert.match(flatText(tree), /同步登录态/);

    // The probe posts the dedicated action and survives a payload without results.
    await app.click(tree, '检查 X 登录状态');
    assert.ok(app.requests.some(body => body.action === 'chrome-login-status'), 'probe action should be posted');
    tree = app.render();
    assert.ok(!/界面渲染遇到错误/.test(flatText(tree)));

    // The cookie sync asks for confirmation first (no accidental cookie copying).
    await app.click(tree, '同步登录态');
    tree = app.render();
    assert.match(flatText(tree), /复制到另外三个浏览器/);
    assert.ok(!app.requests.some(body => body.action === 'sync-login'), 'sync must wait for confirmation');
  } finally { app.close(); }
});

test('list fields keep exactly what you type and only parse on blur', () => {
  const app = mount({ tab: 'learning' });
  try {
    const tree = app.render();
    const fields = elements(tree).filter(node => typeof node.type === 'function' && node.type.name === 'ListText');
    assert.ok(fields.length >= 2, 'learning tab should render list fields');
    const multiline = fields.find(node => node.props.multiline) || fields[0];
    const inst = new multiline.type(multiline.props);
    inst.setState = patch => { inst.state = { ...inst.state, ...patch }; };

    let field = inst.render();
    // Type a separator plus a new item, then leave a trailing comma in place.
    const typed = `${field.props.value}, 新词, `;
    let liveCommitted = null;
    inst.props = { ...multiline.props, onCommit: items => { liveCommitted = items; } };
    field.props.onFocus();
    field.props.onChange({ target: { value: typed } });
    field = inst.render();
    // The trailing comma and space must survive while typing.
    assert.equal(field.props.value, typed);
    assert.match(field.props.value, /新词, $/);
    // The saved value is already updated mid-typing (so 保存 without blurring is safe).
    assert.ok(liveCommitted.includes('新词'), 'edit is committed as you type');

    let committed = null;
    inst.props = { ...inst.props, onCommit: items => { committed = items; } };
    field.props.onBlur();
    assert.ok(Array.isArray(committed), 'blur commits too');
    assert.ok(committed.includes('新词'), 'item is committed on blur');
    assert.ok(committed.every(item => item !== ''), 'no empty entries from the separator');
    field = inst.render();
    assert.equal(field.props.value, committed.join(', '), 'only normalised after blur');

    // Single-line fields commit on Enter.
    const single = fields.find(node => !node.props.multiline);
    if (single) {
      const inst2 = new single.type(single.props);
      inst2.setState = patch => { inst2.state = { ...inst2.state, ...patch }; };
      let field2 = inst2.render();
      let blurred = false;
      let prevented = false;
      field2.props.onKeyDown({ key: 'Enter', preventDefault() { prevented = true; }, currentTarget: { blur() { blurred = true; } } });
      assert.equal(prevented, true);
      assert.equal(blurred, true);
      field2.props.onKeyDown({ key: 'a', preventDefault() {}, currentTarget: { blur() {} } });
      assert.equal(prevented, true, 'other keys are left alone');
    }
  } finally { app.close(); }
});

test('adding a handle that sits in another tier asks before moving it', async () => {
  const tiers = [
    { id: 'apex', label: 'Apex 档位', handles: [], rounds: 30, replyStyle: '' },
    { id: 'tier1', label: 'Tier 1 档位', handles: ['老王'], rounds: 20, replyStyle: '' },
    { id: 'tier2', label: 'Tier 2 档位', handles: [], rounds: 10, replyStyle: '' },
    { id: 'tier3', label: 'Tier 3 档位', handles: [], rounds: 5, replyStyle: '' },
    { id: 'tier4', label: 'Tier 4 档位', handles: [], rounds: 4, replyStyle: '' },
    { id: 'other', label: '其他用户', handles: [], rounds: 3, replyStyle: '' },
  ];
  const app = mount({ tab: 'tiers', config: sampleConfig({ tiers }) });
  try {
    let tree = app.render();
    // Find the tier that owns 老王 and the tier we add him to.
    const tierBoxes = elements(tree).filter(node => node.type === 'textarea'
      && String(node.props?.placeholder || '').includes('user1'));
    assert.equal(tierBoxes.length, 6, 'the tier list renders a handle box per tier');
    // 老王 sits in Tier 1; add him to the Apex tier instead.
    const tier1Box = tierBoxes[0];

    // Adding 老王 to the first tier (apex) must ask first.
    tier1Box.props.onBlur({ target: { value: '老王, 新同学' } });
    tree = app.render();
    const modal = elements(tree).find(node => node.props && node.props.role === 'alertdialog');
    assert.ok(modal, 'a confirmation dialog appears');
    const dialogText = flatText(modal);
    assert.match(dialogText, /老王/);
    assert.match(dialogText, /Tier 1/);
    assert.match(dialogText, /Apex/);
    // Nothing moved before the confirmation.
    assert.equal(app.config().tiers[1].handles.length, 1);

    // Confirm: the handle moves, the other tier loses it, the new one stays.
    const confirmBtn = elements(modal).find(node => node.type === 'button' && flatText(node).includes('确认移动'));
    assert.ok(confirmBtn, 'the dialog has a confirm button');
    confirmBtn.props.onClick({ preventDefault() {}, target: {} });
    tree = app.render();
    const after = app.config().tiers;
    assert.deepEqual(after[0].handles, ['老王', '新同学']);
    assert.deepEqual(after[1].handles, [], 'the old tier gave the handle away');
    // A handle nobody owns is added straight away, without a dialog.
    const tierBoxes2 = elements(tree).filter(node => node.type === 'textarea'
      && String(node.props?.placeholder || '').includes('user1'));
    tierBoxes2[2].props.onBlur({ target: { value: '李四' } });
    tree = app.render();
    assert.equal(elements(tree).filter(node => node.props && node.props.role === 'alertdialog').length, 0);
    assert.deepEqual(app.config().tiers[2].handles, ['李四']);
  } finally { app.close(); }
});
