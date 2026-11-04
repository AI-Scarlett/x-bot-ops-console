import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { createConnection } from 'node:net';

export const CONFIG_NAMESPACE = 'x-bot-ops-console';
export const PACKAGE_ID = 'dsh-x-bot-ops-console';
export const WEB_ROUTE = '/_dsh/x-bot-ops-console';
export const DESKTOP_ROUTE = '/api2/x-bot-ops-console';
const MAX_BODY = 128 * 1024;
const APP_HOME = homedir();
export const DEFAULT_COMMENT_DIR = join(APP_HOME, 'XBotOpsConsole', 'comment-worker');
export const DEFAULT_REPLY_DIR = join(APP_HOME, 'XBotOpsConsole', 'reply-worker');
export const DEFAULT_TARGETS = Object.freeze({
  comment: { dir: DEFAULT_COMMENT_DIR, worker: join(DEFAULT_COMMENT_DIR, 'comment_worker.py'), watchdog: join(DEFAULT_COMMENT_DIR, 'comment_watchdog.py'), watchdogPid: join(DEFAULT_COMMENT_DIR, 'comment_watchdog.pid'), stop: join(DEFAULT_COMMENT_DIR, 'comment_watchdog.stop'), pid: join(DEFAULT_COMMENT_DIR, 'comment_worker.pid'), log: join(DEFAULT_COMMENT_DIR, 'comment_worker.log'), heartbeat: join(DEFAULT_COMMENT_DIR, 'heartbeat.json'), rate: join(DEFAULT_COMMENT_DIR, 'rate_limit.json'), port: 9222 },
  reply: { dir: DEFAULT_REPLY_DIR, worker: join(DEFAULT_REPLY_DIR, 'reply_worker.py'), watchdog: join(DEFAULT_REPLY_DIR, 'reply_watchdog.py'), watchdogPid: join(DEFAULT_REPLY_DIR, 'reply_watchdog.pid'), stop: join(DEFAULT_REPLY_DIR, 'reply_watchdog.stop'), pid: join(DEFAULT_REPLY_DIR, 'reply_worker.pid'), log: join(DEFAULT_REPLY_DIR, 'reply_worker.log'), heartbeat: join(DEFAULT_REPLY_DIR, 'heartbeat.json'), rate: join(DEFAULT_REPLY_DIR, 'rate_limit.json'), port: 9223 },
});
const CONFIG_PATH = join(APP_HOME, 'Library/Application Support/XBotOpsConsole/config.json');
export const TARGETS_PATH = join(APP_HOME, 'Library/Application Support/XBotOpsConsole/console-targets.json');
const TARGET_FIELDS = ['dir', 'worker', 'watchdog', 'watchdogPid', 'stop', 'pid', 'log', 'heartbeat', 'rate'];
export function resolveTargets(base = DEFAULT_TARGETS, overridesPath = TARGETS_PATH) {
  const raw = readJsonSafe(overridesPath);
  if (!isRecord(raw)) return base;
  const patches = isRecord(raw.targets) ? raw.targets : raw;
  const resolved = { ...base };
  for (const key of ['comment', 'reply']) {
    const patch = isRecord(patches[key]) ? patches[key] : null;
    if (!patch) continue;
    const next = { ...base[key] };
    for (const field of TARGET_FIELDS) {
      const value = patch[field];
      if (typeof value !== 'string' || !value.startsWith('/') || value.includes('..')) continue;
      next[field] = value;
    }
    if (Number.isInteger(patch.port) && patch.port > 0 && patch.port < 65536) next.port = patch.port;
    resolved[key] = next;
  }
  return resolved;
}

