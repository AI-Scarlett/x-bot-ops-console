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
export const CONFIG_BACKUP_DIR = join(APP_HOME, 'Library/Application Support/XBotOpsConsole/config-history');
const MAX_CONFIG_BACKUPS = 20;

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

// Build an exact, interleaved theme plan for a whole batch.
//
// Weighted random per item clusters themes together (six "生活" posts in a row).
// A batch of N instead gets an exact quota per theme (largest-remainder), then
// the quotas are spread evenly across the batch so themes alternate.
export function planThemeBatch(mix, count) {
  const usable = (Array.isArray(mix) ? mix : [])
    .filter(item => isRecord(item) && Number(item.weight) > 0);
  const size = Math.max(0, Math.floor(Number(count) || 0));
  if (!usable.length || size === 0) return [];

  const total = usable.reduce((sum, item) => sum + Number(item.weight), 0);
  const exact = usable.map(item => (size * Number(item.weight)) / total);
  const counts = exact.map(value => Math.floor(value));
  let left = size - counts.reduce((a, b) => a + b, 0);
  exact
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac)
    .slice(0, Math.max(0, left))
    .forEach(entry => { counts[entry.index] += 1; });

  // Place each theme's slots on an even stride, then order by position.
  const slots = [];
  usable.forEach((item, index) => {
    const n = counts[index];
    if (!n) return;
    const stride = size / n;
    for (let k = 0; k < n; k += 1) slots.push({ theme: item, pos: (k + 0.5) * stride });
  });
  slots.sort((a, b) => a.pos - b.pos);
  return slots.map(slot => slot.theme);
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
  if (learnings.winningTopics.length) parts.push(`【已验证有效的话题方向】${learnings.winningTopics.join('、')}`);
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

