import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { basename, dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { createServer } from 'node:net';

export const CONFIG_NAMESPACE = 'x-bot-ops-console';
export const PACKAGE_ID = 'dsh-x-bot-ops-console';
export const WEB_ROUTE = '/_dsh/x-bot-ops-console';
export const DESKTOP_ROUTE = '/api2/x-bot-ops-console';
const MAX_BODY = 128 * 1024;
const APP_HOME = homedir();
const DEFAULT_COMMENT_DIR = join(APP_HOME, 'XBotOpsConsole', 'comment-worker');
const DEFAULT_REPLY_DIR = join(APP_HOME, 'XBotOpsConsole', 'reply-worker');
export const DEFAULT_TARGETS = Object.freeze({
  comment: { dir: DEFAULT_COMMENT_DIR, worker: join(DEFAULT_COMMENT_DIR, 'comment_worker.py'), watchdog: join(DEFAULT_COMMENT_DIR, 'comment_watchdog.py'), watchdogPid: join(DEFAULT_COMMENT_DIR, 'comment_watchdog.pid'), stop: join(DEFAULT_COMMENT_DIR, 'comment_watchdog.stop'), pid: join(DEFAULT_COMMENT_DIR, 'comment_worker.pid'), log: join(DEFAULT_COMMENT_DIR, 'comment_worker.log'), heartbeat: join(DEFAULT_COMMENT_DIR, 'heartbeat.json'), rate: join(DEFAULT_COMMENT_DIR, 'rate_limit.json'), port: 9222 },
  reply: { dir: DEFAULT_REPLY_DIR, worker: join(DEFAULT_REPLY_DIR, 'reply_worker.py'), watchdog: join(DEFAULT_REPLY_DIR, 'reply_watchdog.py'), watchdogPid: join(DEFAULT_REPLY_DIR, 'reply_watchdog.pid'), stop: join(DEFAULT_REPLY_DIR, 'reply_watchdog.stop'), pid: join(DEFAULT_REPLY_DIR, 'reply_worker.pid'), log: join(DEFAULT_REPLY_DIR, 'reply_worker.log'), heartbeat: join(DEFAULT_REPLY_DIR, 'heartbeat.json'), rate: join(DEFAULT_REPLY_DIR, 'rate_limit.json'), port: 9223 },
});
const CONFIG_PATH = join(APP_HOME, 'Library/Application Support/XBotOpsConsole/config.json');

const DEFAULT_CONFIG = Object.freeze({
  schemaVersion: 1,
  note: 'Shared runtime configuration read by both Python workers each cycle; any unimplemented field is shown as not applied.',
  model: { name: 'your-model-name', endpointPort: null, keySource: 'LocalModelHub credential reference (secret never read or displayed)' },
  timing: { commentWindowHours: 8, mentionWindowHours: 12, quietHoursStart: 0, quietHoursEnd: 7, fullStopStart: 1, fullStopEnd: 6, publishMinSeconds: 60, publishMaxSeconds: 180, authorCooldownSeconds: 7200, postingWorkMinutes: 15, postingRestMinutes: 15, rateLimitMinutes: 10, rateLimitLongMinutes: 30 },
  tiers: [
    { id: 'apex', label: 'Highest priority', handles: [], rounds: 30, replyStyle: 'Use the configured account-specific style; keep replies respectful and on topic.' },
    { id: 'tier1', label: 'Priority 1', handles: [], rounds: 20, replyStyle: 'Use a concise, respectful style.' },
    { id: 'tier2', label: 'Priority 2', handles: [], rounds: 10, replyStyle: 'Be thoughtful and avoid soliciting private contact.' },
    { id: 'tier3', label: 'Priority 3', handles: [], rounds: 5, replyStyle: 'Be polite and stay on topic.' },
    { id: 'tier4', label: 'Priority 4', handles: [], rounds: 4, replyStyle: 'Keep responses restrained and relevant.' },
    { id: 'other', label: 'Other users', handles: [], rounds: 3, replyStyle: 'Use a neutral, respectful default style.' },
  ],
  specialReplies: { asksAi: 'If asked whether you are AI, answer honestly.', asksToStop: 'If asked to stop, do not continue replying in that thread.', care: 'Reply politely and stay on topic.', affection: 'Respond respectfully without encouraging private contact.', namedAddress: 'Respond neutrally to forms of address.', daddy: 'Decline inappropriate familial roleplay.', imperialTitle: 'Do not claim real-world authority or status.', vernacular: 'Translate only when explicitly requested.' },
  rules: { skipFinanceComments: true, skipGrokMentions: false, doNotReplyAfterStopRequest: true, keepSensitiveKeyOutOfUi: true },
});

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function isRecord(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
function sanitizeHandle(value) {
  if (typeof value !== 'string') throw new TypeError('handle must be a string');
  const handle = value.trim().replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9_]{1,15}$/.test(handle)) throw new TypeError('handle must be a valid X username');
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
    return { running:true, pid, owned, detail:owned ? 'owned process identity verified' : 'PID is live but belongs to another command; controls disabled' };
  } catch { return { running:false, pid, owned:false }; }
}
function portOpen(port) {
  return new Promise(resolveResult => {
    const socket = createServer();
    socket.once('error', () => resolveResult(false));
    socket.listen(port, '127.0.0.1', () => socket.close(() => resolveResult(true)));
  });
}
function validateConfig(input) {
  if (!isRecord(input) || input.schemaVersion !== 1 || !Array.isArray(input.tiers) || input.tiers.length !== 6) throw new TypeError('invalid config structure');
  const copy = clone(input);
  const seen = new Set();
  for (const tier of copy.tiers) {
    if (!isRecord(tier) || typeof tier.id !== 'string' || typeof tier.label !== 'string' || tier.label.length > 80 || !Array.isArray(tier.handles) || !Number.isInteger(tier.rounds) || tier.rounds < 1 || tier.rounds > 1000 || typeof tier.replyStyle !== 'string' || tier.replyStyle.length > 5000 || tier.handles.length > 500) throw new TypeError('invalid tier');
    tier.handles = tier.handles.map(sanitizeHandle);
    for (const handle of tier.handles) { if (seen.has(handle)) throw new TypeError(`duplicate handle: ${handle}`); seen.add(handle); }
  }
  const m = copy.model;
  if (!isRecord(m) || typeof m.name !== 'string' || !/^[\w./:-]{1,100}$/.test(m.name) || (m.endpointPort !== null && (!Number.isInteger(m.endpointPort) || m.endpointPort < 1 || m.endpointPort > 65535))) throw new TypeError('invalid model settings');
  for (const id of ['apex','tier1','tier2','tier3','tier4','other']) if (!copy.tiers.some(t => t.id === id)) throw new TypeError(`missing tier: ${id}`);
  if (copy.tiers.some(t => !['apex','tier1','tier2','tier3','tier4','other'].includes(t.id))) throw new TypeError('unknown tier id');
  if (!isRecord(copy.timing) || !isRecord(copy.specialReplies) || !isRecord(copy.rules)) throw new TypeError('invalid timing/rule settings');
  const bounds = { commentWindowHours:[1,48], mentionWindowHours:[1,48], quietHoursStart:[0,23], quietHoursEnd:[0,24], fullStopStart:[0,23], fullStopEnd:[0,24], publishMinSeconds:[5,3600], publishMaxSeconds:[5,3600], authorCooldownSeconds:[60,604800], postingWorkMinutes:[1,120], postingRestMinutes:[0,60], rateLimitMinutes:[1,60], rateLimitLongMinutes:[1,120] };
  for (const [key,[min,max]] of Object.entries(bounds)) if (!Number.isInteger(copy.timing[key]) || copy.timing[key] < min || copy.timing[key] > max) throw new TypeError(`invalid timing.${key}`);
  if (copy.timing.publishMaxSeconds < copy.timing.publishMinSeconds) throw new TypeError('publishMaxSeconds must be >= publishMinSeconds');
  for (const [key,value] of Object.entries(copy.specialReplies)) if (typeof key !== 'string' || typeof value !== 'string' || value.length > 2000) throw new TypeError('invalid special reply rule');
  if (Buffer.byteLength(JSON.stringify(copy)) > MAX_BODY) throw new RangeError('config too large');
  for (const [key,value] of Object.entries(copy.rules)) if (typeof value !== 'boolean') throw new TypeError(`invalid rules.${key}`);
  return copy;
}
import * as fsSync from 'node:fs';