const DEFAULT_CONFIG = Object.freeze({
  schemaVersion: 1,
  note: '两类 Python worker 每轮读取共享配置；未接入的字段会标记为未生效。',
  model: { name: 'your-model-name', endpointPort: null, keySource: 'LocalModelHub 凭据引用（密钥不会被读取或显示）' },
  timing: { commentWindowHours: 8, mentionWindowHours: 12, quietHoursStart: 0, quietHoursEnd: 7, fullStopStart: 1, fullStopEnd: 6, publishMinSeconds: 60, publishMaxSeconds: 180, authorCooldownSeconds: 7200, postingWorkMinutes: 15, postingRestMinutes: 15, rateLimitMinutes: 10, rateLimitLongMinutes: 30 },
  tiers: [
    { id: 'apex', label: '最高优先级', handles: [], rounds: 30, replyStyle: '使用已配置的账号风格，保持尊重并围绕话题。' },
    { id: 'tier1', label: '优先级 1', handles: [], rounds: 20, replyStyle: '简洁、尊重地回复。' },
    { id: 'tier2', label: '优先级 2', handles: [], rounds: 10, replyStyle: '认真回应，不诱导私下联系。' },
    { id: 'tier3', label: '优先级 3', handles: [], rounds: 5, replyStyle: '礼貌并围绕话题。' },
    { id: 'tier4', label: '优先级 4', handles: [], rounds: 4, replyStyle: '克制且切题。' },
    { id: 'other', label: '其他用户', handles: [], rounds: 3, replyStyle: '采用中性、尊重的默认风格。' },
  ],
  specialReplies: { asksAi: '若被问及是否为 AI，请如实回答。', asksToStop: '若对方要求停止，请勿继续回复该讨论串。', care: '礼貌回应并围绕话题。', affection: '尊重回应，不诱导私下联系。', namedAddress: '以中性方式回应称呼。', daddy: '拒绝不合适的亲属角色扮演。', imperialTitle: '不宣称现实中的权力或身份。', vernacular: '仅在明确请求时翻译。' },
  rules: { skipFinanceComments: true, skipGrokMentions: false, doNotReplyAfterStopRequest: true, keepSensitiveKeyOutOfUi: true },
});

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function isRecord(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
function sanitizeHandle(value) {
  if (typeof value !== 'string') throw new TypeError('用户名必须是文本');
  const handle = value.trim().replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9_]{1,15}$/.test(handle)) throw new TypeError('用户名格式无效');
  return handle;
}
function readJsonSafe(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}
function processState(pidPath, expectedScript, requiredArg = '') {
  let pid;
  try { pid = Number((readFileSync(pidPath, 'utf8') || '').trim()); } catch { return { running: false, pid: null, owned: false }; }
  if (!Number.isSafeInteger(pid) || pid < 2) return { running: false, pid: null, owned: false };
  try {
    const rows = execFileSync('/bin/ps', ['-o','stat=','-o','command=','-p',String(pid)], { encoding:'utf8', timeout:1500, maxBuffer:4096 }).trim();
    if (!rows || rows.startsWith('Z')) return { running:false, pid, owned:false };
    const command = rows.replace(/^\S+\s+/, '').trim();
    const scriptToken = String(expectedScript).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const scriptPattern = new RegExp(`(?:^|\\s)${scriptToken}(?:\\s|$)`);
    const owned = scriptPattern.test(command) && (!requiredArg || command.split(/\s+/).includes(requiredArg));
    return { running:true, pid, owned, detail:owned ? '工作进程身份已验证' : '该进程编号属于其他命令，控制已禁用' };
  } catch { return { running:false, pid, owned:false }; }
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
  if (!isRecord(m) || typeof m.name !== 'string' || !/^[\w./:-]{1,100}$/.test(m.name) || (m.endpointPort !== null && (!Number.isInteger(m.endpointPort) || m.endpointPort < 1 || m.endpointPort > 65535))) throw new TypeError('模型设置无效');
  for (const id of ['apex','tier1','tier2','tier3','tier4','other']) if (!copy.tiers.some(t => t.id === id)) throw new TypeError(`缺少回复档位：${id}`);
  if (copy.tiers.some(t => !['apex','tier1','tier2','tier3','tier4','other'].includes(t.id))) throw new TypeError('未知回复档位');
  if (!isRecord(copy.timing) || !isRecord(copy.specialReplies) || !isRecord(copy.rules)) throw new TypeError('时段或规则设置无效');
  const bounds = { commentWindowHours:[1,48], mentionWindowHours:[1,48], quietHoursStart:[0,23], quietHoursEnd:[0,24], fullStopStart:[0,23], fullStopEnd:[0,24], publishMinSeconds:[5,3600], publishMaxSeconds:[5,3600], authorCooldownSeconds:[60,604800], postingWorkMinutes:[1,120], postingRestMinutes:[0,60], rateLimitMinutes:[1,60], rateLimitLongMinutes:[1,120] };
  for (const [key,[min,max]] of Object.entries(bounds)) if (!Number.isInteger(copy.timing[key]) || copy.timing[key] < min || copy.timing[key] > max) throw new TypeError(`时段字段 ${key} 的设置无效`);
  if (copy.timing.publishMaxSeconds < copy.timing.publishMinSeconds) throw new TypeError('最长发布间隔必须大于或等于最短发布间隔');
  for (const [key,value] of Object.entries(copy.specialReplies)) if (typeof key !== 'string' || typeof value !== 'string' || value.length > 2000) throw new TypeError('特殊回复设置无效');
  if (Buffer.byteLength(JSON.stringify(copy)) > MAX_BODY) throw new RangeError('配置内容过大');
  for (const [key,value] of Object.entries(copy.rules)) if (typeof value !== 'boolean') throw new TypeError(`规则 ${key} 的值无效`);
  return copy;
}
import * as fsSync from 'node:fs';