export async function generateTweetViaLmh(prompt, { model = 'gpt-6-luna', port = 3040 } = {}) {
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
  } catch {}

  const postData = JSON.stringify({
    model: model || 'gpt-6-luna',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.75,
  });

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
      timeout: 30000,
    }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const reply = parsed?.choices?.[0]?.message?.content?.trim();
          if (reply) {
            resolve(reply.replace(/^["'“”‘’]+|["'“”‘’]+$/g, ''));
          } else {
            reject(new Error(parsed?.error?.message || '大模型未返回推文正文'));
          }
        } catch (e) {
          reject(new Error(`解析大模型响应失败: ${e.message}`));
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('调用本地大模型超时 (30s)'));
    });
    req.on('error', err => reject(err));
    req.write(postData);
    req.end();
  });
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
    apex: { handle: '4ggug', enabled: true, rules: { careEnabled: false } },
    yijing: { handle: 'mrchen1998', enabled: true },
    skipReplyHandles: ['grok'],
  },
  specialReplies: { asksAi: '若被问及是否为 AI，请如实回答。', asksToStop: '若对方要求停止，请勿继续回复该讨论串。', care: '礼貌回应并围绕话题。', affection: '尊重回应，不诱导私下联系。', namedAddress: '以中性方式回应称呼。', daddy: '拒绝不合适的亲属角色扮演。', imperialTitle: '不宣称现实中的权力或身份。', vernacular: '仅在明确请求时翻译。' },
  rules: { skipFinanceComments: true, skipGrokMentions: false, doNotReplyAfterStopRequest: true, keepSensitiveKeyOutOfUi: true, mentionPauseDuringQuiet: true, mentionPauseDuringFullStop: true },
  postSettings: {
    enabled: true,
    intervalMinutes: 180,
    intervalMode: 'fixed',
    intervalSeconds: 180,
    // Random interval range in seconds (0 = use the fixed intervalSeconds).
    intervalMinSeconds: 0,
    intervalMaxSeconds: 0,
    queueBatchSize: 10,
    queueLowThreshold: 3,
    queueAutoRefill: true,
    queueMaxSize: 100,
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
    customPrompt: '你在推特(X)上用周天子姬霸的人设发一条原创推文。文风为幽默、古奥的文言文或诗词歌赋，自称周天子、姬霸或夫子，不要露骨，禁止提现代网络低俗梗，字数在30到90字之间。',
  },
  cruiseSettings: {
    enabled: true,
    dailyTargetCount: 50,
    crawlFollowing: true,
    crawlFollowers: true,
    interactionCooldownHours: 48,
    tierSweepHours: 6,
    commentsPerProfile: 1,
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

export function createService({ clock = () => Date.now(), paths = DEFAULT_TARGETS, configPath = CONFIG_PATH, targetsPath = null, platform = process.platform, spawnProcess = spawn, queuePath = POST_QUEUE_PATH, learningsPath = LEARNINGS_PATH, backupDir = CONFIG_BACKUP_DIR } = {}) {
  let activeConfigPath = configPath;
  const activeQueuePath = queuePath;
  const activeLearningsPath = learningsPath;
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
  const saveConfig = (value, expectedHash) => {
    const validated = validateConfig(value);
    const currentHash = hashCurrentConfig();
    if (expectedHash === undefined) throw new Error('缺少配置版本标识；请刷新状态后再保存');
    if (expectedHash !== currentHash) throw new Error('共享配置已被其他进程修改；请刷新状态并重新检查后再保存');
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
        cdpPort: t.port, cdpAvailable: await portListening(t.port), logTail, watchdogLogTail,
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
      ok: true, config: shared.config, configSource: shared.source, configPath: activeConfigPath, configHash,
      runtimeConfigApplied: shared.source === 'shared', runtimeCapabilities, fieldSide: FIELD_SIDE,
      dshModels,
      postQueue: postQueue.queue,
      postHistory: postHistory.slice(-20),
      learnings: readLearnings(activeLearningsPath),
      cruiseSweep: readCruiseSweep(),
      replyDiagnostics: readReplyDiagnostics(items.reply ? items.reply.stateDir : null),
      configBackups: listConfigBackups(activeBackupDir),
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
      const formatRule = onePerLine ? `\n\n${ONE_SENTENCE_RULE}` : '';
      const basePrompt = oneOffPrompt || postCfg.customPrompt || '你在推特(X)上用周天子姬霸的人设发一条原创推文。文风为幽默、古奥的文言文或诗词歌赋，自称周天子、姬霸或夫子，不要露骨，禁止提现代网络低俗梗，字数在30到90字之间。';
      // Learned patterns steer topic choice and structure; the writing style above stays authoritative.
      const learnings = readLearnings(activeLearningsPath);
      const influence = Number(postCfg.learningInfluence ?? 100);
      const learningBlock = (learningCfg.injectIntoPost === false || influence === 0)
        ? ''
        : buildLearningPromptBlock(learnings, { influence });
      const banned = new Set(learnings.bannedTopics.map(topic => topic.toLowerCase()));
      const configuredTopics = postCfg.topics && postCfg.topics.length ? postCfg.topics : ['文言雅趣', '日常随笔', '周朝掌故'];
      const preferred = learnings.winningTopics.filter(topic => !banned.has(topic.toLowerCase()));
      const topics = [...preferred, ...configuredTopics.filter(topic => !banned.has(String(topic).toLowerCase()))];
      const pool = topics.length ? topics : ['文言雅趣'];
      const model = postCfg.model || sharedCfg.model?.name || 'gpt-6-luna';
      const port = sharedCfg.model?.endpointPort || 3040;
      const maxSize = Number(postCfg.queueMaxSize) || 100;
      const generated = [];
      const failures = [];
      const themePlan = planThemeBatch(postCfg.topicMix, count);
      for (let i = 0; i < count; i++) {
        const topic = pool[Math.floor(Math.random() * pool.length)];
        const theme = themePlan[i] || pickTopicTheme(postCfg.topicMix);
        // When a weighted theme is active it owns the content direction; a random
        // topic hint would fight it, so the hint is dropped in that case.
        const themeBlock = theme
          ? `\n\n【本条主题方向：${theme.label}】（约占 ${theme.weight}%）${theme.prompt ? ` ${theme.prompt}` : ''}`
          : '';
        const topicHint = theme ? `\n（请紧扣「${theme.label}」这个主题方向，不要跑题）` : `\n（当前话题灵感参考：${topic}）`;
        const prompt = basePrompt + themeBlock + learningBlock + topicHint + formatRule;
        try {
          const rawDraft = await generateTweetViaLmh(prompt, { model, port });
          const draftText = onePerLine ? enforceOneSentencePerLine(rawDraft) : rawDraft;
          if (draftText) {
            generated.push({
              id: `post_ai_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
              text: draftText,
              topic,
              sig: postSettingsSignature(postCfg),
              theme: theme ? theme.label : '',
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
