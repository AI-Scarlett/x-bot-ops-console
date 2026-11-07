import { readFileSync, existsSync, openSync, closeSync, mkdirSync, writeFileSync, renameSync, unlinkSync, statSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFile, execFileSync, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { createConnection } from 'node:net';
import http from 'node:http';

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
export const POST_QUEUE_PATH = join(APP_HOME, 'Library/Application Support/XBotOpsConsole/post_queue.json');
export const POST_HISTORY_PATH = join(APP_HOME, 'Library/Application Support/XBotOpsConsole/post_history.json');
export const LEARNINGS_PATH = join(APP_HOME, 'Library/Application Support/XBotOpsConsole/learnings.json');
export const POST_METRICS_PATH = join(APP_HOME, 'Library/Application Support/XBotOpsConsole/post_metrics.json');
export const LEARN_TRIGGER_PATH = join(APP_HOME, 'Library/Application Support/XBotOpsConsole/learn_now.trigger');
export const CRUISE_HISTORY_PATH = join(APP_HOME, 'Library/Application Support/XBotOpsConsole/profile_cruise_history.json');
export const TRENDS_PATH = join(APP_HOME, 'Library/Application Support/XBotOpsConsole/trends.json');
export const COOKIE_SET_SENTINEL = '__COOKIE_SET__';
export const CACHE_CLEANUP_STATE = join(homedir(), 'Library/Application Support/XBotOpsConsole/cache_cleanup.json');
export const SAVE_LOG_PATH = join(homedir(), 'Library/Application Support/XBotOpsConsole/save-log.json');
export const CONFIG_BACKUP_DIR = join(APP_HOME, 'Library/Application Support/XBotOpsConsole/config-history');
const MAX_CONFIG_BACKUPS = 20;

const TARGET_FIELDS = ['dir', 'worker', 'watchdog', 'watchdogPid', 'stop', 'pid', 'log', 'heartbeat', 'rate', 'chromeProfile', 'chromeLauncher'];

// Every shared setting, and which worker actually reads it. Mirrors the two Python workers.
export const FIELD_SIDE = Object.freeze({
  'model.name': 'reply',
  'model.endpointPort': 'comment',
  'timing.commentWindowHours': 'comment',
  'timing.mentionWindowHours': 'reply',
  'timing.authorCooldownSeconds': 'comment',
  'timing.publishMinSeconds': 'both',
  'timing.publishMaxSeconds': 'both',
  'timing.replyMinSeconds': 'reply',
  'timing.replyMaxSeconds': 'reply',
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
  'specialPersons.list': 'reply',
  'specialReplies': 'none',
  'rules.skipFinanceComments': 'comment',
  'rules.mentionPauseDuringQuiet': 'reply',
  'rules.mentionPauseDuringFullStop': 'reply',
  'commentSettings.model': 'comment',
  'commentSettings.customPrompt': 'comment',
  'commentSettings.skipKeywords': 'comment',
  'commentSettings.extraFinanceKeywords': 'comment',
  'commentSettings.minLength': 'comment',
  'commentSettings.maxLength': 'comment',
  'replySettings.model': 'reply',
  'replySettings.customPrompt': 'reply',
  'replySettings.lengthRule': 'reply',
  'replySettings.cannedForbidden': 'reply',
  'replySettings.thinReplyExtra': 'reply',
  'replySettings.personaOverride': 'reply',
  'replySettings.stopKeywords': 'reply',
  'replySettings.forbiddenPhrases': 'reply',
  'postSettings.enabled': 'post',
  'postSettings.intervalMinutes': 'post',
  'postSettings.intervalSeconds': 'post',
  'postSettings.queueBatchSize': 'post',
  'postSettings.queueLowThreshold': 'post',
  'postSettings.queueAutoRefill': 'post',
  'postSettings.queueMaxSize': 'post',
  'postSettings.styleSchedule': 'post',
  'postSettings.intervalMode': 'post',
  'postSettings.intervalMinSeconds': 'post',
  'postSettings.intervalMaxSeconds': 'post',
  'postSettings.oneSentencePerLine': 'post',
  'postSettings.hotTopicPerBatch': 'post',
  'postSettings.hotFilter': 'post',
  'postSettings.manualBannedTopics': 'post',
  'postSettings.hotTopicShareMinPercent': 'post',
  'postSettings.politicalCap': 'post',
  'postSettings.dedupe': 'post',
  'postSettings.format': 'post',
  'postSettings.style': 'post',
  'postSettings.restEveryPosts': 'post',
  'postSettings.restMinutes': 'post',
  'postSettings.learningInfluence': 'post',
  'postSettings.topicMix': 'post',
  'postSettings.topics': 'post',
  'postSettings.model': 'post',
  'postSettings.customPrompt': 'post',
  'cruiseSettings.enabled': 'profile',
  'cruiseSettings.dailyTargetCount': 'profile',
  'cruiseSettings.crawlFollowing': 'profile',
  'cruiseSettings.crawlFollowers': 'profile',
  'cruiseSettings.interactionCooldownHours': 'profile',
  'cruiseSettings.tierSweepHours': 'profile',
  'cruiseSettings.commentsPerProfile': 'profile',
  'cruiseSettings.likesPerProfile': 'profile',
  'persona.enabled': 'both',
  'persona.summary': 'both',
  'persona.forbidden': 'both',
  'persona.rules': 'both',
  'cruiseSettings.autoVisitInvited': 'profile',
  'cruiseSettings.model': 'profile',
  'cruiseSettings.customPrompt': 'profile',
  'learningSettings.enabled': 'post',
  'learningSettings.autoLearn': 'post',
  'learningSettings.checkIntervalMinutes': 'post',
  'learningSettings.minAgeHours': 'post',
  'learningSettings.historyHours': 'post',
  'learningSettings.minImpressions': 'post',
  'learningSettings.minComments': 'post',
  'learningSettings.minLikes': 'post',
  'learningSettings.maxSamples': 'post',
  'learningSettings.injectIntoPost': 'post',
  'learningSettings.model': 'post',
  'learningSettings.trendSources': 'post',
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

export function readPostQueue(queuePath = POST_QUEUE_PATH) {
  try {
    if (existsSync(queuePath)) {
      const data = JSON.parse(readFileSync(queuePath, 'utf8'));
      if (isRecord(data) && Array.isArray(data.queue)) {
        return {
          queue: data.queue,
          history: Array.isArray(data.history) ? data.history : [],
        };
      }
    }
  } catch {}
  return { queue: [], history: [] };
}

// The plugin host and the Python workers both mutate shared JSON state.
// A short-lived lock file keeps each read-modify-write cycle atomic across both sides.
function withFileLock(fn, lockPath, label = '共享状态') {
  const deadline = Date.now() + 5000;
  let fd = null;
  while (fd === null) {
    try {
      fd = openSync(lockPath, 'wx');
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      try {
        const age = Date.now() - statSync(lockPath).mtimeMs;
        if (age > 10000) { try { unlinkSync(lockPath); } catch { /* ignore stale lock cleanup */ } continue; }
      } catch { /* lock vanished between checks */ }
      if (Date.now() > deadline) throw new Error(`${label}正被其它进程占用，请稍后重试`);
      sleepSync(60);
    }
  }
  try {
    writeFileSync(fd, String(process.pid));
    return fn();
  } finally {
    try { closeSync(fd); } catch { /* ignore close failure */ }
    try { unlinkSync(lockPath); } catch { /* ignore lock cleanup */ }
  }
}

function withQueueLock(fn, queuePath = POST_QUEUE_PATH) {
  return withFileLock(fn, `${queuePath}.lock`, '发帖队列');
}

// Progress of the "walk the whole priority list" pass, read from the cruise
// worker's own history file so the UI can show what is left.
// Why mentions go unanswered: the queue depth and the recorded drop reasons.
// Read from the reply worker's own state directory so the UI can explain it.
export function readReplyDiagnostics(stateDir) {
  const empty = { backlog: 0, oldestHours: null, skipReasons: [], skipTotal: 0 };
  if (!stateDir) return empty;
  const backlogPath = join(stateDir, 'mention_backlog.json');
  const skipPath = join(stateDir, 'skip_cache.json');
  const out = { ...empty };
  try {
    if (existsSync(backlogPath)) {
      const data = JSON.parse(readFileSync(backlogPath, 'utf8'));
      const items = Array.isArray(data?.items) ? data.items : [];
      out.backlog = items.length;
      const now = Date.now();
      const ages = items
        .map(item => {
          try {
            const raw = String(item.id || '');
            // X status ids are 18-19 digit snowflakes; anything else is not a real post.
            if (!/^\d{15,20}$/.test(raw)) return null;
            // BigInt is required: a 19-digit snowflake overflows JS's 32-bit >>.
            const created = (Number(BigInt(raw) >> 22n) + 1288834974657) / 1000;
            const age = (now / 1000 - created) / 3600;
            return age >= 0 && age < 240 ? age : null;
          } catch { return null; }
        })
        .filter(age => Number.isFinite(age));
      if (ages.length) out.oldestHours = Math.round(Math.max(...ages) * 10) / 10;
    }
  } catch { /* keep defaults */ }
  try {
    if (existsSync(skipPath)) {
      const data = JSON.parse(readFileSync(skipPath, 'utf8'));
      const counts = new Map();
      for (const value of Object.values(data || {})) {
        const reason = isRecord(value) && typeof value.reason === 'string' ? value.reason : 'other';
        counts.set(reason, (counts.get(reason) || 0) + 1);
      }
      out.skipTotal = [...counts.values()].reduce((sum, n) => sum + n, 0);
      out.skipReasons = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([reason, count]) => ({ reason, count }));
    }
  } catch { /* keep defaults */ }
  return out;
}

export function readCruiseSweep(historyPath = CRUISE_HISTORY_PATH) {
  try {
    if (!existsSync(historyPath)) return { pending: 0, total: 0, done: 0, lastFinishedAt: null, startedAt: null };
    const data = JSON.parse(readFileSync(historyPath, 'utf8'));
    const sweep = isRecord(data?.sweep) ? data.sweep : {};
    const pending = Array.isArray(sweep.pending) ? sweep.pending.length : 0;
    const toIso = value => (Number.isFinite(Number(value)) && Number(value) > 0)
      ? new Date(Number(value) * 1000).toISOString()
      : null;
    return {
      pending,
      total: Number.isFinite(Number(sweep.total)) ? Number(sweep.total) : 0,
      done: Number.isFinite(Number(sweep.done)) ? Number(sweep.done) : 0,
      startedAt: toIso(sweep.startedAt),
      lastFinishedAt: toIso(sweep.lastFinishedAt),
      nextHandle: pending > 0 ? String(sweep.pending[0] || '') : '',
    };
  } catch {
    return { pending: 0, total: 0, done: 0, lastFinishedAt: null, startedAt: null };
  }
}

// Every successful save snapshots the previous file first, so an accidental
// overwrite (a stale page wiping prompts or model choices) is always reversible.
export function backupConfigFile(configPath = CONFIG_PATH, backupDir = CONFIG_BACKUP_DIR) {
  try {
    if (!existsSync(configPath)) return null;
    const raw = readFileSync(configPath);
    mkdirSync(backupDir, { recursive: true, mode: 0o700 });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = join(backupDir, `config-${stamp}.json`);
    writeFileSync(file, raw, { mode: 0o600 });
    const files = readdirSync(backupDir)
      .filter(name => name.startsWith('config-') && name.endsWith('.json'))
      .sort();
    for (const stale of files.slice(0, Math.max(0, files.length - MAX_CONFIG_BACKUPS))) {
      try { unlinkSync(join(backupDir, stale)); } catch { /* ignore */ }
    }
    return file;
  } catch {
    return null;
  }
}

export function listConfigBackups(backupDir = CONFIG_BACKUP_DIR) {
  try {
    if (!existsSync(backupDir)) return [];
    return readdirSync(backupDir)
      .filter(name => name.startsWith('config-') && name.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, MAX_CONFIG_BACKUPS)
      .map(name => {
        const full = join(backupDir, name);
        let savedAt = null;
        let size = 0;
        try {
          const info = statSync(full);
          savedAt = new Date(info.mtimeMs).toISOString();
          size = info.size;
        } catch { /* keep nulls */ }
        return { name, savedAt, size };
      });
  } catch {
    return [];
  }
}

// Pull headline candidates out of whatever a board returns (JSON or HTML).
export function extractTrendTopics(body) {
  const text = String(body || '');
  const topics = new Set();
  const push = value => {
    const title = String(value || '').replace(/\s+/g, ' ').trim();
    if (title.length >= 4 && title.length <= 80) topics.add(title);
  };
  try {
    const parsed = JSON.parse(text);
    const walk = node => {
      if (Array.isArray(node)) { node.forEach(walk); return; }
      if (isRecord(node)) {
        for (const key of ['query', 'Title', 'title', 'word', 'name', 'note']) {
          if (typeof node[key] === 'string') push(node[key]);
        }
        Object.values(node).forEach(walk);
      }
    };
    walk(parsed);
  } catch { /* not JSON; fall through to regex */ }
  if (!topics.size) {
    for (const pattern of [/"Title":"([^"]{4,80})"/g, /"query":"([^"]{4,80})"/g, /"word":"([^"]{4,80})"/g, /<title>([^<]{4,80})<\/title>/g]) {
      let match;
      while ((match = pattern.exec(text)) !== null) push(match[1]);
    }
  }
  return [...topics].slice(0, 50);
}

// DevTools shows cookies as a tab-separated table (Name, Value, Domain, Path, …)
// while a request needs "name=value; name2=value2". Accept either.
export function normalizeCookie(raw) {
  let text = String(raw || '').trim();
  if (!text) return '';
  if (text.toLowerCase().startsWith('cookie:')) text = text.slice(7).trim();
  text = text.replace(/^["']|["']$/g, '');

  if (!text.includes('\t')) {
    // Already header-shaped: just tidy separators and whitespace.
    return text
      .split(';')
      .map(part => part.trim())
      .filter(part => part.includes('='))
      .join('; ');
  }

  const tokens = text.split(/[\t\n\r]+/).map(token => token.trim());
  const domainLike = /^\.?[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i;
  const pairs = [];
  const seen = new Map();
  for (let i = 2; i < tokens.length; i += 1) {
    if (!domainLike.test(tokens[i])) continue;
    if (tokens[i + 1] !== '/') continue;
    // The Priority column ("Medium") runs into the next row's Name.
    const name = tokens[i - 2].replace(/^(?:Medium|Low|High)\s+/i, '').trim();
    const value = tokens[i - 1];
    if (!name || /\s/.test(name) || name === 'Session') continue;
    if (seen.has(name)) {
      pairs[seen.get(name)] = `${name}=${value}`;
    } else {
      seen.set(name, pairs.length);
      pairs.push(`${name}=${value}`);
    }
  }
  return pairs.join('; ');
}

// Replace stored cookies with a sentinel so credentials never reach the UI.
export function maskTrendCookies(config) {
  if (!isRecord(config) || !isRecord(config.learningSettings)) return config;
  const sources = config.learningSettings.trendSources;
  if (!Array.isArray(sources)) return config;
  return {
    ...config,
    learningSettings: {
      ...config.learningSettings,
      trendSources: sources.map(source => {
        if (!isRecord(source)) return source;
        const cookie = typeof source.cookie === 'string' ? source.cookie.trim() : '';
        return { ...source, cookie: cookie ? COOKIE_SET_SENTINEL : '' };
      }),
    },
  };
}

export function readSaveLog(saveLogPath = SAVE_LOG_PATH) {
  try {
    const parsed = JSON.parse(readFileSync(saveLogPath, 'utf8'));
    return { last: parsed.last || null, history: Array.isArray(parsed.history) ? parsed.history.slice(0, 10) : [] };
  } catch {
    return { last: null, history: [] };
  }
}

export function readTrends(trendsPath = TRENDS_PATH) {
  try {
    if (existsSync(trendsPath)) {
      const data = JSON.parse(readFileSync(trendsPath, 'utf8'));
      if (isRecord(data) && Array.isArray(data.topics)) return data;
    }
  } catch { /* fall through */ }
  return { fetchedAt: null, topics: [], sources: [] };
}

export function writeTrends(data, trendsPath = TRENDS_PATH) {
  const dir = dirname(trendsPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const payload = {
    fetchedAt: new Date().toISOString(),
    topics: [...new Set((Array.isArray(data.topics) ? data.topics : []).map(String))].slice(0, 200),
    sources: (Array.isArray(data.sources) ? data.sources : []).slice(0, 20),
  };
  if (Number.isFinite(Number(data.rawCount))) payload.rawCount = Number(data.rawCount);
  if (Number.isFinite(Number(data.droppedCount))) payload.droppedCount = Number(data.droppedCount);
  if (Array.isArray(data.droppedSamples)) payload.droppedSamples = data.droppedSamples.slice(0, 20);
  for (const key of ['aiScreened', 'aiRejected']) {
    if (Number.isFinite(Number(data[key]))) payload[key] = Number(data[key]);
  }
  if (typeof data.aiError === 'string' && data.aiError) payload.aiError = data.aiError.slice(0, 200);
  const tempPath = `${trendsPath}.tmp.${Date.now()}`;
  writeFileSync(tempPath, JSON.stringify(payload, null, 2), { mode: 0o600 });
  renameSync(tempPath, trendsPath);
  return payload;
}

// Decide what happens to each trending topic. Sensitive news is dropped, and
// off-brand topics are ranked down rather than silently used.
export function screenHotTopics(topics, filter = {}) {
  const minLength = Number(filter.minLength) || 4;
  const maxLength = Number(filter.maxLength) || 50;
  const exclude = (Array.isArray(filter.excludeKeywords) ? filter.excludeKeywords : []).map(item => String(item).toLowerCase());
  const prefer = (Array.isArray(filter.preferKeywords) ? filter.preferKeywords : []).map(item => String(item).toLowerCase());
  // Manually removed headlines are matched exactly (case-insensitive).
  const bannedTopics = new Set((Array.isArray(filter.excludedTopics) ? filter.excludedTopics : []).map(item => String(item).replace(/\s+/g, ' ').trim().toLowerCase()));
  const kept = [];
  const dropped = [];
  for (const raw of Array.isArray(topics) ? topics : []) {
    const topic = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!topic) continue;
    const lower = topic.toLowerCase();
    if (topic.length < minLength) { dropped.push({ topic, reason: '太短' }); continue; }
    if (topic.length > maxLength) { dropped.push({ topic, reason: '太长' }); continue; }
    if (bannedTopics.has(lower)) { dropped.push({ topic, reason: '手动剔除' }); continue; }
    const hit = exclude.find(word => word && lower.includes(word));
    if (hit) { dropped.push({ topic, reason: `含敏感词「${hit}」` }); continue; }
    const bonus = prefer.some(word => word && lower.includes(word)) ? 1 : 0;
    kept.push({ topic, bonus });
  }
  // Preferred topics float to the front; the rest keep their board order.
  kept.sort((a, b) => b.bonus - a.bonus);
  return { usable: kept.map(item => item.topic), dropped };
}

// Fetch every enabled board. Failures are reported per source instead of aborting.
// Boards such as Weibo reject requests that do not look like they came from
// their own page, so default the Referer to the endpoint's origin.
export function originReferer(url) {
  try {
    const parsed = new URL(String(url));
    if (!/^https?:$/.test(parsed.protocol)) return {};
    return { referer: `${parsed.origin}/`, origin: parsed.origin };
  } catch {
    return {};
  }
}

export async function fetchAllTrends(sources, { timeoutMs = 12000 } = {}) {
  const results = [];
  const topics = [];
  for (const source of Array.isArray(sources) ? sources : []) {
    if (!isRecord(source) || source.enabled === false) continue;
    const url = String(source.url || '');
    if (!/^https?:\/\//i.test(url)) { results.push({ id: source.id, label: source.label, ok: false, count: 0, error: '地址无效' }); continue; }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let body = '';
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36',
            accept: 'application/json,text/html,*/*',
            // Several boards reject requests without a same-site Referer.
            ...(source.referer ? { referer: String(source.referer) } : originReferer(url)),
            ...(normalizeCookie(source.cookie) ? { cookie: normalizeCookie(source.cookie) } : {}),
          },
        });
        body = await response.text();
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      } finally {
        clearTimeout(timer);
      }
      const list = extractTrendTopics(body);
      topics.push(...list);
      results.push({ id: source.id, label: source.label, ok: list.length > 0, count: list.length, error: list.length ? '' : '未提取到话题' });
    } catch (error) {
      results.push({ id: source.id, label: source.label, ok: false, count: 0, error: String(error?.message || error).slice(0, 120) });
    }
  }
  return { results, topics: [...new Set(topics)] };
}