export function createService({ subprocess, clock = () => Date.now(), paths = DEFAULT_TARGETS, configPath = CONFIG_PATH, targetsPath = null, platform = process.platform } = {}) {
  let activeConfigPath = configPath;
  const currentTargets = () => (targetsPath ? resolveTargets(paths, targetsPath) : paths);
  const configMirrorPaths = () => [...new Set([join(currentTargets().comment.dir, 'xops_config.json'), join(currentTargets().reply.dir, 'xops_config.json')])].filter(path => path !== activeConfigPath);
  const getConfig = () => {
    for (const path of [activeConfigPath, ...configMirrorPaths()]) {
      const parsed = readJsonSafe(path);
      if (parsed === null) continue;
      return validateConfig(parsed);
    }
    return clone(DEFAULT_CONFIG);
  };
  const runtimeCapabilities = { model:'reply-only', modelPortOverride:'comment-only', tierMembership:'both', tierReplyStyle:'prompt-addition', tierRoundLimit:'reply-only', timing:'partial', specialReplies:false, booleanRules:false };
  const saveConfig = value => {
    const validated = validateConfig(value);
    fsSync.mkdirSync(dirname(activeConfigPath), { recursive: true, mode: 0o700 });
    const tmp = `${activeConfigPath}.${process.pid}.tmp`;
    fsSync.writeFileSync(tmp, `${JSON.stringify(validated, null, 2)}\n`, { mode: 0o600 });
    fsSync.renameSync(tmp, activeConfigPath);
    const mirrorContent = `${JSON.stringify(validated, null, 2)}\n`;
    for (const mirrorPath of configMirrorPaths()) {
      try {
        fsSync.mkdirSync(dirname(mirrorPath), { recursive: true, mode: 0o700 });
        const mirrorTmp = `${mirrorPath}.${process.pid}.tmp`;
        fsSync.writeFileSync(mirrorTmp, mirrorContent, { mode: 0o600 });
        fsSync.renameSync(mirrorTmp, mirrorPath);
      } catch (error) {
        throw new Error(`配置已保存，但同步工作进程配置失败（${basename(mirrorPath)}）：${error.message}`);
      }
    }
    return clone(validated);
  };
  const inspect = async () => {
    const items = {};
    const active = currentTargets();
    for (const key of ['comment', 'reply']) {
      const t = active[key];
      const worker = processState(t.pid, t.worker);
      const watchdog = processState(t.watchdogPid, t.watchdog, key === 'comment' ? '--loop' : '--supervise');
      const heartbeat = readJsonSafe(t.heartbeat);
      const rate = readJsonSafe(t.rate);
      let logTail = '';
      try { logTail = readFileSync(t.log, 'utf8').slice(-6000).split('\n').slice(-30).join('\n').replace(/(?:Bearer\s+)[^\s]+/gi, 'Bearer [REDACTED]'); } catch { /* no log available */ }
      items[key] = {
        worker, watchdog, workerScriptExists: existsSync(t.worker), watchdogScriptExists: existsSync(t.watchdog), controlsEnabled: (!worker.running || worker.owned) && (!watchdog.running || watchdog.owned) && existsSync(t.worker) && existsSync(t.watchdog),
        heartbeatAgeSeconds: heartbeat && Number.isFinite(Number(heartbeat.timestamp)) ? Math.max(0, Math.floor(clock() / 1000 - Number(heartbeat.timestamp))) : null,
        pausedUntil: rate && Number.isFinite(Number(rate.until)) ? Number(rate.until) : null,
        pauseReason: rate && ['rate_limit', 'manual'].includes(rate.reason) ? rate.reason : (rate ? 'other' : null),
        cdpPort: t.port, cdpAvailable: await portListening(t.port), logTail,
      };
    }
    return { ok: true, config: getConfig(), runtimeConfigApplied: true, runtimeCapabilities, items, platform, checkedAt: new Date(clock()).toISOString() };
  };
  async function action(request) {
    if (!isRecord(request) || typeof request.action !== 'string') throw new TypeError('缺少操作类型');
    if (request.action === 'state') return inspect();
    if (request.action === 'save-config') {
      const saved = saveConfig(request.config);
      return { config: saved, runtimeConfigApplied: true, note: '两个工作进程会在下轮读取重点名单、风格和时段设置。模型名称和回复轮次仅由回复进程读取；模型端口覆盖仅供评论进程使用。特殊回复文本及布尔规则目前仅为草稿，不会接入运行逻辑。' };
    }
    if (!['pause', 'resume', 'start', 'stop', 'restart'].includes(request.action)) throw new TypeError('未知操作类型');
    if (!['comment', 'reply'].includes(request.target)) throw new TypeError('目标必须是评论或提及回复');
    if (platform !== 'darwin') throw new Error('进程控制仅支持 macOS');
    const target = currentTargets()[request.target];
    const watchdogStatus = processState(target.watchdogPid, target.watchdog, request.target === 'comment' ? '--loop' : '--supervise');
    const workerStatus = processState(target.pid, target.worker);
    if (request.action === 'start') {
      if (watchdogStatus.running && watchdogStatus.owned) return { started:false, note:'监控进程已在运行，已拒绝重复启动。' };
      if (watchdogStatus.running || workerStatus.running) throw new Error('发现正在运行但身份未验证的进程，已拒绝启动');
      if (!subprocess?.resolveExecutable || !subprocess?.spawn) throw new Error('DSH 子进程服务不可用');
      if (fsSync.existsSync(target.stop)) fsSync.unlinkSync(target.stop);
      const python = await subprocess.resolveExecutable('python3');
      const argv = request.target === 'comment' ? [python, target.watchdog, '--loop'] : [python, target.watchdog, '--supervise'];
      subprocess.spawn({ argv, cwd: target.dir, stdio: { stdin:'ignore', stdout:{ maxBytes:2048 }, stderr:{ maxBytes:2048 } }, graceMs:5000 });
      return { started:null, launchRequested:true, note:'启动请求已提交，尚未确认成功。请刷新状态核对监控进程、工作进程和心跳。' };
    }
    if (request.action === 'stop') {
      if (!watchdogStatus.running || !watchdogStatus.owned) throw new Error('监控进程身份未验证，拒绝停止');
      if (workerStatus.running && !workerStatus.owned) throw new Error('工作进程身份未验证，拒绝停止');
      fsSync.writeFileSync(target.stop, 'stop\n', { mode:0o600 });
      return { stopping:true, pid:watchdogStatus.pid, note:'已请求协作式停止；监控进程将停止其托管的工作进程并退出。' };
    }
    if (request.action === 'restart') {
      if (!watchdogStatus.running || !watchdogStatus.owned) throw new Error('监控进程身份未验证，拒绝重启');
      if (workerStatus.running && !workerStatus.owned) throw new Error('工作进程身份未验证，拒绝重启');
      if (!workerStatus.running) return { restarted:false, note:'工作进程当前未运行；现有监控进程将在下次检查时尝试启动。' };
      process.kill(workerStatus.pid, 'SIGTERM');
      return { restarted:true, pid:workerStatus.pid, note:'已向身份确认的工作进程发送终止信号；后续重启由监控进程负责。' };
    }
    if (request.action === 'pause') {
      const minutes = Number(request.minutes);
      if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) throw new RangeError('暂停时长必须为 1–1440 分钟');
      if (workerStatus.running && !workerStatus.owned) throw new Error('工作进程身份未验证，拒绝暂停');
      const until = Math.floor(clock() / 1000) + Math.floor(minutes * 60);
      fsSync.writeFileSync(target.rate, JSON.stringify({ until, resume_at: new Date(until * 1000).toISOString(), reason: 'manual', source: 'x-bot-ops-console' }), { mode: 0o600 });
      return { pausedUntil: until, note: '监控进程将遵守暂停标记。请刷新状态核对工作进程是否已停止。' };
    }
    if (request.action === 'resume') {
      try { fsSync.unlinkSync(target.rate); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      return { note: '已移除暂停标记；监控进程可能在下个周期恢复工作进程。' };
    }
  }
  return { inspect, action, getConfig, saveConfig };
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
  ctx.inject(['webServer', 'connection'], webCtx => {
    const connection = webCtx.connection;
    const routePath = desktop ? DESKTOP_ROUTE : WEB_ROUTE;
    webCtx.effect(() => webCtx.webServer.register({ kind: 'exact', path: routePath, handler: async (req, res) => {
      try {
        const auth = await authorize(req, connection);
        if (auth === 'unavailable') return send(res, 503, { ok: false, error: 'DSH 请求授权服务不可用' });
        if (!auth) return send(res, 403, { ok: false, error: 'DSH 拒绝了此请求的授权' });
        if (req.method === 'GET') return send(res, 200, await service.inspect());
        if (req.method !== 'POST') return send(res, 405, { ok: false, error: '不支持此请求方法' });
        const result = await service.action(await bodyJson(req));
        return send(res, 200, { ok: true, value: result });
      } catch (error) { return send(res, error instanceof RangeError ? 413 : 400, { ok: false, error: String(error?.message ?? error).slice(0, 250) }); }
    } }), 'x-bot-ops-console: route');
  });
}
export const inject = ['subprocess', 'connection'];
export function apply(ctx) {
  const service = createService({ subprocess: ctx.subprocess, targetsPath: TARGETS_PATH });
  const desktop = ctx.profileContext?.name === 'desktop';
  installRoute(ctx, service, { desktop });
}

export { DEFAULT_CONFIG, validateConfig };
