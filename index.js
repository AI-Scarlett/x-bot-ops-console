import { readFileSync, existsSync, openSync, closeSync, mkdirSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFile, execFileSync, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { createConnection } from 'node:net';

export const CONFIG_NAMESPACE = 'x-bot-ops-console';
export const PACKAGE_ID = 'dsh-x-bot-ops-console';
export const WEB_ROUTE = '/api/x-bot-ops-console';
export const DESKTOP_ROUTE = '/api/x-bot-ops-console';
const MAX_BODY = 128 * 1024;
const APP_HOME = homedir();
export const DEFAULT_COMMENT_DIR = join(APP_HOME, 'XBotOpsConsole', 'comment-worker');
export const DEFAULT_REPLY_DIR = join(APP_HOME, 'XBotOpsConsole', 'reply-worker');
export const DEFAULT_POST_DIR = join(APP_HOME, 'XBotOpsConsole', 'post-worker');
export const DEFAULT_PROFILE_DIR = join(APP_HOME, 'XBotOpsConsole', 'profile-worker');
export const DEFAULT_TARGETS = Object.freeze({
  comment: { dir: DEFAULT_COMMENT_DIR, worker: join(DEFAULT_COMMENT_DIR, 'comment_worker.py'), watchdog: join(DEFAULT_COMMENT_DIR, 'comment_watchdog.py'), watchdogPid: join(DEFAULT_COMMENT_DIR, 'comment_watchdog.pid'), stop: join(DEFAULT_COMMENT_DIR, 'comment_watchdog.stop'), pid: join(DEFAULT_COMMENT_DIR, 'comment_worker.pid'), log: join(DEFAULT_COMMENT_DIR, 'comment_worker.log'), heartbeat: join(DEFAULT_COMMENT_DIR, 'heartbeat.json'), rate: join(DEFAULT_COMMENT_DIR, 'rate_limit.json'), port: 9222 },
  reply: { dir: DEFAULT_REPLY_DIR, worker: join(DEFAULT_REPLY_DIR, 'reply_worker.py'), watchdog: join(DEFAULT_REPLY_DIR, 'reply_watchdog.py'), watchdogPid: join(DEFAULT_REPLY_DIR, 'reply_watchdog.pid'), stop: join(DEFAULT_REPLY_DIR, 'reply_watchdog.stop'), pid: join(DEFAULT_REPLY_DIR, 'reply_worker.pid'), log: join(DEFAULT_REPLY_DIR, 'reply_worker.log'), heartbeat: join(DEFAULT_REPLY_DIR, 'heartbeat.json'), rate: join(DEFAULT_REPLY_DIR, 'rate_limit.json'), port: 9223 },
  post: { dir: DEFAULT_POST_DIR, worker: join(DEFAULT_POST_DIR, 'post_worker.py'), watchdog: join(DEFAULT_POST_DIR, 'post_watchdog.py'), watchdogPid: join(DEFAULT_POST_DIR, 'post_watchdog.pid'), stop: join(DEFAULT_POST_DIR, 'post_watchdog.stop'), pid: join(DEFAULT_POST_DIR, 'post_worker.pid'), log: join(DEFAULT_POST_DIR, 'post_worker.log'), heartbeat: join(DEFAULT_POST_DIR, 'post_heartbeat.json'), rate: join(DEFAULT_POST_DIR, 'post_rate_limit.json'), port: 9224 },
  profile: { dir: DEFAULT_PROFILE_DIR, worker: join(DEFAULT_PROFILE_DIR, 'profile_worker.py'), watchdog: join(DEFAULT_PROFILE_DIR, 'profile_watchdog.py'), watchdogPid: join(DEFAULT_PROFILE_DIR, 'profile_watchdog.pid'), stop: join(DEFAULT_PROFILE_DIR, 'profile_watchdog.stop'), pid: join(DEFAULT_PROFILE_DIR, 'profile_worker.pid'), log: join(DEFAULT_PROFILE_DIR, 'profile_worker.log'), heartbeat: join(DEFAULT_PROFILE_DIR, 'profile_heartbeat.json'), rate: join(DEFAULT_PROFILE_DIR, 'profile_rate_limit.json'), port: 9225 },
});
export const CONFIG_PATH = join(APP_HOME, 'Library/Application Support/XBotOpsConsole/config.json');
export const TARGETS_PATH = join(APP_HOME, 'Library/Application Support/XBotOpsConsole/console-targets.json');

const TARGET_FIELDS = ['dir', 'worker', 'watchdog', 'watchdogPid', 'stop', 'pid', 'log', 'heartbeat', 'rate'];

// Every shared setting, and which worker actually reads it. Mirrors the two Python workers.
export const FIELD_SIDE = Object.freeze({
  'model.name': 'reply',
  'model.endpointPort': 'comment',
  'timing.commentWindowHours': 'comment',
  'timing.mentionWindowHours': 'reply',
  'timing.authorCooldownSeconds': 'comment',
  'timing.publishMinSeconds': 'both',
  'timing.publishMaxSeconds': 'both',
  'timing.quietHoursStart': 'both',
  'timing.quietHoursEnd': 'both',
  'timing.fullStopStart': 'both',
  'timing.fullStopEnd': 'both',
  'timing.postingWorkMinutes': 'both',
  'timing.postingRestMinutes': 'both',
  'timing.rateLimitMinutes': 'both',
  'timing.rateLimitLongMinutes': 'both',
  'tiers.handles': 'both',
  'tiers.rounds': 'reply',
  'tiers.replyStyle': 'reply',
  'specialPersons.apex.handle': 'both',
  'specialPersons.yijing.handle': 'both',
  'specialPersons.replyStyle': 'both',
  'specialPersons.skipReplyHandles': 'reply',
  'specialReplies': 'none',
  'rules.skipFinanceComments': 'comment',
  'commentSettings.model': 'comment',
  'commentSettings.customPrompt': 'comment',
  'replySettings.model': 'reply',
  'replySettings.customPrompt': 'reply',
  'postSettings.enabled': 'post',
  'postSettings.intervalMinutes': 'post',
  'postSettings.topics': 'post',
  'postSettings.model': 'post',
  'postSettings.customPrompt': 'post',
  'cruiseSettings.enabled': 'profile',
  'cruiseSettings.dailyTargetCount': 'profile',
  'cruiseSettings.crawlFollowing': 'profile',
  'cruiseSettings.crawlFollowers': 'profile',
  'cruiseSettings.interactionCooldownHours': 'profile',
  'cruiseSettings.autoVisitInvited': 'profile',
  'cruiseSettings.model': 'profile',
  'cruiseSettings.customPrompt': 'profile',
});

export function resolveDshPnpm() {
  const candidates = [
    '/Applications/DeepSeek Harness.app/Contents/Resources/runtime/primary-runtime/dependencies/pnpm/bin/pnpm.cjs',
    '/Applications/DeepSeek Harness.app/Contents/Resources/runtime/primary-runtime/dependencies/pnpm/dist/pnpm.mjs',
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

export function resolveDshProfiles() {
  const base = join(homedir(), '.dsh', 'profiles');
  const profiles = [];
  const desktop = join(base, 'desktop');
  if (existsSync(join(desktop, 'package.json'))) profiles.push({ name: 'desktop', dir: desktop });
  const web = join(base, 'web');
  if (existsSync(join(web, 'package.json'))) profiles.push({ name: 'web', dir: web });
  return profiles;
}

export async function executePluginUpdate({ repoSpec = 'github:AI-Scarlett/x-bot-ops-console' } = {}) {
  const pnpmPath = resolveDshPnpm();
  const profiles = resolveDshProfiles();
  if (profiles.length === 0) {
    throw new Error('未检测到 DSH 本地 Profile 目录（~/.dsh/profiles/desktop 或 web）');
  }
  const nodeBin = process.execPath;
  const results = [];
  for (const profile of profiles) {
    const args = pnpmPath
      ? [pnpmPath, '--dir', profile.dir, 'add', repoSpec]
      : ['--dir', profile.dir, 'add', repoSpec];
    const execCommand = pnpmPath ? nodeBin : 'pnpm';
    const output = await new Promise((resolve, reject) => {
      execFile(execCommand, args, {
        env: { ...process.env, DSH_HOME: join(homedir(), '.dsh') },
        timeout: 90000,
      }, (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`[${profile.name}] DSH 插件更新失败: ${err.message}\n${stderr || stdout}`));
        } else {
          resolve({ stdout: stdout || '', stderr: stderr || '' });
        }
      });
    });
    let updatedVersion = null;
    let commit = null;
    try {
      const pkgPath = join(profile.dir, 'node_modules', 'dsh-x-bot-ops-console', 'package.json');
      if (existsSync(pkgPath)) {
        const pkgData = JSON.parse(readFileSync(pkgPath, 'utf8'));
        updatedVersion = pkgData.version;
      }
    } catch {}
    try {
      const lockPath = join(profile.dir, 'pnpm-lock.yaml');
      if (existsSync(lockPath)) {
        const lockContent = readFileSync(lockPath, 'utf8');
        const match = lockContent.match(/x-bot-ops-console\/tar\.gz\/([0-9a-f]{7,40})/);
        if (match) commit = match[1];
      }
    } catch {}
    results.push({
      profile: profile.name,
      updatedVersion,
      commit,
      stdout: output.stdout.slice(-300),
    });
  }
  return {
    success: true,
    results,
    targetSpec: repoSpec,
    note: '已通过 DSH 内置包管理器成功更新至 GitHub 最新版本！请在 DSH 中按 Cmd+R 刷新界面即可生效。',
  };
}