export function readLearnings(learningsPath = LEARNINGS_PATH) {
  try {
    if (existsSync(learningsPath)) {
      const data = JSON.parse(readFileSync(learningsPath, 'utf8'));
      if (isRecord(data)) return normalizeLearnings(data);
    }
  } catch {}
  return normalizeLearnings({});
}

function normalizeLearnings(data) {
  const cleanList = (value, limit) => (Array.isArray(value) ? value : [])
    .map(item => String(item || '').trim())
    .filter(Boolean)
    .slice(0, limit);
  const patterns = (Array.isArray(data.patterns) ? data.patterns : [])
    .filter(isRecord)
    .map((item, index) => ({
      id: typeof item.id === 'string' && item.id ? item.id : `learn_${index}`,
      title: String(item.title || '未命名套路').slice(0, 200),
      structure: String(item.structure || '').slice(0, 2000),
      hooks: cleanList(item.hooks, 12).map(hook => hook.slice(0, 300)),
      sample: String(item.sample || '').slice(0, 1000),
      source: ['history', 'benchmark', 'manual'].includes(item.source) ? item.source : 'manual',
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : null,
    }))
    .slice(0, 100);
  const history = isRecord(data.history) ? data.history : {};
  return {
    version: 1,
    styleGuide: String(data.styleGuide || '').slice(0, 4000),
    winningTopics: cleanList(data.winningTopics, 40),
    bannedTopics: cleanList(data.bannedTopics, 40),
    patterns,
    history: {
      lastRunAt: typeof history.lastRunAt === 'string' ? history.lastRunAt : null,
      considered: Number.isFinite(Number(history.considered)) ? Number(history.considered) : 0,
      learned: Number.isFinite(Number(history.learned)) ? Number(history.learned) : 0,
      note: typeof history.note === 'string' ? history.note.slice(0, 500) : '',
      posts: (Array.isArray(history.posts) ? history.posts : []).filter(isRecord).slice(0, 100),
    },
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : null,
  };
}

