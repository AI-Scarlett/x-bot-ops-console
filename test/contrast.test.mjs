// Dark-mode readability guard.
//
// The panel styles itself with DSH theme tokens. Two controls paired the theme
// accent fill (near-white in dark mode) with a hardcoded '#fff' label, so their
// text disappeared: 固定/随机间隔 and the 当前生效 pill. This test resolves every
// inline colour against the real dark-theme token values and fails on any pair
// whose contrast ratio would make the label unreadable.
//
// Real token values, extracted from the shipped DSH bundle:
//   bg-layer-1 #232324 · bg-layer-2 #2c2c2e · bg-layer-3 #353638
//   label-primary #f9fafb · label-secondary #61666b · label-tertiary #81858c
//   button-primary-fill #f9fafb · label-primary-foreground #0f1115

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_CONFIG } from '../index.js';

const DARK = {
  surface: '#232324',      // bg-layer-1 = neutral-bluish-875
  layerTwo: '#2c2c2e',     // bg-layer-2 = neutral-bluish-850
  raised: '#353638',       // bg-layer-3 = neutral-bluish-800
  text: '#f9fafb',         // label-primary
  muted: '#61666b',        // label-secondary
  faint: '#81858c',        // label-tertiary
  accent: '#f9fafb',       // button-primary-fill -> brand-primary
  onAccent: '#0f1115',     // label-primary-foreground
  error: '#f25a5a',
  success: '#22c55e',
};
const TOKENS = {
  'dsw-alias-bg-layer-1': '#232324',
  'dsw-alias-bg-layer-2': '#2c2c2e',
  'dsw-alias-bg-layer-3': '#353638',
  'dsw-alias-label-primary': '#f9fafb',
  'dsw-alias-label-secondary': '#61666b',
  'dsw-alias-label-tertiary': '#81858c',
  'dsw-alias-button-primary-fill': '#f9fafb',
  'dsw-alias-label-primary-foreground': '#0f1115',
  'dsw-alias-state-error-primary': '#f25a5a',
  'dsw-alias-state-success-primary': '#22c55e',
  'dsw-alias-brand-primary': '#f9fafb',
};
const TOKEN = /var\((--dsw-alias-[a-z0-9-]+)(?:,\s*([^)]+))?\)/;
function resolveColor(value) {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim();
  const m = v.match(TOKEN);
  const tokenKey = m ? m[1].replace(/^--/, '') : '';
  if (m && TOKENS[tokenKey]) return TOKENS[tokenKey];
  if (m && m[2]) return resolveColor(m[2]);
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return v;
  if (/^rgb/i.test(v)) return v;
  if (v === 'currentColor') return DARK.text;
  return null;
}
function toRgb(c) {
  if (!c) return null;
  if (c.startsWith('#')) {
    let hex = c.slice(1);
    if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
    if (hex.length === 8) hex = hex.slice(0, 6);
    if (hex.length !== 6) return null;
    return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(',').map(x => parseFloat(x.trim()));
  const [r, g, b] = parts;
  const alpha = parts.length > 3 ? parts[3] : 1;
  if (alpha >= 1) return [r, g, b];
  // Composite a translucent fill over the card it sits on.
  const over = toRgb(DARK.layerTwo);
  return [r * alpha + over[0] * (1 - alpha), g * alpha + over[1] * (1 - alpha), b * alpha + over[2] * (1 - alpha)];
}
function lum([r, g, b]) {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
const body = source.replace(/^window\.__ModuleLoader__\.load\(\{/, 'const __plugin = {').replace(/\}\);\s*$/, '};');

function mount(tab) {
  const hooks = [];
  let hookIndex = 0;
  let rootComponent = null;
  const React = {
    createElement(type, props, ...children) { return { type, props: props || {}, children: children.flat(Infinity) }; },
    useState(initial) { const i = hookIndex++; if (!(i in hooks)) hooks[i] = initial; return [hooks[i], v => { hooks[i] = v; }]; },
    useRef(initial) { const i = hookIndex++; if (!(i in hooks)) hooks[i] = { current: initial }; return hooks[i]; },
    useEffect() {}, useCallback(fn) { return fn; },
    Component: class { constructor(props) { this.props = props; } },
  };
  const config = structuredClone(DEFAULT_CONFIG);
  const state = {
    ok: true, configSource: 'shared', platform: 'darwin', checkedAt: new Date().toISOString(),
    items: { post: { priorityHandles: {} } }, dshModels: ['gpt-6-luna'],
    postQueue: [{ id: 'q1', text: '示例草稿文本，一行一句。', source: 'ai_draft', hotTopic: '某热点' }],
    postHistory: [], learnings: { patterns: [{ id: 'p', title: '套路', structure: 's', hooks: [] }], bannedTopics: [], winningTopics: [], styleGuide: '', history: {} },
    trends: { fetchedAt: null, topics: [], sources: [], boards: [] },
    maintenance: {}, cruiseSweep: null, replyDiagnostics: null, configBackups: [], fieldSide: {},
    workerAcceptance: {}, configHash: 'hash-1',
    knowledgeBase: { enabled: true, exists: true, entries: [{ id: 'a.md', title: '一篇', imageName: 'a.jpg', bytes: 1024, published: false }], publishedCount: 0, pendingCount: 1, todayCount: 0, perDay: 1, quotaLeft: 1 },
    usedHotTopics: [],
  };
  Object.assign(hooks, { 0: state, 5: config, 6: 'hash-1', 8: tab });
  const locale = { register() {}, bind() { return k => k; } };
  const slots = { inject(_n, fn) { fn(); }, register(def, comp) { if (def?.name === 'main') rootComponent = comp; } };
  const ctx = { effect(fn) { fn(); }, locale, slots };
  const factory = new Function('window', 'require', `${body}; return __plugin;`);
  const plugin = factory({ location: { protocol: 'http:' }, __ModuleLoader__: { load() {} } }, id => (id === 'react' ? React : {}));
  plugin.factory(id => (id === 'react' ? React : {})).apply(ctx);
  globalThis.setInterval = () => 0;
  globalThis.clearInterval = () => {};
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ ok: true, value: { ok: true } }) });
  hookIndex = 0;
  let node = rootComponent();
  let guard = 0;
  while (node && typeof node.type === 'function' && node.type.name !== 'Panel') {
    if (guard++ > 20) throw new Error('no Panel');
    const props = { ...(node.props || {}) };
    if (node.children?.length && props.children === undefined) props.children = node.children.length === 1 ? node.children[0] : node.children;
    const T = node.type;
    node = T.prototype && T.prototype.render ? new T(props).render() : T(props);
  }
  hookIndex = 0;
  return node.type(node.props);
}

function walk(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) { node.forEach(n => walk(n, out)); return out; }
  out.push(node);
  walk(node.children, out);
  if (node.props?.children !== undefined) walk(node.props.children, out);
  return out;
}

test('no control loses its label in dark mode', () => {
  const tabs = ['post', 'learning', 'general', 'comment', 'reply', 'profile', 'tiers'];
  const problems = [];
  for (const tab of tabs) {
    const tree = mount(tab);
    for (const el of walk(tree)) {
      const s = el.props?.style;
      if (!s || typeof s !== 'object') continue;
      const fg = resolveColor(s.color);
      const bgRaw = s.background || s.backgroundColor;
      const bg = resolveColor(bgRaw);
      if (!fg || !bg) continue;
      const a = toRgb(fg);
      const b = toRgb(bg);
      if (!a || !b) continue;
      const ratio = contrast(a, b);
      if (ratio < 1.6) {
        problems.push(`${tab}: <${typeof el.type === 'string' ? el.type : 'component'}> 文字 ${fg} 压在 ${bg} 上（对比度 ${ratio.toFixed(2)}）`);
      }
    }
  }
  assert.deepEqual(problems, [], `深色模式下看不清的控件：\n${problems.join('\n')}`);
});