export function readDshModels() {
  const models = new Set();
  const paths = [
    join(APP_HOME, '.dsh/profiles/desktop/cordis.patch.yml'),
    join(APP_HOME, '.dsh/profiles/web/cordis.patch.yml'),
  ];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    try {
      const content = readFileSync(p, 'utf8');
      const matches = content.matchAll(/^\s*-\s+id:\s*([^\s#]+)/gm);
      for (const m of matches) {
        const id = m[1].trim().replace(/^['"]|['"]$/g, '');
        if (id && !['agent-default-model', 'ui-settings-account', 'ui-chat', 'ui-settings', 'llm-pi-ai', 'ui-theme', 'edge-tts'].includes(id)) {
          models.add(id);
        }
      }
    } catch {}
  }
  if (models.size === 0) {
    return ['gpt-6-luna', 'gemini-3.8-flash-high', 'claude-opus-5-5-high', 'claude-sonnet-5-5-high', 'grok-4.7', 'gpt-5.6-luna'];
  }
  return [...models];
}

// Defaults equal to the values hard-coded in both Python workers, so a fresh save does not change runtime behaviour.
const DEFAULT_CONFIG = Object.freeze({
  schemaVersion: 1,
  note: '两类 Python worker 每轮读取共享配置；未接入的字段会标记为未生效。',
  model: { name: '', endpointPort: null, keySource: 'LocalModelHub 凭据引用（密钥不会被读取或显示）' },
  commentSettings: {
    model: '',
    customPrompt: '',
  },
  replySettings: {
    model: '',
    customPrompt: '',
  },
  timing: { commentWindowHours: 6, mentionWindowHours: 12, quietHoursStart: 0, quietHoursEnd: 7, fullStopStart: 1, fullStopEnd: 6, publishMinSeconds: 30, publishMaxSeconds: 100, authorCooldownSeconds: 1800, postingWorkMinutes: 20, postingRestMinutes: 5, rateLimitMinutes: 5, rateLimitLongMinutes: 15 },
  tiers: [
    { id: 'apex', label: '最高优先级', handles: ['4ggug'], rounds: 30, replyStyle: '' },
    { id: 'tier1', label: '优先级 1', handles: ['bottlecap8699', 'nguynbanph', 'mrchen1998', 'maiga23698'], rounds: 20, replyStyle: '' },
    { id: 'tier2', label: '优先级 2', handles: ['mzixioxio155612', 'xiaolikpo', 'lxl1818', 'hanxue9xue', 'kimmykimol', 'katherine1198', 'hnrr163487', '7gongg', 'lucia000000001', 'litteyyyue1229', 'pbftzogtmp43068', 'hhedy666', 'bmxdawang111', 'gqing0930', 'yoyomao9', 'hpyhh7', 'aquarius_0909', 'xzmokk', 'mia_linh01', 'wrt_win', 'xiaoyezimama'], rounds: 10, replyStyle: '' },
    { id: 'tier3', label: '优先级 3', handles: ['sujing110', 'hamy8998', 'jojojo624824460', 'nz3219798'], rounds: 5, replyStyle: '' },
    { id: 'tier4', label: '优先级 4', handles: ['dmx_flame', 'julsix2333'], rounds: 4, replyStyle: '' },
    { id: 'other', label: '其他用户', handles: [], rounds: 3, replyStyle: '' },
  ],
  specialPersons: {
    apex: { handle: '4ggug', enabled: true, rules: { careEnabled: false } },
    yijing: { handle: 'mrchen1998', enabled: true },
    skipReplyHandles: ['grok'],
  },
  specialReplies: { asksAi: '若被问及是否为 AI，请如实回答。', asksToStop: '若对方要求停止，请勿继续回复该讨论串。', care: '礼貌回应并围绕话题。', affection: '尊重回应，不诱导私下联系。', namedAddress: '以中性方式回应称呼。', daddy: '拒绝不合适的亲属角色扮演。', imperialTitle: '不宣称现实中的权力或身份。', vernacular: '仅在明确请求时翻译。' },
  rules: { skipFinanceComments: true, skipGrokMentions: false, doNotReplyAfterStopRequest: true, keepSensitiveKeyOutOfUi: true },
  postSettings: {
    enabled: true,
    intervalMinutes: 180,
    topics: ['文言雅趣', '周朝掌故', '易经随笔', '日常感悟'],
    model: '',
    customPrompt: '你在推特(X)上用周天子姬霸的人设发一条原创推文。文风为幽默、古奥的文言文或诗词歌赋，自称周天子、姬霸或夫子，不要露骨，禁止提现代网络低俗梗，字数在30到90字之间。',
  },
  cruiseSettings: {
    enabled: true,
    dailyTargetCount: 50,
    crawlFollowing: true,
    crawlFollowers: true,
    interactionCooldownHours: 48,
    autoVisitInvited: true,
    model: '',
    customPrompt: '你在推特(X)上用周天子姬霸的人设回复好友主页的最新推文。\n要求：用文言文或微言大义轻幽默回应对方的话题，亲切称呼对方，不要任何问句，不要现代粗俗脏话，字数在12到30字之间。直接输出纯文本。',
  },
});

const TIMING_BOUNDS = Object.freeze({
  commentWindowHours: [1, 48], mentionWindowHours: [1, 48], quietHoursStart: [0, 23], quietHoursEnd: [0, 24],
  fullStopStart: [0, 23], fullStopEnd: [0, 24], publishMinSeconds: [5, 3600], publishMaxSeconds: [5, 3600],
  authorCooldownSeconds: [60, 604800], postingWorkMinutes: [1, 120], postingRestMinutes: [0, 60],
  rateLimitMinutes: [1, 60], rateLimitLongMinutes: [1, 120],
});
const TIER_IDS = ['apex', 'tier1', 'tier2', 'tier3', 'tier4', 'other'];
const HANDLE_PATTERN = /^[a-z0-9_]{1,15}$/;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function isRecord(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
function sanitizeHandle(value) {
  if (typeof value !== 'string') throw new TypeError('用户名必须是文本');
  const handle = value.trim().replace(/^@/, '').toLowerCase();
  if (!HANDLE_PATTERN.test(handle)) throw new TypeError('用户名格式无效');
  return handle;
}
function readJsonSafe(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

export function resolveTargets(base = DEFAULT_TARGETS, overridesPath = TARGETS_PATH) {
  const raw = readJsonSafe(overridesPath);
  if (!isRecord(raw)) return base;
  const patches = isRecord(raw.targets) ? raw.targets : raw;
  const resolved = { ...base };
  for (const key of ['comment', 'reply', 'post', 'profile']) {
    const patch = isRecord(patches[key]) ? patches[key] : null;
    if (!patch) continue;
    const next = { ...(base[key] || {}) };
    for (const field of TARGET_FIELDS) {
      const value = patch[field];
      if (typeof value !== 'string' || !value.startsWith('/') || value.includes('..')) continue;
      next[field] = value;
    }
    if (typeof patch.python === 'string' && patch.python.startsWith('/') && !patch.python.includes('..') && patch.python.length < 512) next.python = patch.python;
    if (typeof patch.interpreterPidArgvToken === 'string' && patch.interpreterPidArgvToken.startsWith('/') && !patch.interpreterPidArgvToken.includes('..') && patch.interpreterPidArgvToken.length < 1024) next.interpreterPidArgvToken = patch.interpreterPidArgvToken;
    for (const tokenKey of ['workerPidArgvToken', 'watchdogPidArgvToken']) {
      if (typeof patch[tokenKey] === 'string' && patch[tokenKey].startsWith('/') && !patch[tokenKey].includes('..') && patch[tokenKey].length < 1024) next[tokenKey] = patch[tokenKey];
    }
    if (Number.isInteger(patch.port) && patch.port > 0 && patch.port < 65536) next.port = patch.port;
    resolved[key] = next;
  }
  return resolved;
}

function processInfo(pid) {
  const read = field => {
    try { return execFileSync('/bin/ps', ['-o', `${field}=`, '-p', String(pid)], { encoding: 'utf8', timeout: 1500, maxBuffer: 8192 }).trim(); }
    catch { return ''; }
  };
  return { stat: read('stat'), comm: read('comm'), command: read('command') };
}
function processState(pidPath, expectedScript, requiredArg = '', expectedArgvToken = expectedScript, interpreterToken = '') {
  let pid;
  try { pid = Number((readFileSync(pidPath, 'utf8') || '').trim()); } catch { return { running: false, pid: null, owned: false, detail: '未找到进程编号文件' }; }
  if (!Number.isSafeInteger(pid) || pid < 2) return { running: false, pid: null, owned: false, detail: '未找到进程编号文件' };
  const info = processInfo(pid);
  if (!info.command || info.stat.startsWith('Z')) return { running: false, pid, owned: false, detail: '进程编号已失效' };
  const scriptToken = String(expectedArgvToken).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tokens = info.command.match(/(?:"[^"]*"|'[^']*'|\S+)/g) || [];
  const cleanToken = token => token.replace(/^(?:"(.*)"|'(.*)')$/, (_, doubleQuoted, singleQuoted) => doubleQuoted ?? singleQuoted);
  const owned = tokens.some(token => cleanToken(token) === String(expectedArgvToken)) && (!requiredArg || tokens.some(token => cleanToken(token) === requiredArg)) && (!interpreterToken || tokens.some(token => cleanToken(token) === interpreterToken));
  return { running: true, pid, owned, detail: owned ? '工作进程身份已验证' : '该进程编号属于其他命令，控制已禁用' };
}
function portListening(port) {
  return new Promise(resolveResult => {
    const socket = createConnection({ host: '127.0.0.1', port });
    const finish = value => { try { socket.destroy(); } catch { /* ignore */ } resolveResult(value); };
    socket.setTimeout(1500);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

// Reads the priority handles that are hard-coded in a worker script, so the UI can offer them as the real current list.
export function readPriorityHandles(scriptPath) {
  const result = { apex: [], tier1: [], tier2: [], tier3: [], tier4: [] };
  let source;
  try { source = readFileSync(scriptPath, 'utf8'); } catch { return result; }
  const apex = source.match(/APEX_HANDLE\s*=\s*["']([A-Za-z0-9_]{1,15})["']/);
  if (apex) result.apex.push(apex[1].toLowerCase());
  for (const tier of ['tier1', 'tier2', 'tier3', 'tier4']) {
    const match = source.match(new RegExp(`PRIORITY_${tier.toUpperCase()}\\s*=\\s*\\(([\\s\\S]*?)\\)`));
    if (!match) continue;
    const handles = [...match[1].matchAll(/["']([A-Za-z0-9_]{1,15})["']/g)].map(item => item[1].toLowerCase());
    result[tier] = [...new Set(handles)];
  }
  return result;
}

// Mirrors the validation both Python workers run before they accept the shared config.
export function workerAcceptance(config) {
  const report = { comment: { accepted: true, reasons: [] }, reply: { accepted: true, reasons: [] } };
  const add = (side, reason) => { report[side].accepted = false; report[side].reasons.push(reason); };
  if (!isRecord(config)) { add('comment', '配置不是对象'); add('reply', '配置不是对象'); return report; }
  // The comment worker's loader requires these sections to be objects even though it currently ignores their contents.
  if (!isRecord(config.specialReplies)) add('comment', 'specialReplies 必须是对象');
  if (!isRecord(config.rules)) add('comment', 'rules 必须是对象');
  if (config.schemaVersion !== 1) { add('comment', 'schemaVersion 必须为 1'); add('reply', 'schemaVersion 必须为 1'); }
  const timing = config.timing;
  if (!isRecord(timing)) { add('comment', 'timing 必须是对象'); add('reply', 'timing 必须是对象'); }
  else {
    const commentKeys = ['rateLimitMinutes', 'rateLimitLongMinutes', 'postingWorkMinutes', 'postingRestMinutes', 'commentWindowHours', 'publishMinSeconds', 'publishMaxSeconds', 'authorCooldownSeconds', 'quietHoursStart', 'quietHoursEnd', 'fullStopStart', 'fullStopEnd'];
    const replyKeys = ['rateLimitMinutes', 'rateLimitLongMinutes', 'postingWorkMinutes', 'postingRestMinutes', 'mentionWindowHours', 'publishMinSeconds', 'publishMaxSeconds', 'quietHoursStart', 'quietHoursEnd', 'fullStopStart', 'fullStopEnd'];
    for (const [side, keys] of [['comment', commentKeys], ['reply', replyKeys]]) {
      for (const key of keys) if (typeof timing[key] !== 'number' || !Number.isInteger(timing[key])) add(side, `timing.${key} 必须是整数`);
    }
  }
  const model = config.model;
  if (!isRecord(model)) { add('comment', 'model 必须是对象'); add('reply', 'model 必须是对象'); }
  else {
    if (typeof model.name !== 'string') { add('comment', 'model.name 必须是文本'); add('reply', 'model.name 必须是文本'); }
    const port = model.endpointPort;
    if (port !== null && port !== undefined && !(Number.isInteger(port) && port >= 1 && port <= 65535)) add('comment', 'model.endpointPort 必须是 1–65535 或留空');
  }
  const tiers = config.tiers;
  if (!Array.isArray(tiers)) { add('comment', 'tiers 必须是数组'); add('reply', 'tiers 必须是数组'); }
  else {
    const ids = new Set();
    const seen = new Set();
    for (const tier of tiers) {
      if (!isRecord(tier) || typeof tier.id !== 'string' || ids.has(tier.id)) { add('comment', 'tiers 结构无效或档位编号重复'); add('reply', 'tiers 结构无效或档位编号重复'); break; }
      ids.add(tier.id);
      if (!Number.isInteger(tier.rounds)) { add('comment', `${tier.id} 的 rounds 必须是整数`); add('reply', `${tier.id} 的 rounds 必须是整数`); }
      if (typeof tier.replyStyle !== 'string') { add('comment', `${tier.id} 的 replyStyle 必须是文本`); add('reply', `${tier.id} 的 replyStyle 必须是文本`); }
      if (!Array.isArray(tier.handles)) { add('comment', `${tier.id} 的 handles 必须是数组`); add('reply', `${tier.id} 的 handles 必须是数组`); continue; }
      for (const handle of tier.handles) {
        if (typeof handle !== 'string' || !HANDLE_PATTERN.test(handle)) { add('comment', `用户名格式无效：${handle}`); add('reply', `用户名格式无效：${handle}`); }
        else if (seen.has(handle)) { add('comment', `用户名重复：${handle}`); add('reply', `用户名重复：${handle}`); }
        seen.add(handle);
      }
    }
    const required = new Set(TIER_IDS);
    if (ids.size !== required.size || [...required].some(id => !ids.has(id))) { add('comment', '档位编号必须恰好是 apex/tier1/tier2/tier3/tier4/other'); add('reply', '档位编号必须恰好是 apex/tier1/tier2/tier3/tier4/other'); }
  }
  return report;
}

function validateConfig(input) {
  if (!isRecord(input) || input.schemaVersion !== 1 || !Array.isArray(input.tiers) || input.tiers.length !== 6) throw new TypeError('配置结构无效');
  const copy = clone(input);
  const seen = new Set();
  for (const tier of copy.tiers) {
    if (!isRecord(tier) || typeof tier.id !== 'string' || typeof tier.label !== 'string' || tier.label.length > 80 || !Array.isArray(tier.handles) || !Number.isInteger(tier.rounds) || tier.rounds < 1 || tier.rounds > 1000 || typeof tier.replyStyle !== 'string' || tier.replyStyle.length > 5000 || tier.handles.length > 500) throw new TypeError('回复档位配置无效');
    tier.handles = tier.handles.map(sanitizeHandle);
    for (const handle of tier.handles) { if (seen.has(handle)) throw new TypeError(`用户名重复：${handle}`); seen.add(handle); }
  }
  const m = copy.model;
  if (!isRecord(m) || typeof m.name !== 'string' || m.name.length > 100 || (m.name.length > 0 && !/^[\w./:-]{1,100}$/.test(m.name)) || (m.endpointPort !== null && m.endpointPort !== undefined && (!Number.isInteger(m.endpointPort) || m.endpointPort < 1 || m.endpointPort > 65535))) throw new TypeError('模型设置无效');
  if (m.endpointPort === undefined) m.endpointPort = null;
  for (const id of TIER_IDS) if (!copy.tiers.some(t => t.id === id)) throw new TypeError(`缺少回复档位：${id}`);
  if (copy.tiers.some(t => !TIER_IDS.includes(t.id))) throw new TypeError('未知回复档位');
  if (!isRecord(copy.timing) || !isRecord(copy.specialReplies) || !isRecord(copy.rules) || !isRecord(copy.specialPersons)) throw new TypeError('时段或规则设置无效');
  if (copy.commentSettings !== undefined) {
    if (!isRecord(copy.commentSettings) || (copy.commentSettings.model !== undefined && typeof copy.commentSettings.model !== 'string') || (copy.commentSettings.customPrompt !== undefined && typeof copy.commentSettings.customPrompt !== 'string')) throw new TypeError('评论个性化设置无效');
  }
  if (copy.replySettings !== undefined) {
    if (!isRecord(copy.replySettings) || (copy.replySettings.model !== undefined && typeof copy.replySettings.model !== 'string') || (copy.replySettings.customPrompt !== undefined && typeof copy.replySettings.customPrompt !== 'string')) throw new TypeError('回复个性化设置无效');
  }
  if (copy.postSettings !== undefined) {
    if (!isRecord(copy.postSettings) || typeof copy.postSettings.enabled !== 'boolean' || !Number.isInteger(copy.postSettings.intervalMinutes) || copy.postSettings.intervalMinutes < 10 || copy.postSettings.intervalMinutes > 1440 || (copy.postSettings.customPrompt !== undefined && typeof copy.postSettings.customPrompt !== 'string') || (copy.postSettings.model !== undefined && typeof copy.postSettings.model !== 'string') || (copy.postSettings.topics !== undefined && !Array.isArray(copy.postSettings.topics))) throw new TypeError('发帖设置无效');
  }
  if (copy.cruiseSettings !== undefined) {
    if (!isRecord(copy.cruiseSettings) || typeof copy.cruiseSettings.enabled !== 'boolean' || !Number.isInteger(copy.cruiseSettings.dailyTargetCount) || copy.cruiseSettings.dailyTargetCount < 1 || copy.cruiseSettings.dailyTargetCount > 500 || (copy.cruiseSettings.model !== undefined && typeof copy.cruiseSettings.model !== 'string') || (copy.cruiseSettings.customPrompt !== undefined && typeof copy.cruiseSettings.customPrompt !== 'string')) throw new TypeError('巡航设置无效');
  }
  for (const [key, [min, max]] of Object.entries(TIMING_BOUNDS)) if (!Number.isInteger(copy.timing[key]) || copy.timing[key] < min || copy.timing[key] > max) throw new TypeError(`时段字段 ${key} 的设置无效`);
  if (copy.timing.publishMaxSeconds < copy.timing.publishMinSeconds) throw new TypeError('最长发布间隔必须大于或等于最短发布间隔');
  for (const [key, value] of Object.entries(copy.specialReplies)) if (typeof key !== 'string' || typeof value !== 'string' || value.length > 2000) throw new TypeError('特殊回复设置无效');
  if (!isRecord(copy.specialPersons.apex) || !isRecord(copy.specialPersons.yijing) || !Array.isArray(copy.specialPersons.skipReplyHandles)) throw new TypeError('关键人物规则结构无效');
  for (const key of ['apex', 'yijing']) {
    const person = copy.specialPersons[key];
    if (typeof person.handle !== 'string' || typeof person.enabled !== 'boolean' || (person.rules !== undefined && !isRecord(person.rules)) || (person.replyStyle !== undefined && (typeof person.replyStyle !== 'string' || person.replyStyle.length > 3000))) throw new TypeError(`关键人物 ${key} 设置无效`);
    person.handle = sanitizeHandle(person.handle);
  }
  if (copy.specialPersons.skipReplyHandles.length > 500) throw new TypeError('免回复名单过长');
  copy.specialPersons.skipReplyHandles = [...new Set(copy.specialPersons.skipReplyHandles.map(sanitizeHandle))];
  if (Buffer.byteLength(JSON.stringify(copy)) > MAX_BODY) throw new RangeError('配置内容过大');
  for (const [key, value] of Object.entries(copy.rules)) if (typeof value !== 'boolean') throw new TypeError(`规则 ${key} 的值无效`);
  return copy;
}

export function createService({ clock = () => Date.now(), paths = DEFAULT_TARGETS, configPath = CONFIG_PATH, targetsPath = null, platform = process.platform, spawnProcess = spawn } = {}) {
  let activeConfigPath = configPath;
  const currentTargets = () => (targetsPath ? resolveTargets(paths, targetsPath) : paths);
  const readSharedConfig = () => {
    let raw;
    try { raw = readFileSync(activeConfigPath, 'utf8'); }
    catch (error) {
      return { config: clone(DEFAULT_CONFIG), source: error.code === 'ENOENT' ? 'missing' : 'invalid' };
    }
    if (Buffer.byteLength(raw) > MAX_BODY) return { config: clone(DEFAULT_CONFIG), source: 'invalid' };
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { return { config: clone(DEFAULT_CONFIG), source: 'invalid' }; }
    try { return { config: validateConfig(parsed), source: 'shared' }; }
    catch { return { config: clone(DEFAULT_CONFIG), source: 'invalid' }; }
  };
  const getConfig = () => readSharedConfig().config;
  const runtimeCapabilities = {
    model: 'reply-only', modelPortOverride: 'comment-only', tierMembership: 'both', tierReplyStyle: 'reply-only', tierRoundLimit: 'reply-only',
    timing: { shared: ['rateLimitMinutes', 'rateLimitLongMinutes', 'postingWorkMinutes', 'postingRestMinutes', 'publishMinSeconds', 'publishMaxSeconds', 'quietHoursStart', 'quietHoursEnd', 'fullStopStart', 'fullStopEnd'], commentOnly: ['commentWindowHours', 'authorCooldownSeconds'], replyOnly: ['mentionWindowHours'] },
    specialPersons: { handles: 'both', enabled: 'both', replyStyle: 'both', skipReplyHandles: 'reply-only' },
    specialReplies: false, booleanRules: { skipFinanceComments: 'comment-only' },
  };
  const hashCurrentConfig = () => {
    try { return createHash('sha256').update(readFileSync(activeConfigPath)).digest('hex'); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  };
  const saveConfig = (value, expectedHash) => {
    const validated = validateConfig(value);
    const currentHash = hashCurrentConfig();
    if (expectedHash === undefined) throw new Error('缺少配置版本标识；请刷新状态后再保存');
    if (expectedHash !== currentHash) throw new Error('共享配置已被其他进程修改；请刷新状态并重新检查后再保存');
    mkdirSync(dirname(activeConfigPath), { recursive: true, mode: 0o700 });
    const tmp = `${activeConfigPath}.${process.pid}.tmp`;
    try {
      writeFileSync(tmp, `${JSON.stringify(validated, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
      renameSync(tmp, activeConfigPath);
    } catch (error) {
      try { unlinkSync(tmp); } catch { /* preserve original error */ }
      throw error;
    }
    return { config: clone(validated), hash: hashCurrentConfig() };
  };
  const inspect = async () => {
    const items = {};
    const active = currentTargets();
    for (const key of ['comment', 'reply', 'post', 'profile']) {
      const t = active[key] || DEFAULT_TARGETS[key];
      if (!t) continue;
      const watchdogFlag = key === 'comment' ? '--loop' : '--supervise';
      const worker = processState(t.pid, t.worker, '', t.workerPidArgvToken || t.worker, t.interpreterPidArgvToken || '');
      const watchdog = processState(t.watchdogPid, t.watchdog, watchdogFlag, t.watchdogPidArgvToken || t.watchdog, t.interpreterPidArgvToken || '');
      const watchdogLogPath = key === 'comment' ? join(t.dir, 'watchdog.log') : join(t.dir, `${key}_watchdog.stdout.log`);
      let watchdogLogTail = '';
      try { watchdogLogTail = readFileSync(watchdogLogPath, 'utf8').slice(-6000).split('\n').slice(-30).join('\n').replace(/(?:Bearer\s+)[^\s]+/gi, 'Bearer [REDACTED]'); } catch { /* no watchdog log */ }
      const heartbeat = readJsonSafe(t.heartbeat);
      const rate = readJsonSafe(t.rate);
      let logTail = '';
      try { logTail = readFileSync(t.log, 'utf8').slice(-6000).split('\n').slice(-30).join('\n').replace(/(?:Bearer\s+)[^\s]+/gi, 'Bearer [REDACTED]'); } catch { /* no log available */ }
      items[key] = {
        worker, watchdog, workerScriptExists: existsSync(t.worker), watchdogScriptExists: existsSync(t.watchdog),
        pythonConfigured: typeof t.python === 'string' ? existsSync(t.python) : false,
        controlsEnabled: (!worker.running || worker.owned) && (!watchdog.running || watchdog.owned) && existsSync(t.worker) && existsSync(t.watchdog),
        heartbeatAgeSeconds: heartbeat && Number.isFinite(Number(heartbeat.timestamp)) ? Math.max(0, Math.floor(clock() / 1000 - Number(heartbeat.timestamp))) : null,
        heartbeatStatus: heartbeat && typeof heartbeat.status === 'string' ? heartbeat.status : null,
        pausedUntil: rate && Number.isFinite(Number(rate.until)) ? Number(rate.until) : null,
        pauseReason: rate && ['rate_limit', 'manual'].includes(rate.reason) ? rate.reason : (rate ? 'other' : null),
        cdpPort: t.port, cdpAvailable: await portListening(t.port), logTail, watchdogLogTail,
        priorityHandles: readPriorityHandles(t.worker),
      };
    }
    const shared = readSharedConfig();
    const configHash = hashCurrentConfig();
    const dshModels = readDshModels();
    return {
      ok: true, config: shared.config, configSource: shared.source, configPath: activeConfigPath, configHash,
      runtimeConfigApplied: shared.source === 'shared', runtimeCapabilities, fieldSide: FIELD_SIDE,
      dshModels,
      workerAcceptance: workerAcceptance(shared.config), items, platform, checkedAt: new Date(clock()).toISOString(),
    };
  };
  async function action(request) {
    if (!isRecord(request) || typeof request.action !== 'string') throw new TypeError('缺少操作类型');
    if (request.action === 'state') return inspect();
    if (request.action === 'save-config') {
      const result = saveConfig(request.config, request.expectedConfigHash);
      const saved = result.config;
      const acceptance = workerAcceptance(saved);
      return {
        config: saved, configHash: result.hash, runtimeConfigApplied: true, workerAcceptance: acceptance,
        note: '共享配置已写入，两个工作进程会在下轮读取。重点名单与人物特例句柄/提示词两侧生效；回复轮次、免回复名单由回复进程读取；skipFinanceComments 由评论进程读取。specialReplies 及其余规则仍为建议字段，不保证改变 Worker 分支逻辑。',
      };
    }
    if (request.action === 'update-plugin') {
      const updateResult = await executePluginUpdate();
      return {
        ok: true,
        action: 'update-plugin',
        ...updateResult,
      };
    }
    if (!['pause', 'resume', 'start', 'stop', 'restart'].includes(request.action)) throw new TypeError('未知操作类型');
    if (!['comment', 'reply', 'post', 'profile'].includes(request.target)) throw new TypeError('目标必须是评论或提及回复');
    if (platform !== 'darwin') throw new Error('进程控制仅支持 macOS');
    const target = currentTargets()[request.target];
    const watchdogFlag = request.target === 'comment' ? '--loop' : '--supervise';
    const watchdogStatus = processState(target.watchdogPid, target.watchdog, watchdogFlag, target.watchdogPidArgvToken || target.watchdog, target.interpreterPidArgvToken || '');
    const workerStatus = processState(target.pid, target.worker, '', target.workerPidArgvToken || target.worker, target.interpreterPidArgvToken || '');
    if (request.action === 'start') {
      if (!watchdogStatus.running && !workerStatus.running && (!target.workerPidArgvToken || !target.watchdogPidArgvToken || !target.interpreterPidArgvToken || !target.python)) throw new Error('启动已停止的 worker 需要在 console-targets.json 配置 python、workerPidArgvToken、watchdogPidArgvToken 和 interpreterPidArgvToken');
      if (watchdogStatus.running && watchdogStatus.owned) return { started: false, note: '监控进程已在运行，已拒绝重复启动。' };
      if (watchdogStatus.running || workerStatus.running) throw new Error('发现正在运行但身份未验证的进程，已拒绝启动');
      if (!existsSync(target.watchdog)) throw new Error('未找到监控脚本，请先在设置中核对脚本路径');
      const python = resolvePython(target);
      if (existsSync(target.stop)) unlinkSync(target.stop);
      const argv = request.target === 'comment' ? [python, target.watchdog, '--loop'] : [python, target.watchdog, '--supervise'];
      const logPath = request.target === 'comment' ? join(target.dir, 'watchdog.log') : join(target.dir, `${request.target}_watchdog.stdout.log`);
      let pid = null;
      let out;
      try {
        out = openSync(logPath, 'a');
        const child = spawnProcess(argv[0], argv.slice(1), { cwd: target.dir, detached: true, stdio: ['ignore', out, out] });
        if (child?.error) throw child.error;
        if (typeof child?.unref === 'function') child.unref();
        pid = child?.pid ?? null;
        if (pid == null) throw new Error('系统未返回新进程编号');
      } catch (error) {
        throw new Error(`启动监控进程失败：${error.message}`);
      } finally {
        if (out !== undefined) { try { closeSync(out); } catch { /* ignore close failure */ } }
      }
      return { started: null, launchRequested: true, pid, note: '启动请求已提交，尚未确认成功。监控进程会自行拉起工作进程，请刷新状态核对进程与心跳。' };
    }
    if (request.action === 'stop') {
      if (!watchdogStatus.running || !watchdogStatus.owned) throw new Error('监控进程身份未验证，拒绝停止');
      if (workerStatus.running && !workerStatus.owned) throw new Error('工作进程身份未验证，拒绝停止');
      writeFileSync(target.stop, 'stop\n', { mode: 0o600 });
      return { stopping: true, pid: watchdogStatus.pid, note: '已请求协作式停止；监控进程将停止其托管的工作进程并退出。' };
    }
    if (request.action === 'restart') {
      if (!watchdogStatus.running || !watchdogStatus.owned) throw new Error('监控进程身份未验证，拒绝重启');
      if (workerStatus.running && !workerStatus.owned) throw new Error('工作进程身份未验证，拒绝重启');
      if (!workerStatus.running) return { restarted: false, note: '工作进程当前未运行；现有监控进程将在下次检查时尝试启动。' };
      process.kill(workerStatus.pid, 'SIGTERM');
      return { restarted: true, pid: workerStatus.pid, note: '已向身份确认的工作进程发送终止信号；后续重启由监控进程负责。' };
    }
    if (request.action === 'pause') {
      const minutes = Number(request.minutes);
      if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) throw new RangeError('暂停时长必须为 1–1440 分钟');
      const existingRate = readJsonSafe(target.rate);
      if (existingRate?.reason === 'rate_limit' && Number(existingRate.until) > Math.floor(clock() / 1000)) throw new Error('X 限流保护仍有效；不能用手动暂停覆盖或缩短保护时间');
      if (!watchdogStatus.running || !watchdogStatus.owned) throw new Error('监控进程未运行或身份未验证，暂停标记不会生效，已拒绝操作');
      if (workerStatus.running && !workerStatus.owned) throw new Error('工作进程身份未验证，拒绝暂停');
      const until = Math.floor(clock() / 1000) + Math.floor(minutes * 60);
      writeFileSync(target.rate, JSON.stringify({ until, resume_at: new Date(until * 1000).toISOString(), reason: 'manual', source: 'x-bot-ops-console' }), { mode: 0o600 });
      return { pausedUntil: until, note: '监控进程将遵守暂停标记（读到 until 为止）。请刷新状态核对工作进程是否已停止。' };
    }
    if (request.action === 'resume') {
      const existingRate = readJsonSafe(target.rate);
      if (existingRate?.reason === 'rate_limit' && Number(existingRate.until) > Math.floor(clock() / 1000)) throw new Error('X 限流保护仍有效；为了账号安全，不能提前恢复');
      if (!watchdogStatus.running || !watchdogStatus.owned) throw new Error('监控进程未运行或身份未验证，无法安全恢复');
      if (workerStatus.running && !workerStatus.owned) throw new Error('工作进程身份未验证，拒绝恢复');
      if (existingRate?.reason === 'rate_limit' && Number(existingRate.until) > Math.floor(clock() / 1000)) throw new Error('X 限流保护仍有效；为了账号安全，不能提前恢复');
      try { unlinkSync(target.rate); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      return { note: '已移除到期或手动暂停标记；监控进程可能在下个周期恢复工作进程。' };
    }
  }
  return { inspect, action, getConfig, saveConfig };
}

// Uses the same interpreter the worker already runs under, so optional dependencies keep resolving.
function resolvePython(target) {
  const python = target.python;
  if (typeof python !== 'string' || !python.startsWith('/') || !existsSync(python)) throw new Error('配置的 Python 解释器不存在或不是绝对路径');
  if (target.interpreterPidArgvToken !== python) throw new Error('interpreterPidArgvToken 必须与 python 可执行路径一致');
  return python;
}

export async function authorize(req, connection) {
  const fetchSite = req.headers?.['sec-fetch-site'];
  if (fetchSite === 'cross-site') return false;
  const origin = req.headers?.origin;
  if (origin !== undefined) {
    const host = req.headers?.host;
    if (!host) return false;
    try {
      const parsed = new URL(origin);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.host !== host) return false;
    } catch { return false; }
  }
  if (typeof connection?.requestRejection !== 'function') return 'unavailable';
  try {
    const rejection = await connection.requestRejection(req);
    return rejection === undefined ? true : (rejection === 401 || rejection === 403 ? false : 'unavailable');
  } catch { return 'unavailable'; }
}
async function bodyJson(req) {
  let body = ''; for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > MAX_BODY) throw new RangeError('请求内容过大'); }
  return JSON.parse(body);
}
function send(res, status, value) {
  const data = Buffer.from(JSON.stringify(value));
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': data.length, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; frame-ancestors 'none'" }); res.end(data);
}
export function installRoute(ctx, service, { desktop = false } = {}) {
  if (typeof ctx.connection?.fetch?.register !== 'function') throw new Error('DSH Connection Fetch service is unavailable');
  const routePath = desktop ? DESKTOP_ROUTE : WEB_ROUTE;
  const registered = ctx.connection.fetch.register({
    path: routePath,
    methods: ['GET', 'POST'],
    requestBody: 'buffered',
    fetch: async request => {
      try {
        if (request.method === 'GET') return new Response(JSON.stringify(await service.inspect()), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; frame-ancestors 'none'" } });
        if (request.method !== 'POST') return new Response(JSON.stringify({ ok: false, error: '不支持此请求方法' }), { status: 405, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
        const body = await request.arrayBuffer();
        if (body.byteLength > MAX_BODY) return new Response(JSON.stringify({ ok: false, error: '请求内容过大' }), { status: 413, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
        const result = await service.action(JSON.parse(new TextDecoder().decode(body)));
        return new Response(JSON.stringify({ ok: true, value: result }), { status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; frame-ancestors 'none'" } });
      } catch (error) {
        const status = error instanceof RangeError ? 413 : 400;
        return new Response(JSON.stringify({ ok: false, error: String(error?.message ?? error).slice(0, 250) }), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
      }
    },
  });
  ctx.effect(() => registered, 'x-bot-ops-console: authenticated Connection Fetch route');
}
export const inject = ['connection'];
export function apply(ctx) {
  const service = createService({ targetsPath: TARGETS_PATH });
  const desktop = ctx.profileContext?.name === 'desktop';
  installRoute(ctx, service, { desktop });
}

export { DEFAULT_CONFIG, TIMING_BOUNDS, TIER_IDS, validateConfig };