export function writeLearnings(data, learningsPath = LEARNINGS_PATH) {
  const dir = dirname(learningsPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const payload = { ...normalizeLearnings(data), updatedAt: new Date().toISOString() };
  const tempPath = `${learningsPath}.tmp.${process.pid}.${Date.now()}`;
  writeFileSync(tempPath, JSON.stringify(payload, null, 2), { mode: 0o600 });
  renameSync(tempPath, learningsPath);
  return payload;
}

export function mutateLearnings(mutator, learningsPath = LEARNINGS_PATH) {
  return withFileLock(() => {
    const current = readLearnings(learningsPath);
    const result = mutator(current);
    const payload = writeLearnings(current, learningsPath);
    return { result, payload };
  }, `${learningsPath}.lock`, '发帖学习记录');
}

// The active style window, in Beijing time. The plugin used to ignore this
// entirely, so a manual "generate 10 drafts" always produced the global style
// even while the English window was active.
export function beijingHour(now = Date.now()) {
  return new Date(now + 8 * 3600 * 1000).getUTCHours();
}

export function styleSlotFor(postCfg, hour = beijingHour()) {
  const slots = Array.isArray(postCfg?.styleSchedule) ? postCfg.styleSchedule : [];
  for (const slot of slots) {
    if (!isRecord(slot)) continue;
    const start = Number(slot.startHour);
    const end = Number(slot.endHour);
    if (!Number.isInteger(start) || !Number.isInteger(end)) continue;
    if (start <= hour && hour < end) return slot;
  }
  return null;
}

export function stylePromptFor(postCfg, hour = beijingHour()) {
  const slot = styleSlotFor(postCfg, hour);
  if (!slot) return { prompt: '', label: '' };
  return { prompt: String(slot.prompt || '').trim(), label: String(slot.label || '').trim() };
}

// Must match post_worker.py's post_settings_signature byte for byte, so a draft
// made here is recognised as current (or stale) by the worker.
export function postSettingsSignature(postCfg) {
  const pc = postCfg || {};
  const slots = (Array.isArray(pc.styleSchedule) ? pc.styleSchedule : [])
    .filter(item => isRecord(item))
    .map(item => `${item.label}:${item.startHour}:${item.endHour}:${item.prompt || ''}`)
    .join(';');
  const mix = (Array.isArray(pc.topicMix) ? pc.topicMix : [])
    .filter(item => isRecord(item))
    .map(item => `${item.label}:${item.weight}:${item.prompt || ''}`)
    .join(';');
  const influence = pc.learningInfluence === undefined || pc.learningInfluence === null ? 100 : pc.learningInfluence;
  const parts = [
    pc.customPrompt || '',
    slots,
    mix,
    String(influence),
    pc.oneSentencePerLine === false ? '0' : '1',
    (Array.isArray(pc.topics) ? pc.topics : []).map(String).join(','),
  ];
  return createHash('sha1').update(parts.join('|'), 'utf8').digest('hex').slice(0, 16);
}

// Hard format rule: every sentence gets its own line, never one solid paragraph.
// Applied after generation so the model cannot ignore it.
export function enforceOneSentencePerLine(text) {
  const raw = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!raw) return raw;
  // Flatten whatever layout the model produced, then rebuild it deterministically.
  const flat = raw.replace(/\n+/g, ' ').replace(/[ \t]{2,}/g, ' ').trim();
  if (!flat) return '';
  const lines = [];
  // Only the closing quote/bracket itself joins the previous line; whatever the
  // model wrote after it still starts a new line.
  const leadingClosers = /^([」』”’"'）)\]】》〉]+)([\s\S]*)$/;
  for (const chunk of flat.split(/(?<=[。！？；!?;])\s*/)) {
    if (!chunk) continue;
    // English sentences also end with ". " followed by a capital or a quote.
    for (const piece of chunk.split(/(?<=[.!?])\s+(?=[A-Z"“'‘（(])/)) {
      const line = piece.trim();
      if (!line) continue;
      const closers = lines.length ? line.match(leadingClosers) : null;
      if (closers) {
        lines[lines.length - 1] += closers[1];
        const rest = closers[2].trim();
        if (rest) lines.push(rest);
      } else {
        lines.push(line);
      }
    }
  }
  return lines.length ? lines.join('\n') : flat;
}

export const ONE_SENTENCE_RULE = '【格式硬性要求】每一句话必须单独占一行，句与句之间必须换行；禁止把多句连成一整段，禁止使用空行。';

// The prompt's structural section, assembled from editable fragments.
// `language` switches to the English rules: the Chinese ones demand a Han
// character count and a closing「尔」, which would fight the English window.
export function buildStructureBlock(format = {}, style = {}, language = 'chinese') {
  const fmt = { ...(format || {}) };
  const st = { ...(style || {}) };
  const english = String(language || '').toLowerCase().startsWith('en') || language === '英文';
  const fill = template => String(template || '')
    .replace(/\{prefix\}/g, String(fmt.closingPrefix ?? '尔'))
    .replace(/\{lines\}/g, String(fmt.lineCount ?? 3))
    .replace(/\{min\}/g, String(fmt.minChars ?? 30))
    .replace(/\{max\}/g, String(fmt.maxChars ?? 60));
  const autoLines = Number(fmt.lineCount) === 0;
  const min = fmt.minChars ?? 30;
  const max = fmt.maxChars ?? 60;
  let lines;
  if (english) {
    const count = autoLines
      ? `Write one sentence per line; the number of lines follows the content. Keep it between ${min} and ${max} characters.`
      : `Write exactly ${fmt.lineCount ?? 3} lines, no more and no less. Keep it between ${min} and ${max} characters.`;
    lines = [
      `【Structure】${count}`,
      autoLines ? '' : 'Line 1: open with the conflict or desire, concretely.',
      autoLines ? '' : 'Line 2: turn it over; put the tension in the open.',
      autoLines ? '' : `Line ${fmt.lineCount ?? 3}: end with a direct question that ends in a question mark.`,
      'Write in English only. Do not include any Chinese characters.',
      st.extraRules ? fill(st.extraRules) : '',
      'No links, no @mentions, no hashtags.',
      fmt.hardBottomLines ? `【Hard limits】${fill(fmt.hardBottomLines)}` : '',
    ];
  } else {
    lines = [
      autoLines
        ? `【结构】行数按内容自然安排，不硬性规定。汉字 ${min}-${max} 个，务必不超过上限。`
        : `【硬性结构】共 ${fmt.lineCount ?? 3} 行，不多不少。汉字 ${min}-${max} 个，务必不超过上限。`,
      autoLines ? '' : (st.line1Rule ? fill(st.line1Rule) : ''),
      autoLines ? '' : (st.line2Rule ? fill(st.line2Rule) : ''),
      autoLines ? (st.autoLineRule ? fill(st.autoLineRule) : '') : (st.line3Rule ? fill(st.line3Rule) : ''),
      st.languageRule ? fill(st.languageRule) : '',
      Array.isArray(fmt.softOpeners) && fmt.softOpeners.length ? `禁在首行使用：${fmt.softOpeners.join('、')}。` : '',
      Array.isArray(fmt.bannedPatterns) && fmt.bannedPatterns.length ? `禁用作废句式：${fmt.bannedPatterns.join('、')}。` : '',
      Array.isArray(fmt.forbidColloquial) && fmt.forbidColloquial.length ? `禁用白话虚词：${fmt.forbidColloquial.join('、')}。` : '',
      st.extraRules ? fill(st.extraRules) : '',
      '禁链接、@、话题标签。',
      fmt.hardBottomLines ? `【硬底线】${fill(fmt.hardBottomLines)}` : '',
    ];
  }
  return `\n\n${lines.filter(Boolean).join('\n')}`;
}

// Enforce the writer rules: fixed line count, length, an addressing question at
// the end, no soft openers, no colloquial filler, no retired templates.
// Structural fingerprint: per line the character count plus the first and last
// character. Two drafts that differ only by swapped words share a skeleton, which
// is what the 48h cooldown is meant to stop.
export function postSkeleton(text) {
  const lines = String(text || '').split('\n').map(line => line.replace(/\s+/g, '')).filter(Boolean);
  if (!lines.length) return '';
  return lines.map(line => {
    const chars = Array.from(line);
    return `${chars.length}:${chars[0] || ''}:${chars[chars.length - 1] || ''}`;
  }).join('|');
}

export function checkPostDraft(text, format = {}, recentTexts = [], skeletonTexts = [], skeletonCooldownHours = 0) {
  const reasons = [];
  const fmt = format || {};
  // 0 means automatic, so it must not fall back to the default.
  const lineCount = fmt.lineCount === undefined || fmt.lineCount === null || fmt.lineCount === '' ? 3 : Number(fmt.lineCount);
  const minChars = Number(fmt.minChars) || 30;
  const maxChars = Number(fmt.maxChars) || 60;
  const closingPrefix = String(fmt.closingPrefix ?? '尔');
  const lines = String(text || '').split('\n').map(line => line.trim()).filter(Boolean);
  const body = lines.join('');

  if (!body) return { ok: false, reasons: ['内容为空'] };
  if (lineCount > 0) {
    if (lines.length !== lineCount) reasons.push(`行数为 ${lines.length}，应为 ${lineCount}`);
  } else if (lines.length < 2) {
    reasons.push('自动分行模式下至少要分成两行，不能写成一段');
  }
  const hanCount = (body.match(/[\u4e00-\u9fff]/g) || []).length;
  // Length is measured in the language of the draft: an English post has no
  // Han characters at all, so counting only Han characters rejected every
  // English draft ("汉字 0 个，应在 30-120").
  const englishDraft = hanCount === 0 && /[A-Za-z]/.test(body);
  const charCount = englishDraft ? (body.replace(/\s+/g, '').length) : hanCount;
  const unit = englishDraft ? '字符' : '汉字';
  if (charCount < minChars || charCount > maxChars) reasons.push(`${unit} ${charCount} 个，应在 ${minChars}-${maxChars}`);

  if (fmt.requireClosingQuestion !== false && lines.length) {
    const last = lines[lines.length - 1];
    // The Chinese closing prefix ("尔") only applies to Chinese drafts.
    if (!englishDraft && !last.startsWith(closingPrefix)) reasons.push(`末行应以「${closingPrefix}」开头`);
    if (!/[？?]$/.test(last)) reasons.push('末行应以问号结尾');
  }

  const openers = englishDraft ? [] : (Array.isArray(fmt.softOpeners) ? fmt.softOpeners : []);
  if (lines.length && openers.some(word => word && lines[0].includes(word))) reasons.push('首行使用了软铺垫词');

  const banned = englishDraft ? [] : (Array.isArray(fmt.bannedPatterns) ? fmt.bannedPatterns : []);
  const hitBanned = banned.find(word => word && body.includes(word));
  if (hitBanned) reasons.push(`含作废句式「${hitBanned}」`);

  // Soft openers, banned patterns and colloquial fillers are Chinese-only
  // rules; they cannot match an English draft.
  const colloquial = englishDraft ? [] : (Array.isArray(fmt.forbidColloquial) ? fmt.forbidColloquial : []);
  const hitColloquial = colloquial.find(word => word && body.includes(word));
  if (hitColloquial) reasons.push(`含白话虚词「${hitColloquial}」`);

  if (/https?:\/\/|www\.|@[A-Za-z0-9_]{2,}/.test(body)) reasons.push('含链接或 @');

  const overlap = Number(fmt.maxOverlapChars) || 0;
  if (overlap > 0 && Array.isArray(recentTexts)) {
    for (const previous of recentTexts) {
      const prev = String(previous || '').replace(/\s+/g, '');
      if (!prev) continue;
      for (let i = 0; i + overlap <= body.length; i += 1) {
        if (prev.includes(body.slice(i, i + overlap))) {
          reasons.push(`与已发内容连续 ${overlap} 字重复`);
          break;
        }
      }
      if (reasons.some(reason => reason.startsWith('与已发内容'))) break;
    }
  }
  const cooldown = Number(skeletonCooldownHours) || 0;
  if (cooldown > 0 && Array.isArray(skeletonTexts) && skeletonTexts.length) {
    const skeleton = postSkeleton(text);
    if (skeleton) {
      const clash = skeletonTexts.find(previous => previous && postSkeleton(previous) === skeleton);
      if (clash) reasons.push(`结构骨架与 ${Math.round(cooldown)} 小时内的旧帖重复（${clash.slice(0, 12)}…）`);
    }
  }
  return { ok: reasons.length === 0, reasons, hanCount, charCount, english: englishDraft, lineCount: lines.length };
}

// Learned bans plus the operator's own list; either one vetoes a topic.
// The board filter has two layers: the operator's own keyword list (editable, and
// may be replaced wholesale) plus a built-in floor that always applies. Without the
// floor, clearing the list would let crime and war headlines back into the queue.
export function hotSafetyFloor() {
  return [...(DEFAULT_CONFIG.postSettings.hotFilter.excludeKeywords || [])];
}

export function effectiveHotFilter(postCfg, learnings) {
  const base = { ...(postCfg?.hotFilter || DEFAULT_CONFIG.postSettings.hotFilter) };
  const political = (postCfg?.politicalCap?.keywords || DEFAULT_CONFIG.postSettings.politicalCap?.keywords || []);
  base.excludeKeywords = [...new Set([
    ...(base.excludeKeywords || []),
    ...hotSafetyFloor(),
    ...political,
    ...mergeBannedTopics(learnings, postCfg),
  ].map(item => String(item || '').trim()).filter(Boolean))];
  return base;
}

export function mergeBannedTopics(learnings, postCfg) {
  const learned = Array.isArray(learnings?.bannedTopics) ? learnings.bannedTopics : [];
  const manual = Array.isArray(postCfg?.manualBannedTopics) ? postCfg.manualBannedTopics : [];
  const seen = new Set();
  const merged = [];
  for (const raw of [...manual, ...learned]) {
    const item = String(raw || '').trim();
    if (!item) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

// Build an exact, interleaved theme plan for a whole batch.
//
// Weighted random per item clusters themes together (six "生活" posts in a row).
// A batch of N instead gets an exact quota per theme (largest-remainder), then
// the quotas are spread evenly across the batch so themes alternate.
export function planThemeBatch(mix, count, random = Math.random) {
  const usable = (Array.isArray(mix) ? mix : [])
    .filter(item => isRecord(item) && Number(item.weight) > 0);
  const size = Math.max(0, Math.floor(Number(count) || 0));
  if (!usable.length || size === 0) return [];

  // 1. Exact quota per theme (largest remainder).
  const total = usable.reduce((sum, item) => sum + Number(item.weight), 0);
  const exact = usable.map(item => (size * Number(item.weight)) / total);
  const counts = exact.map(value => Math.floor(value));
  const left = size - counts.reduce((a, b) => a + b, 0);
  exact
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac)
    .slice(0, Math.max(0, left))
    .forEach(entry => { counts[entry.index] += 1; });

  // 2. Optimal anti-adjacency schedule: always take the theme with the most
  //    remaining slots that differs from the previous one. Ties are broken
  //    randomly, so the order varies while the quota stays exact.
  const pool = usable.map((item, index) => ({ theme: item, left: counts[index] }));
  const plan = [];
  let previous = null;
  while (pool.some(entry => entry.left > 0)) {
    const available = pool.filter(entry => entry.left > 0);
    const fresh = available.filter(entry => entry.theme !== previous);
    const candidates = fresh.length ? fresh : available;
    const most = Math.max(...candidates.map(entry => entry.left));
    const top = candidates.filter(entry => entry.left === most);
    const chosen = top[Math.floor(random() * top.length)];
    plan.push(chosen.theme);
    chosen.left -= 1;
    previous = chosen.theme;
  }
  return plan;
}

// Pick a content theme by weight, so the mix config drives what gets written about.
export function pickTopicTheme(mix, random = Math.random) {
  const usable = (Array.isArray(mix) ? mix : []).filter(item => isRecord(item) && Number(item.weight) > 0);
  if (!usable.length) return null;
  const total = usable.reduce((sum, item) => sum + Number(item.weight), 0);
  let roll = random() * total;
  for (const item of usable) {
    roll -= Number(item.weight);
    if (roll < 0) return item;
  }
  return usable[usable.length - 1];
}

// Collapse the stored learnings into a prompt fragment the generator can use.
// The caller keeps its own writing style; only topics and structure are borrowed.
export function buildLearningPromptBlock(learnings, { maxChars = 1600, influence = 100 } = {}) {
  const parts = [];
  if (learnings.styleGuide) parts.push(`【高表现套路总结】\n${learnings.styleGuide}`);
  const hooks = learnings.patterns.flatMap(p => p.hooks).filter(Boolean).slice(0, 10);
  if (hooks.length) parts.push(`【高互动钩子/开头方式】\n${hooks.map(h => `- ${h}`).join('\n')}`);
  const structures = learnings.patterns.map(p => p.structure).filter(Boolean).slice(0, 6);
  if (structures.length) parts.push(`【可借鉴的行文结构】\n${structures.map(s => `- ${s}`).join('\n')}`);
  // A topic that is also banned must not be advertised as proven: the two
  // lists contradicted each other and the banned ones leaked back in.
  const bannedSet = new Set((learnings.bannedTopics || []).map(topic => String(topic).toLowerCase()));
  const usableWinners = (learnings.winningTopics || []).filter(topic => !bannedSet.has(String(topic).toLowerCase()));
  if (usableWinners.length) parts.push(`【已验证有效的话题方向】${usableWinners.join('、')}`);
  if (learnings.bannedTopics.length) parts.push(`【必须避开的话题（历史表现差）】${learnings.bannedTopics.join('、')}`);
  if (!parts.length) return '';
  // influence scales how much of the learned guidance reaches the model.
  const strength = Math.max(0, Math.min(100, Number(influence)));
  if (strength === 0) return '';
  const budget = Math.max(80, Math.round(maxChars * (strength / 100)));
  let block = parts.join('\n\n');
  if (block.length > budget) block = `${block.slice(0, budget)}…`;
  return `\n\n（以下是根据历史爆款总结的参考套路，只借鉴选题方向与结构节奏；行文风格仍必须严格遵循上面的文风要求，不要照抄原句。）\n${block}`;
}

// Pull the first JSON object out of a model reply that may be wrapped in prose
// or fenced code blocks.
export function extractJsonObject(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

const LEARNING_ANALYST_PROMPT = `你是中文社交媒体的内容策略分析师。下面给出若干「高表现推文样本」。
请拆解它们为什么能获得高曝光/高互动，并提炼成可以照着写的套路。

只输出严格 JSON，不要任何解释文字，格式：
{"styleGuide":"150字以内的整体套路总结（选题角度+情绪+节奏+收尾方式）","winningTopics":["值得继续写的话题方向1","方向2"],"patterns":[{"title":"套路名称","structure":"这条推文的结构拆解（开头—中段—收尾）","hooks":["可复用的开头钩子或句式"]}]}
patterns 给 2~5 条。赢家话题要是「话题方向」而不是整句原文。`;

// Ask the local model to turn raw high-performing samples into reusable patterns.
export async function analyzeLearningSamples(samples, { model = 'gpt-6-luna', port = 3040, kind = 'manual', extra = '' } = {}) {
  const usable = (Array.isArray(samples) ? samples : [])
    .map(sample => (typeof sample === 'string' ? { text: sample } : sample) || {})
    .filter(sample => String(sample.text || '').trim())
    .slice(0, 40);
  if (!usable.length) throw new TypeError('没有可分析的样本内容');

  const rendered = usable.map((sample, index) => {
    const metrics = [
      sample.impressions !== undefined ? `曝光 ${sample.impressions}` : '',
      sample.likes !== undefined ? `点赞 ${sample.likes}` : '',
      sample.comments !== undefined ? `评论 ${sample.comments}` : '',
    ].filter(Boolean).join(' / ');
    return `${index + 1}. ${metrics ? `[${metrics}] ` : ''}${String(sample.text).trim().slice(0, 400)}`;
  }).join('\n');

  const prompt = `${LEARNING_ANALYST_PROMPT}\n\n样本来源：${kind}\n${extra ? `补充说明：${extra}\n` : ''}\n样本：\n${rendered}`;
  const reply = await generateTweetViaLmh(prompt, { model, port });
  const parsed = extractJsonObject(reply);
  if (!parsed || !isRecord(parsed)) throw new Error('大模型未返回可解析的学习结果，请重试');

  const patterns = (Array.isArray(parsed.patterns) ? parsed.patterns : [])
    .filter(isRecord)
    .map((item, index) => ({
      id: `pattern_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
      title: String(item.title || '未命名套路').slice(0, 200),
      structure: String(item.structure || '').slice(0, 2000),
      hooks: (Array.isArray(item.hooks) ? item.hooks : [])
        .map(hook => String(hook || '').trim().slice(0, 300))
        .filter(Boolean)
        .slice(0, 12),
      sample: String(usable[0]?.text || '').slice(0, 1000),
      source: kind,
      createdAt: new Date().toISOString(),
    }));

  return {
    styleGuide: String(parsed.styleGuide || '').slice(0, 4000),
    winningTopics: (Array.isArray(parsed.winningTopics) ? parsed.winningTopics : [])
      .map(topic => String(topic || '').trim().slice(0, 80))
      .filter(Boolean)
      .slice(0, 20),
    patterns,
  };
}

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function writePostQueue(data, queuePath = POST_QUEUE_PATH, { maxSize = 100 } = {}) {
  const dir = dirname(queuePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const payload = {
    queue: Array.isArray(data.queue) ? data.queue.slice(0, maxSize) : [],
    history: Array.isArray(data.history) ? data.history.slice(-100) : [],
    updatedAt: new Date().toISOString(),
  };
  const tempPath = `${queuePath}.tmp.${process.pid}.${Date.now()}`;
  writeFileSync(tempPath, JSON.stringify(payload, null, 2), { mode: 0o600 });
  renameSync(tempPath, queuePath);
  return payload;
}

// Read-modify-write helper used by every queue mutation so concurrent
// plugin actions and worker pops never lose each other's items.
export function mutatePostQueue(mutator, queuePath = POST_QUEUE_PATH, { maxSize = 100 } = {}) {
  return withQueueLock(() => {
    const current = readPostQueue(queuePath);
    const result = mutator(current);
    const payload = writePostQueue(current, queuePath, { maxSize });
    return { result, payload };
  }, queuePath);
}

// The hot-board screen rejects news headlines (crime, politics, disaster). The
// preferred topics are the opposite: they are directions for the account's own
// adult fiction, so a blanket "sexual suggestion" ban would empty the list.
// This rule set only removes the directions that belong to other subjects.
export const PREFERRED_TOPIC_SCREEN_INSTRUCTION = [
  '你是账号选题审核员。下面是从 X 榜单学到的「选题方向」，将来要用来写虚构的、成年人之间的原创内容。',
  '',
  '# 必须剔除（判断语义，不是字面）',
  '1. 明星、演员、歌手、偶像、网红、主持人等真实公众人物，及其私生活、作品比较、影视综艺、娱乐圈八卦',
  '2. 时政要闻、领导人、外交、军事、灾难事故、犯罪案件、疾病死亡、战争',
  '3. 复述真实历史事件、真实新闻人物、纯带货广告、教程类内容',
  '4. 涉及未成年人',
  '',
  '# 必须保留',
  '成年人之间的暧昧、关系拉扯、男女博弈、相亲与彩礼、亲密与边界表达、情感与欲望的转折、职场与日常、家庭与朋友。',
  '这类方向是账号要写的东西：即使出现「服务」「按摩」「亲密」「主动」等词，只要写的是虚构的成年人关系、且不涉及真实公众人物，就保留。',
  '',
  '# 待审方向',
  '{topics}',
  '',
  '只输出 JSON，不要解释、不要代码块：{"keep":[编号],"reject":[{"id":编号,"why":"简短原因"}]}',
].join('\n');

// The learned "winning topics" come from the X benchmark and can contain exactly
// the entertainment headlines the account does not want. They are screened with
// the same model rules as the hot board, so the preferred topics stay on brand.
export async function screenPreferredTopics(winners, filter = {}, { model = 'gpt-6-luna', port = 3040, timeoutMs = 45000 } = {}) {
  const list = (Array.isArray(winners) ? winners : []).map(topic => String(topic).trim()).filter(Boolean);
  if (!list.length) return { usable: [], rejected: [], error: '' };
  // Its own rule set: the hot-board one would reject every adult-fiction topic.
  const screenFilter = { ...filter, aiScreenInstruction: PREFERRED_TOPIC_SCREEN_INSTRUCTION };
  const screened = await aiScreenHotTopics(list, screenFilter, { model, port, batchSize: 20, maxTopics: 60, timeoutMs });
  const rejected = screened.rejected.map(item => ({ topic: item.topic, reason: item.reason }));
  const usable = screened.usable.filter(topic => !rejected.some(item => item.topic === topic));
  return { usable, rejected, error: screened.error || '' };
}

  // ---- preferred topic screening cache ----------------------------------------
// The learned "winning topics" come from the X benchmark and often contain the
// very entertainment headlines the account refuses. The hot board is screened by
// the model, so the preferred topics are screened the same way. The result is
// cached so a generation does not pay for a model call every time.
export const PREFERRED_TOPIC_CACHE = join(APP_HOME, 'Library/Application Support/XBotOpsConsole/preferred-topics.json');

export function readPreferredTopicCache(cachePath = PREFERRED_TOPIC_CACHE) {
  try {
    const parsed = JSON.parse(readFileSync(cachePath, 'utf8'));
    return {
      at: Number(parsed.at) || 0,
      source: Array.isArray(parsed.source) ? parsed.source.map(String) : [],
      usable: Array.isArray(parsed.usable) ? parsed.usable.map(String) : [],
      rejected: Array.isArray(parsed.rejected) ? parsed.rejected : [],
      error: String(parsed.error || ''),
    };
  } catch {
    return { at: '', source: [], usable: [], rejected: [], error: '' };
  }
}

export function writePreferredTopicCache(cache, cachePath = PREFERRED_TOPIC_CACHE) {
  try {
    mkdirSync(dirname(cachePath), { recursive: true, mode: 0o700 });
    writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`, { mode: 0o600 });
  } catch { /* the cache is an optimisation, never a blocker */ }
  return cache;
}

export function preferredTopicCacheFresh(cache, source, maxAgeHours = 24) {
  if (!cache || !Array.isArray(cache.source) || !Array.isArray(source)) return false;
  if (JSON.stringify(cache.source) !== JSON.stringify(source)) return false;
  const age = Date.now() / 1000 - Number(cache.at || 0);
  return Number.isFinite(age) && age >= 0 && age < maxAgeHours * 3600;
}

// ---- account persona --------------------------------------------------------
// The persona answers "who is speaking". It is injected into every generated
// text (posts, comments, replies) and the result is checked afterwards, because
// a model can still slip an identity detail past the instruction.
export function personaBlock(config = {}) {
  const persona = (config && config.persona) || {};
  if (persona.enabled === false) return '';
  const summary = String(persona.summary || '').trim();
  const rules = String(persona.rules || '').trim();
  if (!summary && !rules) return '';
  const parts = [];
  if (summary) parts.push(`【人设（只作约束，禁止写进正文）】${summary}`);
  parts.push('人设只是说话人的身份背景，用来约束能写什么、不能写什么，不是帖子的题材。'
    + '正文不要交代、复述或解释这个人设：不要写年龄、失业、职业、兼职、收入来源，'
    + '不要写「余年过…」「失业后…」「白昼…夜…」这类自我介绍。'
    + '身份、性别、年龄、职业、处境必须与人设一致，不得出现与人设矛盾的细节'
    + '（例如人设是中年失业者，就不能写自己正在上班、在读大学、当学生）。'
    + '叙述对象可以是别人，但说话的人始终是这个人。');
  if (rules) parts.push(rules);
  return `\n\n${parts.join('\n')}`;
}

// Identity details the narrator must not announce. The persona is a constraint,
// not the subject of the post.
const PERSONA_SELF_INTRO = ['失业', '失职', '兼职', '跑外卖', '送餐', '送膳', '足疗', '足肆', '旧书市', '旧书市场', '年过', '年近', '不惑', '知命'];

export function personaViolations(text, config = {}) {
  const persona = (config && config.persona) || {};
  if (persona.enabled === false) return [];
  const body = String(text || '');
  const hits = [];
  const forbidden = Array.isArray(persona.forbidden) ? persona.forbidden : [];
  for (const word of forbidden) {
    const needle = String(word || '').trim();
    if (needle && body.includes(needle)) hits.push(needle);
  }
  const summary = String(persona.summary || '');
  for (const word of PERSONA_SELF_INTRO) {
    if (!summary.includes(word)) continue;
    if (body.includes(word) && !hits.includes(word)) hits.push(word);
  }
  return hits;
}

// Generic local-model chat call: one prompt in, raw text out. Kept separate from
// the tweet generator so screening can ask for JSON without quote stripping.
export async function localModelChat(prompt, { model = 'gpt-6-luna', port = 3040, temperature = 0.2, maxTokens = null, timeoutMs = 30000 } = {}) {
  const configPath = join(APP_HOME, 'Library/Application Support/LocalModelHub/data/config.json');
  let apiKey = 'local-key';
  let targetPort = port;
  try {
    if (existsSync(configPath)) {
      const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
      if (cfg.port) targetPort = cfg.port;
      const key = cfg.clientKeys?.['business-default'] || cfg.clientKeys?.local;
      if (key) apiKey = key;
    }
  } catch { /* defaults are fine */ }

  const payload = { model: model || 'gpt-6-luna', messages: [{ role: 'user', content: prompt }], temperature };
  if (Number.isInteger(maxTokens) && maxTokens > 0) payload.max_tokens = maxTokens;
  const postData = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const { request } = http;
    const req = request({
      hostname: '127.0.0.1',
      port: targetPort,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(postData),
        'authorization': `Bearer ${apiKey}`,
      },
      timeout: timeoutMs,
    }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const reply = parsed?.choices?.[0]?.message?.content?.trim();
          if (reply) resolve(reply);
          else reject(new Error(parsed?.error?.message || '大模型未返回内容'));
        } catch (e) {
          reject(new Error(`解析大模型响应失败: ${e.message}`));
        }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error(`调用本地大模型超时 (${timeoutMs}ms)`)); });
    req.on('error', err => reject(err));
    req.write(postData);
    req.end();
  });
}

// ---- semantic screening of the hot board ------------------------------------
// Keyword matching only removes headlines that literally contain a banned word,
// so "娱乐圈" never matches "某顶流塌房". This asks the configured model to judge
// every headline against the operator's intent before anything is cached.
export const HOT_AI_DEFAULT_INSTRUCTION = [
  '你是热榜选题审核员。下面是从各平台抓来的候选话题，要为「古典文言短帖」账号挑出能用的选题。',
  '',
  '# 必须剔除（命中任意一条就剔除，判断语义而不是只看字面）',
  '1. 属于这些被禁用领域或其同义说法：{keywords}',
  '2. 命中这些避写话题：{banned}',
  '3. 时政官场、领导人、外交军事、灾难事故、犯罪案件、色情性暗示、疾病健康、宗教民族、明星娱乐八卦、体育赛事战报、纯带货广告',
  '4. 指向具体个人隐私、需要站队表态的争议',
  '',
  '# 优先保留',
  '生活观察、社会怪象、职场、消费与钱、科技与 AI、文化传统、教育、城市交通、饮食',
  '',
  '# 待审话题',
  '{topics}',
  '',
  '只输出 JSON，不要解释、不要代码块：{"keep":[编号],"reject":[{"id":编号,"why":"简短原因"}]}',
].join('\n');

export function buildHotScreenPrompt(topics, filter = {}) {
  const instruction = String(filter.aiScreenInstruction || '').trim() || HOT_AI_DEFAULT_INSTRUCTION;
  const keywords = (Array.isArray(filter.excludeKeywords) ? filter.excludeKeywords : []).slice(0, 200).join('、') || '（无）';
  const banned = (Array.isArray(filter.bannedTopics) ? filter.bannedTopics : []).slice(0, 100).join('、') || '（无）';
  const list = topics.map((topic, index) => `${index + 1}. ${topic}`).join('\n');
  return instruction
    .replaceAll('{keywords}', keywords)
    .replaceAll('{banned}', banned)
    .replaceAll('{topics}', list);
}

export function applyHotScreenVerdict(topics, verdict) {
  const list = Array.isArray(topics) ? topics : [];
  const keep = new Set();
  const rejected = [];
  const indexOf = value => {
    const index = Number(value) - 1;
    return Number.isInteger(index) && index >= 0 && index < list.length ? index : -1;
  };
  const keeps = Array.isArray(verdict?.keep) ? verdict.keep : [];
  const rejects = Array.isArray(verdict?.reject) ? verdict.reject : [];
  for (const value of keeps) {
    const index = indexOf(value);
    if (index >= 0) keep.add(index);
  }
  for (const item of rejects) {
    const index = indexOf(item && item.id);
    if (index < 0) continue;
    rejected.push({ topic: list[index], reason: `AI：${String(item.why || '不符合选题方向').slice(0, 40)}` });
  }
  const rejectedTopics = new Set(rejected.map(item => item.topic));
  // Whitelist when the model listed anything to keep, blacklist when it only
  // reported rejects (an all-reject reply must not empty the board by accident).
  // Only a *valid* keep id switches to whitelist mode; a hallucinated id must not
  // wipe the whole board.
  const whitelist = keep.size > 0;
  const usable = [];
  for (let index = 0; index < list.length; index += 1) {
    const topic = list[index];
    if (rejectedTopics.has(topic)) continue;
    if (whitelist && !keep.has(index)) continue;
    usable.push(topic);
  }
  return { usable, rejected };
}

export async function aiScreenHotTopics(topics, filter = {}, { model = 'gpt-6-luna', port = 3040, batchSize = 20, maxTopics = 80, timeoutMs = 60000, concurrency = 3 } = {}) {
  const source = Array.isArray(topics) ? topics.slice() : [];
  if (!source.length) return { usable: [], rejected: [], screened: 0, skipped: 0, error: '', batches: 0 };
  const screenLimit = Math.max(1, Number(maxTopics) || 80);
  const size = Math.max(5, Math.min(60, Number(batchSize) || 20));
  const screened = source.slice(0, screenLimit);
  const passthrough = source.slice(screened.length);
  const batches = [];
  for (let start = 0; start < screened.length; start += size) batches.push(screened.slice(start, start + size));
  const usable = [];
  const rejected = [];
  const errors = [];
  // Batches run in parallel: a 20-headline judgement takes ~15s, and a single
  // fetch can need several, so serialising them would stall the UI for minutes.
  const lanes = new Array(Math.max(1, Math.min(6, Number(concurrency) || 3))).fill(0).map(() => []);
  batches.forEach((batch, index) => lanes[index % lanes.length].push(batch));
  const runBatch = async batch => {
    try {
      const reply = await localModelChat(buildHotScreenPrompt(batch, filter), {
        model, port, temperature: 0.1, maxTokens: 900, timeoutMs,
      });
      const verdict = extractJsonObject(reply);
      if (!verdict) throw new Error('模型没有返回 JSON');
      const applied = applyHotScreenVerdict(batch, verdict);
      usable.push(...applied.usable);
      rejected.push(...applied.rejected);
    } catch (err) {
      // Never block a fetch: this batch keeps the keyword result.
      errors.push(String(err?.message || err).slice(0, 120));
      usable.push(...batch);
    }
  };
  await Promise.all(lanes.map(async lane => { for (const batch of lane) await runBatch(batch); }));
  return {
    usable: [...usable, ...passthrough],
    rejected,
    screened: screened.length,
    skipped: passthrough.length,
    error: errors.length ? `${errors.length}/${batches.length} 批失败：${errors[0]}` : '',
    batches: batches.length,
  };
}

export async function generateTweetViaLmh(prompt, { model = 'gpt-6-luna', port = 3040 } = {}) {
  const reply = await localModelChat(prompt, { model, port, temperature: 0.75 });
  return reply.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '');
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
    // Words that make the worker skip a post entirely.
    skipKeywords: [],
    extraFinanceKeywords: [],
    minLength: 8,
    maxLength: 60,
  },
  replySettings: {
    model: '',
    customPrompt: '',
    // Built-in prompt fragments, surfaced in the UI so they can be edited.
    lengthRule: '10到28字。结尾不要用“。”或“.”。可用省略号、感叹号、一个表情、文言语气词，或者不加标点。',
    cannedForbidden: '禁止“评论区卧虎藏龙”“感谢分享”“支持一下”“同谋共济”“投书密语”这类套话，禁止方括号表情。',
    thinReplyExtra: [],
    forbiddenPhrases: [],
    // Replaces the built-in persona sentence when non-empty.
    personaOverride: '',
    // Extra phrases that mean "stop replying to me".
    stopKeywords: [],
  },
  timing: { commentWindowHours: 6, mentionWindowHours: 12, quietHoursStart: 0, quietHoursEnd: 7, fullStopStart: 1, fullStopEnd: 6, publishMinSeconds: 30, publishMaxSeconds: 100, replyMinSeconds: 0, replyMaxSeconds: 0, authorCooldownSeconds: 1800, postingWorkMinutes: 20, postingRestMinutes: 5, rateLimitMinutes: 5, rateLimitLongMinutes: 15 },
  tiers: [
    { id: 'apex', label: '最高优先级', handles: ['4ggug'], rounds: 30, replyStyle: '' },
    { id: 'tier1', label: '优先级 1', handles: ['bottlecap8699', 'nguynbanph', 'mrchen1998', 'maiga23698'], rounds: 20, replyStyle: '' },
    { id: 'tier2', label: '优先级 2', handles: ['mzixioxio155612', 'xiaolikpo', 'lxl1818', 'hanxue9xue', 'kimmykimol', 'katherine1198', 'hnrr163487', '7gongg', 'lucia000000001', 'litteyyyue1229', 'pbftzogtmp43068', 'hhedy666', 'bmxdawang111', 'gqing0930', 'yoyomao9', 'hpyhh7', 'aquarius_0909', 'xzmokk', 'mia_linh01', 'wrt_win', 'xiaoyezimama'], rounds: 10, replyStyle: '' },
    { id: 'tier3', label: '优先级 3', handles: ['sujing110', 'hamy8998', 'jojojo624824460', 'nz3219798'], rounds: 5, replyStyle: '' },
    { id: 'tier4', label: '优先级 4', handles: ['dmx_flame', 'julsix2333'], rounds: 4, replyStyle: '' },
    { id: 'other', label: '其他用户', handles: [], rounds: 3, replyStyle: '' },
  ],
  specialPersons: {
    // Operator-managed special people: add, edit and remove freely.
    list: [
      { id: 'apex', label: 'Apex 专属对象', handle: '4ggug', enabled: true, replyStyle: '聊两性，撩骚' },
      { id: 'yijing', label: '易经专属对象', handle: 'mrchen1998', enabled: true, replyStyle: '遇到易经的帖子专门跟它聊易经' },
    ],
    // Legacy mirrors of the two built-in rows: worker tier logic still reads
    // these keys, so a save keeps them in sync with the list above.
    apex: { handle: '4ggug', enabled: true, rules: { careEnabled: false }, replyStyle: '聊两性，撩骚' },
    yijing: { handle: 'mrchen1998', enabled: true, replyStyle: '遇到易经的帖子专门跟它聊易经' },
    skipReplyHandles: ['grok'],
  },
  specialReplies: { asksAi: '若被问及是否为 AI，请如实回答。', asksToStop: '若对方要求停止，请勿继续回复该讨论串。', care: '礼貌回应并围绕话题。', affection: '尊重回应，不诱导私下联系。', namedAddress: '以中性方式回应称呼。', daddy: '拒绝不合适的亲属角色扮演。', imperialTitle: '不宣称现实中的权力或身份。', vernacular: '仅在明确请求时翻译。' },
  rules: { skipFinanceComments: true, skipGrokMentions: false, doNotReplyAfterStopRequest: true, keepSensitiveKeyOutOfUi: true, mentionPauseDuringQuiet: true, mentionPauseDuringFullStop: true },

// The account persona constrains who is speaking in every generated text:
  // posts, comments and replies must stay inside this identity.
  persona: {
    enabled: false,
    summary: '',
    forbidden: [],
    rules: '',
  },
  postSettings: {
    enabled: true,
    intervalMinutes: 180,
    intervalMode: 'fixed',
    intervalSeconds: 180,
    // Random interval range in seconds (0 = use the fixed intervalSeconds).
    intervalMinSeconds: 480,
    intervalMaxSeconds: 600,
    queueBatchSize: 10,
    queueLowThreshold: 3,
    queueAutoRefill: true,
    queueMaxSize: 100,
    // Post shape from the writer rules: fixed line count, length, ending style.
    format: {
      lineCount: 3,
      minChars: 30,
      maxChars: 60,
      closingPrefix: '尔',
      requireClosingQuestion: true,
      forbidColloquial: ['的', '了', '吗', '呢', '吧', '啊', '我们', '你们', '这个', '那个', '没有', '什么', '怎么', '是不是', '觉得', '一下', '就是'],
      softOpeners: ['茶', '灯', '天气', '衣服', '眼神', '走路', '月色', '帘', '香囊', '玉佩'],
      bannedPatterns: ['君不见', '诸君', '敢问诸君', '君以为然', '敢问', '《X赋》', '赋体'],
      hardBottomLines: '只写虚构、自愿的成年人；不写未成年人、露骨性行为过程、生殖器、裸体细节；不写胁迫、偷拍、灌醉/下药；不违法、不仇恨、不歧视。',
    },
    // Every wording fragment of the style prompt lives here so nothing is fixed.
    style: {
      persona: '用浅显文言写。自称余/吾，称对方君/卿/尔，不用我/你作主语。写虚构成年人之间自愿的暧昧、男女博弈、相亲彩礼、渣男渣女，或骂一件具体的事。',
      line1Rule: '第 1 行：直接扔出冲突、欲望或暧昧，动作具体；禁止茶、灯、天气、衣物、眼神、走路之类软铺垫。',
      line2Rule: '第 2 行：立刻揭底或反转，把矛盾推到明面。',
      line3Rule: '第 3 行：以「{prefix}」开头的具体提问，并以问号结尾。',
      languageRule: '浅显文言，陌生人一读就懂；不写骈赋、不堆僻字；多用曰/之/乎/也/矣/者/焉/何/乃/亦/其。',
      hotRewriteRule: '借这个话题的热度写一条原创推文：可以评论、反讽、借题发挥或抒发感怀；不要照搬新闻标题，不要写成新闻播报。',
      // Used when 行数 = 自动, so the shape still has a beginning and an end.
      autoLineRule: '开头直接扔出冲突、欲望或暧昧；随后揭底或反转；结尾给出以「{prefix}」开头的具体提问。行数随内容自然安排，一句一行，不要写成整段。',
      extraRules: '',
    },
    // Reuse guard: no long verbatim run and no repeated skeleton.
    dedupe: { maxOverlapChars: 8, recentPosts: 50, skeletonCooldownHours: 48 },
    // Political topics are capped per day and per event.
    politicalCap: {
      dailyMax: 3,
      perEventMax: 1,
      keywords: ['政治', '主席', '总统', '总理', '政府', '中央', '国务院', '人大', '政协', '部长', '书记', '外交', '选战', '制裁'],
    },
    // At least this share of a batch should ride a trending topic.
    hotTopicShareMinPercent: 33,
    // Topics the operator never wants posted about, regardless of learning.
    manualBannedTopics: [],
    // Rules that decide which trending topics are safe and on-brand to reuse.
    hotFilter: {
      // Operator-removed headlines: they come back on every fetch, so the skip
      // list lives in config and survives re-fetching.
      excludedTopics: [],
      // Semantic screening before the cache is written: keyword matching only
      // catches literal words, so a model judges each headline against intent.
      aiScreen: true,
      aiScreenModel: '',
      aiScreenMaxTopics: 160,
      aiScreenInstruction: '',
      aiScreenBatchSize: 20,
      minLength: 4,
      maxLength: 50,
      excludeKeywords: [
        // 伤亡与灾祸
        '死', '尸', '凶', '杀', '命案', '碎尸', '遇难', '身亡', '去世', '病逝', '猝死',
        '坠', '车祸', '事故', '地震', '洪水', '火灾', '台风', '伤亡', '失踪', '自杀', '抑郁',
        '爆炸', '爆雷', '投毒', '中毒', '枪击', '枪', '炸',
        // 法纪与政务
        '被查', '落马', '投案', '纪委', '反腐', '违纪', '正风肃纪', '巡视', '双开',
        '逮捕', '判刑', '入狱', '警方', '通报', '谣言', '维权', '抗议', '讨薪', '信访',
        // 时政与官方口径
        '中央', '国务院', '国家机关', '党组', '书记', '部长', '局长', '省委', '市委', '县委',
        '政府', '政协', '人大', '会议', '部署', '印发', '方针', '政策', '改革', '试点',
        '外交', '中美', '中俄', '第一方阵', '领导人', '重要讲话',
        // 疾病与医疗
        '癌', '确诊', '疫情', '病例', '传染',
        // 成人内容
        '色情', '裸', '性侵', '强奸', '约炮',
        // 战争与国际冲突
        '战争', '袭击', '制裁', '冲突',
        // English
        'dead', 'death', 'kill', 'murder', 'crash', 'war', 'attack', 'sanction', 'suicide',
      ],
      preferKeywords: [],
    },
    // How many drafts of each batch are rewrites of a trending topic (0 = off).
    hotTopicPerBatch: 2,
    // Hard format rule: one sentence per line, never a single block of text.
    oneSentencePerLine: true,
    // Take a break after this many posts (0 disables the counter-based rest).
    restEveryPosts: 8,
    restMinutes: 3,
    // How strongly learned rules are injected (0 = prompt only, 100 = full).
    learningInfluence: 100,
    // Weighted content themes. Weights must add up to 100. Empty = disabled.
    topicMix: [],
    // Post style windows, in Beijing time. The first window containing the hour wins.
    styleSchedule: [
      { id: 'slot-0', label: '楚辞', startHour: 0, endHour: 1, prompt: '用楚辞体（骚体）写：多用「兮」字句、香草美人意象、上下求索的磅礴气势，句式长短错落。' },
      { id: 'slot-1', label: '英文', startHour: 1, endHour: 7, prompt: 'Write in English. Keep the persona of a playful ancient Chinese sovereign, witty and self-deprecating, 30-90 words, no profanity.' },
      { id: 'slot-2', label: '文言文', startHour: 7, endHour: 24, prompt: '用文言文／浅近文言，古奥幽默，自称周天子、姬霸或夫子，可夹杂诗词意象，字数30-90字。' },
    ],
    topics: ['文言雅趣', '周朝掌故', '易经随笔', '日常感悟'],
    model: '',
    customPrompt: '你在推特(X)上用浅显文言发一条原创推文。自称余/吾，称对方君/卿/尔，不用我/你作主语，不用白话虚词。写虚构成年人之间自愿的暧昧、男女博弈、相亲彩礼、渣男渣女，或骂一件具体的事。陌生人一读就懂，不写骈赋、不堆僻字。',
  },
  cruiseSettings: {
    enabled: true,
    dailyTargetCount: 50,
    crawlFollowing: true,
    crawlFollowers: true,
    interactionCooldownHours: 48,
    tierSweepHours: 6,
    commentsPerProfile: 1,
    // How many posts of a visited profile to like. 0 disables liking.
    likesPerProfile: 0,
    autoVisitInvited: true,
    model: '',
    customPrompt: '你在推特(X)上用周天子姬霸的人设回复好友主页的最新推文。\n要求：用文言文或微言大义轻幽默回应对方的话题，亲切称呼对方，不要任何问句，不要现代粗俗脏话，字数在12到30字之间。直接输出纯文本。',
  },
  learningSettings: {
    enabled: true,
    autoLearn: true,
    checkIntervalMinutes: 360,
    minAgeHours: 12,
    historyHours: 36,
    minImpressions: 1000,
    minComments: 3,
    minLikes: 10,
    maxSamples: 20,
    injectIntoPost: true,
    benchmarkUrl: 'https://xbangdan.com/posts/',
    model: '',
    // Hot-search boards mined for trending topics.
    trendSources: [
      { id: 'baidu', label: '百度热搜', url: 'https://top.baidu.com/board?tab=realtime', enabled: true, cookie: '' },
      { id: 'toutiao', label: '头条热榜', url: 'https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc', enabled: true, cookie: '' },
      { id: 'weibo', label: '微博热搜', url: 'https://weibo.com/ajax/side/hotSearch', enabled: false, cookie: '' },
      { id: 'zhihu', label: '知乎热榜', url: 'https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=20', enabled: false, cookie: '' },
      { id: 'douyin', label: '抖音热榜', url: 'https://www.douyin.com/aweme/v1/web/hot/search/list/', enabled: false, cookie: '' },
      { id: 'xiaohongshu', label: '小红书热榜', url: 'https://www.xiaohongshu.com/api/sns/v1/search/hot_list', enabled: false, cookie: '' },
    ],
  },
});