export function createService({ subprocess, clock = () => Date.now(), paths = DEFAULT_TARGETS, configPath = CONFIG_PATH, platform = process.platform } = {}) {
  let activeConfigPath = configPath;
  const configMirrorPaths = [...new Set([join(paths.comment.dir, 'xops_config.json'), join(paths.reply.dir, 'xops_config.json')])].filter(path => path !== activeConfigPath);
  const getConfig = () => {
    for (const path of [activeConfigPath, ...configMirrorPaths]) {
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
    for (const mirrorPath of configMirrorPaths) {
      try {
        fsSync.mkdirSync(dirname(mirrorPath), { recursive: true, mode: 0o700 });
        const mirrorTmp = `${mirrorPath}.${process.pid}.tmp`;
        fsSync.writeFileSync(mirrorTmp, mirrorContent, { mode: 0o600 });
        fsSync.renameSync(mirrorTmp, mirrorPath);
      } catch (error) {
        throw new Error(`config saved but mirror sync failed (${basename(mirrorPath)}): ${error.message}`);
      }
    }
    return clone(validated);
  };
  const inspect = async () => {
    const items = {};
    for (const key of ['comment', 'reply']) {
      const t = paths[key];
      const worker = processState(t.pid, t.worker);
      const watchdog = processState(t.watchdogPid, t.watchdog, key === 'comment' ? '--loop' : '--supervise');
      const heartbeat = readJsonSafe(t.heartbeat);
      const rate = readJsonSafe(t.rate);
      let logTail = '';
      try { logTail = readFileSync(t.log, 'utf8').slice(-6000).split('\n').slice(-30).join('\n').replace(/(?:Bearer\s+)[^\s]+/gi, 'Bearer [REDACTED]'); } catch { /* no log available */ }
      items[key] = {
        worker, watchdog,
        heartbeatAgeSeconds: heartbeat && Number.isFinite(Number(heartbeat.timestamp)) ? Math.max(0, Math.floor(clock() / 1000 - Number(heartbeat.timestamp))) : null,
        pausedUntil: rate && Number.isFinite(Number(rate.until)) ? Number(rate.until) : null,
        pauseReason: rate && ['rate_limit', 'manual'].includes(rate.reason) ? rate.reason : (rate ? 'other' : null),
        cdpPort: t.port, cdpAvailable: await portOpen(t.port), logTail,
      };
    }
    return { ok: true, config: getConfig(), runtimeConfigApplied: true, runtimeCapabilities, items, platform, checkedAt: new Date(clock()).toISOString() };
  };
  async function action(request) {
    if (!isRecord(request) || typeof request.action !== 'string') throw new TypeError('action required');
    if (request.action === 'state') return inspect();
    if (request.action === 'save-config') {
      const saved = saveConfig(request.config);
      return { config: saved, runtimeConfigApplied: true, note: 'Both workers read tier membership/style and timing on their next loop. Model names are read only by replies; round caps only by replies; model port override only by commenter. SpecialReplies and boolean rules remain draft/display-only.' };
    }
    if (!['pause', 'resume', 'start', 'stop', 'restart'].includes(request.action)) throw new TypeError('unknown action');
    if (!['comment', 'reply'].includes(request.target)) throw new TypeError('target must be comment or reply');
    if (platform !== 'darwin') throw new Error('Process controls are supported only on macOS');
    const target = paths[request.target];
    const watchdogStatus = processState(target.watchdogPid, target.watchdog, request.target === 'comment' ? '--loop' : '--supervise');
    const workerStatus = processState(target.pid, target.worker);
    if (request.action === 'start') {
      if (watchdogStatus.running && watchdogStatus.owned) return { started:false, note:'Watchdog is already running; duplicate start refused.' };
      if (watchdogStatus.running || workerStatus.running) throw new Error('a live process has an unverified identity; start refused');
      if (!subprocess?.resolveExecutable || !subprocess?.spawn) throw new Error('Host subprocess service unavailable');
      if (fsSync.existsSync(target.stop)) fsSync.unlinkSync(target.stop);
      const python = await subprocess.resolveExecutable('python3');
      const argv = request.target === 'comment' ? [python, target.watchdog, '--loop'] : [python, target.watchdog, '--supervise'];
      subprocess.spawn({ argv, cwd: target.dir, stdio: { stdin:'ignore', stdout:{ maxBytes:2048 }, stderr:{ maxBytes:2048 } }, graceMs:5000 });
      return { started:null, launchRequested:true, note:'Launch request submitted; success is not claimed. Refresh state to verify a matching watchdog, worker and heartbeat.' };
    }
    if (request.action === 'stop') {
      if (!watchdogStatus.running || !watchdogStatus.owned) throw new Error('watchdog identity not verified; refusing to stop processes');
      if (workerStatus.running && !workerStatus.owned) throw new Error('worker identity not verified; refusing stop');
      fsSync.writeFileSync(target.stop, 'stop\n', { mode:0o600 });
      return { stopping:true, pid:watchdogStatus.pid, note:'Cooperative stop requested; watchdog will stop its owned worker and exit.' };
    }
    if (request.action === 'restart') {
      if (!watchdogStatus.running || !watchdogStatus.owned) throw new Error('watchdog identity not verified; refusing restart');
      if (workerStatus.running && !workerStatus.owned) throw new Error('worker identity not verified; refusing restart');
      if (!workerStatus.running) return { restarted:false, note:'Worker is not running; existing watchdog will start it on its next supervision cycle.' };
      process.kill(workerStatus.pid, 'SIGTERM');
      return { restarted:true, pid:workerStatus.pid, note:'SIGTERM sent to verified worker; watchdog owns restart.' };
    }
    if (request.action === 'pause') {
      const minutes = Number(request.minutes);
      if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) throw new RangeError('pause duration must be 1–1440 minutes');
      if (workerStatus.running && !workerStatus.owned) throw new Error('worker identity not verified; refusing pause operation');
      const until = Math.floor(clock() / 1000) + Math.floor(minutes * 60);
      fsSync.writeFileSync(target.rate, JSON.stringify({ until, resume_at: new Date(until * 1000).toISOString(), reason: 'manual', source: 'x-bot-ops-console' }), { mode: 0o600 });
      return { pausedUntil: until, note: 'The watchdog honors this pause marker. Refresh state to verify worker shutdown.' };
    }
    if (request.action === 'resume') {
      try { fsSync.unlinkSync(target.rate); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      return { note: 'Pause marker removed; watchdog may resume its worker on its next cycle.' };
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
  let body = ''; for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > MAX_BODY) throw new RangeError('request too large'); }
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
        if (auth === 'unavailable') return send(res, 503, { ok: false, error: 'Host authorization unavailable' });
        if (!auth) return send(res, 403, { ok: false, error: 'Host authorization rejected' });
        if (req.method === 'GET') return send(res, 200, await service.inspect());
        if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method not allowed' });
        const result = await service.action(await bodyJson(req));
        return send(res, 200, { ok: true, value: result });
      } catch (error) { return send(res, error instanceof RangeError ? 413 : 400, { ok: false, error: String(error?.message ?? error).slice(0, 250) }); }
    } }), 'x-bot-ops-console: route');
  });
}
export const inject = ['subprocess', 'connection'];
export function apply(ctx) {
  const service = createService({ subprocess: ctx.subprocess });
  const desktop = ctx.profileContext?.name === 'desktop';
  installRoute(ctx, service, { desktop });
}

export { DEFAULT_CONFIG, validateConfig };