const TIMING_BOUNDS = Object.freeze({
  commentWindowHours: [1, 48], mentionWindowHours: [1, 72], quietHoursStart: [0, 23], quietHoursEnd: [0, 24],
  fullStopStart: [0, 23], fullStopEnd: [0, 24], publishMinSeconds: [5, 3600], publishMaxSeconds: [5, 3600], replyMinSeconds: [0, 3600], replyMaxSeconds: [0, 3600],
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

// Chrome profiles live under Application Support. They used to sit in /tmp, which
// macOS clears on reboot, so every reboot silently logged the workers out.
export const CHROME_PROFILE_ROOT = join(homedir(), 'Library/Application Support/XBotOpsConsole/chrome');

export function chromeProfileFor(key, target = {}) {
  if (target && typeof target.chromeProfile === 'string' && target.chromeProfile.trim()) return target.chromeProfile.trim();
  if (key === 'reply') {
    const legacy = join(homedir(), 'Library/Application Support/CursorXRunner/ChromeProfile');
    if (existsSync(legacy)) return legacy;
  }
  return join(CHROME_PROFILE_ROOT, key);
}

// ---- X session sharing over CDP --------------------------------------------
// X keeps the login in two cookies (auth_token + ct0). They live in each Chrome
// profile, so a brand-new profile (or one whose /tmp profile was wiped) is signed
// out. Rather than asking the operator to log in four times, copy the session from
// whichever browser is already signed in. Cookie values are never logged or
// returned to the UI — only counts and names of what moved.
const X_COOKIE_DOMAIN = /(^|\.)x\.com$/i;
export const LOGIN_MARKER_JS = "Boolean(document.querySelector('[data-testid=\"SideNav_AccountSwitcher_Button\"]'))";

export function xSessionCookies(cookies) {
  const list = Array.isArray(cookies) ? cookies : [];
  return list.filter(item => item && typeof item.name === 'string' && item.name && X_COOKIE_DOMAIN.test(String(item.domain || '')));
}

export function cdpCookieParams(cookie) {
  const domain = String(cookie.domain || '.x.com');
  const sameSite = String(cookie.sameSite || '');
  const params = {
    name: String(cookie.name),
    value: String(cookie.value ?? ''),
    domain: domain.startsWith('.') ? domain : `.${domain}`,
    path: String(cookie.path || '/'),
    secure: cookie.secure !== false,
    httpOnly: Boolean(cookie.httpOnly),
    sameSite: sameSite && sameSite !== 'Unspecified' ? sameSite : 'Lax',
  };
  const expires = Number(cookie.expires);
  if (Number.isFinite(expires) && expires > 0) params.expires = expires;
  return params;
}

// Minimal CDP client on Node's built-in WebSocket: one page, one promise chain.
export async function withCdpPage(port, fn, { timeoutMs = 20000 } = {}) {
  const numericPort = Number(port);
  if (!Number.isInteger(numericPort) || numericPort <= 0) throw new Error(`无效的调试端口：${port}`);
  let tabs;
  try {
    tabs = await (await fetch(`http://127.0.0.1:${numericPort}/json/list`, { cache: 'no-store' })).json();
  } catch (error) {
    throw new Error(`端口 ${numericPort} 连不上（Chrome 没起来？）：${String(error?.message || error).slice(0, 120)}`);
  }
  const page = (Array.isArray(tabs) ? tabs : []).find(item => item && item.type === 'page' && item.webSocketDebuggerUrl);
  if (!page) throw new Error(`端口 ${numericPort} 上没有可操作的页面`);
  if (typeof WebSocket !== 'function') throw new Error('当前 Node 不支持 WebSocket');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('连接调试页面超时')), timeoutMs);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
    ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('连接调试页面失败')); }, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener('message', event => {
    let message;
    try { message = JSON.parse(typeof event.data === 'string' ? event.data : String(event.data)); } catch { return; }
    const waiter = message && message.id ? pending.get(message.id) : null;
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(new Error(message.error.message || 'CDP 调用失败'));
    else waiter.resolve(message.result);
  });
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP ${method} 超时`)); }, timeoutMs);
    pending.set(id, {
      resolve: value => { clearTimeout(timer); resolve(value); },
      reject: error => { clearTimeout(timer); reject(error); },
    });
    ws.send(JSON.stringify({ id, method, params }));
  });
  try {
    return await fn(call);
  } finally {
    try { ws.close(); } catch { /* already closed */ }
  }
}

export async function probeXLogin(port, { timeoutMs = 9000 } = {}) {
  return withCdpPage(port, async call => {
    const res = await call('Runtime.evaluate', {
      expression: `({url: location.href, marker: ${LOGIN_MARKER_JS}})`,
      returnByValue: true,
    });
    const value = (res && res.result && res.result.value) || {};
    return { loggedIn: Boolean(value.marker), url: String(value.url || '') };
  }, { timeoutMs });
}

export async function exportXSession(port) {
  const cookies = await withCdpPage(port, async call => {
    await call('Network.enable');
    const result = await call('Network.getAllCookies');
    return (result && result.cookies) || [];
  }, { timeoutMs: 15000 });
  return xSessionCookies(cookies);
}

export async function applyXSession(port, cookies) {
  return withCdpPage(port, async call => {
    await call('Network.enable');
    let set = 0;
    const failed = [];
    for (const cookie of cookies) {
      try {
        await call('Network.setCookie', cdpCookieParams(cookie));
        set += 1;
      } catch {
        failed.push(String(cookie.name));
      }
    }
    try { await call('Page.navigate', { url: 'https://x.com/home' }); } catch { /* page may already be there */ }
    return { set, failed };
  }, { timeoutMs: 40000 });
}

export function chromeLauncherPath(target = {}) {
  if (typeof target.chromeLauncher === 'string' && target.chromeLauncher.trim()) {
    return existsSync(target.chromeLauncher.trim()) ? target.chromeLauncher.trim() : '';
  }
  const dir = target.dir ? String(target.dir) : '';
  const scriptDir = target.worker ? dirname(String(target.worker)) : '';
  const candidates = [
    scriptDir ? join(scriptDir, 'chrome_launcher.py') : '',
    dir ? join(dir, 'chrome_launcher.py') : '',
    dir ? join(dir, 'scripts', 'chrome_launcher.py') : '',
  ].filter(Boolean);
  for (const candidate of candidates) if (existsSync(candidate)) return candidate;
  return '';
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
// Free space on the volume that holds the workspace, in bytes.
export function diskFreeBytes() {
  try {
    const out = execFileSync('/bin/df', ['-k', homedir()], { encoding: 'utf8', timeout: 5000 });
    const line = out.trim().split('\n').pop() || '';
    const columns = line.split(/\s+/);
    const available = Number(columns[3]);
    return Number.isFinite(available) ? available * 1024 : null;
  } catch {
    return null;
  }
}

export function readCacheCleanupState() {
  try {
    return JSON.parse(readFileSync(CACHE_CLEANUP_STATE, 'utf8'));
  } catch {
    return null;
  }
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
    const replyKeys = ['rateLimitMinutes', 'rateLimitLongMinutes', 'postingWorkMinutes', 'postingRestMinutes', 'mentionWindowHours', 'publishMinSeconds', 'publishMaxSeconds', 'replyMinSeconds', 'replyMaxSeconds', 'quietHoursStart', 'quietHoursEnd', 'fullStopStart', 'fullStopEnd'];
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
  {
    const people = copy.specialPersons;
    if (people.list === undefined) {
      // Older configs only had apex/yijing; surface them as editable rows.
      people.list = [];
      for (const key of ['apex', 'yijing']) {
        const legacy = people[key];
        if (!isRecord(legacy) || typeof legacy.handle !== 'string' || !legacy.handle.trim()) continue;
        people.list.push({
          id: key,
          label: key === 'apex' ? 'Apex 专属对象' : (key === 'yijing' ? '易经专属对象' : key),
          handle: legacy.handle.trim().toLowerCase(),
          enabled: legacy.enabled !== false,
          replyStyle: typeof legacy.replyStyle === 'string' ? legacy.replyStyle : '',
        });
      }
    }
    if (!Array.isArray(people.list) || people.list.length > 50) throw new TypeError('特例人物最多 50 个');
    const seenIds = new Set();
    const seenHandles = new Set();
    people.list = people.list.map((entry, index) => {
      if (!isRecord(entry)) throw new TypeError('特例人物条目无效');
      const handle = String(entry.handle || '').trim().replace(/^@/, '').toLowerCase();
      if (!/^[a-z0-9_]{1,15}$/.test(handle)) throw new TypeError('特例人物账号名只能是 1~15 位字母、数字或下划线');
      if (seenHandles.has(handle)) throw new TypeError(`特例人物账号 @${handle} 重复`);
      seenHandles.add(handle);
      let id = String(entry.id || '').trim() || `sp_${index}`;
      if (seenIds.has(id)) id = `sp_${index}_${handle}`;
      seenIds.add(id);
      const replyStyle = String(entry.replyStyle || '');
      if (replyStyle.length > 4000) throw new TypeError('特例人物专属规则不能超过 4000 字');
      if (typeof entry.enabled !== 'boolean') throw new TypeError('特例人物启用状态无效');
      return { id, label: String(entry.label || handle).slice(0, 40), handle, enabled: entry.enabled, replyStyle };
    });
  }
  if (copy.commentSettings !== undefined) {
    if (!isRecord(copy.commentSettings) || (copy.commentSettings.model !== undefined && typeof copy.commentSettings.model !== 'string') || (copy.commentSettings.customPrompt !== undefined && typeof copy.commentSettings.customPrompt !== 'string')) throw new TypeError('评论个性化设置无效');
    if (copy.commentSettings.skipKeywords !== undefined) {
      if (!Array.isArray(copy.commentSettings.skipKeywords) || copy.commentSettings.skipKeywords.length > 500) throw new TypeError('评论跳过关键词名单无效');
      copy.commentSettings.skipKeywords = [...new Set(copy.commentSettings.skipKeywords.map(item => String(item || '').trim()).filter(Boolean))];
    }
    if (copy.commentSettings.extraFinanceKeywords !== undefined) {
      if (!Array.isArray(copy.commentSettings.extraFinanceKeywords) || copy.commentSettings.extraFinanceKeywords.length > 500) throw new TypeError('追加财经关键词名单无效');
      copy.commentSettings.extraFinanceKeywords = [...new Set(copy.commentSettings.extraFinanceKeywords.map(item => String(item || '').trim()).filter(Boolean))];
    }
    for (const key of ['minLength', 'maxLength']) {
      if (copy.commentSettings[key] === undefined) continue;
      const value = Number(copy.commentSettings[key]);
      if (!Number.isInteger(value) || value < 1 || value > 500) throw new TypeError('评论文本长度需为 1~500 的整数');
      copy.commentSettings[key] = value;
    }
    if (copy.commentSettings.minLength > copy.commentSettings.maxLength) throw new TypeError('评论最短长度不能大于最长长度');
  }
  if (copy.replySettings !== undefined) {
    if (!isRecord(copy.replySettings) || (copy.replySettings.model !== undefined && typeof copy.replySettings.model !== 'string') || (copy.replySettings.customPrompt !== undefined && typeof copy.replySettings.customPrompt !== 'string')) throw new TypeError('回复个性化设置无效');
    if (copy.replySettings.personaOverride !== undefined && (typeof copy.replySettings.personaOverride !== 'string' || copy.replySettings.personaOverride.length > 2000)) throw new TypeError('人设覆盖文本无效');
    if (copy.replySettings.stopKeywords !== undefined) {
      if (!Array.isArray(copy.replySettings.stopKeywords) || copy.replySettings.stopKeywords.length > 200) throw new TypeError('停止回复关键词名单无效');
      copy.replySettings.stopKeywords = [...new Set(copy.replySettings.stopKeywords.map(item => String(item || '').trim()).filter(Boolean))];
    }
    for (const key of ['lengthRule', 'cannedForbidden']) {
      if (copy.replySettings[key] !== undefined && (typeof copy.replySettings[key] !== 'string' || copy.replySettings[key].length > 2000)) throw new TypeError('回复内置提示词片段无效');
    }
    for (const key of ['thinReplyExtra', 'forbiddenPhrases']) {
      if (copy.replySettings[key] !== undefined) {
        if (!Array.isArray(copy.replySettings[key]) || copy.replySettings[key].length > 200) throw new TypeError('回复规则名单无效');
        copy.replySettings[key] = [...new Set(copy.replySettings[key].map(item => String(item || '').trim()).filter(Boolean))];
      }
    }
  }
  if (copy.persona !== undefined) {
    if (!isRecord(copy.persona)) throw new TypeError('人设配置无效');
    if (copy.persona.enabled !== undefined && typeof copy.persona.enabled !== 'boolean') throw new TypeError('人设开关无效');
    if (copy.persona.summary !== undefined) {
      if (typeof copy.persona.summary !== 'string' || copy.persona.summary.length > 500) throw new TypeError('人设简介不能超过 500 字');
    }
    if (copy.persona.rules !== undefined) {
      if (typeof copy.persona.rules !== 'string' || copy.persona.rules.length > 1000) throw new TypeError('人设附加规则不能超过 1000 字');
    }
    if (copy.persona.forbidden !== undefined) {
      if (!Array.isArray(copy.persona.forbidden) || copy.persona.forbidden.length > 200) throw new TypeError('人设禁用词名单无效');
      copy.persona.forbidden = [...new Set(copy.persona.forbidden.map(item => String(item || '').trim()).filter(Boolean))];
      for (const item of copy.persona.forbidden) if (item.length > 40) throw new TypeError('单条人设禁用词不能超过 40 字');
    }
  }
  if (copy.postSettings !== undefined) {
    if (!isRecord(copy.postSettings) || typeof copy.postSettings.enabled !== 'boolean') throw new TypeError('发帖设置无效');
    if (copy.postSettings.intervalMinutes !== undefined && (!Number.isInteger(copy.postSettings.intervalMinutes) || copy.postSettings.intervalMinutes < 1 || copy.postSettings.intervalMinutes > 1440)) throw new TypeError('发帖分钟间隔设置无效');
    if (copy.postSettings.intervalSeconds !== undefined && (!Number.isInteger(copy.postSettings.intervalSeconds) || copy.postSettings.intervalSeconds < 30 || copy.postSettings.intervalSeconds > 86400)) throw new TypeError('发帖秒级间隔设置无效');
    if (copy.postSettings.customPrompt !== undefined && typeof copy.postSettings.customPrompt !== 'string') throw new TypeError('发帖提示词无效');
    if (copy.postSettings.model !== undefined && typeof copy.postSettings.model !== 'string') throw new TypeError('发帖模型设置无效');
    if (copy.postSettings.topics !== undefined && !Array.isArray(copy.postSettings.topics)) throw new TypeError('发帖灵感池设置无效');
    if (copy.postSettings.intervalMode !== undefined && !['fixed', 'random'].includes(copy.postSettings.intervalMode)) throw new TypeError('发帖间隔模式只能是固定或随机');
    if (copy.postSettings.intervalMinSeconds !== undefined) {
      const min = Number(copy.postSettings.intervalMinSeconds);
      if (!Number.isInteger(min) || min < 0 || min > 86400) throw new TypeError('随机间隔下限需为 0~86400 秒');
      copy.postSettings.intervalMinSeconds = min;
    }
    if (copy.postSettings.intervalMaxSeconds !== undefined) {
      const max = Number(copy.postSettings.intervalMaxSeconds);
      if (!Number.isInteger(max) || max < 0 || max > 86400) throw new TypeError('随机间隔上限需为 0~86400 秒');
      copy.postSettings.intervalMaxSeconds = max;
    }
    const intMin = copy.postSettings.intervalMinSeconds ?? 0;
    const intMax = copy.postSettings.intervalMaxSeconds ?? 0;
    if ((intMin > 0 || intMax > 0) && intMin < 30) throw new TypeError('随机间隔下限至少 30 秒');
    if (intMin > 0 && intMax > 0 && intMax < intMin) throw new TypeError('随机间隔上限必须大于或等于下限');
    if (copy.postSettings.intervalMode === undefined) {
      copy.postSettings.intervalMode = (intMin > 0 || intMax > 0) ? 'random' : 'fixed';
    }
    if (copy.postSettings.queueBatchSize !== undefined) {
      const batch = Number(copy.postSettings.queueBatchSize);
      if (!Number.isInteger(batch) || batch < 1 || batch > 50) throw new TypeError('每批生成条数需为 1~50 之间的整数');
      copy.postSettings.queueBatchSize = batch;
    }
    if (copy.postSettings.queueLowThreshold !== undefined) {
      const threshold = Number(copy.postSettings.queueLowThreshold);
      if (!Number.isInteger(threshold) || threshold < 0 || threshold > 50) throw new TypeError('自动补仓阈值需为 0~50 之间的整数');
      copy.postSettings.queueLowThreshold = threshold;
    }
    if (copy.postSettings.queueMaxSize !== undefined) {
      const maxSize = Number(copy.postSettings.queueMaxSize);
      if (!Number.isInteger(maxSize) || maxSize < 1 || maxSize > 200) throw new TypeError('队列容量上限需为 1~200 之间的整数');
      copy.postSettings.queueMaxSize = maxSize;
    }
    if (copy.postSettings.queueAutoRefill !== undefined && typeof copy.postSettings.queueAutoRefill !== 'boolean') throw new TypeError('自动补仓开关无效');
    if (copy.postSettings.oneSentencePerLine !== undefined && typeof copy.postSettings.oneSentencePerLine !== 'boolean') throw new TypeError('一句一行开关无效');
    if (copy.postSettings.format !== undefined) {
      const fmt = copy.postSettings.format;
      if (!isRecord(fmt)) throw new TypeError('发帖结构设置无效');
      for (const key of ['lineCount', 'minChars', 'maxChars']) {
        if (fmt[key] === undefined) continue;
        const value = Number(fmt[key]);
        if (!Number.isInteger(value) || value < 0 || value > 500) throw new TypeError('发帖结构数值需为非负整数');
        fmt[key] = value;
      }
      if (fmt.minChars < 1) throw new TypeError('汉字下限至少为 1');
      if (fmt.lineCount > 12) throw new TypeError('发帖行数不能超过 12 行');
      if (fmt.minChars > fmt.maxChars) throw new TypeError('字数下限不能大于上限');
      if (fmt.closingPrefix !== undefined && (typeof fmt.closingPrefix !== 'string' || fmt.closingPrefix.length > 10)) throw new TypeError('结尾引导字无效');
      for (const key of ['forbidColloquial', 'softOpeners', 'bannedPatterns']) {
        if (fmt[key] === undefined) continue;
        if (!Array.isArray(fmt[key]) || fmt[key].length > 200) throw new TypeError('发帖结构词表无效');
        fmt[key] = [...new Set(fmt[key].map(item => String(item || '').trim()).filter(Boolean))];
      }
      if (fmt.hardBottomLines !== undefined && (typeof fmt.hardBottomLines !== 'string' || fmt.hardBottomLines.length > 2000)) throw new TypeError('硬底线文本无效');
      if (fmt.requireClosingQuestion !== undefined && typeof fmt.requireClosingQuestion !== 'boolean') throw new TypeError('结尾提问开关无效');
    }
    if (copy.postSettings.style !== undefined) {
      const style = copy.postSettings.style;
      if (!isRecord(style)) throw new TypeError('文风设置无效');
      for (const key of ['persona', 'line1Rule', 'line2Rule', 'line3Rule', 'languageRule', 'hotRewriteRule', 'extraRules', 'autoLineRule']) {
        if (style[key] === undefined) continue;
        if (typeof style[key] !== 'string' || style[key].length > 4000) throw new TypeError(`文风片段 ${key} 无效`);
      }
    }
    if (copy.postSettings.dedupe !== undefined) {
      const dedupe = copy.postSettings.dedupe;
      if (!isRecord(dedupe)) throw new TypeError('去重设置无效');
      for (const key of ['maxOverlapChars', 'recentPosts', 'skeletonCooldownHours']) {
        if (dedupe[key] === undefined) continue;
        const value = Number(dedupe[key]);
        if (!Number.isInteger(value) || value < 0 || value > 10000) throw new TypeError('去重数值需为非负整数');
        dedupe[key] = value;
      }
    }
    if (copy.postSettings.politicalCap !== undefined) {
      const cap = copy.postSettings.politicalCap;
      if (!isRecord(cap)) throw new TypeError('政治话题上限设置无效');
      for (const key of ['dailyMax', 'perEventMax']) {
        if (cap[key] === undefined) continue;
        const value = Number(cap[key]);
        if (!Number.isInteger(value) || value < 0 || value > 50) throw new TypeError('政治话题上限需为 0~50 的整数');
        cap[key] = value;
      }
      if (cap.keywords !== undefined) {
        if (!Array.isArray(cap.keywords) || cap.keywords.length > 200) throw new TypeError('政治关键词名单无效');
        cap.keywords = [...new Set(cap.keywords.map(item => String(item || '').trim()).filter(Boolean))];
      }
    }
    if (copy.postSettings.hotTopicShareMinPercent !== undefined) {
      const percent = Number(copy.postSettings.hotTopicShareMinPercent);
      if (!Number.isInteger(percent) || percent < 0 || percent > 100) throw new TypeError('热点占比需为 0~100 的整数');
      copy.postSettings.hotTopicShareMinPercent = percent;
    }
    if (copy.postSettings.manualBannedTopics !== undefined) {
      if (!Array.isArray(copy.postSettings.manualBannedTopics) || copy.postSettings.manualBannedTopics.length > 200) throw new TypeError('手动避写话题最多 200 条');
      copy.postSettings.manualBannedTopics = [...new Set(
        copy.postSettings.manualBannedTopics.map(item => String(item || '').trim()).filter(Boolean),
      )];
      for (const item of copy.postSettings.manualBannedTopics) {
        if (item.length > 80) throw new TypeError('单条避写话题不能超过 80 字');
      }
    }
    if (copy.postSettings.hotFilter !== undefined) {
      const filter = copy.postSettings.hotFilter;
      if (!isRecord(filter)) throw new TypeError('热榜筛选规则无效');
      if (filter.aiScreen !== undefined && typeof filter.aiScreen !== 'boolean') throw new TypeError('热榜 AI 筛选开关无效');
      if (filter.aiScreenModel !== undefined) {
        if (typeof filter.aiScreenModel !== 'string' || filter.aiScreenModel.length > 100) throw new TypeError('热榜 AI 筛选模型无效');
      }
      if (filter.aiScreenInstruction !== undefined) {
        if (typeof filter.aiScreenInstruction !== 'string' || filter.aiScreenInstruction.length > 3000) throw new TypeError('热榜 AI 审核指令不能超过 3000 字');
      }
      for (const key of ['aiScreenMaxTopics', 'aiScreenBatchSize']) {
        if (filter[key] === undefined) continue;
        const value = Number(filter[key]);
        if (!Number.isInteger(value) || value < 5 || value > 300) throw new TypeError('热榜 AI 筛选条数需为 5~300 的整数');
        filter[key] = value;
      }
      if (filter.excludedTopics !== undefined) {
        if (!Array.isArray(filter.excludedTopics) || filter.excludedTopics.length > 300) throw new TypeError('手动剔除的热榜话题名单无效');
        filter.excludedTopics = [...new Set(filter.excludedTopics.map(item => String(item || '').replace(/\s+/g, ' ').trim()).filter(Boolean))];
        for (const item of filter.excludedTopics) if (item.length > 80) throw new TypeError('单条手动剔除的热榜话题不能超过 80 字');
      }
      for (const key of ['excludeKeywords', 'preferKeywords']) {
        if (filter[key] === undefined) continue;
        if (!Array.isArray(filter[key]) || filter[key].length > 300) throw new TypeError('热榜筛选关键词名单无效');
        filter[key] = [...new Set(filter[key].map(item => String(item || '').trim()).filter(Boolean))];
      }
      for (const key of ['minLength', 'maxLength']) {
        if (filter[key] === undefined) continue;
        const value = Number(filter[key]);
        if (!Number.isInteger(value) || value < 1 || value > 200) throw new TypeError('热榜话题长度需为 1~200 的整数');
        filter[key] = value;
      }
      if (filter.minLength > filter.maxLength) throw new TypeError('热榜话题最短长度不能大于最长长度');
    }
    if (copy.postSettings.hotTopicPerBatch !== undefined) {
      const hot = Number(copy.postSettings.hotTopicPerBatch);
      if (!Number.isInteger(hot) || hot < 0 || hot > 20) throw new TypeError('每批热榜条数需为 0~20 的整数');
      copy.postSettings.hotTopicPerBatch = hot;
    }
    if (copy.postSettings.restEveryPosts !== undefined) {
      const every = Number(copy.postSettings.restEveryPosts);
      if (!Number.isInteger(every) || every < 0 || every > 100) throw new TypeError('发帖批次数需为 0~100 的整数（0 表示不按条数休息）');
      copy.postSettings.restEveryPosts = every;
    }
    if (copy.postSettings.restMinutes !== undefined) {
      const minutes = Number(copy.postSettings.restMinutes);
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) throw new TypeError('发帖批次休息时长需为 1~240 分钟');
      copy.postSettings.restMinutes = minutes;
    }
    if (copy.postSettings.learningInfluence !== undefined) {
      const influence = Number(copy.postSettings.learningInfluence);
      if (!Number.isInteger(influence) || influence < 0 || influence > 100) throw new TypeError('学习规则强度需为 0~100 的整数');
      copy.postSettings.learningInfluence = influence;
    }
    if (copy.postSettings.topicMix !== undefined) {
      const mix = copy.postSettings.topicMix;
      if (!Array.isArray(mix) || mix.length > 12) throw new TypeError('主题配比最多 12 条');
      const seenIds = new Set();
      for (const item of mix) {
        if (!isRecord(item)) throw new TypeError('主题配比条目无效');
        if (typeof item.id !== 'string' || !item.id || seenIds.has(item.id)) throw new TypeError('主题配比编号缺失或重复');
        seenIds.add(item.id);
        if (typeof item.label !== 'string' || !item.label.trim() || item.label.length > 40) throw new TypeError('主题名称需为 1~40 字');
        const weight = Number(item.weight);
        if (!Number.isInteger(weight) || weight < 0 || weight > 100) throw new TypeError('主题比例需为 0~100 的整数');
        item.weight = weight;
        if (item.prompt !== undefined && (typeof item.prompt !== 'string' || item.prompt.length > 2000)) throw new TypeError('主题提示词需为不超过 2000 字的文本');
      }
      const total = mix.reduce((sum, item) => sum + item.weight, 0);
      if (mix.length && total !== 100) throw new TypeError(`主题比例合计必须等于 100%（当前 ${total}%）`);
    }
    if (copy.postSettings.styleSchedule !== undefined) {
      const slots = copy.postSettings.styleSchedule;
      if (!Array.isArray(slots) || slots.length > 12) throw new TypeError('分时段文风最多 12 条');
      const seenIds = new Set();
      for (const slot of slots) {
        if (!isRecord(slot)) throw new TypeError('分时段文风条目无效');
        if (typeof slot.id !== 'string' || !slot.id || seenIds.has(slot.id)) throw new TypeError('分时段文风条目编号缺失或重复');
        seenIds.add(slot.id);
        if (typeof slot.label !== 'string' || !slot.label.trim() || slot.label.length > 40) throw new TypeError('分时段文风名称需为 1~40 字');
        for (const key of ['startHour', 'endHour']) {
          const hour = Number(slot[key]);
          if (!Number.isInteger(hour) || hour < 0 || hour > 24) throw new TypeError('分时段的开始/结束小时需为 0~24 的整数');
          slot[key] = hour;
        }
        if (slot.endHour <= slot.startHour) throw new TypeError('分时段的结束小时必须大于开始小时');
        if (slot.prompt !== undefined && (typeof slot.prompt !== 'string' || slot.prompt.length > 3000)) throw new TypeError('分时段提示词需为不超过 3000 字的文本');
      }
    }
  }
  if (copy.cruiseSettings !== undefined) {
    if (!isRecord(copy.cruiseSettings)) throw new TypeError('巡航设置无效');
    if (copy.cruiseSettings.enabled !== undefined && typeof copy.cruiseSettings.enabled !== 'boolean') throw new TypeError('巡航启用开关无效');
    if (copy.cruiseSettings.dailyTargetCount !== undefined) {
      const daily = Number(copy.cruiseSettings.dailyTargetCount);
      if (!Number.isInteger(daily) || daily < 1 || daily > 500) throw new TypeError('每日巡航上限次数需为 1~500 之间的整数');
      copy.cruiseSettings.dailyTargetCount = daily;
    }
    if (copy.cruiseSettings.interactionCooldownHours !== undefined) {
      const cd = Number(copy.cruiseSettings.interactionCooldownHours);
      if (!Number.isInteger(cd) || cd < 1 || cd > 720) throw new TypeError('巡航冷却时长需为 1~720 小时之间的整数');
      copy.cruiseSettings.interactionCooldownHours = cd;
    }
    if (copy.cruiseSettings.tierSweepHours !== undefined) {
      const sweep = Number(copy.cruiseSettings.tierSweepHours);
      if (!Number.isInteger(sweep) || sweep < 0 || sweep > 720) throw new TypeError('重点名单轮巡间隔需为 0~720 小时之间的整数（0 表示关闭）');
      copy.cruiseSettings.tierSweepHours = sweep;
    }
    if (copy.cruiseSettings.commentsPerProfile !== undefined) {
      const per = Number(copy.cruiseSettings.commentsPerProfile);
      if (!Number.isInteger(per) || per < 0 || per > 10) throw new TypeError('每次巡航评论条数需为 0~10 之间的整数（0 表示只浏览不评论）');
      copy.cruiseSettings.commentsPerProfile = per;
    }
    if (copy.cruiseSettings.likesPerProfile !== undefined) {
      const likes = Number(copy.cruiseSettings.likesPerProfile);
      if (!Number.isInteger(likes) || likes < 0 || likes > 20) throw new TypeError('每个主页点赞条数需为 0~20 之间的整数（0 表示不点赞）');
      copy.cruiseSettings.likesPerProfile = likes;
    }
    if (copy.cruiseSettings.crawlFollowing !== undefined && typeof copy.cruiseSettings.crawlFollowing !== 'boolean') throw new TypeError('巡航关注列表开关无效');
    if (copy.cruiseSettings.crawlFollowers !== undefined && typeof copy.cruiseSettings.crawlFollowers !== 'boolean') throw new TypeError('巡航粉丝列表开关无效');
    if (copy.cruiseSettings.autoVisitInvited !== undefined && typeof copy.cruiseSettings.autoVisitInvited !== 'boolean') throw new TypeError('自动优先消费回踩邀请开关无效');
    if (copy.cruiseSettings.model !== undefined && typeof copy.cruiseSettings.model !== 'string') throw new TypeError('巡航模型设置无效');
    if (copy.cruiseSettings.customPrompt !== undefined && typeof copy.cruiseSettings.customPrompt !== 'string') throw new TypeError('巡航提示词无效');
  }
  if (copy.learningSettings !== undefined) {
    const ls = copy.learningSettings;
    if (!isRecord(ls)) throw new TypeError('发帖学习设置无效');
    const intIn = (key, min, max, label) => {
      if (ls[key] === undefined) return;
      const value = Number(ls[key]);
      if (!Number.isInteger(value) || value < min || value > max) throw new TypeError(`${label}需为 ${min}~${max} 之间的整数`);
      ls[key] = value;
    };
    intIn('checkIntervalMinutes', 5, 10080, '学习检查间隔（分钟）');
    intIn('minAgeHours', 1, 2160, '分析时间下限（小时）');
    intIn('historyHours', 1, 2160, '分析时间上限（小时）');
    const lowerAge = ls.minAgeHours === undefined ? 12 : Number(ls.minAgeHours);
    const upperAge = ls.historyHours === undefined ? 36 : Number(ls.historyHours);
    if (lowerAge > upperAge) throw new TypeError('分析时间下限（距今更近）必须小于或等于上限（距今更久）');
    intIn('minImpressions', 0, 100000000, '曝光量门槛');
    intIn('minComments', 0, 1000000, '评论数门槛');
    intIn('minLikes', 0, 1000000, '点赞数门槛');
    intIn('maxSamples', 1, 100, '单次分析样本上限');
    for (const key of ['enabled', 'autoLearn', 'injectIntoPost']) {
      if (ls[key] !== undefined && typeof ls[key] !== 'boolean') throw new TypeError('发帖学习开关无效');
    }
    if (ls.model !== undefined && typeof ls.model !== 'string') throw new TypeError('学习模型设置无效');
    if (ls.trendSources !== undefined) {
      if (!Array.isArray(ls.trendSources) || ls.trendSources.length > 20) throw new TypeError('热榜来源最多 20 个');
      const seen = new Set();
      for (const source of ls.trendSources) {
        if (!isRecord(source)) throw new TypeError('热榜来源条目无效');
        if (typeof source.id !== 'string' || !source.id || seen.has(source.id)) throw new TypeError('热榜来源编号缺失或重复');
        seen.add(source.id);
        if (typeof source.label !== 'string' || !source.label.trim() || source.label.length > 60) throw new TypeError('热榜来源名称需为 1~60 字');
        if (typeof source.url !== 'string' || !/^https?:\/\//i.test(source.url) || source.url.length > 500) throw new TypeError('热榜来源地址必须是 http(s) 链接');
        if (typeof source.enabled !== 'boolean') throw new TypeError('热榜来源启用状态无效');
        if (source.cookie !== undefined && typeof source.cookie !== 'string') throw new TypeError('热榜来源 Cookie 无效');
        if (typeof source.cookie === 'string' && source.cookie.length > 8000) throw new TypeError('热榜来源 Cookie 过长');
      }
    }
    if (ls.benchmarkUrl !== undefined) {
      if (typeof ls.benchmarkUrl !== 'string' || ls.benchmarkUrl.length > 500 || (ls.benchmarkUrl && !/^https?:\/\//i.test(ls.benchmarkUrl))) throw new TypeError('榜单地址必须是 http(s) 链接');
    }
  }
  for (const [key, [min, max]] of Object.entries(TIMING_BOUNDS)) if (!Number.isInteger(copy.timing[key]) || copy.timing[key] < min || copy.timing[key] > max) throw new TypeError(`时段字段 ${key} 的设置无效`);
  if (copy.timing.publishMaxSeconds < copy.timing.publishMinSeconds) throw new TypeError('最长发布间隔必须大于或等于最短发布间隔');
  if (copy.timing.replyMaxSeconds > 0 && copy.timing.replyMinSeconds > 0 && copy.timing.replyMaxSeconds < copy.timing.replyMinSeconds) throw new TypeError('回复最长间隔必须大于或等于回复最短间隔');
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

// The badge in the panel must never drift from the installed package again: it is
// read from package.json on every state call instead of being hardcoded in the UI.
export function readPluginVersion(packageUrl = new URL('./package.json', import.meta.url)) {
  try {
    const parsed = JSON.parse(readFileSync(packageUrl, 'utf8'));
    return typeof parsed.version === 'string' ? parsed.version : '';
  } catch {
    return '';
  }
}

export function createService({ clock = () => Date.now(), paths = DEFAULT_TARGETS, configPath = CONFIG_PATH, targetsPath = null, platform = process.platform, spawnProcess = spawn, queuePath = POST_QUEUE_PATH, learningsPath = LEARNINGS_PATH, backupDir = CONFIG_BACKUP_DIR, trendsPath = TRENDS_PATH } = {}) {
  let activeConfigPath = configPath;
  const activeQueuePath = queuePath;
  const activeLearningsPath = learningsPath;
  const activeTrendsPath = trendsPath;
  const activeBackupDir = backupDir;
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
  // The UI only ever sees a sentinel for an existing cookie. On save, restore
  // the real value so a plain page save cannot wipe a working login.
  const restoreTrendCookies = (value) => {
    if (!isRecord(value) || !isRecord(value.learningSettings)) return value;
    const incoming = value.learningSettings.trendSources;
    if (!Array.isArray(incoming)) return value;
    let disk = null;
    try { disk = JSON.parse(readFileSync(activeConfigPath, 'utf8')); } catch { disk = null; }
    const diskSources = Array.isArray(disk?.learningSettings?.trendSources) ? disk.learningSettings.trendSources : [];
    const byId = new Map(diskSources.filter(isRecord).map(item => [item.id, item]));
    return {
      ...value,
      learningSettings: {
        ...value.learningSettings,
        trendSources: incoming.map(source => {
          if (!isRecord(source) || source.cookie !== COOKIE_SET_SENTINEL) return source;
          const stored = byId.get(source.id);
          return { ...source, cookie: typeof stored?.cookie === 'string' ? stored.cookie : '' };
        }),
      },
    };
  };

  // Every rejected save is recorded so the operator can see *why* the page
  // refused the change instead of only seeing "unsaved changes" on screen.
  const saveFailures = [];
  const recordSaveFailure = (reason, detail) => {
    const entry = { at: new Date().toISOString(), reason: String(reason || '').slice(0, 200), detail: String(detail || '').slice(0, 400) };
    saveFailures.unshift(entry);
    saveFailures.length = Math.min(saveFailures.length, 20);
    try {
      writeFileSync(SAVE_LOG_PATH, `${JSON.stringify({ last: entry, history: saveFailures }, null, 2)}\n`, { mode: 0o600 });
    } catch { /* logging must never block a save */ }
  };
  const saveConfig = (value, expectedHash) => {
    let validated;
    try {
      validated = validateConfig(restoreTrendCookies(value));
    } catch (error) {
      recordSaveFailure('配置校验未通过', error?.message);
      throw error;
    }
    const currentHash = hashCurrentConfig();
    if (expectedHash === undefined) {
      recordSaveFailure('缺少配置版本标识', 'expectedConfigHash 未随请求发送');
      throw new Error('缺少配置版本标识；请刷新状态后再保存');
    }
    if (expectedHash !== currentHash) {
      recordSaveFailure('配置版本不一致', `页面 hash=${String(expectedHash).slice(0, 12)} 磁盘 hash=${String(currentHash).slice(0, 12)}`);
      throw new Error('共享配置已被其他进程修改；请刷新状态并重新检查后再保存');
    }
    backupConfigFile(activeConfigPath, activeBackupDir);
    mkdirSync(dirname(activeConfigPath), { recursive: true, mode: 0o700 });
    const tmp = `${activeConfigPath}.${process.pid}.tmp`;
    try {
      writeFileSync(tmp, `${JSON.stringify(validated, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
      renameSync(tmp, activeConfigPath);
    } catch (error) {
      try { unlinkSync(tmp); } catch { /* preserve original error */ }
      throw error;
    }
    try {
      writeFileSync(SAVE_LOG_PATH, `${JSON.stringify({ last: null, history: saveFailures }, null, 2)}\n`, { mode: 0o600 });
    } catch { /* ignore */ }
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
        stateDir: dirname(t.heartbeat),
        pausedUntil: rate && Number.isFinite(Number(rate.until)) ? Number(rate.until) : null,
        pauseReason: rate && ['rate_limit', 'manual'].includes(rate.reason) ? rate.reason : (rate ? 'other' : null),
        cdpPort: t.port, cdpAvailable: await portListening(t.port),
        chromeProfile: chromeProfileFor(key, t), chromeProfileExists: existsSync(chromeProfileFor(key, t)),
        chromeLauncher: chromeLauncherPath(t), logTail, watchdogLogTail,
        priorityHandles: readPriorityHandles(t.worker),
      };
    }
    const shared = readSharedConfig();
    const configHash = hashCurrentConfig();
    const dshModels = readDshModels();
    const postQueue = readPostQueue(activeQueuePath);
    let postHistory = [];
    try {
      if (existsSync(POST_HISTORY_PATH)) {
        const hist = JSON.parse(readFileSync(POST_HISTORY_PATH, 'utf8'));
        if (hist && Array.isArray(hist.posts)) postHistory = hist.posts;
      }
    } catch {}
    return {
      ok: true, pluginVersion: readPluginVersion(), config: maskTrendCookies(shared.config), configSource: shared.source, configPath: activeConfigPath, configHash,
      runtimeConfigApplied: shared.source === 'shared', runtimeCapabilities, fieldSide: FIELD_SIDE,
      dshModels,
      postQueue: postQueue.queue,
      postHistory: postHistory.slice(-20),
      learnings: readLearnings(activeLearningsPath),
      trends: readTrends(activeTrendsPath),
      maintenance: { diskFreeBytes: diskFreeBytes(), cacheCleanup: readCacheCleanupState() },
      cruiseSweep: readCruiseSweep(),
      replyDiagnostics: readReplyDiagnostics(items.reply ? items.reply.stateDir : null),
      configBackups: listConfigBackups(activeBackupDir),
      saveLog: readSaveLog(),
      learnTriggerPending: existsSync(LEARN_TRIGGER_PATH),
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
    if (request.action === 'enqueue-post') {
      const text = String(request.text || '').trim();
      if (!text) throw new TypeError('推文内容不能为空');
      if (text.length > 500) throw new TypeError('推文长度不能超过 500 字');
      const urgent = request.urgent === true;
      const sharedCfg = getConfig();
      const maxSize = Number(sharedCfg.postSettings?.queueMaxSize) || 100;
      const newItem = {
        id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        text,
        source: request.source || 'manual',
        urgent,
        createdAt: new Date().toISOString(),
      };
      const { payload } = mutatePostQueue((current) => {
        if (urgent) current.queue.unshift(newItem);
        else current.queue.push(newItem);
      }, activeQueuePath, { maxSize });
      return {
        ok: true,
        action: 'enqueue-post',
        item: newItem,
        queue: payload.queue,
        note: urgent ? '已成功将推文设置为【立即插队发送】！发帖 Worker 会在当前周期优先发出。' : '推文已加入待发队列！',
      };
    }
    if (request.action === 'remove-queued-post') {
      const id = String(request.id || '');
      if (!id) throw new TypeError('缺少待删除推文 ID');
      const sharedCfg = getConfig();
      const maxSize = Number(sharedCfg.postSettings?.queueMaxSize) || 100;
      let removed = 0;
      const { payload } = mutatePostQueue((current) => {
        const before = current.queue.length;
        current.queue = current.queue.filter(item => item.id !== id);
        removed = before - current.queue.length;
      }, activeQueuePath, { maxSize });
      return {
        ok: true,
        action: 'remove-queued-post',
        queue: payload.queue,
        note: removed > 0 ? '已从待发队列中移除该条草稿。' : '未找到该条草稿，可能已被 Worker 发出或删除。',
      };
    }
    if (request.action === 'clear-post-queue') {
      const sharedCfg = getConfig();
      const maxSize = Number(sharedCfg.postSettings?.queueMaxSize) || 100;
      const { payload } = mutatePostQueue((current) => {
        current.queue = [];
      }, activeQueuePath, { maxSize });
      return {
        ok: true,
        action: 'clear-post-queue',
        queue: [],
        note: '待发队列已清空。',
      };
    }
    if (request.action === 'generate-draft-posts') {
      const sharedCfg = getConfig();
      const postCfg = sharedCfg.postSettings || {};
      const learningCfg = sharedCfg.learningSettings || {};
      const batchSize = Number(postCfg.queueBatchSize) || 10;
      const requested = Number(request.count);
      const count = Math.max(1, Math.min(50, Number.isFinite(requested) && requested > 0 ? Math.floor(requested) : batchSize));
      // A one-off prompt overrides the global style prompt for this batch only.
      const oneOffPrompt = typeof request.prompt === 'string' && request.prompt.trim() ? request.prompt.trim() : '';
      const onePerLine = postCfg.oneSentencePerLine !== false;
      const fmtCfg = { ...DEFAULT_CONFIG.postSettings.format, ...(postCfg.format || {}) };
      const dedupeCfg = { ...DEFAULT_CONFIG.postSettings.dedupe, ...(postCfg.dedupe || {}) };
      const capCfg = { ...DEFAULT_CONFIG.postSettings.politicalCap, ...(postCfg.politicalCap || {}) };
      const styleCfg = { ...DEFAULT_CONFIG.postSettings.style, ...(postCfg.style || {}) };
      // The active time window decides the language of this batch.
      const slot = stylePromptFor(postCfg);
      const windowLanguage = /英文|english/i.test(slot.label || '') ? 'english' : 'chinese';
      const structureBlock = buildStructureBlock(fmtCfg, styleCfg, windowLanguage);
      const formatRule = fmtCfg.lineCount > 0 ? structureBlock : (onePerLine ? `\n\n${ONE_SENTENCE_RULE}` : '');
      const globalPrompt = postCfg.customPrompt || '你在推特(X)上用周天子姬霸的人设发一条原创推文。文风为幽默、古奥的文言文或诗词歌赋，自称周天子、姬霸或夫子，不要露骨，禁止提现代网络低俗梗，字数在30到90字之间。';
      // The active time window wins over the global prompt, exactly like the
      // worker's compose_post_prompt does.
      const slotPrompt = oneOffPrompt ? '' : slot.prompt;
      const slotLabel = oneOffPrompt ? '' : slot.label;
      const personaText = personaBlock(sharedCfg);
      const basePrompt = oneOffPrompt
        ? oneOffPrompt
        : (slotPrompt ? `${globalPrompt}\n\n【当前时段文风：${slotLabel || '分时文风'}】${slotPrompt}` : globalPrompt)
          + personaText;
      // Learned patterns steer topic choice and structure; the writing style above stays authoritative.
      const rawLearnings = readLearnings(activeLearningsPath);
      const influence = Number(postCfg.learningInfluence ?? 100);
      // The operator's own ban list joins the learned one before anything reads it.
      const bannedList = mergeBannedTopics(rawLearnings, postCfg);
      const learnings = { ...rawLearnings, bannedTopics: bannedList };
      const learningBlock = (learningCfg.injectIntoPost === false || influence === 0)
        ? ''
        : buildLearningPromptBlock(learnings, { influence });
      const banned = new Set(bannedList.map(topic => topic.toLowerCase()));
      const configuredTopics = postCfg.topics && postCfg.topics.length ? postCfg.topics : ['文言雅趣', '日常随笔', '周朝掌故'];
      const rawWinners = learnings.winningTopics.filter(topic => !banned.has(String(topic).toLowerCase()));
      // The preferred topics are screened with the same model rules as the hot
      // board, so the benchmark's entertainment hits never reach a draft.
      const model = postCfg.model || sharedCfg.model?.name || 'gpt-6-luna';
      const port = sharedCfg.model?.endpointPort || 3040;
      const screenFilter = effectiveHotFilter(postCfg, { bannedTopics: bannedList });
      let preferred = rawWinners;
      if (rawWinners.length) {
        let cache = readPreferredTopicCache();
        if (!preferredTopicCacheFresh(cache, rawWinners)) {
          const screened = await screenPreferredTopics(rawWinners, screenFilter, { model, port });
          cache = {
            at: Math.floor(Date.now() / 1000),
            source: rawWinners,
            usable: screened.usable,
            rejected: screened.rejected,
            error: screened.error || '',
          };
          writePreferredTopicCache(cache);
        }
        // A failed screen keeps the raw list rather than losing every topic.
        preferred = cache.error ? rawWinners : cache.usable.filter(topic => !banned.has(String(topic).toLowerCase()));
      }
      const manual = configuredTopics.filter(topic => !banned.has(String(topic).toLowerCase()));
      // "Preferred" has to mean preferred: with both lists present the learned
      // winners are used most of the time.
      const pool = preferred.length
        ? (manual.length && Math.random() >= 0.7 ? [...preferred, ...manual] : preferred)
        : (manual.length ? manual : ['文言雅趣']);
      const maxSize = Number(postCfg.queueMaxSize) || 100;
      const generated = [];
      const failures = [];
      const themePlan = planThemeBatch(postCfg.topicMix, count);
      const sharePercent = Number(postCfg.hotTopicShareMinPercent ?? DEFAULT_CONFIG.postSettings.hotTopicShareMinPercent) || 0;
      const shareQuota = Math.ceil((count * sharePercent) / 100);
      // Recent history drives the overlap check and today's political budget.
      let historyPosts = [];
      try {
        const stored = JSON.parse(readFileSync(POST_HISTORY_PATH, 'utf8'));
        if (stored && Array.isArray(stored.posts)) historyPosts = stored.posts;
      } catch { historyPosts = []; }
      const hotQuota = Math.max(0, Math.min(Math.max(Number(postCfg.hotTopicPerBatch) || 0, shareQuota), count));
      // Political topics are rationed: today's quota and one post per event.
      const politicalWords = (capCfg.keywords || []).map(word => String(word).toLowerCase());
      const todayKey = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
      const todayPosts = historyPosts.filter(item => {
        const stamp = String(item?.time || item?.createdAt || '');
        return stamp.slice(0, 10) === todayKey;
      });
      const politicalToday = todayPosts.filter(item => (capCfg.keywords || []).some(word => `${item?.theme || ''}${item?.hotTopic || ''}`.includes(word)));
      const politicalBudget = Math.max(0, (Number(capCfg.dailyMax) || 0) - politicalToday.length);
      const recentTexts = historyPosts.slice(-(Number(dedupeCfg.recentPosts) || 50)).map(item => item?.text).filter(Boolean);
      // Skeleton pool: only posts inside the cooldown window take part.
      const skeletonHours = Math.max(0, Number(dedupeCfg.skeletonCooldownHours) || 0);
      const skeletonCutoff = Date.now() + 8 * 3600 * 1000 - skeletonHours * 3600 * 1000;
      const skeletonTexts = skeletonHours > 0
        ? historyPosts
          .filter(item => {
            const stamp = Date.parse(String(item?.time || '').replace(' ', 'T') + '+08:00');
            return Number.isFinite(stamp) && stamp >= skeletonCutoff;
          })
          .map(item => item?.text)
          .filter(Boolean)
        : [];
      const trendPool = hotQuota > 0
        ? screenHotTopics(readTrends(activeTrendsPath).topics,
            effectiveHotFilter(postCfg, { bannedTopics: bannedList })).usable
        : [];
      for (let k = trendPool.length - 1; k > 0; k -= 1) {
        const j = Math.floor(Math.random() * (k + 1));
        [trendPool[k], trendPool[j]] = [trendPool[j], trendPool[k]];
      }
      // When today's political budget is spent, non-political topics go first.
      const isPolitical = topic => (capCfg.keywords || []).some(word => String(topic).includes(word));
      if (politicalBudget <= 0) trendPool.sort((a, b) => Number(isPolitical(a)) - Number(isPolitical(b)));
      const hotTopics = trendPool.slice(0, Math.min(hotQuota, trendPool.length));
      for (let i = 0; i < count; i++) {
        const hotTopic = i < hotTopics.length ? hotTopics[i] : '';
        // One subject per draft: the hot headline when this draft got one, else a
        // preferred topic. The theme only decides the angle, so the two no
        // longer fight each other and the preferred topics really get used.
        const topic = hotTopic || pool[Math.floor(Math.random() * pool.length)];
        const theme = themePlan[i] || pickTopicTheme(postCfg.topicMix);
        const themeBlock = theme
          ? `\n\n【本条主题方向：${theme.label}】（约占 ${theme.weight}%）${theme.prompt ? ` ${theme.prompt}` : ''}`
          : '';
        const subjectSource = hotTopic ? '今日热点' : '优先话题';
        const subjectBlock = topic
          ? `\n\n【本条话题：${topic}】（来源：${subjectSource}）`
            + (hotTopic ? `\n（借这条热榜标题当素材写一条原创推文，不要照搬标题）` : '')
            + `\n（请就上面这条话题写，主题方向只决定口吻与切入角度）`
          : '';
        const prompt = basePrompt + themeBlock + learningBlock + subjectBlock + formatRule;
        try {
          let rawDraft = await generateTweetViaLmh(prompt, { model, port });
          let draftText = fmtCfg.lineCount > 0
            ? String(rawDraft || '').trim()
            : enforceOneSentencePerLine(rawDraft);
          let verdict = checkPostDraft(draftText, { ...fmtCfg, maxOverlapChars: dedupeCfg.maxOverlapChars }, recentTexts, skeletonTexts, skeletonHours);
          for (let attempt = 0; attempt < 2 && !verdict.ok; attempt += 1) {
            // Corrective retries that name every violation.
            const retryPrompt = `${prompt}\n\n【上一次不合格，必须逐条修正】\n- ${verdict.reasons.join('\n- ')}`
              + (fmtCfg.lineCount === 0 ? '' : `\n- 严格保持 ${fmtCfg.lineCount} 行`);
            rawDraft = await generateTweetViaLmh(retryPrompt, { model, port });
            draftText = fmtCfg.lineCount > 0
              ? String(rawDraft || '').trim()
              : enforceOneSentencePerLine(rawDraft);
            verdict = checkPostDraft(draftText, { ...fmtCfg, maxOverlapChars: dedupeCfg.maxOverlapChars }, recentTexts, skeletonTexts, skeletonHours);
          }
          if (!verdict.ok) {
            failures.push(`结构不合规：${verdict.reasons.join('；')}`);
            console.error('Draft rejected:', verdict.reasons.join('; '));
            continue;
          }
          if (draftText) {
            // The model can ignore the window rule; such a draft must not enter
            // the queue, or it would be published in the wrong language.
            // The persona is a hard constraint: a draft that breaks it is dropped
            // instead of being published.
            const personaHits = personaViolations(draftText, sharedCfg);
            if (personaHits.length) {
              failures.push(`第 ${i + 1} 条不符合人设（出现「${personaHits.join('、')}」）`);
              continue;
            }
            const han = (draftText.match(/[\u4e00-\u9fff]/g) || []).length;
            const wantsEnglish = slotLabel.includes('英文') || slotLabel.toLowerCase().includes('english');
            const wantsChinese = slotLabel.includes('文言') || slotLabel.includes('楚辞') || slotLabel.includes('中文');
            if (wantsEnglish && han > 0) {
              failures.push(`第 ${i + 1} 条未遵守「${slotLabel}」时段要求（仍含中文）`);
              continue;
            }
            if (wantsChinese && han === 0) {
              failures.push(`第 ${i + 1} 条未遵守「${slotLabel}」时段要求（没有中文）`);
              continue;
            }
            recentTexts.unshift(draftText);
            if (skeletonHours > 0) skeletonTexts.unshift(draftText);
            generated.push({
              id: `post_ai_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
              text: draftText,
              topic,
              sig: postSettingsSignature(postCfg),
              // The worker uses this to keep English drafts out of the Chinese
              // window and vice versa.
              styleSlot: slotLabel,
              theme: theme ? theme.label : '',
              hotTopic: hotTopic || '',
              political: (capCfg.keywords || []).some(word => `${theme?.label || ''}${hotTopic}`.includes(word)),
              source: oneOffPrompt ? 'ai_draft_custom' : 'ai_draft',
              urgent: false,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          failures.push(err.message);
          console.error('Draft generation error:', err.message);
        }
      }
      if (generated.length === 0) throw new Error(`未能成功生成推文草稿，请检查 LocalModelHub 服务状态${failures[0] ? `（${failures[0]}）` : ''}`);
      const { payload } = mutatePostQueue((current) => {
        current.queue.push(...generated);
      }, activeQueuePath, { maxSize });
      return {
        ok: true,
        action: 'generate-draft-posts',
        generated,
        queue: payload.queue,
        failed: failures.length,
        note: `已成功由大模型生成并追加 ${generated.length} 条推文草稿入队！${failures.length ? `另有 ${failures.length} 条生成失败。` : ''}`,
      };
    }
    if (request.action === 'restore-config-backup') {
      const name = String(request.name || '');
      // No slashes allowed, so a crafted name can never escape the backup directory.
      if (!/^config-[A-Za-z0-9._-]+\.json$/.test(name) || name.includes('..')) throw new TypeError('备份文件名无效');
      const source = join(activeBackupDir, name);
      if (!existsSync(source)) throw new Error('找不到该备份文件');
      let parsed;
      try { parsed = JSON.parse(readFileSync(source, 'utf8')); }
      catch { throw new Error('该备份文件内容已损坏，无法恢复'); }
      const validated = validateConfig(parsed);
      backupConfigFile(activeConfigPath, activeBackupDir);
      mkdirSync(dirname(activeConfigPath), { recursive: true, mode: 0o700 });
      const tmp = `${activeConfigPath}.${process.pid}.restore.tmp`;
      try {
        writeFileSync(tmp, `${JSON.stringify(validated, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
        renameSync(tmp, activeConfigPath);
      } catch (error) {
        try { unlinkSync(tmp); } catch { /* keep original error */ }
        throw error;
      }
      return {
        ok: true,
        action: 'restore-config-backup',
        config: clone(validated),
        configHash: hashCurrentConfig(),
        workerAcceptance: workerAcceptance(validated),
        note: `已恢复至 ${name} 的配置，两个 Worker 下一轮读取即生效。`,
      };
    }
    if (request.action === 'backup-config-now') {
      const file = backupConfigFile(activeConfigPath, activeBackupDir);
      return {
        ok: true,
        action: 'backup-config-now',
        backups: listConfigBackups(activeBackupDir),
        note: file ? '已为当前配置创建一份快照。' : '当前没有可备份的配置文件。',
      };
    }
    if (request.action === 'clean-cache') {
      const all = currentTargets() || {};
      const reply = all.reply || {};
      const post = all.post || {};
      const script = (currentTargets() || {}).cacheCleanupScript
        || join(dirname(String(post.worker || reply.worker || '')), 'cache_cleanup.py');
      if (!script || !existsSync(script)) throw new Error(`未找到缓存清理脚本：${script}`);
      const python = (currentTargets() || {}).cacheCleanupPython || resolvePython(post.python ? post : (reply.python ? reply : {})) || 'python3';
      const before = diskFreeBytes();
      let output = '';
      try {
        output = execFileSync(python, [script], { encoding: 'utf8', timeout: 180000 });
      } catch (error) {
        throw new Error(`清理脚本执行失败：${String(error?.message || error).split('\n')[0]}`);
      }
      const after = diskFreeBytes();
      const reclaimed = before != null && after != null ? Math.max(0, after - before) : null;
      const state = readCacheCleanupState();
      return {
        ok: true,
        action: 'clean-cache',
        output: String(output || '').trim(),
        reclaimedBytes: state?.reclaimedBytes ?? reclaimed,
        diskFreeBefore: before,
        diskFreeAfter: after,
        cacheCleanup: state,
        note: `缓存已清理，释放约 ${reclaimed != null ? Math.round(reclaimed / (1024 * 1024)) : Math.round((state?.reclaimedBytes || 0) / (1024 * 1024))} MB。`,
      };
    }
    if (request.action === 'ensure-chrome') {
      const all = currentTargets() || {};
      const wanted = Array.isArray(request.targets) && request.targets.length ? request.targets : ['comment', 'reply', 'post', 'profile'];
      const results = [];
      for (const key of wanted) {
        const target = all[key];
        if (!target) { results.push({ key, ok: false, error: '未配置该工作进程' }); continue; }
        const launcher = chromeLauncherPath(target);
        if (!launcher) { results.push({ key, ok: false, error: `未找到 chrome_launcher.py（${target.dir || ''}）` }); continue; }
        // resolvePython enforces the watchdog identity token; fall back rather than
        // failing the whole batch when a target was configured by hand.
        let python = '';
        try { python = resolvePython(target) || ''; } catch { python = typeof target.python === 'string' ? target.python : ''; }
        if (!python) python = 'python3';
        const profile = chromeProfileFor(key, target);
        const args = [launcher, '--port', String(target.port || 0), '--worker', key, '--profile', profile, '--wait', '25'];
        let parsed = null;
        try {
          const output = execFileSync(python, args, { encoding: 'utf8', timeout: 120000 });
          try { parsed = JSON.parse(String(output || '').trim().split('\n').pop()); } catch { parsed = null; }
          results.push({ key, ok: true, ...(parsed || {}), output: String(output || '').trim().slice(-400) });
        } catch (error) {
          const message = String(error?.stdout || error?.message || error).trim().split('\n').slice(-3).join(' ');
          results.push({ key, ok: false, error: message.slice(0, 400), profile });
        }
      }
      const ready = results.filter(item => item.ok && item.cdpOpen !== false && item.ready !== false).length;
      return {
        ok: true,
        action: 'ensure-chrome',
        results,
        ready,
        note: `已检查 ${results.length} 个浏览器：${ready} 个 CDP 就绪。` +
          (ready < results.length ? ' 未就绪的请看 results 里的说明；首次使用新配置目录需要在弹出的 Chrome 窗口里登录 X。' : ''),
      };
    }
    if (request.action === 'chrome-login-status') {
      const all = currentTargets() || {};
      const order = ['comment', 'reply', 'post', 'profile'];
      const results = [];
      for (const key of order) {
        const target = all[key];
        if (!target) continue;
        try {
          const info = await probeXLogin(target.port);
          results.push({ key, port: target.port, ok: true, loggedIn: info.loggedIn, url: info.url });
        } catch (error) {
          results.push({ key, port: target.port, ok: false, error: String(error?.message || error).slice(0, 200) });
        }
      }
      const loggedIn = results.filter(item => item.ok && item.loggedIn).length;
      return {
        ok: true,
        action: 'chrome-login-status',
        results,
        loggedIn,
        note: `已检查 ${results.length} 个浏览器：${loggedIn} 个已登录 X。`,
      };
    }
    if (request.action === 'sync-login') {
      const all = currentTargets() || {};
      const order = ['comment', 'reply', 'post', 'profile'];
      const preferred = typeof request.from === 'string' && order.includes(request.from) ? request.from : '';
      const candidates = preferred ? [preferred, ...order.filter(key => key !== preferred)] : order;
      // 1. Find a browser that still holds a usable X session.
      let source = '';
      let session = [];
      for (const key of candidates) {
        const target = all[key];
        if (!target) continue;
        try {
          const cookies = await exportXSession(target.port);
          if (!cookies.some(cookie => cookie.name === 'auth_token')) continue;
          const probe = await probeXLogin(target.port);
          if (!probe.loggedIn) continue;
          source = key;
          session = cookies;
          break;
        } catch { /* try the next browser */ }
      }
      if (!session.length) throw new Error('四个浏览器都没有可用的 X 登录态；请先在任意一个窗口里手动登录一次。');
      // 2. Replay the cookies into every other browser and verify.
      const applied = [];
      for (const key of order) {
        if (key === source) continue;
        const target = all[key];
        if (!target) continue;
        try {
          const result = await applyXSession(target.port, session);
          let loggedIn = false;
          for (let attempt = 0; attempt < 3 && !loggedIn; attempt += 1) {
            await new Promise(resolve => setTimeout(resolve, attempt === 0 ? 4000 : 3000));
            try { loggedIn = (await probeXLogin(target.port)).loggedIn; } catch { /* keep polling */ }
          }
          applied.push({ key, port: target.port, ok: true, cookiesSet: result.set, failedNames: result.failed, loggedIn });
        } catch (error) {
          applied.push({ key, port: target.port, ok: false, error: String(error?.message || error).slice(0, 200) });
        }
      }
      const done = applied.filter(item => item.loggedIn).length;
      return {
        ok: true,
        action: 'sync-login',
        source,
        cookieCount: session.length,
        applied,
        note: `已从「${source}」复制 ${session.length} 个 x.com Cookie，${done}/${applied.length} 个浏览器恢复登录。`
          + (done < applied.length ? ' 没成功的窗口请手动登录一次。' : '')
          + ' Cookie 值不会显示在界面或日志里。',
      };
    }
    if (request.action === 'fetch-trends') {
      const sharedCfg = getConfig();
      const sources = (sharedCfg.learningSettings || {}).trendSources
        || DEFAULT_CONFIG.learningSettings.trendSources;
      const enabled = sources.filter(source => source.enabled !== false);
      if (!enabled.length) throw new Error('没有启用任何热榜来源');
      const { results, topics } = await fetchAllTrends(enabled);
      if (!topics.length) {
        // Never wipe a usable cache just because every board answered empty today.
        return {
          ok: true,
          action: 'fetch-trends',
          trends: readTrends(activeTrendsPath),
          results,
          note: '本次所有榜单都没有抓到话题，已保留上一次的缓存。',
        };
      }
      // Screen before caching: headlines the rules already reject must never reach
      // the board list, otherwise the operator has to strike them out by hand.
      const filterCfg = effectiveHotFilter(sharedCfg.postSettings, readLearnings(activeLearningsPath));
      const keywordPass = screenHotTopics(topics, filterCfg);
      let usable = keywordPass.usable;
      const dropped = keywordPass.dropped.slice();
      const aiEnabled = filterCfg.aiScreen !== false;
      let aiInfo = { screened: 0, skipped: 0, error: '', rejected: 0 };
      if (aiEnabled && usable.length) {
        const shared = getConfig();
        const model = filterCfg.aiScreenModel || shared.postSettings?.model || shared.model?.name || 'gpt-6-luna';
        const port = shared.model?.endpointPort || 3040;
        const ai = await aiScreenHotTopics(usable, {
          ...filterCfg,
          bannedTopics: mergeBannedTopics(readLearnings(activeLearningsPath), shared.postSettings),
        }, {
          model, port,
          maxTopics: filterCfg.aiScreenMaxTopics || 160,
          batchSize: filterCfg.aiScreenBatchSize || 20,
          timeoutMs: 60000,
        });
        usable = ai.usable;
        dropped.push(...ai.rejected);
        aiInfo = { screened: ai.screened, skipped: ai.skipped, error: ai.error, rejected: ai.rejected.length };
      }
      // The preferred topics are screened with the same model pass, so the cache
      // stays fresh whenever the boards are refreshed.
      try {
        const rawWinners = (readLearnings(activeLearningsPath).winningTopics || [])
          .filter(topic => !mergeBannedTopics(readLearnings(activeLearningsPath), postCfg)
            .some(banned => String(banned).toLowerCase() === String(topic).toLowerCase()));
        if (rawWinners.length && !preferredTopicCacheFresh(readPreferredTopicCache(), rawWinners)) {
          const screened = await screenPreferredTopics(rawWinners, filterCfg, { model, port });
          writePreferredTopicCache({
            at: Math.floor(Date.now() / 1000),
            source: rawWinners,
            usable: screened.usable,
            rejected: screened.rejected,
            error: screened.error || '',
          });
        }
      } catch { /* the cache is an optimisation, never a blocker */ }
      const payload = writeTrends({
        topics: usable,
        sources: results,
        rawCount: topics.length,
        droppedCount: dropped.length,
        // Lead with the semantic rejects: that is what the operator wants to audit.
        droppedSamples: [
          ...dropped.filter(item => String(item.reason).startsWith('AI')),
          ...dropped.filter(item => !String(item.reason).startsWith('AI')),
        ].slice(0, 20),
        aiScreened: aiInfo.screened,
        aiRejected: aiInfo.rejected,
        aiError: aiInfo.error,
      }, activeTrendsPath);
      const okCount = results.filter(item => item.ok).length;
      return {
        ok: true,
        action: 'fetch-trends',
        trends: payload,
        results,
        note: `已抓取 ${okCount}/${results.length} 个榜单，共 ${topics.length} 条话题：剔除 ${dropped.length} 条`
          + (aiInfo.screened ? `（其中大模型语义筛掉 ${aiInfo.rejected} 条）` : '')
          + `，入库 ${payload.topics.length} 条。`
          + (aiInfo.error ? ` AI 筛选部分失败：${aiInfo.error}（已保留关键词结果）` : ''),
      };
    }
    if (request.action === 'learn-manual') {
      const raw = String(request.text || '').trim();
      if (!raw) throw new TypeError('请先粘贴要高曝光推文内容');
      if (raw.length > 20000) throw new TypeError('粘贴内容过长，请分批提交');
      const sharedCfg = getConfig();
      const learningCfg = sharedCfg.learningSettings || {};
      const model = learningCfg.model || sharedCfg.postSettings?.model || sharedCfg.model?.name || 'gpt-6-luna';
      const port = sharedCfg.model?.endpointPort || 3040;
      // Accept either one blob or several posts separated by blank lines.
      const samples = raw
        .split(/\n\s*\n/)
        .map(part => part.replace(/\s+$/g, '').trim())
        .filter(Boolean)
        .slice(0, 40)
        .map(text => ({ text }));
      const analysis = await analyzeLearningSamples(samples, { model, port, kind: 'manual' });
      const { payload } = mutateLearnings((current) => {
        current.patterns.unshift(...analysis.patterns);
        if (analysis.styleGuide) current.styleGuide = analysis.styleGuide;
        current.winningTopics = [...new Set([...analysis.winningTopics, ...current.winningTopics])].slice(0, 40);
      }, activeLearningsPath);
      return {
        ok: true,
        action: 'learn-manual',
        learnings: payload,
        learnedPatterns: analysis.patterns.length,
        note: `已拆解 ${samples.length} 条高曝光样本，提炼出 ${analysis.patterns.length} 条可复用套路。`,
      };
    }
    if (request.action === 'trigger-learn') {
      const sharedCfg = getConfig();
      const learningCfg = sharedCfg.learningSettings || {};
      if (learningCfg.enabled === false) throw new Error('发帖学习已在设置中关闭，请先启用');
      mkdirSync(dirname(LEARN_TRIGGER_PATH), { recursive: true });
      writeFileSync(LEARN_TRIGGER_PATH, JSON.stringify({
        requestedAt: new Date().toISOString(),
        withBenchmark: request.withBenchmark !== false,
      }), { mode: 0o600 });
      return {
        ok: true,
        action: 'trigger-learn',
        note: '已通知发帖 Worker 立即执行一次学习（历史发帖表现 + X 榜单拆解）。结果会写入本页，约 1~3 分钟后刷新可见。',
      };
    }
    if (request.action === 'save-style-guide') {
      const styleGuide = String(request.styleGuide || '').slice(0, 4000);
      const { payload } = mutateLearnings((current) => {
        current.styleGuide = styleGuide;
      }, activeLearningsPath);
      return {
        ok: true,
        action: 'save-style-guide',
        learnings: payload,
        note: styleGuide ? '套路总结已保存，下次生成草稿会参考它。' : '套路总结已清空。',
      };
    }
    if (request.action === 'remove-learning') {
      const kind = String(request.kind || '');
      const id = String(request.id || '');
      const { payload } = mutateLearnings((current) => {
        if (kind === 'pattern') current.patterns = current.patterns.filter(item => item.id !== id);
        else if (kind === 'banned') current.bannedTopics = current.bannedTopics.filter(item => item !== id);
        else if (kind === 'winning') current.winningTopics = current.winningTopics.filter(item => item !== id);
        else throw new TypeError('未知的学习记录类型');
      }, activeLearningsPath);
      return { ok: true, action: 'remove-learning', learnings: payload, note: '已删除该条学习记录。' };
    }
    if (request.action === 'promote-topic') {
      const topic = String(request.topic || '').trim().slice(0, 80);
      const target = String(request.target || 'winning');
      if (!topic) throw new TypeError('缺少话题名称');
      const { payload } = mutateLearnings((current) => {
        if (target === 'banned') {
          current.bannedTopics = [...new Set([topic, ...current.bannedTopics])].slice(0, 40);
          current.winningTopics = current.winningTopics.filter(item => item !== topic);
        } else {
          current.winningTopics = [...new Set([topic, ...current.winningTopics])].slice(0, 40);
          current.bannedTopics = current.bannedTopics.filter(item => item !== topic);
        }
      }, activeLearningsPath);
      return {
        ok: true,
        action: 'promote-topic',
        learnings: payload,
        note: target === 'banned' ? `已将「${topic}」加入避写名单。` : `已将「${topic}」标记为优先话题。`,
      };
    }
    if (request.action === 'clear-learnings') {
      const { payload } = mutateLearnings((current) => {
        current.styleGuide = '';
        current.winningTopics = [];
        current.bannedTopics = [];
        current.patterns = [];
        current.history = { lastRunAt: null, considered: 0, learned: 0, note: '', posts: [] };
      }, activeLearningsPath);
      return { ok: true, action: 'clear-learnings', learnings: payload, note: '学习成果已全部清空。' };
    }
    if (!['pause', 'resume', 'start', 'stop', 'restart', 'restart-watchdog'].includes(request.action)) throw new TypeError('未知操作类型');
    if (!['comment', 'reply', 'post', 'profile'].includes(request.target)) throw new TypeError('目标必须是评论或提及回复');
    if (platform !== 'darwin') throw new Error('进程控制仅支持 macOS');
    const target = currentTargets()[request.target];
    const watchdogFlag = request.target === 'comment' ? '--loop' : '--supervise';
    const watchdogStatus = processState(target.watchdogPid, target.watchdog, watchdogFlag, target.watchdogPidArgvToken || target.watchdog, target.interpreterPidArgvToken || '');
    const workerStatus = processState(target.pid, target.worker, '', target.workerPidArgvToken || target.worker, target.interpreterPidArgvToken || '');
    if (request.action === 'restart-watchdog') {
      // Recovers from the case where a full disk or a crash killed the watchdog:
      // without it the console can no longer start, stop or restart the worker.
      if (!existsSync(target.watchdog)) throw new Error('未找到监控脚本，请先在设置中核对脚本路径');
      const python = resolvePython(target);
      if (existsSync(target.stop)) unlinkSync(target.stop);

      let killed = false;
      if (watchdogStatus.running) {
        if (!watchdogStatus.owned) throw new Error('发现同名但不属于本插件的监控进程，已拒绝操作');
        try { process.kill(watchdogStatus.pid, 'SIGTERM'); killed = true; } catch { /* already gone */ }
        const watchdogFlag = request.target === 'comment' ? '--loop' : '--supervise';
        const check = () => processState(target.watchdogPid, target.watchdog, watchdogFlag, target.watchdogPidArgvToken || target.watchdog, target.interpreterPidArgvToken || '');
        for (let i = 0; i < 40; i += 1) {
          await new Promise(resolveWait => setTimeout(resolveWait, 250));
          if (!check().running) break;
        }
        const stillRunning = check();
        if (stillRunning.running) {
          try { process.kill(stillRunning.pid, 'SIGKILL'); } catch { /* best effort */ }
          await new Promise(resolveWait => setTimeout(resolveWait, 400));
        }
      }

      const argv = request.target === 'comment'
        ? [python, target.watchdog, '--loop']
        : [python, target.watchdog, '--supervise'];
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
        if (out !== undefined) { try { closeSync(out); } catch { /* ignore */ } }
      }
      return {
        ok: true,
        action: 'restart-watchdog',
        killed,
        pid,
        note: killed
          ? `已替换监控进程（旧 PID ${watchdogStatus.pid} → 新 PID ${pid}），稍后刷新即可看到它拉起工作进程。`
          : `监控进程此前未运行，已启动（PID ${pid}），稍后刷新即可。`,
      };
    }
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
      if (!watchdogStatus.running || !watchdogStatus.owned) throw new Error('监控进程身份未验证，拒绝停止；请先点「🛠 运维操作」里的「重启全部看门狗」。');
      if (workerStatus.running && !workerStatus.owned) throw new Error('工作进程身份未验证，拒绝停止');
      writeFileSync(target.stop, 'stop\n', { mode: 0o600 });
      return { stopping: true, pid: watchdogStatus.pid, note: '已请求协作式停止；监控进程将停止其托管的工作进程并退出。' };
    }
    if (request.action === 'restart') {
      if (!watchdogStatus.running || !watchdogStatus.owned) throw new Error('监控进程身份未验证，拒绝重启；请先点「🛠 运维操作」里的「重启全部看门狗」。');
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
