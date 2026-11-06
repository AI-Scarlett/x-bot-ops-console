window.__ModuleLoader__.load({
  id: 'dsh-x-bot-ops-console',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const DESKTOP = window.location?.protocol === 'dsh-app:';
    const ROUTE = '/api/x-bot-ops-console';
    const NS = 'xBotOpsConsole';

    const zh = {
      panel: 'X 运维台', title: '𝕏 自动运维台', subtitle: '集中监控自动评论与提及回复，支持重点名单、通用公共配置与两项任务独立配置',
      refresh: '刷新状态', comment: '自动评论', reply: '提及回复', post: '自动发帖', profile: '主页巡航', worker: '工作进程', watchdog: '监控进程',
      heartbeat: '心跳年龄', chrome: 'Chrome 调试端口', pause: '暂停', resume: '恢复', start: '启动', stop: '停止', restart: '重启工作进程',
      logs: '最近日志', configuration: '运行配置', model: '模型', modelName: '模型名称', modelPort: '模型池端口覆盖',
      tiers: '重点名单与回复风格', handles: '用户名（逗号分隔）', rounds: '每条讨论串回复轮次上限', style: '该档回复风格 / 文风提示词',
      timing: '运行时段与节奏', specials: '特殊评论/回复场景提示词参考', rules: '通用安全与过滤规则', save: '保存并写入共享配置',
      unavailable: '无法连接本地插件服务。', yes: '运行中', no: '未运行', seconds: '秒', unknown: '未知',
      unsupported: '以下场景为两端 worker 的特殊判定规则；保存后将作为标准基准生效。',
      sourceInvalid: '共享配置内容错误、超限或版本已变化；保存前应刷新并核对 worker 配置。',
      conflict: '配置在编辑期间已被其他进程修改。草稿保留；请先刷新、对比并重新应用需要的修改。',
      confirmPause: '确认暂停该任务？', confirmResume: '确认清除到期或手动暂停标记？有效的 X 限流保护会被插件拒绝清除。',
      confirmStart: '确认启动该监控进程？不会重复启动已验证的监控进程。', confirmStop: '确认停止？监控进程会停止其托管的工作进程。',
      confirmRestart: '确认重启工作进程？将向身份已确认的进程发送终止信号，再由监控进程重新启动。',
      error: '操作失败：', checked: '检查时间', saved: '已保存，工作进程会在下轮读取。',
      launchRequested: '启动请求已提交，尚未确认成功；请刷新状态核对进程与心跳。', keySafe: '密钥仍只从 LocalModelHub 读取，界面不显示或保存。',
      errorLabel: '操作失败', pausedUntil: '暂停至', notConfigured: '未配置', sharedConfig: '共享配置', configPath: '配置文件', watchdogLogs: '看门狗诊断',
      configShared: '已创建：各个 worker 每轮读取此文件', configMissing: '尚未创建：保存后各个 worker 才会开始读取',
      configInvalid: '共享配置格式错误或内容超限；worker 可能回退到内置默认值，请检查原文件后再保存。',
      accepted: '接受', rejected: '不接受', workerAccept: 'worker 接受校验', commentWorker: '评论 worker', replyWorker: '回复 worker',
      watchdogUnavailable: '启动需在 console-targets.json 相应目标中设置 python、interpreterPidArgvToken、workerPidArgvToken 和 watchdogPidArgvToken；这些路径用于实际启动及核对进程身份。',
      noWatchdog: '看门狗未运行，暂停标记不会生效。请先启动看门狗，或按对应 worker 的文档恢复它。',
      notActuallyPaused: '已写入暂停标记，但 worker PID 仍在运行；等待看门狗下一轮确认，不代表已暂停。',
      pauseExpired: '暂停期限已过但标记仍存在；可能是看门狗未成功恢复。请检查诊断日志，不要提前删除限流保护。',
      builtin: '用 worker 内置名单填充', builtinStyle: '内置', both: '两侧生效', commentSide: '仅评论侧', replySide: '仅回复侧', postSide: '仅发帖侧', profileSide: '仅巡航侧', none: '未接入',
      modelNameHint: '仅回复 worker 使用；留空表示沿用内置默认模型（gpt-6-luna）。', portHint: '留空表示不覆盖内置值；仅评论 worker 会读取此端口覆盖。',
      styleHint: '留空表示沿用 worker 内置文风；回复 worker 会把这段要求追加到人设提示词。',
      roundsHint: '每条讨论串针对该用户的最多回复次数。仅回复 worker 读取。', handlesHint: '两个 worker 都读取重点名单；用户名重复或格式非法会被拒绝保存。',
      sourceMissing: '尚未创建共享配置。注意：保存空重点名单会覆盖并清空 worker 内置名单；请先点每档“用 worker 内置名单填充”，核对名单后再保存。',
      sourceShared: '当前显示的是已写入的共享配置。', pauseMinutes: '暂停分钟', running: '运行中',
      missingFiles: '未找到配置位置的工作进程或监控脚本；请在设置中核对脚本目录。',
      pidForeign: '发现进程身份未确认，控制已禁用', logEmpty: '暂无日志', heartbeatStatus: '心跳状态',
      detailMissing: '未找到进程编号文件', detailDead: '进程编号已失效', detailVerified: '身份已验证', detailForeign: '进程身份未确认',
      tabTiers: '👥 重点名单与个性化', tabGeneral: '🌐 通用与公共配置', tabComment: '💬 自动评论', tabReply: '↩️ 提及回复', tabPost: '📝 自动发帖', tabProfile: '🧭 主页巡航',
      addHandle: '＋ 添加', remove: '移除', removeHandle: '移除此名单', saveHint: '保存后各个 worker 会在下一轮读取时生效。',
    };
    const t = key => zh[key] || key;

    const C = {
      surface: 'var(--dsw-alias-bg-layer-1, transparent)',
      layerTwo: 'var(--dsw-alias-bg-layer-2, transparent)',
      raised: 'var(--dsw-alias-bg-layer-3, transparent)',
      border: 'var(--dsw-alias-border-l2, transparent)',
      text: 'var(--dsw-alias-label-primary, currentColor)',
      muted: 'var(--dsw-alias-label-secondary, currentColor)',
      faint: 'var(--dsw-alias-label-tertiary, currentColor)',
      accent: 'var(--dsw-alias-button-primary-fill, currentColor)',
      onAccent: 'var(--dsw-alias-label-primary-foreground, currentColor)',
      error: 'var(--dsw-alias-state-error-primary, currentColor)',
      success: 'var(--dsw-alias-state-success-primary, currentColor)',
    };
    const pageStyle = {
      display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '1120px', minWidth: 0, minHeight: 0,
      height: 'calc(100vh - 24px)', maxHeight: 'calc(100vh - 24px)', boxSizing: 'border-box', marginInline: 'auto',
      padding: '14px clamp(12px, 2vw, 26px) 32px', overflowX: 'hidden', overflowY: 'auto', overscrollBehaviorY: 'contain',
      WebkitOverflowScrolling: 'touch', color: C.text, background: C.surface, position: 'relative',
    };
    const cardStyle = { border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, background: C.layerTwo, width: '100%', boxSizing: 'border-box' };
    const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', margin: '4px 0 10px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, color: C.text };
    const labelStyle = { display: 'block', fontSize: 13, color: C.muted, marginTop: 8 };
    const buttonStyle = (primary = false, disabled = false) => ({
      padding: '7px 14px', border: `1px solid ${C.border}`, borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
      background: primary ? C.accent : C.surface, color: primary ? C.onAccent : C.text, opacity: disabled ? 0.55 : 1, fontSize: 13,
    });
    const badgeStyle = side => ({
      display: 'inline-block', marginLeft: 6, padding: '1px 6px', borderRadius: 6, fontSize: 11,
      border: `1px solid ${C.border}`, color: side === 'none' ? C.faint : C.muted, background: C.raised,
    });
    const sideText = side => (side === 'both' ? t('both') : side === 'comment' ? t('commentSide') : side === 'reply' ? t('replySide') : side === 'post' ? t('postSide') : side === 'profile' ? t('profileSide') : t('none'));

    const tierInfo = {
      apex: {
        title: '👑 Apex 档位（最高优先级 · 专属对象）',
        desc: '仅针对最高一档的专属用户。支持最露骨、直白的诗词文言互动，情欲直接表达，不受常规含蓄限制。',
        defaultWorkerVoice: '文言与诗词歌赋，直抒情欲与爱恋。',
        specialPersonNotice: '当前内置专属用户：4ggug（全系统唯一顶级优先）',
      },
      tier1: {
        title: '⭐ Tier 1 档位（核心互访与易经专属用户）',
        desc: '核心常来常往的关键好友。楚辞短章接话（必须有「兮」），含蓄委婉，把未尽之意留到私聊。',
        defaultWorkerVoice: '楚辞短章（含「兮」）。香草江岸，词句婉约。',
        specialPersonNotice: '特例人物：mrchen1998（在此档中专走《易经》卦象爻辞风格，不走楚辞，不要「兮」）',
      },
      tier2: {
        title: '🔷 Tier 2 档位（高频互动熟人）',
        desc: '第二档熟人群体。轻吟楚辞短章，香草江岸换着用（蕙、杜若、江离、芙蓉），情意旁敲侧击，不直说情欲。',
        defaultWorkerVoice: '楚辞短章（含「兮」）。客气温存，点到为止。',
        specialPersonNotice: '涵盖常互动用户：mzixioxio155612, xiaolikpo, lxl1818 等 21 人',
      },
      tier3: {
        title: '🔶 Tier 3 档位（活跃关注用户）',
        desc: '第三档活跃用户。楚辞短章客气轻应，言辞更克制婉约，薄帖也接，但只说眼前事，不挑明情意。',
        defaultWorkerVoice: '楚辞短章（含「兮」）。客气、克制收敛。',
        specialPersonNotice: '涵盖关注用户：sujing110, hamy8998, jojojo624824460, nz3219798 等',
      },
      tier4: {
        title: '⚪ Tier 4 档位（普通互关用户）',
        desc: '第四档互关用户。楚辞短章客气应一声，比第三档更收着，不轻轻撩拨，只围绕帖子本身。',
        defaultWorkerVoice: '楚辞短章（含「兮」）。更收敛客气。',
        specialPersonNotice: '涵盖普通互关：dmx_flame, julsix2333 等',
      },
      other: {
        title: '🌐 Other 档位（其他常规陌生用户）',
        desc: '不在重点名单中的普通公开推文用户。男女未知，全面避开情事、春情与身体，采用秦汉魏晋文言，风雅端庄。',
        defaultWorkerVoice: '秦汉魏晋古奥文言。拿掉情欲，吐纳风雅。',
        specialPersonNotice: '未分档的所有其他用户均归入此档规则',
      },
    };

    // Special people are fully operator-managed rows: add, edit, reorder and
    // delete all happen in the UI. Older configs only carried apex/yijing
    // objects, so the editor migrates those into rows as well — otherwise the
    // list would look empty until the first save.
    function normalizeSpecialRows(people) {
      const source = people && typeof people === 'object' ? people : {};
      if (Array.isArray(source.list)) {
        return source.list.filter(row => row && typeof row === 'object').map((row, index) => ({
          id: String(row.id || `sp_${index}`),
          label: String(row.label || row.handle || `特例人物 ${index + 1}`),
          handle: String(row.handle || '').toLowerCase(),
          enabled: row.enabled !== false,
          replyStyle: String(row.replyStyle || ''),
          rules: row.rules && typeof row.rules === 'object' ? row.rules : {},
        }));
      }
      const rows = [];
      for (const key of ['apex', 'yijing']) {
        const legacy = source[key];
        if (!legacy || typeof legacy !== 'object' || !legacy.handle) continue;
        rows.push({
          id: key,
          label: key === 'apex' ? 'Apex 专属对象' : '易经专属对象',
          handle: String(legacy.handle).toLowerCase(),
          enabled: legacy.enabled !== false,
          replyStyle: String(legacy.replyStyle || ''),
          rules: legacy.rules && typeof legacy.rules === 'object' ? legacy.rules : {},
        });
      }
      return rows;
    }

    const specialRowNote = id => (id === 'apex'
      ? '👑 最高优先级：文言与诗词歌赋，直抒情欲与爱恋，不受常规含蓄限制。'
      : id === 'yijing'
        ? '⭐ 易经特例：《易经》卦象与爻辞，阴阳吉凶往来、不走楚辞；该行启用时回复轮次不封顶。'
        : '自定义特例：命中该账号时，专属规则会作为附加提示词进入回复 Worker。');

    const specialLabel = key => ({
      asksAi: '🤖 被对方询问是否为 AI / 人机',
      asksToStop: '🛑 被对方要求停止回复',
      care: '💌 对方问候关怀（吃了吗/睡了吗）',
      affection: '❤️ 对方表达好感/爱意',
      namedAddress: '👑 特殊名号/称呼称谓（如姬霸/天子）',
      daddy: '🚷 亲属称呼要求（如叫爸爸）',
      imperialTitle: '🏛️ 对方称帝称皇/宣称特权',
      vernacular: '📜 请求白话翻译',
    }[key] || key);

    const specialDesc = key => ({
      asksAi: 'Worker 行为：直接用文言文坦率承认（如“是也，余乃机上所设之灵”），不否认不装活人。',
      asksToStop: 'Worker 行为：立即永久退出该讨论串，不再继续打扰。',
      care: 'Worker 行为：委婉以思念作答（如“念君之故兮，食不知味”），整句含含蓄楚辞风。',
      affection: 'Worker 行为：重点用户以楚辞温存回应，不写现代脏话或裸露身体部位。',
      namedAddress: 'Worker 行为：识别名号接住上文，保持尊崇典雅文风。',
      daddy: 'Worker 行为：坚决拒绝，以文言令其跪下叩首三次，绝不妥协。',
      imperialTitle: 'Worker 行为：严正教化，申明名器不可假人，回以天子诏令口吻。',
      vernacular: 'Worker 行为：若此前写过文言且对方请求翻译，则翻译为白话并放宽字数。',
    }[key] || '');

    const ruleLabel = key => ({
      skipFinanceComments: '跳过金融理财类推文（自动评论）',
      skipGrokMentions: '跳过 Grok 或竞品模型提及（提及回复）',
      doNotReplyAfterStopRequest: '收到停止请求后彻底静默该串',
      keepSensitiveKeyOutOfUi: '严格保护 API Key 不在前端界面显示或保存',
    }[key] || key);

    const timingFields = [
      ['commentWindowHours', 1, 48, 'comment', '评论取推时间窗口（近 N 小时）'],
      ['mentionWindowHours', 1, 48, 'reply', '提及通知处理窗口（近 N 小时）'],
      ['quietHoursStart', 0, 23, 'both', '重点账号夜间安静开始（小时）'],
      ['quietHoursEnd', 0, 24, 'both', '重点账号夜间安静结束（小时）'],
      ['fullStopStart', 0, 23, 'both', '全任务完全停止开始（小时）'],
      ['fullStopEnd', 0, 24, 'both', '全任务完全停止结束（小时）'],
      ['publishMinSeconds', 5, 3600, 'send', '发送最短间隔（秒）'],
      ['publishMaxSeconds', 5, 3600, 'send', '发送最长间隔（秒）'],
      ['authorCooldownSeconds', 60, 604800, 'comment', '同一博主再次评论冷却（秒）'],
      ['postingWorkMinutes', 1, 120, 'both', '连续运行工作时长（分钟）'],
      ['postingRestMinutes', 0, 60, 'both', '连续工作后强制休息时长（分钟）'],
      ['rateLimitMinutes', 1, 60, 'both', '触发常规限流等待时长（分钟）'],
      ['rateLimitLongMinutes', 1, 120, 'both', '连续第 4 次限流等待时长（分钟）'],
    ];

    class SafeBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }
      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }
      componentDidCatch(error, info) {
        console.error('x-bot-ops-console error caught by boundary:', error, info);
      }
      render() {
        if (this.state.hasError) {
          return h('main', { style: pageStyle },
            h('h1', { style: { fontSize: 20 } }, t('title')),
            h('div', { style: { padding: '14px 16px', background: C.raised, border: `1px solid ${C.error}`, borderRadius: 10, margin: '16px 0' } },
              h('h3', { style: { margin: '0 0 8px', color: C.error, fontSize: 15 } }, '界面渲染遇到错误'),
              h('pre', { style: { whiteSpace: 'pre-wrap', fontSize: 12, color: C.text, margin: 0 } }, String(this.state.error?.message || this.state.error))),
            h('button', { type: 'button', style: buttonStyle(true), onClick: () => this.setState({ hasError: false, error: null }) }, '重试恢复'));
        }
        return this.props.children;
      }
    }

    // Saving used to post the whole in-memory config, so any field the user had
    // not touched could be overwritten by a stale snapshot (prompts were lost that
    // way). These helpers let a save start from the freshest disk config and apply
    // only the paths the operator actually changed.
    const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

    function diffConfigPaths(base, next, prefix = [], out = []) {
      if (isPlainObject(base) && isPlainObject(next)) {
        const keys = new Set([...Object.keys(base), ...Object.keys(next)]);
        for (const key of keys) diffConfigPaths(base[key], next[key], [...prefix, key], out);
        return out;
      }
      if (JSON.stringify(base) !== JSON.stringify(next)) out.push(prefix);
      return out;
    }

    function readConfigPath(source, path) {
      let node = source;
      for (const key of path) {
        if (node === null || node === undefined) return undefined;
        node = node[key];
      }
      return node;
    }

    function writeConfigPath(target, path, value) {
      let node = target;
      for (let i = 0; i < path.length - 1; i += 1) {
        const key = path[i];
        if (!isPlainObject(node[key])) node[key] = {};
        node = node[key];
      }
      node[path[path.length - 1]] = value;
    }

    // Overlay only the changed paths onto the freshest config from disk.
    function composeSaveConfig(current, baseline, fresh) {
      if (!baseline || !fresh) return current;
      let paths;
      try { paths = diffConfigPaths(baseline, current); } catch { return current; }
      if (!paths.length) return fresh;
      if (paths.some(path => path.length === 0)) return current;
      const merged = JSON.parse(JSON.stringify(fresh));
      for (const path of paths) writeConfigPath(merged, path, readConfigPath(current, path));
      return merged;
    }

    function Panel() {
      const [state, setState] = React.useState(null);
      const [error, setError] = React.useState('');
      const [notice, setNotice] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [updating, setUpdating] = React.useState(false);
      const [config, setConfig] = React.useState(null);
      const [configHash, setConfigHash] = React.useState(null);
      const [draftDirty, setDraftDirty] = React.useState(false);
      const [activeTab, setActiveTab] = React.useState('general');
      const [pause, setPause] = React.useState({ comment: 30, reply: 30, post: 30, profile: 30 });
      const [confirmModal, setConfirmModal] = React.useState(null);
      const [manualPostText, setManualPostText] = React.useState('');
      const [generatingDrafts, setGeneratingDrafts] = React.useState(false);
      const [showGenPanel, setShowGenPanel] = React.useState(false);
      const [draftGenCount, setDraftGenCount] = React.useState(10);
      const [draftGenPrompt, setDraftGenPrompt] = React.useState('');
      // Free-text drafts for comma/space separated fields. These inputs keep the
      // raw text locally so a typed separator is never swallowed by re-parsing
      // on every keystroke; the parsed array is committed on blur and on save.
      const [topicsText, setTopicsText] = React.useState('');
      const [skipHandlesText, setSkipHandlesText] = React.useState('');
      const [tierHandlesText, setTierHandlesText] = React.useState({});
      const [learnPasteText, setLearnPasteText] = React.useState('');
      const [learnBusy, setLearnBusy] = React.useState(false);
      const [styleGuideDraft, setStyleGuideDraft] = React.useState('');
      const [bannedDraft, setBannedDraft] = React.useState('');
      const saveLock = React.useRef(false);
      const latestSaveHash = React.useRef(null);
      const serverSnapshot = React.useRef(null);

      const refresh = React.useCallback(async ({ preserveDraft = false } = {}) => {
        try {
          const response = await fetch(ROUTE, { cache: 'no-store' });
          const data = await response.json();
          if (!response.ok || data.ok === false) throw new Error(data.error || `请求失败，状态码 ${response.status}`);
          setState(data);
          serverSnapshot.current = data.config;
          if (!draftDirty && !preserveDraft) {
            setConfig(data.config);
            // Seed the free-text drafts from the server so the inputs show the
            // stored values while no local edit is in flight.
            setTopicsText((data.config?.postSettings?.topics || []).join(', '));
            setSkipHandlesText((data.config?.specialPersons?.skipReplyHandles || []).join(', '));
            const tierText = {};
            for (const tier of data.config?.tiers || []) tierText[tier.id] = (tier.handles || []).join(', ');
            setTierHandlesText(tierText);
          }
          setConfigHash(data.configHash ?? null);
          latestSaveHash.current = data.configHash ?? null;
          setError('');
        } catch (err) {
          setError(`${t('unavailable')} ${err.message || ''}`);
        }
      }, [draftDirty]);
      React.useEffect(() => { void refresh(); const timer = setInterval(() => void refresh(), 15000); return () => clearInterval(timer); }, [refresh]);

      const act = async (action, target, extra = {}) => {
        if (action === 'save-config' && saveLock.current) return;
        if (action === 'save-config') saveLock.current = true;
        setBusy(true); setError('');
        if (action !== 'update-plugin') setNotice('');
        try {
          const response = await fetch(ROUTE, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, target, ...extra }) });
          const data = await response.json();
          if (!response.ok || data.ok !== true) throw new Error(data.error || `请求失败，状态码 ${response.status}`);
          const value = data.value || {};
          if (action === 'save-config') { setNotice(value.note || t('saved')); setConfig(value.config); setConfigHash(value.configHash ?? null); latestSaveHash.current = value.configHash ?? null; setDraftDirty(false); }
          else if (action === 'update-plugin') { /* handled by caller */ }
          else if (value.launchRequested) setNotice(t('launchRequested'));
          else if (value.note) setNotice(value.note);
          await refresh();
          return value;
        } catch (err) {
          const message = err.message || String(err);
          setError(`${t('error')}${message}`);
          if (action === 'save-config' && message.includes('共享配置已被其他进程修改')) {
            setNotice(t('conflict'));
            await refresh({ preserveDraft: true });
          }
        } finally {
          if (action === 'save-config') saveLock.current = false;
          setBusy(false);
        }
      };

      if (!config) return h('main', { style: pageStyle }, h('h1', null, t('title')), error || '…');

      const updateConfig = fn => { setConfig(current => fn(current)); setDraftDirty(true); };
      const splitList = value => String(value || '').split(/[\s,，]+/).map(x => x.trim().replace(/^@/, '').toLowerCase()).filter(Boolean);
      const splitTopics = value => String(value || '').split(/[,，\s]+/).map(x => x.trim()).filter(Boolean);
      const setTier = (index, key, value) => updateConfig(current => ({
        ...current,
        tiers: (current.tiers || []).map((tier, i) => {
          if (i !== index) return tier;
          if (key === 'handles') {
            const handles = Array.isArray(value)
              ? value.map(x => String(x || '').trim().replace(/^@/, '').toLowerCase()).filter(Boolean)
              : splitList(value);
            return { ...tier, handles };
          }
          return { ...tier, [key]: value };
        }),
      }));
      const setPostFormat = (key, value) => updateConfig(c => ({
        ...c,
        postSettings: { ...(c.postSettings || {}), format: { ...(c.postSettings?.format || {}), [key]: value } },
      }));
      const setPostDedupe = (key, value) => updateConfig(c => ({
        ...c,
        postSettings: { ...(c.postSettings || {}), dedupe: { ...(c.postSettings?.dedupe || {}), [key]: value } },
      }));
      const setPostCap = (key, value) => updateConfig(c => ({
        ...c,
        postSettings: { ...(c.postSettings || {}), politicalCap: { ...(c.postSettings?.politicalCap || {}), [key]: value } },
      }));

      const addBanned = () => {
        const items = bannedDraft.split(/[,，\n]+/).map(item => item.trim()).filter(Boolean);
        if (!items.length) return;
        updateConfig(current => {
          const existing = current.postSettings?.manualBannedTopics || [];
          const merged = [...new Set([...existing, ...items])].slice(0, 200);
          return { ...current, postSettings: { ...(current.postSettings || {}), manualBannedTopics: merged } };
        });
        setBannedDraft('');
        setNotice(`已加入 ${items.length} 个避写话题，记得点保存。`);
      };

      const setTiming = (key, value) => updateConfig(current => ({ ...current, timing: { ...current.timing, [key]: value } }));
      const setSkipHandles = value => updateConfig(current => ({ ...current, specialPersons: { ...current.specialPersons, skipReplyHandles: Array.isArray(value) ? value : splitList(value) } }));

      // Special-person rows: one config array drives the whole editor.
      const specialRows = normalizeSpecialRows(config?.specialPersons);
      const setSpecialRows = updater => updateConfig(current => ({
        ...current,
        specialPersons: {
          ...(current.specialPersons || {}),
          list: updater(normalizeSpecialRows(current.specialPersons)),
        },
      }));
      const updateSpecialRow = (id, patch) => setSpecialRows(rows => rows.map(row => (row.id === id ? { ...row, ...patch } : row)));
      const removeSpecialRow = id => setSpecialRows(rows => rows.filter(row => row.id !== id));
      const moveSpecialRow = (id, delta) => setSpecialRows(rows => {
        const index = rows.findIndex(row => row.id === id);
        const target = index + delta;
        if (index < 0 || target < 0 || target >= rows.length) return rows;
        const next = rows.slice();
        next.splice(target, 0, next.splice(index, 1)[0]);
        return next;
      });
      const addSpecialRow = () => setSpecialRows(rows => {
        const taken = new Set(rows.map(row => row.id));
        let seq = rows.length + 1;
        while (taken.has(`sp_${seq}`)) seq += 1;
        return [...rows, { id: `sp_${seq}`, label: `特例人物 ${seq}`, handle: '', enabled: true, replyStyle: '', rules: {} }];
      });

      const askConfirm = (promptKey, onConfirm) => setConfirmModal({ prompt: t(promptKey), onConfirm });
      const askConfirmText = (prompt, onConfirm) => setConfirmModal({ prompt, onConfirm });

      const SideBadge = ({ side }) => h('span', { style: badgeStyle(side) }, sideText(side));
      const StatusLine = ({ label, value, tone }) => h('div', { style: { display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' } },
        h('span', { style: { color: C.muted, fontSize: 12 } }, label),
        h('strong', { style: { color: tone || C.text, fontSize: 13 } }, value));

      const ModelPicker = ({ value, onChange, side = 'both', label = '推理大模型选择' }) => {
        const dshList = Array.isArray(state?.dshModels) && state.dshModels.length > 0 ? state.dshModels : ['gpt-6-luna', 'gemini-3.8-flash-high', 'claude-opus-5-5-high', 'claude-sonnet-5-5-high', 'grok-4.7'];
        return h('div', { style: { marginTop: 10 } },
          h('label', { style: labelStyle }, label, h(SideBadge, { side })),
          h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
            h('select', {
              style: { ...inputStyle, flex: '1 1 50%', cursor: 'pointer' },
              value: dshList.includes(value) ? value : (value ? '__custom__' : ''),
              onChange: e => {
                if (e.target.value === '__custom__') return;
                onChange(e.target.value);
              }
            },
              h('option', { value: '' }, '-- 默认（留空沿用全局/默认模型）--'),
              ...dshList.map(m => h('option', { key: m, value: m }, `DSH 模型: ${m}`)),
              h('option', { value: '__custom__' }, '✎ 手动输入其他模型名称...')
            ),
            h('input', {
              style: { ...inputStyle, flex: '1 1 50%' },
              value: value || '',
              placeholder: '或直接输入模型名称，例如 gpt-6-luna',
              onChange: e => onChange(e.target.value.trim())
            })
          ),
          h('small', { style: { color: C.faint, fontSize: 11, display: 'block', marginTop: 4 } },
            '已自动读取 DSH 当前环境配置的大模型列表，可直接下拉选择，或在右侧输入框自定义。'
          )
        );
      };

      const statusCard = (key, label) => {
        const item = state?.items?.[key] || {};
        const pausePending = item.pausedUntil && item.pausedUntil > (state?.checkedAt ? new Date(state.checkedAt).getTime() / 1000 : Date.now() / 1000);
        const pauseActive = pausePending && (!item.worker?.running || item.worker.owned) && item.watchdog?.running && item.watchdog.owned;
        const pauseError = pausePending && (!item.watchdog?.running || !item.watchdog.owned || (item.worker?.running && !item.worker.owned));
        const pauseExpired = item.pausedUntil && !pausePending;
        const controlsEnabled = item.controlsEnabled !== false;
        const foreign = (item.worker?.running && !item.worker.owned) || (item.watchdog?.running && !item.watchdog.owned);
        const disabledReason = foreign ? t('pidForeign') : t('missingFiles');
        const startNeedsPython = !item.watchdog?.running && !item.worker?.running && !item.pythonConfigured;
        const run = (action, text, prompt, primary = false) => h('button', {
          disabled: busy || !controlsEnabled || (action === 'start' && startNeedsPython),
          onClick: () => askConfirm(prompt, () => act(action, key)),
          style: buttonStyle(primary),
        }, t(text));
        return h('section', { style: cardStyle, key },
          h('header', { style: { display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' } },
            h('h2', { style: { margin: 0, fontSize: 16 } }, label),
            h('strong', { style: { color: item.worker?.running ? C.success : C.muted, fontSize: 13 } }, item.worker?.running ? t('running') : t('no'))),
          h('div', { style: { display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 } },
            StatusLine({ label: `${t('worker')} PID`, value: item.worker?.pid || t('unknown'), tone: item.worker?.running ? C.success : C.muted }),
            StatusLine({ label: `${t('watchdog')} PID`, value: item.watchdog?.pid || t('unknown'), tone: item.watchdog?.running ? C.success : C.muted }),
            StatusLine({ label: t('heartbeat'), value: item.heartbeatAgeSeconds == null ? t('unknown') : `${item.heartbeatAgeSeconds}${t('seconds')}`, tone: item.heartbeatAgeSeconds != null && item.heartbeatAgeSeconds < 180 ? C.success : C.muted }),
            StatusLine({ label: t('chrome'), value: `${item.cdpPort} · ${item.cdpAvailable ? t('yes') : t('no')}`, tone: item.cdpAvailable ? C.success : C.muted })),
          h('p', { style: { margin: '8px 0 0', fontSize: 12, color: C.faint } },
            `${t('worker')}: ${item.worker?.running ? (item.worker.owned ? t('detailVerified') : t('detailForeign')) : t('detailDead')} · `,
            `${t('watchdog')}: ${item.watchdog?.running ? (item.watchdog.owned ? t('detailVerified') : t('detailForeign')) : t('detailMissing')}`),
          pauseActive ? h('p', { role: 'status', style: { margin: '8px 0 0', fontSize: 13, color: C.muted } }, `⏸ ${item.worker?.running ? t('notActuallyPaused') : t('pausedUntil')} ${new Date(item.pausedUntil * 1000).toLocaleString()} · ${item.pauseReason === 'rate_limit' ? 'X 限流保护' : '手动暂停'}`) : null,
          pauseError ? h('p', { role: 'alert', style: { margin: '8px 0 0', fontSize: 13, color: C.error } }, (!item.watchdog?.running || !item.watchdog.owned) ? t('noWatchdog') : '检测到暂停标记，但无法确认工作进程身份；看门狗拒绝操作该 PID。请核对 PID 文件与进程命令。') : null,
          pauseExpired ? h('p', { role: 'alert', style: { margin: '8px 0 0', fontSize: 13, color: C.error } }, t('pauseExpired')) : null,
          !controlsEnabled ? h('p', { role: 'alert', style: { margin: '8px 0 0', fontSize: 13, color: C.error } },
            `${disabledReason}（${t('worker')}：${item.workerScriptExists ? '存在' : '缺失'}；${t('watchdog')}：${item.watchdogScriptExists ? '存在' : '缺失'}）`) : null,
          startNeedsPython ? h('p', { role: 'alert', style: { margin: '8px 0 0', fontSize: 13, color: C.error } }, t('watchdogUnavailable')) : null,
          h('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 } },
            h('input', { type: 'number', min: 1, max: 1440, value: pause[key] || 30, onChange: e => setPause(current => ({ ...current, [key]: Number(e.target.value) || 30 })), style: { ...inputStyle, width: 96, margin: 0 } }),
            h('span', { style: { fontSize: 12, color: C.faint } }, t('pauseMinutes')),
            h('button', { disabled: busy || !controlsEnabled || !item.watchdog?.running || !item.watchdog?.owned, onClick: () => askConfirm('confirmPause', () => act('pause', key, { minutes: pause[key] })), style: buttonStyle(true) }, t('pause')),
            h('button', { disabled: busy || !controlsEnabled || !pausePending || !item.watchdog?.running || !item.watchdog?.owned, onClick: () => askConfirm('confirmResume', () => act('resume', key)), style: buttonStyle() }, t('resume')),
            run('start', 'start', 'confirmStart'),
            run('stop', 'stop', 'confirmStop'),
            run('restart', 'restart', 'confirmRestart')),
          item.logTail ? h('details', { style: { marginTop: 12 } }, h('summary', { style: { fontSize: 13, color: C.muted } }, `${t('logs')}（已脱敏尾部）`),
            h('pre', { style: { whiteSpace: 'pre-wrap', maxHeight: 240, overflow: 'auto', fontSize: 12, background: C.raised, padding: 10, borderRadius: 8 } }, item.logTail)) : null,
          item.watchdogLogTail ? h('details', { style: { marginTop: 8 } }, h('summary', { style: { fontSize: 13, color: C.muted } }, t('watchdogLogs')),
            h('pre', { style: { whiteSpace: 'pre-wrap', maxHeight: 240, overflow: 'auto', fontSize: 12, background: C.raised, padding: 10, borderRadius: 8 } }, item.watchdogLogTail)) : null);
      };

      const acceptance = state?.workerAcceptance;
      const sourceText = state?.configSource === 'shared' ? t('configShared') : state?.configSource === 'invalid' ? t('configInvalid') : t('configMissing');
      const sourceColor = state?.configSource === 'shared' ? C.success : state?.configSource === 'invalid' ? C.error : C.muted;

      // 显式胶囊式 Tab 样式，对比度极高，选中高亮明显
      const tabItemStyle = key => {
        const active = activeTab === key;
        return {
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: '8px 16px', borderRadius: 8, border: `1px solid ${active ? C.accent : C.border}`,
          background: active ? C.accent : C.layerTwo, color: active ? C.onAccent : C.text,
          fontWeight: active ? '600' : 'normal', fontSize: 13, cursor: 'pointer',
          userSelect: 'none', transition: 'all 0.15s ease', flexShrink: 0,
        };
      };

      return h('main', { style: pageStyle },
        h('header', { style: { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' } },
          h('div', null,
            h('h1', { style: { margin: 0, fontSize: 22, display: 'flex', alignItems: 'center', gap: 8 } },
              h('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'currentColor' },
                h('path', { d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' })),
              t('title')),
            h('p', { style: { margin: '4px 0 0', fontSize: 13, color: C.muted } }, t('subtitle'))),
          h('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' } },
            h('span', {
              title: state?.pluginVersion ? '版本号读取自已安装插件的 package.json' : '宿主进程还没重新加载插件（重启 DSH 后自动显示真实版本）',
              style: { padding: '4px 8px', borderRadius: 6, fontSize: 11, background: C.layerTwo, color: state?.pluginVersion ? C.muted : C.accent, border: `1px solid ${C.border}` },
            }, state?.pluginVersion ? `v${state.pluginVersion}` : 'v? 待宿主重载'),
            h('button', {
              type: 'button',
              disabled: busy || updating,
              onClick: () => {
                setConfirmModal({
                  title: '一键自动更新插件',
                  prompt: '是否立即自动更新插件至最新版本？\n\n插件将通过 DSH 内置包管理器直接从 GitHub (AI-Scarlett/x-bot-ops-console) 拉取并安装最新代码。整个过程全自动，无需手动复制地址或重装。更新后刷新界面即可生效。',
                  confirmText: '开始自动更新',
                  onConfirm: async () => {
                    setUpdating(true);
                    setError('');
                    setNotice('正在通过 DSH 内置包管理器连接 GitHub 下载并安装最新版本，请稍候约 10-15 秒...');
                    try {
                      const res = await act('update-plugin');
                      if (res && res.success) {
                        const ver = res.results?.[0]?.updatedVersion ? ` (v${res.results[0].updatedVersion})` : '';
                        const commit = res.results?.[0]?.commit ? ` [${res.results[0].commit.slice(0, 7)}]` : '';
                        setNotice(`🎉 插件已成功通过 DSH 更新${ver}${commit}！按快捷键 Cmd+R 刷新窗口即可生效。`);
                      }
                    } catch (err) {
                      setError(`自动更新失败：${err.message || String(err)}。如遇网络波动，可手动在 DSH 插件管理中安装【github:AI-Scarlett/x-bot-ops-console】。`);
                    } finally {
                      setUpdating(false);
                    }
                  }
                });
              },
              style: {
                ...buttonStyle(false),
                background: 'rgba(56, 189, 248, 0.12)',
                borderColor: 'rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                fontWeight: '600',
              }
            }, updating ? '⏳ 正在通过 DSH 更新...' : '🔄 自动更新'),
            h('button', { disabled: busy || updating, onClick: () => void refresh(), style: buttonStyle() }, t('refresh')),
            state?.checkedAt ? h('small', { style: { color: C.faint } }, `${t('checked')}：${new Date(state.checkedAt).toLocaleTimeString()}`) : null)),

        error ? h('p', { role: 'alert', style: { margin: 0, padding: '10px 12px', borderRadius: 10, background: C.raised, color: C.error, fontSize: 13 } }, error) : null,
        notice ? h('div', { role: 'status', style: { margin: 0, padding: '10px 14px', borderRadius: 10, background: C.raised, color: C.success, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 } },
          h('span', null, notice),
          notice.includes('刷新') ? h('button', { type: 'button', style: { ...buttonStyle(true), padding: '4px 10px', fontSize: 12 }, onClick: () => window.location.reload() }, '立即刷新网页') : null
        ) : null,

        // 显式胶囊式 Tab 导航栏（置顶吸顶 Sticky，始终固定在可视区域最上方，不被长列表或滚动挤压）
        h('div', {
          style: {
            position: 'sticky', top: 0, zIndex: 100,
            display: 'flex', gap: 8, padding: '10px 12px', background: C.surface,
            border: `1px solid ${C.border}`, borderRadius: 12, margin: '0 0 4px',
            overflowX: 'auto', flexWrap: 'wrap', alignItems: 'center', flexShrink: 0,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)', backdropFilter: 'blur(8px)',
          }
        },
          h('button', { type: 'button', style: tabItemStyle('general'), onClick: () => setActiveTab('general') }, t('tabGeneral')),
          h('button', { type: 'button', style: tabItemStyle('comment'), onClick: () => setActiveTab('comment') }, t('tabComment')),
          h('button', { type: 'button', style: tabItemStyle('reply'), onClick: () => setActiveTab('reply') }, t('tabReply')),
          h('button', { type: 'button', style: tabItemStyle('post'), onClick: () => setActiveTab('post') }, t('tabPost')),
          h('button', { type: 'button', style: tabItemStyle('learning'), onClick: () => setActiveTab('learning') }, '🧠 发帖学习'),
          h('button', { type: 'button', style: tabItemStyle('profile'), onClick: () => setActiveTab('profile') }, t('tabProfile')),
          h('button', { type: 'button', style: tabItemStyle('tiers'), onClick: () => setActiveTab('tiers') }, t('tabTiers'))),

        // TAB 1: 👥 重点名单与个性化配置（独立维护专区）
        activeTab === 'tiers' ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
          // 1. 关键特例人物专属回复配置
          h('section', { style: { ...cardStyle, background: C.layerTwo } },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 } },
              h('div', null,
                h('h2', { style: { margin: 0, fontSize: 16 } }, '🌟 关键特例人物专属回复配置（Special Person Rules）'),
                h('p', { style: { margin: '4px 0 0', fontSize: 12, color: C.faint } }, '名单在这里全量维护：可新增、改账号名、改专属规则、调顺序、启用或禁用、直接删除。保存后两端 Worker 下一轮读取生效。')),
              h('span', { style: { fontSize: 12, color: C.accent, background: C.raised, padding: '4px 8px', borderRadius: 6 } }, 'Worker 核心内置策略')),
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 14 } },
              h('p', { style: { margin: 0, fontSize: 12, color: C.faint, lineHeight: 1.6 } },
                `当前 ${specialRows.length} 个特例人物。账号名忽略大小写与 @ 前缀，命中后专属规则会作为附加提示词进入回复 Worker；新增行只在保存后生效。`),
              h('button', { type: 'button', style: buttonStyle(true), onClick: addSpecialRow }, '➕ 添加特例人物')),
            specialRows.length === 0
              ? h('div', { style: { marginTop: 12, padding: 14, border: `1px dashed ${C.border}`, borderRadius: 10, color: C.faint, fontSize: 12 } }, '还没有特例人物，点击「添加特例人物」新增一行。')
              : null,
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 } },
              ...specialRows.map((person, index) => h('div', {
                key: person.id,
                style: { background: C.surface, border: `1px solid ${person.enabled === false ? C.border : C.accent}`, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, opacity: person.enabled === false ? 0.72 : 1 },
              },
                h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
                  h('strong', { style: { fontSize: 14, color: C.text } },
                    `${person.enabled === false ? '⏸' : '✅'} ${person.label || '未命名'}${person.handle ? ` · @${person.handle}` : ' · 未填账号'}`),
                  h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
                    h('button', { type: 'button', style: { ...buttonStyle(), padding: '3px 9px', fontSize: 12 }, disabled: index === 0, onClick: () => moveSpecialRow(person.id, -1) }, '↑ 上移'),
                    h('button', { type: 'button', style: { ...buttonStyle(), padding: '3px 9px', fontSize: 12 }, disabled: index === specialRows.length - 1, onClick: () => moveSpecialRow(person.id, 1) }, '↓ 下移'),
                    h('button', { type: 'button', style: { ...buttonStyle(), padding: '3px 9px', fontSize: 12, color: C.error }, onClick: () => { removeSpecialRow(person.id); setNotice(`已删除特例人物「${person.label || person.handle || '未命名'}」，记得点保存。`); } }, '🗑 删除'))),
                h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 } },
                  h('label', { style: labelStyle }, 'X 账号名（不带 @）',
                    h('input', {
                      style: inputStyle, maxLength: 15, placeholder: '例如 4ggug',
                      value: person.handle || '',
                      onChange: e => updateSpecialRow(person.id, { handle: e.target.value.replace(/[^A-Za-z0-9_]/g, '').toLowerCase() }),
                    })),
                  h('label', { style: labelStyle }, '显示名称（只影响界面）',
                    h('input', { style: inputStyle, maxLength: 40, value: person.label || '', onChange: e => updateSpecialRow(person.id, { label: e.target.value }) })),
                  h('label', { style: { ...labelStyle, display: 'flex', gap: 8, alignItems: 'center', marginTop: 28, fontSize: 13 } },
                    h('input', { type: 'checkbox', checked: person.enabled !== false, onChange: e => updateSpecialRow(person.id, { enabled: e.target.checked }) }), '启用该人物特例')),
                h('div', { style: { fontSize: 12, color: C.muted } }, specialRowNote(person.id)),
                h('label', { style: labelStyle }, '专属回复规则 / 附加提示词（空白则只用 Worker 内置规则）',
                  h('textarea', {
                    style: { ...inputStyle, minHeight: 88 }, maxLength: 4000,
                    value: person.replyStyle || '',
                    placeholder: '例如：聊两性，撩骚；或：遇到易经的帖子专门跟它聊易经',
                    onChange: e => updateSpecialRow(person.id, { replyStyle: e.target.value }),
                  })),
                person.id === 'apex'
                  ? h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 } },
                    h('input', {
                      type: 'checkbox', checked: person.rules?.careEnabled !== true,
                      onChange: e => updateSpecialRow(person.id, { rules: { ...(person.rules || {}), careEnabled: !e.target.checked } }),
                    }), '禁用日常问候关怀分支')
                  : null)),
            ),
            h('section', { style: { marginTop: 12, padding: 14, border: `1px solid ${C.border}`, borderRadius: 10, background: C.surface } },
              h('h3', { style: { margin: '0 0 6px', fontSize: 14 } }, '🤖 回复时跳过名单'),
              h('p', { style: { margin: '0 0 8px', fontSize: 12, color: C.faint } }, '这些句柄不会进入 mention 回复流程；支持增加、删除和批量粘贴。'),
              h('textarea', {
                style: { ...inputStyle, minHeight: 70, fontFamily: 'monospace' },
                value: skipHandlesText,
                onChange: e => setSkipHandlesText(e.target.value),
                onBlur: e => {
                  const parsed = splitList(e.target.value);
                  setSkipHandlesText(parsed.join(', '));
                  setSkipHandles(parsed);
                },
              }),
              h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 } }, ...(config?.specialPersons?.skipReplyHandles || []).map(handle => h('button', { type: 'button', key: handle, onClick: () => setSkipHandles((config.specialPersons.skipReplyHandles || []).filter(item => item !== handle)), style: { ...buttonStyle(), padding: '3px 8px', fontSize: 11 } }, `@${handle} ×`))))),

          // 2. 重点人群分层名单维护
          h('section', { style: { ...cardStyle, background: C.layerTwo } },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 } },
              h('div', null,
                h('h2', { style: { margin: 0, fontSize: 16 } }, '👥 重点人群分层名单与针对性配置'),
                h('p', { style: { margin: '4px 0 0', fontSize: 12, color: C.faint } }, '各档位已同步标准回复轮次（Apex 30轮、Tier 1 20轮、Tier 2 10轮、Tier 3 5轮、Tier 4 4轮、其他 3轮）。两端 Worker 实时联动。')),
              h('span', { style: { fontSize: 12, color: C.accent, background: C.raised, padding: '4px 8px', borderRadius: 6 } }, '实时双端生效')),

            ...(config?.tiers || []).map((tier, index) => {
              const info = tierInfo[tier.id] || { title: tier.id, desc: '', defaultWorkerVoice: '', specialPersonNotice: '' };
              const builtin = state?.items?.comment?.priorityHandles?.[tier.id] || [];
              const handlesList = Array.isArray(tier.handles) ? tier.handles : [];
              return h('div', {
                key: tier.id,
                style: {
                  border: `1px solid ${C.border}`, borderRadius: 12, margin: '14px 0', padding: 16,
                  background: C.surface, boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }
              },
                h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 } },
                  h('h3', { style: { margin: 0, fontSize: 15, fontWeight: '600' } }, info.title),
                  h('span', { style: { fontSize: 12, color: C.muted } }, `已配置 ${handlesList.length} 人`)),
                h('p', { style: { margin: '6px 0 4px', fontSize: 12, color: C.muted, lineHeight: 1.5 } }, info.desc),
                info.specialPersonNotice ? h('div', {
                  style: {
                    margin: '6px 0 10px', padding: '6px 10px', borderRadius: 6,
                    background: C.raised, borderLeft: `3px solid ${C.accent}`, fontSize: 12, color: C.text,
                  }
                }, `💡 关键人物特例：${info.specialPersonNotice}`) : null,

                h('div', { style: { margin: '10px 0 4px' } },
                  h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 } },
                    h('label', { style: { ...labelStyle, margin: 0, fontWeight: '500' } }, '关注用户名列表（支持逗号或空格分隔）：', h(SideBadge, { side: 'both' })),
                    builtin.length ? h('button', {
                      type: 'button', disabled: busy,
                      onClick: () => {
                        setTier(index, 'handles', builtin);
                        setTierHandlesText(current => ({ ...current, [tier.id]: builtin.join(', ') }));
                      },
                      style: { ...buttonStyle(), padding: '3px 8px', fontSize: 11 },
                    }, '一键恢复内置名单') : null),
                  h('textarea', {
                    style: { ...inputStyle, minHeight: 64, margin: '4px 0 6px', fontFamily: 'monospace', fontSize: 13 },
                    value: tierHandlesText[tier.id] ?? handlesList.join(', '),
                    placeholder: '例如：user1, user2, user3',
                    onChange: e => setTierHandlesText(current => ({ ...current, [tier.id]: e.target.value })),
                    onBlur: e => {
                      const parsed = splitList(e.target.value);
                      setTierHandlesText(current => ({ ...current, [tier.id]: parsed.join(', ') }));
                      setTier(index, 'handles', parsed);
                    },
                  }),
                  h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 } },
                    ...handlesList.map(handle => h('button', { key: handle, type: 'button', disabled: busy, title: `移除 @${handle}`, onClick: () => { const next = handlesList.filter(item => item !== handle); setTier(index, 'handles', next); setTierHandlesText(current => ({ ...current, [tier.id]: next.join(', ') })); }, style: { ...buttonStyle(), padding: '3px 8px', fontSize: 11 } }, `@${handle} ×`)),
                    !handlesList.length ? h('small', { style: { color: C.faint } }, '名单为空，可在上方输入框新增。') : null)),

                h('div', { style: { display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10 } },
                  h('div', { style: { flex: '1 1 200px' } },
                    h('label', { style: { ...labelStyle, margin: 0 } }, '该人群单串回复轮次上限：', h(SideBadge, { side: 'reply' })),
                    h('input', {
                      type: 'number', min: 1, max: 1000, style: { ...inputStyle, margin: '6px 0 4px' },
                      value: tier.rounds, onChange: e => setTier(index, 'rounds', Number(e.target.value))
                    }),
                    h('small', { style: { color: C.faint, fontSize: 11 } },
                      tier.id === 'tier1' ? `达到上限后停止回复。当前易经特例 @${config?.specialPersons?.yijing?.handle || 'mrchen1998'} 启用时不封顶。` :
                      tier.id === 'apex' ? '达到上限（标准 30 轮）后停止回复，避免死循环。' :
                      '达到上限后不再继续回复该串，避免死循环')),

                  h('div', { style: { flex: '2 1 340px' } },
                    h('label', { style: { ...labelStyle, margin: 0 } }, '针对该档位人群的定制回复文风 / 附加提示词：', h(SideBadge, { side: 'reply' })),
                    h('textarea', {
                      style: { ...inputStyle, minHeight: 64, margin: '6px 0 4px' }, maxLength: 5000,
                      value: tier.replyStyle || '',
                      placeholder: `默认内置文风：${info.defaultWorkerVoice}（可在此输入额外要求，留空则沿用内置）`,
                      onChange: e => setTier(index, 'replyStyle', e.target.value)
                    }),
                    h('small', { style: { color: C.faint, fontSize: 11 } }, '此提示词会直接拼接入 AI 生成 Prompt，影响对此人群的回应口吻'))));
            })),

          // 3. 对话意图特殊分支回复配置
          h('section', { style: { ...cardStyle, background: C.layerTwo } },
            h('h2', { style: { margin: 0, fontSize: 16 } }, '🎭 对话意图特殊分支回复配置（Special Situation Replies）', h(SideBadge, { side: 'both' })),
            h('p', { style: { margin: '4px 0 12px', fontSize: 12, color: C.faint } }, '当评论或提及命中下列特定意图时，两端 Worker 的底层处理规则与参考提示词（可直接编辑保存）：'),
            ...Object.entries(config?.specialReplies || {}).map(([key, value]) =>
              h('div', { key, style: { margin: '10px 0', padding: '12px 14px', background: C.surface, borderRadius: 8, border: `1px solid ${C.border}` } },
                h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 } },
                  h('strong', { style: { fontSize: 13 } }, specialLabel(key)),
                  h('small', { style: { color: C.accent, fontSize: 12 } }, specialDesc(key))),
                h('textarea', { style: { ...inputStyle, minHeight: 52, margin: '8px 0 0' }, maxLength: 2000, value, onChange: e => updateConfig(current => ({ ...current, specialReplies: { ...current.specialReplies, [key]: e.target.value } })) })))))
        : null,

        // TAB 2: 🌐 通用与公共配置
        activeTab === 'general' ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },

          // 配置备份与恢复
          h('section', { style: cardStyle },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 } },
              h('div', null,
                h('h2', { style: { margin: 0, fontSize: 15 } }, '🗂️ 配置备份与恢复'),
                h('p', { style: { margin: '4px 0 0', fontSize: 12, color: C.faint, lineHeight: 1.6 } },
                  '每次保存前都会自动存一份快照（保留最近 20 份）。如果发现模型、提示词或名单被误清空，可在这里一键退回。')),
              h('button', {
                type: 'button',
                disabled: busy,
                style: { ...buttonStyle(false), padding: '6px 14px', fontSize: 12 },
                onClick: async () => {
                  try {
                    await act('backup-config-now');
                    setNotice('已为当前配置创建一份快照。');
                  } catch (err) { setError(err.message || String(err)); }
                }
              }, '📌 立即创建快照')),
            (() => {
              const backups = state?.configBackups || [];
              if (!backups.length) {
                return h('div', { style: { marginTop: 10, padding: '12px', background: C.layerTwo, borderRadius: 8, fontSize: 12, color: C.faint } },
                  '还没有备份。下次保存配置时会自动生成第一份。');
              }
              return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, maxHeight: 260, overflowY: 'auto' } },
                ...backups.map((item, idx) => h('div', {
                  key: item.name,
                  style: {
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                    padding: '8px 10px', background: C.layerTwo, borderRadius: 6,
                    border: `1px solid ${C.border}`,
                  }
                },
                  h('div', { style: { minWidth: 0 } },
                    h('div', { style: { fontSize: 12, color: C.text } },
                      item.savedAt ? new Date(item.savedAt).toLocaleString() : item.name,
                      idx === 0 ? h('span', { style: { marginLeft: 8, fontSize: 11, color: C.accent } }, '最近一次') : null),
                    h('div', { style: { fontSize: 11, color: C.faint } },
                      `${item.name} · ${Math.max(1, Math.round((item.size || 0) / 102.4) / 10)} KB`)),
                  h('button', {
                    type: 'button',
                    disabled: busy,
                    style: { ...buttonStyle(false), padding: '3px 10px', fontSize: 11, color: C.accent, borderColor: C.accent, flexShrink: 0 },
                    onClick: () => setConfirmModal({
                      title: '恢复配置快照',
                      prompt: `确认把配置恢复到 ${item.savedAt ? new Date(item.savedAt).toLocaleString() : item.name} 的版本吗？\n\n当前配置会先自动备份一份，所以这一步可以再撤回。`,
                      confirmText: '确认恢复',
                      onConfirm: async () => {
                        try {
                          await act('restore-config-backup', undefined, { name: item.name });
                          setNotice('配置已恢复。两个 Worker 下一轮读取即生效。');
                        } catch (err) { setError(`恢复失败：${err.message || String(err)}`); }
                      },
                    })
                  }, '↩️ 恢复此版本')))
              );
            })()),

          // 概览与校验
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, t('sharedConfig')),
            h('div', { style: { marginTop: 8, padding: '8px 10px', borderRadius: 8, background: C.layerTwo, borderLeft: `3px solid ${C.accent}`, fontSize: 12, color: C.text, lineHeight: 1.7 } },
              h('div', { style: { fontWeight: '600' } }, '这里只放「全局作息与风控」'),
              h('div', { style: { color: C.muted } },
                '模型、提示词、发送间隔、窗口、轮次等任务专属参数已各自收拢到「💬 自动评论」「↩️ 提及回复」「📝 自动发帖」「🧭 主页巡航」「🧠 发帖学习」对应 Tab，本页不再重复出现。')),
            (() => {
              const m = state?.maintenance || {};
              const freeGb = m.diskFreeBytes != null ? (m.diskFreeBytes / (1024 ** 3)).toFixed(1) : '未知';
              const low = m.diskFreeBytes != null && m.diskFreeBytes < 3 * 1024 ** 3;
              const cleanup = m.cacheCleanup || {};
              const keys = ['comment', 'reply', 'post', 'profile'];
              const labels = { comment: '评论', reply: '回复', post: '发帖', profile: '巡航' };
              const bulk = async (label, fn) => {
                const results = [];
                for (const key of keys) {
                  try { await fn(key); results.push(`${labels[key]}✓`); }
                  catch (err) { results.push(`${labels[key]}✗`); }
                }
                setNotice(`${label}：${results.join(' ')}`);
              };
              return h('div', { style: { marginTop: 14, padding: '12px 14px', borderRadius: 10, background: C.layerTwo, border: `1px solid ${low ? C.error : C.border}` } },
                h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 } },
                  h('div', { style: { fontSize: 14, fontWeight: '600' } }, '🛠 运维操作'),
                  h('div', { style: { fontSize: 12, color: low ? C.error : C.muted } },
                    `磁盘可用 ${freeGb} GB${low ? '（空间偏低，建议清理缓存）' : ''}`)),
                h('div', { style: { fontSize: 12, color: C.faint, marginTop: 6 } },
                  cleanup.lastRunLocal
                    ? `上次自动清理：${cleanup.lastRunLocal} · 释放 ${Math.round((cleanup.reclaimedBytes || 0) / (1024 * 1024))} MB · 共执行 ${cleanup.runs || 0} 次（每 6 小时自动一次）`
                    : '尚未自动清理过（每个 Worker 每 6 小时自动清一次自己的缓存）'),
                h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 } },
                  h('button', {
                    type: 'button', disabled: busy,
                    style: { ...buttonStyle(false), padding: '7px 14px', fontSize: 12 },
                    onClick: () => askConfirmText('重启全部工作进程？看门狗会立即把它们重新拉起来。', () => bulk('重启工作进程', key => act('restart', key))),
                  }, '🔁 重启全部工作进程')),
                h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 } },
                  h('button', {
                    type: 'button', disabled: busy,
                    style: { ...buttonStyle(false), padding: '7px 14px', fontSize: 12 },
                    onClick: () => askConfirmText('重启全部看门狗？用于看门狗崩溃后恢复控制能力。', () => bulk('重启看门狗', key => act('restart-watchdog', key))),
                  }, '🐕 重启全部看门狗'),
                  h('button', {
                    type: 'button', disabled: busy,
                    style: { ...buttonStyle(false), padding: '7px 14px', fontSize: 12 },
                    onClick: () => askConfirmText('全量重启：先重启四个看门狗，再重启四个工作进程。', async () => {
                      setNotice('正在重启看门狗…');
                      await bulk('重启看门狗', key => act('restart-watchdog', key));
                      await new Promise(r => setTimeout(r, 4000));
                      await bulk('重启工作进程', key => act('restart', key));
                    }),
                  }, '⚡ 全量重启（看门狗 + Worker）'),
                  h('button', {
                    type: 'button', disabled: busy,
                    style: { ...buttonStyle(true), padding: '7px 14px', fontSize: 12 },
                    onClick: async () => {
                      try {
                        const res = await act('clean-cache');
                        setNotice(res?.note || '缓存已清理。');
                      } catch (err) { setError(`清理失败：${err.message || String(err)}`); }
                    },
                  }, '🧹 立即清理缓存'),
                  h('button', {
                    type: 'button', disabled: busy,
                    style: { ...buttonStyle(false), padding: '7px 14px', fontSize: 12 },
                    onClick: async () => { try { await refresh(); setNotice('状态已刷新。'); } catch (err) { setError(String(err.message || err)); } },
                  }, '🔄 刷新状态')),
                h('small', { style: { display: 'block', marginTop: 10, fontSize: 11, color: C.faint, lineHeight: 1.7 } },
                  '看门狗挂了会表现为「点重启没反应 / 提示身份未验证」，先点「重启全部看门狗」即可恢复；磁盘满了会导致 Worker 静默崩溃，先点「立即清理缓存」。'),
              );
            })(),
            h('p', { style: { margin: '6px 0 0', fontSize: 13, color: sourceColor } }, sourceText),
            h('p', { style: { margin: '4px 0 0', fontSize: 12, color: C.faint, wordBreak: 'break-all' } }, `${t('configPath')}：${state?.configPath || ''}`),
            h('p', { style: { margin: '4px 0 0', fontSize: 12, color: C.faint } }, state?.configSource === 'shared' ? t('sourceShared') : state?.configSource === 'missing' ? t('sourceMissing') : t('configInvalid')),
            h('div', { style: { display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8, fontSize: 13 } },
              h('span', null, `${t('commentWorker')}：`, h('strong', { style: { color: acceptance?.comment?.accepted ? C.success : C.error } }, acceptance?.comment?.accepted ? t('accepted') : t('rejected'))),
              h('span', null, `${t('replyWorker')}：`, h('strong', { style: { color: acceptance?.reply?.accepted ? C.success : C.error } }, acceptance?.reply?.accepted ? t('accepted') : t('rejected')))),
            acceptance && (!acceptance.comment?.accepted || !acceptance.reply?.accepted)
              ? h('ul', { style: { margin: '8px 0 0', paddingLeft: 18, fontSize: 12, color: C.error } },
                ...[...(acceptance.comment?.reasons || []), ...(acceptance.reply?.reasons || [])].slice(0, 8).map(reason => h('li', { key: reason }, reason)))
              : null),

          // 公共节奏与时段
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '⏱️ 通用运行时段与防限流节奏', h(SideBadge, { side: 'both' })),
            h('p', { style: { margin: '4px 0 8px', fontSize: 12, color: C.faint } }, '两端任务严格遵守的休眠与频率限制，避免触发 X 平台风控'),
            h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 } },
              ...timingFields.filter(([, , , side]) => side === 'both').map(([key, min, max, side, hint]) =>
                h('label', { key, style: { ...labelStyle, flex: '1 1 45%', minWidth: 240, margin: 0 } },
                  hint, h(SideBadge, { side }),
                  h('input', { type: 'number', min, max, style: inputStyle, value: config?.timing?.[key] ?? 0, onChange: e => setTiming(key, Number(e.target.value)) }))))),

          // 特殊场景与评论回复参考
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '💡 ' + t('specials'), h(SideBadge, { side: 'both' })),
            h('p', { style: { margin: '4px 0 8px', fontSize: 12, color: C.faint } }, '当评论或提及命中下列特定情境时，Worker 的底层处理规则与参考提示词：'),
            ...Object.entries(config?.specialReplies || {}).map(([key, value]) =>
              h('div', { key, style: { margin: '10px 0', padding: '12px 14px', background: C.surface, borderRadius: 8, border: `1px solid ${C.border}` } },
                h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 } },
                  h('strong', { style: { fontSize: 13 } }, specialLabel(key)),
                  h('small', { style: { color: C.accent, fontSize: 12 } }, specialDesc(key))),
                h('textarea', { style: { ...inputStyle, minHeight: 52, margin: '8px 0 0' }, maxLength: 2000, value, onChange: e => updateConfig(current => ({ ...current, specialReplies: { ...current.specialReplies, [key]: e.target.value } })) })))),

          // 通用规则开关
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '🛡️ 通用安全与规则开关'),
            h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12 } },
              ...Object.entries(config?.rules || {}).map(([key, value]) =>
                h('label', { key, style: { display: 'inline-flex', gap: 8, alignItems: 'center', flex: '1 1 45%', fontSize: 13, cursor: 'pointer' } },
                  h('input', { type: 'checkbox', checked: !!value, onChange: e => updateConfig(current => ({ ...current, rules: { ...current.rules, [key]: e.target.checked } })) }),
                  ruleLabel(key), h(SideBadge, { side: key === 'skipFinanceComments' ? 'comment' : 'none' }))))))
        : null,

        // TAB 3: 💬 自动评论独立配置
        activeTab === 'comment' ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
          statusCard('comment', '💬 ' + t('comment') + '（任务状态与控制）'),
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '🎯 自动评论模型、提示词与独立参数'),
            h(ModelPicker, {
              value: config?.commentSettings?.model || '',
              onChange: val => updateConfig(c => ({ ...c, commentSettings: { ...(c.commentSettings || {}), model: val } })),
              side: 'comment',
              label: '💬 自动评论专用大模型：'
            }),
            h('label', { style: { ...labelStyle, marginTop: 12 } }, '💬 自动评论人设与文风提示词（Prompt）：', h(SideBadge, { side: 'comment' })),
            h('textarea', {
              style: { ...inputStyle, minHeight: 80 },
              value: config?.commentSettings?.customPrompt || '',
              placeholder: '例如：增加更多风趣幽默的比喻，自称寡人或周天子，语气微讽但友好，严禁现代网络低俗梗，直击推文要害...',
              onChange: e => updateConfig(c => ({ ...c, commentSettings: { ...(c.commentSettings || {}), customPrompt: e.target.value } }))
            }),
            (config?.commentSettings?.customPrompt || '').trim()
              ? h('small', { style: { color: C.success, fontSize: 12 } }, `✓ 已设置（${config.commentSettings.customPrompt.length} 字），生效于自动评论 Worker`)
              : h('small', { style: { color: C.error, fontSize: 12 } }, '⚠️ 当前为空：自动评论将只使用 Worker 内置文风，不会应用任何自定义补充要求。'),
            h('div', { style: { marginTop: 14, padding: '10px 12px', borderRadius: 8, background: C.layerTwo, border: `1px solid ${C.border}` } },
              h('div', { style: { fontSize: 13, fontWeight: '600', marginBottom: 6 } }, '⚙️ 内置评论规则（原先写死在 Worker 里，现在可改）'),
              h('label', { style: { ...labelStyle, marginTop: 4 } }, '跳过关键词（逗号分隔，命中即整条跳过）：', h(SideBadge, { side: 'comment' })),
              h('input', {
                style: inputStyle,
                placeholder: '例如：广告, 抽奖, 拼多多',
                value: (config?.commentSettings?.skipKeywords || []).join(', '),
                onChange: e => updateConfig(c => ({
                  ...c,
                  commentSettings: {
                    ...(c.commentSettings || {}),
                    skipKeywords: e.target.value.split(/[,，\s]+/).map(x => x.trim()).filter(Boolean),
                  },
                })),
              }),
              h('label', { style: { ...labelStyle, marginTop: 10 } }, '追加「财经类」判定关键词（内置词库之外，逗号分隔）：'),
              h('input', {
                style: inputStyle,
                placeholder: '例如：黄金, 白银, 期货',
                value: (config?.commentSettings?.extraFinanceKeywords || []).join(', '),
                onChange: e => updateConfig(c => ({ ...c, commentSettings: { ...(c.commentSettings || {}), extraFinanceKeywords: e.target.value.split(/[,，\s]+/).map(x => x.trim()).filter(Boolean) } })),
              }),
              h('div', { style: { display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' } },
                h('label', { style: { ...labelStyle, flex: '1 1 160px' } },
                  '评论最短字数：',
                  h('input', {
                    type: 'number', min: 1, max: 500, style: inputStyle,
                    value: config?.commentSettings?.minLength ?? 8,
                    onChange: e => updateConfig(c => ({ ...c, commentSettings: { ...(c.commentSettings || {}), minLength: e.target.value === '' ? '' : Number(e.target.value) } })),
                  })),
                h('label', { style: { ...labelStyle, flex: '1 1 160px' } },
                  '评论最长字数：',
                  h('input', {
                    type: 'number', min: 1, max: 500, style: inputStyle,
                    value: config?.commentSettings?.maxLength ?? 60,
                    onChange: e => updateConfig(c => ({ ...c, commentSettings: { ...(c.commentSettings || {}), maxLength: e.target.value === '' ? '' : Number(e.target.value) } })),
                  })))),
            h('label', { style: { ...labelStyle, marginTop: 12 } }, t('modelPort'), h(SideBadge, { side: 'comment' })),
            h('input', { type: 'number', min: 1, max: 65535, style: inputStyle, value: config?.model?.endpointPort || '', placeholder: '留空表示使用默认端口（如 3040）', onChange: e => updateConfig(current => ({ ...current, model: { ...current.model, endpointPort: e.target.value === '' ? null : Number(e.target.value) } })) }),
            h('small', { style: { color: C.faint, fontSize: 12 } }, t('portHint')),
            h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 } },
              ...timingFields.filter(([, , , side]) => side === 'comment' || side === 'send').map(([key, min, max, side, hint]) =>
                h('label', { key, style: { ...labelStyle, flex: '1 1 45%', minWidth: 240, margin: 0 } },
                  hint, h(SideBadge, { side }),
                  h('input', { type: 'number', min, max, style: inputStyle, value: config?.timing?.[key] ?? 0, onChange: e => setTiming(key, Number(e.target.value)) }))))))
        : null,

        // TAB 4: ↩️ 提及回复独立配置
        activeTab === 'reply' ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
          statusCard('reply', '↩️ ' + t('reply') + '（任务状态与控制）'),

          // 漏回复诊断 + 防漏配置
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '🩺 漏回复诊断与防漏配置'),
            (() => {
              const diag = state?.replyDiagnostics;
              const win = config?.timing?.mentionWindowHours ?? 12;
              if (!diag) return h('div', { style: { fontSize: 12, color: C.faint, marginTop: 8 } }, '暂无诊断数据。');
              const nearWindow = diag.oldestHours !== null && diag.oldestHours >= win * 0.75;
              const reasonText = {
                author_cooldown: '同一作者冷却未到',
                too_many_rounds: '单串对话轮次已达上限',
                thin_reply: '回复太短/太空被拦下',
                food: '被判定为闲聊话题',
                no_contextual_comment: '找不到可回应的点',
                already_replied: '已经回复过',
                stop_requested: '对方表示不想继续',
                grok: 'Grok 相关已跳过',
                configured_skip_handle: '在免回复名单',
                insufficient_text_media: '纯图片/无文字',
              };
              return h('div', null,
                h('div', { style: { display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 8, fontSize: 13 } },
                  h('div', null, h('span', { style: { color: C.muted } }, '当前积压：'),
                    h('strong', { style: { color: diag.backlog > 30 ? C.error : C.success } }, `${diag.backlog} 条`)),
                  h('div', null, h('span', { style: { color: C.muted } }, '最老一条约：'),
                    h('strong', { style: { color: nearWindow ? C.error : C.text } },
                      diag.oldestHours === null ? '—' : `${diag.oldestHours} 小时前`)),
                  h('div', null, h('span', { style: { color: C.muted } }, '回复窗口：'),
                    h('strong', { style: { color: C.text } }, `${win} 小时`))),
                nearWindow ? h('div', { style: { marginTop: 8, padding: '8px 10px', borderRadius: 8, background: C.raised, borderLeft: `3px solid ${C.error}`, fontSize: 12, color: C.text, lineHeight: 1.6 } },
                  `⚠️ 队列中最老的提及已接近 ${win} 小时窗口上限，超出后会被永久丢弃。建议调大「回复窗口」或加快回复节奏。`) : null,
                diag.skipReasons.length ? h('div', { style: { marginTop: 10 } },
                  h('div', { style: { fontSize: 12, color: C.muted, marginBottom: 6 } }, `历史跳过原因（累计 ${diag.skipTotal} 条）：`),
                  h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } },
                    ...diag.skipReasons.map(r => h('span', {
                      key: r.reason,
                      style: { fontSize: 11, padding: '3px 8px', borderRadius: 999, background: C.layerTwo, border: `1px solid ${C.border}`, color: C.text }
                    }, `${reasonText[r.reason] || r.reason} · ${r.count}`)))) : null);
            })(),
            h('div', { style: { display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14 } },
              h('label', { style: { ...labelStyle, flex: '1 1 150px' } },
                '回复窗口（小时）：', h(SideBadge, { side: 'reply' }),
                h('input', { type: 'number', min: 1, max: 72, style: inputStyle, value: config?.timing?.mentionWindowHours ?? 12, onChange: e => setTiming('mentionWindowHours', e.target.value === '' ? '' : Number(e.target.value)) })),
              h('label', { style: { ...labelStyle, flex: '1 1 150px' } },
                '回复最短间隔（秒，0=跟随发布间隔）：', h(SideBadge, { side: 'reply' }),
                h('input', { type: 'number', min: 0, max: 3600, style: inputStyle, value: config?.timing?.replyMinSeconds ?? 0, onChange: e => setTiming('replyMinSeconds', e.target.value === '' ? '' : Number(e.target.value)) })),
              h('label', { style: { ...labelStyle, flex: '1 1 150px' } },
                '回复最长间隔（秒，0=跟随发布间隔）：', h(SideBadge, { side: 'reply' }),
                h('input', { type: 'number', min: 0, max: 3600, style: inputStyle, value: config?.timing?.replyMaxSeconds ?? 0, onChange: e => setTiming('replyMaxSeconds', e.target.value === '' ? '' : Number(e.target.value)) }))),
            h('div', { style: { display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 12 } },
              h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 } },
                h('input', { type: 'checkbox', checked: config?.rules?.mentionPauseDuringQuiet !== false, onChange: e => updateConfig(c => ({ ...c, rules: { ...(c.rules || {}), mentionPauseDuringQuiet: e.target.checked } })) }),
                '静默时段（00:00-07:00）暂停回复普通用户', h(SideBadge, { side: 'reply' })),
              h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 } },
                h('input', { type: 'checkbox', checked: config?.rules?.mentionPauseDuringFullStop !== false, onChange: e => updateConfig(c => ({ ...c, rules: { ...(c.rules || {}), mentionPauseDuringFullStop: e.target.checked } })) }),
                '全停时段（01:00-06:00）完全停止回复', h(SideBadge, { side: 'reply' }))),
            h('p', { style: { margin: '8px 0 0', fontSize: 12, color: C.faint, lineHeight: 1.6 } },
              '关掉这两项后，夜间也会继续消化提及，是减少漏回复最有效的一招；若担心账号活跃痕迹不自然，可只关掉「静默时段」保留全停。')),

          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '🤖 提及回复模型选择与全局提示词'),
            h(ModelPicker, {
              value: config?.replySettings?.model || config?.model?.name || '',
              onChange: val => updateConfig(c => ({ ...c, model: { ...c.model, name: val }, replySettings: { ...(c.replySettings || {}), model: val } })),
              side: 'reply',
              label: '↩️ 提及回复专用大模型：'
            }),
            h('label', { style: { ...labelStyle, marginTop: 12 } }, '↩️ 提及回复全局补充提示词（Prompt）：', h(SideBadge, { side: 'reply' })),
            h('textarea', {
              style: { ...inputStyle, minHeight: 80 },
              value: config?.replySettings?.customPrompt || '',
              placeholder: '所有提及回复均遵循的补充规则，例如：围绕对方最新发言展开，不要复述对方的话，多用诗词与文言意象...',
              onChange: e => updateConfig(c => ({ ...c, replySettings: { ...(c.replySettings || {}), customPrompt: e.target.value } }))
            }),
            (config?.replySettings?.customPrompt || '').trim()
              ? h('small', { style: { color: C.success, fontSize: 12 } }, `✓ 已设置（${config.replySettings.customPrompt.length} 字），生效于提及回复 Worker`)
              : h('small', { style: { color: C.error, fontSize: 12 } }, '⚠️ 当前为空：提及回复将只使用 Worker 内置文风，不会应用任何自定义补充要求。'),
            h('div', { style: { marginTop: 14, padding: '10px 12px', borderRadius: 8, background: C.layerTwo, border: `1px solid ${C.border}` } },
              h('div', { style: { fontSize: 13, fontWeight: '600', marginBottom: 6 } }, '⚙️ 内置回复规则（原先写死在 Worker 里，现在可改）'),
              h('label', { style: { ...labelStyle, marginTop: 4 } }, '长度要求（覆盖内置默认）：'),
              h('input', {
                style: inputStyle,
                value: config?.replySettings?.lengthRule || '',
                placeholder: '例如：10到28字。结尾不要用句号。',
                onChange: e => updateConfig(c => ({ ...c, replySettings: { ...(c.replySettings || {}), lengthRule: e.target.value } })),
              }),
              h('label', { style: { ...labelStyle, marginTop: 10 } }, '套话禁语（覆盖内置默认）：'),
              h('textarea', {
                style: { ...inputStyle, minHeight: 56, fontSize: 12 },
                value: config?.replySettings?.cannedForbidden || '',
                placeholder: '禁止“感谢分享”“支持一下”这类套话…',
                onChange: e => updateConfig(c => ({ ...c, replySettings: { ...(c.replySettings || {}), cannedForbidden: e.target.value } })),
              }),
              h('label', { style: { ...labelStyle, marginTop: 10 } }, '追加「太空洞」判定词（逗号分隔，命中则不回复）：'),
              h('input', {
                style: inputStyle,
                placeholder: '例如：好的, 收到, 谢谢',
                value: (config?.replySettings?.thinReplyExtra || []).join(', '),
                onChange: e => updateConfig(c => ({ ...c, replySettings: { ...(c.replySettings || {}), thinReplyExtra: e.target.value.split(/[,，\s]+/).map(x => x.trim()).filter(Boolean) } })),
              }),
              h('label', { style: { ...labelStyle, marginTop: 10 } }, '人设覆盖（留空则用 Worker 内置人设描述）：'),
              h('textarea', {
                style: { ...inputStyle, minHeight: 56, fontSize: 12 },
                value: config?.replySettings?.personaOverride || '',
                placeholder: '例如：你是周朝天子姬霸，幽默古奥，自称寡人…',
                onChange: e => updateConfig(c => ({ ...c, replySettings: { ...(c.replySettings || {}), personaOverride: e.target.value } })),
              }),
              h('label', { style: { ...labelStyle, marginTop: 10 } }, '追加「对方不想继续」判定词（逗号分隔）：'),
              h('input', {
                style: inputStyle,
                placeholder: '例如：别私信了, 到此为止吧',
                value: (config?.replySettings?.stopKeywords || []).join(', '),
                onChange: e => updateConfig(c => ({ ...c, replySettings: { ...(c.replySettings || {}), stopKeywords: e.target.value.split(/[,，\s]+/).map(x => x.trim()).filter(Boolean) } })),
              }),
              h('label', { style: { ...labelStyle, marginTop: 10 } }, '回复中禁止出现的词（逗号分隔）：'),
              h('input', {
                style: inputStyle,
                placeholder: '例如：亲, 宝子',
                value: (config?.replySettings?.forbiddenPhrases || []).join(', '),
                onChange: e => updateConfig(c => ({ ...c, replySettings: { ...(c.replySettings || {}), forbiddenPhrases: e.target.value.split(/[,，\s]+/).map(x => x.trim()).filter(Boolean) } })),
              })),
            h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 } },
              ...timingFields.filter(([, , , side]) => side === 'reply' || side === 'send').map(([key, min, max, side, hint]) =>
                h('label', { key, style: { ...labelStyle, flex: '1 1 45%', minWidth: 240, margin: 0 } },
                  hint, h(SideBadge, { side }),
                  h('input', { type: 'number', min, max, style: inputStyle, value: config?.timing?.[key] ?? 0, onChange: e => setTiming(key, Number(e.target.value)) }))))))
        : null,

        // TAB 5: 📝 自动发帖独立配置与队列管理
        activeTab === 'post' ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
          statusCard('post', '📝 ' + t('post') + '（任务状态与控制）'),

          // 待发队列与手动插队
          h('section', { style: cardStyle },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 } },
              h('h2', { style: { margin: 0, fontSize: 16 } }, '📋 待发推文队列看板（按序或加急发布）'),
              h('div', { style: { display: 'flex', gap: 8 } },
                h('button', {
                  type: 'button',
                  disabled: busy || generatingDrafts,
                  style: { ...buttonStyle(false), fontSize: 12, padding: '4px 10px', background: 'rgba(99, 102, 241, 0.15)', borderColor: '#6366f1', color: '#818cf8' },
                  onClick: () => setShowGenPanel(v => !v)
                }, showGenPanel ? '✕ 收起生成面板' : '🤖 AI 批量生成草稿'),
                state?.postQueue && state.postQueue.length > 0 ? h('button', {
                  type: 'button',
                  disabled: busy,
                  style: { ...buttonStyle(false), fontSize: 12, padding: '4px 10px', color: C.error, borderColor: C.error },
                  onClick: () => {
                    setConfirmModal({
                      title: '清空待发队列',
                      prompt: `确认清空当前所有未发送的推文吗？\n\n队列中共有 ${state.postQueue.length} 条待发稿件，清空后 Worker 会在下一轮按补仓阈值重新生成。`,
                      confirmText: '确认清空',
                      onConfirm: () => void act('clear-post-queue'),
                    });
                  }
                }, '🗑️ 清空队列') : null
              )
            ),

            // AI 草稿生成面板：数量 + 一次性独立提示词
            showGenPanel ? h('div', { style: { background: C.layerTwo, padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 14 } },
              h('label', { style: { fontSize: 13, fontWeight: '600', display: 'block', marginBottom: 6 } }, '🤖 AI 批量生成待发草稿：'),
              h('div', { style: { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 10 } },
                h('label', { style: { ...labelStyle, flex: '0 0 160px', margin: 0 } },
                  '本次生成条数：',
                  h('input', {
                    type: 'number', min: 1, max: 50, style: inputStyle,
                    value: draftGenCount,
                    onChange: e => setDraftGenCount(e.target.value === '' ? 1 : Math.max(1, Math.min(50, Number(e.target.value)))),
                  })
                ),
                h('div', { style: { flex: '1 1 320px', minWidth: 260 } },
                  h('div', { style: { fontSize: 12, color: C.faint, marginBottom: 4 } }, '本次使用的提示词（留空则使用下方「自动发帖文案提示词」的全局设置）：'),
                  h('textarea', {
                    style: { ...inputStyle, minHeight: 70, resize: 'vertical' },
                    placeholder: '例如：写一条关于「周朝美食」的幽默文言推文，30~90字...',
                    value: draftGenPrompt,
                    onChange: e => setDraftGenPrompt(e.target.value),
                  })
                )
              ),
              h('div', { style: { display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' } },
                h('span', { style: { fontSize: 12, color: C.faint } }, `将生成 ${Math.max(1, Math.min(50, Number(draftGenCount) || 1))} 条并追加到队列末尾`),
                h('button', {
                  type: 'button',
                  disabled: busy || generatingDrafts,
                  style: { ...buttonStyle(true), padding: '6px 16px', fontSize: 13 },
                  onClick: async () => {
                    const count = Math.max(1, Math.min(50, Number(draftGenCount) || 1));
                    setGeneratingDrafts(true);
                    setError('');
                    setNotice(`正在请求大模型生成 ${count} 条原创推文草稿，请稍候...`);
                    try {
                      const res = await act('generate-draft-posts', undefined, {
                        count,
                        prompt: draftGenPrompt.trim(),
                      });
                      if (res && res.generated) {
                        setNotice(`🎉 成功生成 ${res.generated.length} 条推文草稿并加入队列！`);
                        setDraftGenPrompt('');
                      }
                    } catch (err) {
                      setError(`生成草稿失败：${err.message || String(err)}`);
                    } finally {
                      setGeneratingDrafts(false);
                    }
                  }
                }, generatingDrafts ? '⏳ 正在生成...' : '🚀 生成并加入队列')
              )
            ) : null,

            // 手动编辑与插队区域
            h('div', { style: { background: C.layerTwo, padding: '12px 14px', borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 14 } },
              h('label', { style: { fontSize: 13, fontWeight: '600', display: 'block', marginBottom: 6 } }, '✍️ 手动撰写新推文（支持立即插队或排队）：'),
              h('textarea', {
                style: { ...inputStyle, minHeight: 70, resize: 'vertical' },
                placeholder: '输入你想发的推文内容（可自拟文案，字数建议 20~140 字）...',
                value: manualPostText,
                onChange: e => setManualPostText(e.target.value),
              }),
              h('div', { style: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 } },
                h('button', {
                  type: 'button',
                  disabled: busy || !manualPostText.trim(),
                  style: { ...buttonStyle(false), padding: '6px 14px', fontSize: 13 },
                  onClick: async () => {
                    const text = manualPostText.trim();
                    if (!text) return;
                    setBusy(true);
                    try {
                      await act('enqueue-post', undefined, { text, urgent: false, source: 'manual' });
                      setManualPostText('');
                      setNotice('推文已追加到队列末尾，将按轮次顺序发送。');
                    } catch (err) {
                      setError(err.message || String(err));
                    } finally {
                      setBusy(false);
                    }
                  }
                }, '➕ 加入待发队列末尾'),
                h('button', {
                  type: 'button',
                  disabled: busy || !manualPostText.trim(),
                  style: {
                    ...buttonStyle(true),
                    padding: '6px 16px',
                    fontSize: 13,
                    background: '#f59e0b',
                    borderColor: '#d97706',
                    color: '#000',
                    fontWeight: 'bold',
                  },
                  onClick: async () => {
                    const text = manualPostText.trim();
                    if (!text) return;
                    setBusy(true);
                    try {
                      await act('enqueue-post', undefined, { text, urgent: true, source: 'manual' });
                      setManualPostText('');
                      setNotice('⚡ 已设置为【加急插队】！Post Worker 会在当前发帖周期优先发出本条！');
                    } catch (err) {
                      setError(err.message || String(err));
                    } finally {
                      setBusy(false);
                    }
                  }
                }, '⚡ 立即插队置顶发送')
              )
            ),

            // 队列列表展示
            h('div', null,
              h('div', { style: { fontSize: 13, fontWeight: '600', color: C.muted, marginBottom: 8, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 } },
                h('span', null, `当前待发队列 (${state?.postQueue?.length || 0} 条)`),
                h('span', { style: { fontSize: 12, color: C.faint } },
                  `补仓阈值 ${config?.postSettings?.queueLowThreshold ?? 3} 条 · 每批 ${config?.postSettings?.queueBatchSize ?? 10} 条 · ${config?.postSettings?.queueAutoRefill !== false ? '自动补仓已开启' : '自动补仓已关闭'}`
                )
              ),
              state?.postQueue && state.postQueue.length > 0 ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
                ...state.postQueue.map((item, idx) => h('div', {
                  key: item.id || idx,
                  style: {
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10,
                    padding: '10px 12px', background: C.raised, borderRadius: 8,
                    borderLeft: `4px solid ${item.urgent ? '#f59e0b' : '#38bdf8'}`,
                    borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
                  }
                },
                  h('div', { style: { flex: 1, minWidth: 0 } },
                    h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' } },
                      h('span', { style: { fontSize: 12, fontWeight: 'bold', color: item.urgent ? '#f59e0b' : '#38bdf8' } }, `#${idx + 1}`),
                      item.urgent ? h('span', { style: { padding: '1px 6px', borderRadius: 4, background: '#f59e0b', color: '#000', fontSize: 10, fontWeight: 'bold' } }, '⚡ 加急插队') : null,
                      h('span', { style: { fontSize: 11, color: C.faint } }, item.source === 'manual' ? '手动录入' : (item.source === 'ai_draft_custom' ? 'AI 草稿（独立提示词）' : (item.source === 'ai_draft' ? 'AI 预生成' : '动态生成'))),
                      item.topic ? h('span', { style: { fontSize: 11, color: C.faint } }, `话题：${item.topic}`) : null,
                      item.createdAt ? h('span', { style: { fontSize: 11, color: C.faint } }, new Date(item.createdAt).toLocaleTimeString()) : null
                    ),
                    item.hotTopic ? h('div', { style: { fontSize: 11, color: '#c07a00', marginBottom: 4, fontWeight: '600' } }, `🔥 借热点：${item.hotTopic}`) : null,
                    h('p', { style: { margin: 0, fontSize: 13, color: C.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' } }, item.text)
                  ),
                  h('div', { style: { display: 'flex', gap: 6, flexShrink: 0 } },
                    !item.urgent ? h('button', {
                      type: 'button',
                      title: '设为立即插队置顶',
                      style: { ...buttonStyle(false), padding: '2px 8px', fontSize: 11, color: '#f59e0b', borderColor: '#f59e0b' },
                      onClick: async () => {
                        await act('remove-queued-post', undefined, { id: item.id });
                        await act('enqueue-post', undefined, { text: item.text, urgent: true, source: item.source });
                        setNotice('已将该推文设为加急插队置顶！');
                      }
                    }, '⚡ 置顶') : null,
                    h('button', {
                      type: 'button',
                      title: '从队列中移除该条草稿',
                      style: { ...buttonStyle(false), padding: '2px 8px', fontSize: 11, color: C.error, borderColor: C.error },
                      onClick: () => void act('remove-queued-post', undefined, { id: item.id })
                    }, '✕ 删除')
                  )
                ))
              ) : h('div', { style: { padding: '20px', textAlign: 'center', background: C.layerTwo, borderRadius: 8, color: C.faint, fontSize: 13 } },
                '暂无排队推文。你可以在上方手动录入，或点击右上角「🤖 AI 批量生成草稿」提前备齐。'
              )
            )
          ),

          // 发帖策略、模型与参数设置
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '⚙️ 自动发帖策略、模型与提示词'),
            h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginTop: 8 } },
              h('input', { type: 'checkbox', checked: config?.postSettings?.enabled !== false, onChange: e => updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), enabled: e.target.checked } })) }),
              '启用自动发帖 Worker', h(SideBadge, { side: 'post' })),
            h(ModelPicker, {
              value: config?.postSettings?.model || '',
              onChange: val => updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), model: val } })),
              side: 'post',
              label: '📝 自动发帖专用大模型：'
            }),
            (() => {
              const ps = config?.postSettings || {};
              const mode = ps.intervalMode || (((Number(ps.intervalMinSeconds) || 0) > 0 || (Number(ps.intervalMaxSeconds) || 0) > 0) ? 'random' : 'fixed');
              const setMode = next => updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), intervalMode: next } }));
              const seg = (key, text) => h('button', {
                type: 'button',
                onClick: () => setMode(key),
                style: {
                  ...buttonStyle(mode === key),
                  padding: '6px 16px',
                  fontSize: 13,
                  background: mode === key ? C.accent : 'transparent',
                  color: mode === key ? '#fff' : C.muted,
                  borderColor: mode === key ? C.accent : C.border,
                },
              }, text);

              const fixedSeconds = Number(ps.intervalSeconds) || 180;
              const fixedRow = h('div', { style: { marginTop: 10, fontSize: 12, color: C.muted } },
                `每条间隔固定 ${fixedSeconds} 秒（约 ${Math.round(fixedSeconds / 6) / 10} 分钟）`);

              const lo = Number(ps.intervalMinSeconds) || 300;
              const hi = Number(ps.intervalMaxSeconds) || 600;
              const randomRows = h('div', { style: { marginTop: 10, fontSize: 12, color: C.muted } },
                `每条发出后，在 ${lo}~${hi} 秒之间重新随机（约 ${Math.round(lo / 6) / 10}~${Math.round(hi / 6) / 10} 分钟）`);

              const fixedInputs = h('div', { style: { display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' } },
                h('label', { style: { ...labelStyle, flex: '1 1 220px' } },
                  '固定间隔（秒）：', h(SideBadge, { side: 'post' }),
                  h('input', {
                    type: 'number', min: 30, max: 86400, style: inputStyle, placeholder: '例如 180',
                    value: ps.intervalSeconds ?? 180,
                    onChange: e => updateConfig(c => ({
                      ...c,
                      postSettings: { ...(c.postSettings || {}), intervalSeconds: e.target.value === '' ? '' : Number(e.target.value) },
                    })),
                  })));

              const randomInputs = h('div', { style: { display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' } },
                h('label', { style: { ...labelStyle, flex: '1 1 170px' } },
                  '最短间隔（秒）：', h(SideBadge, { side: 'post' }),
                  h('input', {
                    type: 'number', min: 30, max: 86400, style: inputStyle, placeholder: '例如 300',
                    value: ps.intervalMinSeconds ?? 300,
                    onChange: e => updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), intervalMinSeconds: e.target.value === '' ? 0 : Number(e.target.value) } })),
                  })),
                h('label', { style: { ...labelStyle, flex: '1 1 170px' } },
                  '最长间隔（秒）：', h(SideBadge, { side: 'post' }),
                  h('input', {
                    type: 'number', min: 30, max: 86400, style: inputStyle, placeholder: '例如 600',
                    value: ps.intervalMaxSeconds ?? 600,
                    onChange: e => updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), intervalMaxSeconds: e.target.value === '' ? 0 : Number(e.target.value) } })),
                  })));

              return h('div', null,
                h('label', { style: { ...labelStyle, marginTop: 12 } }, '发帖间隔模式（二选一，Worker 只按选中的模式执行）：', h(SideBadge, { side: 'post' })),
                h('div', { style: { display: 'flex', gap: 8 } },
                  seg('fixed', '⏱ 固定间隔'),
                  seg('random', '🎲 随机区间')),
                mode === 'random' ? randomInputs : fixedInputs,
                mode === 'random' ? randomRows : fixedRow);
            })(),

            h('label', { style: { ...labelStyle, marginTop: 10 } }, '原创发帖文案提示词（自定义 Prompt）：', h(SideBadge, { side: 'post' })),
            h('textarea', { style: { ...inputStyle, minHeight: 90 }, value: config?.postSettings?.customPrompt || '', onChange: e => updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), customPrompt: e.target.value } })) }),
            h('label', { style: { ...labelStyle, marginTop: 10 } }, '随机发帖话题灵感池（逗号分隔）：', h(SideBadge, { side: 'post' })),
            h('input', {
              style: inputStyle,
              value: topicsText,
              placeholder: '例如：文言雅趣, 周朝掌故, 易经随笔',
              onChange: e => setTopicsText(e.target.value),
              onBlur: e => {
                const parsed = splitTopics(e.target.value);
                setTopicsText(parsed.join(', '));
                updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), topics: parsed } }));
              },
            })),

          // 写作规则（来自 builtbyxm 写手规则）
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '📖 写作规则（三行结构 / 禁则 / 去重）'),
            h('p', { style: { margin: '6px 0 10px', fontSize: 12, color: C.faint, lineHeight: 1.6 } },
              '改动即时生效：生成提示词会带上这些要求，生成后再按同样规则硬校验，不合规重写一次，仍不合格就丢弃不入队。'),
            h('div', { style: { display: 'flex', gap: 16, flexWrap: 'wrap' } },
              h('label', { style: { ...labelStyle, flex: '1 1 150px' } },
                '行数：', h(SideBadge, { side: 'post' }),
                h('select', {
                  style: inputStyle,
                  value: String(config?.postSettings?.format?.lineCount ?? 3),
                  onChange: e => setPostFormat('lineCount', Number(e.target.value)),
                },
                  h('option', { value: '0' }, '自动（按内容自然分行）'),
                  ...[1, 2, 3, 4, 5, 6, 7, 8].map(n => h('option', { key: n, value: String(n) }, `固定 ${n} 行`)))),
              h('label', { style: { ...labelStyle, flex: '1 1 130px' } },
                '汉字下限：',
                h('input', {
                  type: 'number', min: 1, max: 500, style: inputStyle,
                  value: config?.postSettings?.format?.minChars ?? 30,
                  onChange: e => setPostFormat('minChars', e.target.value === '' ? '' : Number(e.target.value)),
                })),
              h('label', { style: { ...labelStyle, flex: '1 1 130px' } },
                '汉字上限：',
                h('input', {
                  type: 'number', min: 1, max: 500, style: inputStyle,
                  value: config?.postSettings?.format?.maxChars ?? 60,
                  onChange: e => setPostFormat('maxChars', e.target.value === '' ? '' : Number(e.target.value)),
                })),
              h('label', { style: { ...labelStyle, flex: '1 1 130px' } },
                '末行引导字：',
                h('input', {
                  style: inputStyle,
                  value: config?.postSettings?.format?.closingPrefix ?? '尔',
                  onChange: e => setPostFormat('closingPrefix', e.target.value),
                }))),
            h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginTop: 10 } },
              h('input', {
                type: 'checkbox',
                checked: config?.postSettings?.format?.requireClosingQuestion !== false,
                onChange: e => setPostFormat('requireClosingQuestion', e.target.checked),
              }),
              '末行必须以引导字开头并以问号结尾'),
            (config?.postSettings?.format?.lineCount ?? 3) === 0
              ? h('small', { style: { color: C.muted, fontSize: 11, display: 'block', marginTop: 6 } },
                  '当前为「自动」：不限行数，按句子自然分行（一句一行），仍会检查字数、末行提问与禁则。')
              : null,
            (() => {
              const fields = [
                ['persona', '人设与立场', true],
                ['line1Rule', '第 1 行要求', false],
                ['line2Rule', '第 2 行要求', false],
                ['line3Rule', '第 3 行要求（可用 {prefix}）', false],
                ['languageRule', '语言与用词要求', false],
                ['hotRewriteRule', '热点改写要求', true],
                ['extraRules', '附加要求（可留空）', true],
              ];
              const update = (key, value) => updateConfig(c => ({
                ...c,
                postSettings: { ...(c.postSettings || {}), style: { ...(c.postSettings?.style || {}), [key]: value } },
              }));
              const rows = fields.map(([key, label, multiline]) => h('label', {
                key,
                style: { ...labelStyle, marginTop: 8, display: 'block' },
              },
                label,
                multiline
                  ? h('textarea', {
                      style: { ...inputStyle, minHeight: 56, fontSize: 12 },
                      value: config?.postSettings?.style?.[key] ?? '',
                      onChange: e => update(key, e.target.value),
                    })
                  : h('input', {
                      style: { ...inputStyle, fontSize: 12 },
                      value: config?.postSettings?.style?.[key] ?? '',
                      onChange: e => update(key, e.target.value),
                    })));
              return h('div', { style: { marginTop: 14, paddingTop: 10, borderTop: `1px solid ${C.border}` } },
                h('div', { style: { fontSize: 13, fontWeight: '600', marginBottom: 6 } }, '✍️ 文风片段（每段都能改，生成时原样拼进提示词）'),
                h('small', { style: { color: C.faint, fontSize: 11, display: 'block', marginBottom: 8 } },
                  '可用占位符：{prefix} 末行引导字、{lines} 行数、{min} 字数下限、{max} 字数上限。'),
                ...rows);
            })(),
            h('label', { style: { ...labelStyle, marginTop: 10 } }, '首行禁用的软铺垫词（逗号分隔）：'),
            h('input', {
              style: inputStyle,
              value: (config?.postSettings?.format?.softOpeners || []).join('、'),
              onChange: e => setPostFormat('softOpeners', e.target.value.split(/[,，、\s]+/).map(x => x.trim()).filter(Boolean)),
            }),
            h('label', { style: { ...labelStyle, marginTop: 8 } }, '作废句式（逗号分隔）：'),
            h('input', {
              style: inputStyle,
              value: (config?.postSettings?.format?.bannedPatterns || []).join('、'),
              onChange: e => setPostFormat('bannedPatterns', e.target.value.split(/[,，、\s]+/).map(x => x.trim()).filter(Boolean)),
            }),
            h('label', { style: { ...labelStyle, marginTop: 8 } }, '白话虚词（逗号分隔，命中即重写）：'),
            h('input', {
              style: inputStyle,
              value: (config?.postSettings?.format?.forbidColloquial || []).join('、'),
              onChange: e => setPostFormat('forbidColloquial', e.target.value.split(/[,，、\s]+/).map(x => x.trim()).filter(Boolean)),
            }),
            h('label', { style: { ...labelStyle, marginTop: 8 } }, '硬底线（任何题材都不放松）：'),
            h('textarea', {
              style: { ...inputStyle, minHeight: 60, fontSize: 12 },
              value: config?.postSettings?.format?.hardBottomLines || '',
              onChange: e => setPostFormat('hardBottomLines', e.target.value),
            }),
            h('div', { style: { display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}` } },
              h('label', { style: { ...labelStyle, flex: '1 1 150px' } },
                '重复字数上限（与已发比）：',
                h('input', {
                  type: 'number', min: 0, max: 100, style: inputStyle,
                  value: config?.postSettings?.dedupe?.maxOverlapChars ?? 8,
                  onChange: e => setPostDedupe('maxOverlapChars', e.target.value === '' ? 0 : Number(e.target.value)),
                })),
              h('label', { style: { ...labelStyle, flex: '1 1 150px' } },
                '比对最近多少条：',
                h('input', {
                  type: 'number', min: 1, max: 500, style: inputStyle,
                  value: config?.postSettings?.dedupe?.recentPosts ?? 50,
                  onChange: e => setPostDedupe('recentPosts', e.target.value === '' ? 50 : Number(e.target.value)),
                })),
              h('label', { style: { ...labelStyle, flex: '1 1 150px' } },
                '同骨架冷却（小时）：',
                h('input', {
                  type: 'number', min: 0, max: 720, style: inputStyle,
                  value: config?.postSettings?.dedupe?.skeletonCooldownHours ?? 48,
                  onChange: e => setPostDedupe('skeletonCooldownHours', e.target.value === '' ? 0 : Number(e.target.value)),
                }))),
            h('div', { style: { display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 } },
              h('label', { style: { ...labelStyle, flex: '1 1 130px' } },
                '政治每日上限：',
                h('input', {
                  type: 'number', min: 0, max: 50, style: inputStyle,
                  value: config?.postSettings?.politicalCap?.dailyMax ?? 3,
                  onChange: e => setPostCap('dailyMax', e.target.value === '' ? 0 : Number(e.target.value)),
                })),
              h('label', { style: { ...labelStyle, flex: '1 1 130px' } },
                '同一事件上限：',
                h('input', {
                  type: 'number', min: 0, max: 50, style: inputStyle,
                  value: config?.postSettings?.politicalCap?.perEventMax ?? 1,
                  onChange: e => setPostCap('perEventMax', e.target.value === '' ? 0 : Number(e.target.value)),
                })),
              h('label', { style: { ...labelStyle, flex: '1 1 160px' } },
                '每批热点占比下限（%）：',
                h('input', {
                  type: 'number', min: 0, max: 100, style: inputStyle,
                  value: config?.postSettings?.hotTopicShareMinPercent ?? 33,
                  onChange: e => updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), hotTopicShareMinPercent: e.target.value === '' ? 0 : Number(e.target.value) } })),
                }))),
            h('div', { style: { marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}` } },
              h('button', {
                type: 'button',
                style: { ...buttonStyle(true), padding: '7px 14px', fontSize: 12 },
                onClick: () => {
                  const preset = [
                    { id: 'hook_xy', label: '香艳', weight: 60, prompt: '古典艳诗/宫体诗气质，写虚构成年女子，称卿、佳人、娘子。闺房双关、调情、暧昧动作，用一句双关收束。不写琴、月、帘、花之类氛围小品。' },
                    { id: 'hook_pp', label: '批判', weight: 20, prompt: '骂一件具体的事（热点、制度动作、平台坑、看客、伪君子），要有具体人物/动作/数字。' },
                    { id: 'hook_gn', label: '搞女人', weight: 20, prompt: '成年人自愿的暧昧、男女博弈、相亲彩礼、渣男渣女、嘴上装身体诚实。' },
                  ];
                  updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), topicMix: preset } }));
                  setNotice('已套用文档配比：香艳 60% / 批判 20% / 搞女人 20%，记得保存。');
                },
              }, '⚡ 套用文档配比（香艳60/批判20/搞女人20）'),
              h('small', { style: { display: 'block', marginTop: 6, fontSize: 11, color: C.faint } },
                '替换当前「主题配比」。楚辞占比可在主题里单独加一条，或在时段文风里控制。')),
          ),

          // 格式硬性要求
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '📐 格式硬性要求'),
            h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginTop: 8 } },
              h('input', {
                type: 'checkbox',
                checked: config?.postSettings?.oneSentencePerLine !== false,
                onChange: e => updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), oneSentencePerLine: e.target.checked } })),
              }),
              '强制「一句一行」，禁止整段连写', h(SideBadge, { side: 'post' })),
            h('p', { style: { margin: '8px 0 0', fontSize: 12, color: C.faint, lineHeight: 1.6 } },
              '开启后在两处生效：① 提示词里明确要求模型逐句换行；② 生成后按标点强制重排（中文 。！？；、英文 .!? 断句，收尾引号跟随前句），所以即使模型不配合也会被纠正。发帖前还会再兜底一次，队列里的旧稿同样适用。')),

          // 批次休息
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '😴 发帖批次休息'),
            h('p', { style: { margin: '6px 0 10px', fontSize: 12, color: C.faint, lineHeight: 1.6 } },
              '按「条数」触发的休息，与通用配置里按「时长」触发的工作/休息周期相互独立：这里每发满 N 条就停 M 分钟，让人工号更像真人节奏。'),
            h('div', { style: { display: 'flex', gap: 16, flexWrap: 'wrap' } },
              h('label', { style: { ...labelStyle, flex: '1 1 200px' } },
                '每发多少条后休息（0=关闭）：', h(SideBadge, { side: 'post' }),
                h('input', {
                  type: 'number', min: 0, max: 100, style: inputStyle,
                  value: config?.postSettings?.restEveryPosts ?? 8,
                  onChange: e => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), restEveryPosts: val } }));
                  }
                })),
              h('label', { style: { ...labelStyle, flex: '1 1 200px' } },
                '每次休息多少分钟：', h(SideBadge, { side: 'post' }),
                h('input', {
                  type: 'number', min: 1, max: 240, style: inputStyle,
                  value: config?.postSettings?.restMinutes ?? 3,
                  onChange: e => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), restMinutes: val } }));
                  }
                }))),
            h('small', { style: { color: C.faint, fontSize: 12, marginTop: 8, display: 'block' } },
              `当前：${(config?.postSettings?.restEveryPosts ?? 8) === 0 ? '不按条数休息' : `每发 ${config?.postSettings?.restEveryPosts ?? 8} 条后休息 ${config?.postSettings?.restMinutes ?? 3} 分钟`}；计数器在 Worker 重启后继续累计，不会因为重启而永远不休息。`)),

          // 生成配比：学习规则强度 + 主题配比
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '🎚️ 生成配比（提示词 / 学习规则 / 主题）'),
            h('p', { style: { margin: '6px 0 10px', fontSize: 12, color: C.faint, lineHeight: 1.6 } },
              '每条文由三层组成：① 上面的发帖提示词与时段文风（骨架，始终生效）② 学习规则（按下方强度注入）③ 主题方向（按权重随机抽取）。'),

            h('label', { style: { ...labelStyle, marginTop: 4 } }, '学习规则强度（0=完全不用学习成果，100=全量注入）：', h(SideBadge, { side: 'post' })),
            h('div', { style: { display: 'flex', gap: 12, alignItems: 'center' } },
              h('input', {
                type: 'range', min: 0, max: 100, step: 5,
                style: { flex: 1 },
                value: config?.postSettings?.learningInfluence ?? 100,
                onChange: e => updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), learningInfluence: Number(e.target.value) } })),
              }),
              h('strong', { style: { minWidth: 48, textAlign: 'right', fontSize: 14 } }, `${config?.postSettings?.learningInfluence ?? 100}%`)),
            h('small', { style: { color: C.faint, fontSize: 12 } },
              `当前学习注入：${(config?.postSettings?.learningInfluence ?? 100) === 0 ? '已关闭' : `约 ${Math.round(1600 * (config?.postSettings?.learningInfluence ?? 100) / 100)} 字`}；避写话题始终生效，不受强度影响。`),

            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 18 } },
              h('div', null,
                h('div', { style: { fontSize: 13, fontWeight: '600' } }, '主题配比（合计需为 100%）'),
                h('small', { style: { color: C.faint, fontSize: 12 } }, '例如：文言文 50% · 撩女人 30% · 谈生活 20%。比例越高出现越频繁。')),
              (() => {
                const mix = config?.postSettings?.topicMix || [];
                const total = mix.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
                return h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
                  h('span', { style: { fontSize: 12, fontWeight: '600', color: total === 100 ? C.success : C.error } }, `合计 ${total}%`),
                  h('button', {
                    type: 'button',
                    disabled: busy,
                    style: { ...buttonStyle(false), fontSize: 12, padding: '4px 10px' },
                    onClick: () => updateConfig(c => {
                      const current = [...(c.postSettings?.topicMix || [])];
                      if (current.length >= 12) return c;
                      current.push({ id: `theme-${Date.now()}`, label: '新主题', weight: 0, prompt: '' });
                      return { ...c, postSettings: { ...(c.postSettings || {}), topicMix: current } };
                    }),
                  }, '➕ 新增主题'));
              })()),
            (() => {
              const mix = config?.postSettings?.topicMix || [];
              const patch = (id, patchValue) => updateConfig(c => ({
                ...c,
                postSettings: {
                  ...(c.postSettings || {}),
                  topicMix: (c.postSettings?.topicMix || []).map(item => (item.id === id ? { ...item, ...patchValue } : item)),
                },
              }));
              if (!mix.length) {
                return h('div', { style: { marginTop: 10, padding: '12px', background: C.layerTwo, borderRadius: 8, fontSize: 12, color: C.faint } },
                  '未启用主题配比：所有帖子共用同一套提示词。点「➕ 新增主题」开始按比例分配。');
              }
              return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 } },
                ...mix.map(item => h('div', {
                  key: item.id,
                  style: { padding: '10px 12px', borderRadius: 8, background: C.layerTwo, border: `1px solid ${C.border}` }
                },
                  h('div', { style: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' } },
                    h('input', {
                      style: { ...inputStyle, flex: '1 1 140px', margin: 0 },
                      placeholder: '主题名称，如 文言文 / 撩女人 / 谈生活',
                      value: item.label,
                      onChange: e => patch(item.id, { label: e.target.value }),
                    }),
                    h('div', { style: { display: 'flex', gap: 6, alignItems: 'center' } },
                      h('input', {
                        type: 'number', min: 0, max: 100, style: { ...inputStyle, width: 80, margin: 0 },
                        value: item.weight,
                        onChange: e => patch(item.id, { weight: e.target.value === '' ? 0 : Number(e.target.value) }),
                      }),
                      h('span', { style: { fontSize: 12, color: C.muted } }, '%')),
                    h('button', {
                      type: 'button', disabled: busy,
                      style: { ...buttonStyle(false), padding: '2px 8px', fontSize: 11, color: C.error, borderColor: C.error },
                      onClick: () => updateConfig(c => ({
                        ...c,
                        postSettings: { ...(c.postSettings || {}), topicMix: (c.postSettings?.topicMix || []).filter(x => x.id !== item.id) },
                      })),
                    }, '✕ 删除')),
                  h('textarea', {
                    style: { ...inputStyle, minHeight: 48, marginTop: 8, fontSize: 12 },
                    placeholder: '这个主题的写法和侧重点，例如：围绕搞钱与追求异性展开，风趣不低俗…',
                    value: item.prompt || '',
                    onChange: e => patch(item.id, { prompt: e.target.value }),
                  }))));
            })()),

          // 分时段文风调度
          h('section', { style: cardStyle },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 } },
              h('div', null,
                h('h2', { style: { margin: 0, fontSize: 15 } }, '🕰️ 分时段文风调度（北京时间）'),
                h('p', { style: { margin: '4px 0 0', fontSize: 12, color: C.faint, lineHeight: 1.6 } },
                  '按时段切换文风：落在一段区间内就用该段的提示词，都没命中则回落到上面的「原创发帖文案提示词」。时间段左闭右开，例如 1~7 表示 01:00 到 06:59。')),
              h('button', {
                type: 'button',
                disabled: busy,
                style: { ...buttonStyle(false), fontSize: 12, padding: '4px 10px' },
                onClick: () => updateConfig(c => {
                  const slots = [...(c.postSettings?.styleSchedule || [])];
                  if (slots.length >= 12) return c;
                  const id = `slot-${Date.now()}`;
                  slots.push({ id, label: '新时段', startHour: 0, endHour: 1, prompt: '' });
                  return { ...c, postSettings: { ...(c.postSettings || {}), styleSchedule: slots } };
                })
              }, '➕ 新增时段')),
            (() => {
              const slots = config?.postSettings?.styleSchedule || [];
              const nowHour = (new Date().getUTCHours() + 8) % 24;
              const patchSlot = (id, patch) => updateConfig(c => ({
                ...c,
                postSettings: {
                  ...(c.postSettings || {}),
                  styleSchedule: (c.postSettings?.styleSchedule || []).map(slot => (
                    slot.id === id ? { ...slot, ...patch } : slot
                  )),
                },
              }));
              if (!slots.length) {
                return h('div', { style: { marginTop: 10, padding: '12px', background: C.layerTwo, borderRadius: 8, fontSize: 12, color: C.faint } },
                  '还没有分时段配置，当前所有时间都用同一条全局提示词。点右上角「➕ 新增时段」开始。');
              }
              return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 } },
                ...slots.map(slot => {
                  const active = nowHour >= slot.startHour && nowHour < slot.endHour;
                  return h('div', {
                    key: slot.id,
                    style: {
                      padding: '10px 12px', borderRadius: 8, background: C.layerTwo,
                      border: `1px solid ${active ? C.accent : C.border}`,
                      borderLeft: `4px solid ${active ? C.accent : C.border}`,
                    }
                  },
                    h('div', { style: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' } },
                      h('input', {
                        style: { ...inputStyle, flex: '1 1 120px', margin: 0 },
                        placeholder: '时段名称，如 文言文 / 英文 / 楚辞',
                        value: slot.label,
                        onChange: e => patchSlot(slot.id, { label: e.target.value }),
                      }),
                      h('div', { style: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: C.muted } },
                        h('input', {
                          type: 'number', min: 0, max: 23, style: { ...inputStyle, width: 72, margin: 0 },
                          value: slot.startHour,
                          onChange: e => patchSlot(slot.id, { startHour: e.target.value === '' ? 0 : Number(e.target.value) }),
                        }),
                        '时 ~',
                        h('input', {
                          type: 'number', min: 1, max: 24, style: { ...inputStyle, width: 72, margin: 0 },
                          value: slot.endHour,
                          onChange: e => patchSlot(slot.id, { endHour: e.target.value === '' ? 24 : Number(e.target.value) }),
                        }),
                        '时'),
                      active ? h('span', { style: { fontSize: 11, padding: '2px 8px', borderRadius: 999, background: C.accent, color: '#fff' } }, '当前生效') : null,
                      h('button', {
                        type: 'button',
                        disabled: busy,
                        style: { ...buttonStyle(false), padding: '2px 8px', fontSize: 11, color: C.error, borderColor: C.error },
                        onClick: () => updateConfig(c => ({
                          ...c,
                          postSettings: {
                            ...(c.postSettings || {}),
                            styleSchedule: (c.postSettings?.styleSchedule || []).filter(item => item.id !== slot.id),
                          },
                        })),
                      }, '✕ 删除')),
                    h('textarea', {
                      style: { ...inputStyle, minHeight: 56, marginTop: 8, fontSize: 12 },
                      placeholder: '该时段的文风要求，例如：用楚辞体写，多用「兮」字句与香草美人意象…',
                      value: slot.prompt || '',
                      onChange: e => patchSlot(slot.id, { prompt: e.target.value }),
                    }));
                }));
            })()),

          // 队列补仓策略设置
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '🧺 待发队列补仓策略（自动囤稿）'),
            h('p', { style: { margin: '6px 0 10px', fontSize: 12, color: C.faint, lineHeight: 1.6 } },
              'Worker 会在每轮发帖前检查队列：待发稿件少于「自动补仓阈值」时，立刻按「每批生成条数」调用大模型生成草稿补入队列，确保你随时能看到足够的待发稿子，并可手动删除不合适的。'),
            h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginTop: 8 } },
              h('input', {
                type: 'checkbox',
                checked: config?.postSettings?.queueAutoRefill !== false,
                onChange: e => updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), queueAutoRefill: e.target.checked } })),
              }),
              '🔄 启用自动补仓（队列低于阈值时自动生成）', h(SideBadge, { side: 'post' })),
            h('div', { style: { display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' } },
              h('label', { style: { ...labelStyle, flex: '1 1 180px' } },
                '每批生成条数：', h(SideBadge, { side: 'post' }),
                h('input', {
                  type: 'number',
                  min: 1,
                  max: 50,
                  style: inputStyle,
                  placeholder: '例如 10',
                  value: config?.postSettings?.queueBatchSize ?? 10,
                  onChange: e => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), queueBatchSize: val } }));
                  }
                })
              ),
              h('label', { style: { ...labelStyle, flex: '1 1 180px' } },
                '自动补仓阈值（低于此条数即补货）：', h(SideBadge, { side: 'post' }),
                h('input', {
                  type: 'number',
                  min: 0,
                  max: 50,
                  style: inputStyle,
                  placeholder: '例如 3',
                  value: config?.postSettings?.queueLowThreshold ?? 3,
                  onChange: e => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), queueLowThreshold: val } }));
                  }
                })
              ),
              h('label', { style: { ...labelStyle, flex: '1 1 180px' } },
                '队列容量上限：', h(SideBadge, { side: 'post' }),
                h('input', {
                  type: 'number',
                  min: 1,
                  max: 200,
                  style: inputStyle,
                  placeholder: '例如 100',
                  value: config?.postSettings?.queueMaxSize ?? 100,
                  onChange: e => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), queueMaxSize: val } }));
                  }
                })
              )
            )
          ),

          // 历史已发送记录
          state?.postHistory && state.postHistory.length > 0 ? h('section', { style: cardStyle },
            h('h2', { style: { margin: '0 0 10px', fontSize: 15 } }, `📜 最近已发送推文记录 (${state.postHistory.length} 条)`),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
              ...state.postHistory.slice().reverse().slice(0, 10).map((hItem, idx) => h('div', {
                key: idx,
                style: { padding: '8px 12px', background: C.layerTwo, borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12 }
              },
                h('div', { style: { color: C.faint, marginBottom: 2, display: 'flex', gap: 10 } },
                  h('span', null, `🕒 ${hItem.time || '刚刚'}`),
                  hItem.source ? h('span', { style: { color: '#38bdf8' } }, `[${hItem.source}]`) : null
                ),
                h('div', { style: { color: C.text, lineHeight: 1.4 } }, hItem.text)
              ))
            )
          ) : null
        ) : null,

        // TAB: 🧠 发帖学习
        activeTab === 'learning' ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
          h('section', { style: cardStyle },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 } },
              h('div', null,
                h('h2', { style: { margin: 0, fontSize: 16 } }, '🧠 发帖学习 · 让自动发帖照着高曝光套路写'),
                h('p', { style: { margin: '4px 0 0', fontSize: 12, color: C.faint, lineHeight: 1.6 } },
                  '学习只借鉴「选题方向 + 结构节奏 + 钩子」，最终产出仍然严格按「📝 自动发帖」里的文言文文风写，不会照抄原句。')),
              h('button', {
                type: 'button',
                disabled: busy || learnBusy,
                style: { ...buttonStyle(true), padding: '8px 18px', fontSize: 13 },
                onClick: async () => {
                  setLearnBusy(true);
                  setError('');
                  setNotice('已通知发帖 Worker 立即学习（历史表现 + X 榜单）。约 1~3 分钟后结果会出现在下方。');
                  try {
                    await act('trigger-learn', undefined, { withBenchmark: true });
                  } catch (err) {
                    setError(`触发学习失败：${err.message || String(err)}`);
                  } finally {
                    setLearnBusy(false);
                  }
                }
              }, learnBusy ? '⏳ 学习中...' : '🚀 立即学习一次')),
            h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginTop: 10 } },
              h('input', { type: 'checkbox', checked: config?.learningSettings?.enabled !== false, onChange: e => updateConfig(c => ({ ...c, learningSettings: { ...(c.learningSettings || {}), enabled: e.target.checked } })) }),
              '启用发帖学习模块', h(SideBadge, { side: 'post' })),
            h(ModelPicker, {
              value: config?.learningSettings?.model || '',
              onChange: val => updateConfig(c => ({ ...c, learningSettings: { ...(c.learningSettings || {}), model: val } })),
              side: 'post',
              label: '🧠 发帖学习专用大模型（留空则跟随发帖模型）：'
            }),
            h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginTop: 6 } },
              h('input', { type: 'checkbox', checked: config?.learningSettings?.autoLearn !== false, onChange: e => updateConfig(c => ({ ...c, learningSettings: { ...(c.learningSettings || {}), autoLearn: e.target.checked } })) }),
              '⏱ 按间隔自动学习（关闭后只能手动触发）', h(SideBadge, { side: 'post' })),
            h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginTop: 6 } },
              h('input', { type: 'checkbox', checked: config?.learningSettings?.injectIntoPost !== false, onChange: e => updateConfig(c => ({ ...c, learningSettings: { ...(c.learningSettings || {}), injectIntoPost: e.target.checked } })) }),
              '✨ 生成推文时参考学习成果（关闭则仍按原始提示词写）', h(SideBadge, { side: 'post' }))
          ),

          // 1. 历史发帖表现
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '① 我的历史发帖表现'),
            h('p', { style: { margin: '6px 0 10px', fontSize: 12, color: C.faint, lineHeight: 1.6 } },
              'Worker 只分析落在【下限 ~ 上限】小时区间内的推文，避开刚发出、曝光还在累积的新帖。达到任一门槛的进入学习；同一话题反复不达标会被拉黑，之后不再写。'),
            h('div', { style: { display: 'flex', gap: 16, flexWrap: 'wrap' } },
              h('label', { style: { ...labelStyle, flex: '1 1 150px' } },
                '检查间隔（分钟）：', h(SideBadge, { side: 'post' }),
                h('input', { type: 'number', min: 5, max: 10080, style: inputStyle, value: config?.learningSettings?.checkIntervalMinutes ?? 360, onChange: e => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  updateConfig(c => ({ ...c, learningSettings: { ...(c.learningSettings || {}), checkIntervalMinutes: val } }));
                } })),
              h('label', { style: { ...labelStyle, flex: '1 1 130px' } },
                '只分析「至少」多少小时前：', h(SideBadge, { side: 'post' }),
                h('input', { type: 'number', min: 1, max: 2160, style: inputStyle, value: config?.learningSettings?.minAgeHours ?? 12, onChange: e => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  updateConfig(c => ({ ...c, learningSettings: { ...(c.learningSettings || {}), minAgeHours: val } }));
                } })),
              h('label', { style: { ...labelStyle, flex: '1 1 130px' } },
                '只分析「最多」多少小时前：', h(SideBadge, { side: 'post' }),
                h('input', { type: 'number', min: 1, max: 2160, style: inputStyle, value: config?.learningSettings?.historyHours ?? 36, onChange: e => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  updateConfig(c => ({ ...c, learningSettings: { ...(c.learningSettings || {}), historyHours: val } }));
                } })),
              h('label', { style: { ...labelStyle, flex: '1 1 150px' } },
                '曝光量门槛：', h(SideBadge, { side: 'post' }),
                h('input', { type: 'number', min: 0, style: inputStyle, value: config?.learningSettings?.minImpressions ?? 1000, onChange: e => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  updateConfig(c => ({ ...c, learningSettings: { ...(c.learningSettings || {}), minImpressions: val } }));
                } })),
              h('label', { style: { ...labelStyle, flex: '1 1 150px' } },
                '评论数门槛：', h(SideBadge, { side: 'post' }),
                h('input', { type: 'number', min: 0, style: inputStyle, value: config?.learningSettings?.minComments ?? 3, onChange: e => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  updateConfig(c => ({ ...c, learningSettings: { ...(c.learningSettings || {}), minComments: val } }));
                } })),
              h('label', { style: { ...labelStyle, flex: '1 1 150px' } },
                '点赞数门槛：', h(SideBadge, { side: 'post' }),
                h('input', { type: 'number', min: 0, style: inputStyle, value: config?.learningSettings?.minLikes ?? 10, onChange: e => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  updateConfig(c => ({ ...c, learningSettings: { ...(c.learningSettings || {}), minLikes: val } }));
                } })),
              h('label', { style: { ...labelStyle, flex: '1 1 150px' } },
                '单次最多分析条数：', h(SideBadge, { side: 'post' }),
                h('input', { type: 'number', min: 1, max: 100, style: inputStyle, value: config?.learningSettings?.maxSamples ?? 20, onChange: e => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  updateConfig(c => ({ ...c, learningSettings: { ...(c.learningSettings || {}), maxSamples: val } }));
                } }))
            ),
            state?.learnings?.history?.lastRunAt ? h('div', { style: { marginTop: 12 } },
              h('div', { style: { fontSize: 12, color: C.muted, marginBottom: 6 } },
                `上次学习：${state.learnings.history.lastRunAt} · 分析 ${state.learnings.history.considered} 条 · 达标 ${state.learnings.history.learned} 条`,
                state.learnings.history.note ? ` · ${state.learnings.history.note}` : ''),
              state.learnings.history.posts?.length ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
                ...state.learnings.history.posts.slice(0, 20).map((post, idx) => h('div', {
                  key: post.id || idx,
                  style: {
                    display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 10px',
                    background: C.layerTwo, borderRadius: 6, borderLeft: `3px solid ${post.learned ? C.success : C.border}`,
                    border: `1px solid ${C.border}`, fontSize: 12,
                  }
                },
                  h('div', { style: { flex: 1, minWidth: 0 } },
                    h('div', { style: { display: 'flex', gap: 8, marginBottom: 3, flexWrap: 'wrap' } },
                      post.learned ? h('span', { style: { color: C.success, fontWeight: 'bold' } }, '✓ 已学习') : h('span', { style: { color: C.faint } }, '· 未达标'),
                      h('span', { style: { color: C.faint } }, `曝光 ${post.views ?? '—'} / 赞 ${post.likes ?? '—'} / 评 ${post.comments ?? '—'}`),
                      post.topic ? h('span', { style: { color: C.accent } }, `话题：${post.topic}`) : null),
                    h('div', { style: { color: C.text, lineHeight: 1.4 } }, (post.text || '').slice(0, 120) + ((post.text || '').length > 120 ? '…' : ''))),
                  post.topic ? h('button', {
                    type: 'button',
                    title: '以后不要再写这个话题',
                    style: { ...buttonStyle(false), padding: '2px 8px', fontSize: 11, color: C.error, borderColor: C.error, alignSelf: 'flex-start' },
                    onClick: () => void act('promote-topic', undefined, { topic: post.topic, target: 'banned' })
                  }, '🚫 避写') : null
                ))
              ) : null
            ) : h('div', { style: { marginTop: 10, padding: '12px', background: C.layerTwo, borderRadius: 8, fontSize: 12, color: C.faint } },
              '还没有学习记录。点击右上角「🚀 立即学习一次」开始。')
          ),

          // 热榜话题源
          h('section', { style: cardStyle },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 } },
              h('div', null,
                h('h2', { style: { margin: 0, fontSize: 15 } }, '🔥 热榜话题源'),
                h('p', { style: { margin: '4px 0 0', fontSize: 12, color: C.faint, lineHeight: 1.6 } },
                  '发帖时读取这些榜单的话题，按「每批热榜条数」插入几条借热度的原创改写。需登录态的源会被自动跳过。')),
              h('button', {
                type: 'button',
                disabled: busy,
                style: { ...buttonStyle(true), padding: '6px 14px', fontSize: 12 },
                onClick: async () => {
                  try {
                    const res = await act('fetch-trends');
                    setNotice(res?.note || '热榜已刷新。');
                  } catch (err) { setError(`抓取失败：${err.message || String(err)}`); }
                }
              }, '🔄 立即抓取热榜')),
            h('label', { style: { ...labelStyle, marginTop: 10 } }, '每批生成中插入几条热榜改写（0=不插入）：', h(SideBadge, { side: 'post' })),
            h('input', {
              type: 'number', min: 0, max: 20, style: inputStyle,
              value: config?.postSettings?.hotTopicPerBatch ?? 2,
              onChange: e => updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), hotTopicPerBatch: e.target.value === '' ? 0 : Number(e.target.value) } })),
            }),
            (() => {
              const trends = state?.trends;
              const filter = config?.postSettings?.hotFilter || {};
              const minLength = Number(filter.minLength) || 4;
              const maxLength = Number(filter.maxLength) || 50;
              const excludes = (filter.excludeKeywords || []).map(w => String(w).toLowerCase());
              const prefers = (filter.preferKeywords || []).map(w => String(w).toLowerCase());
              // Manually removed headlines: they return on every fetch, so the skip
              // list is stored in config and can be undone from the same panel.
              const excludedTopics = Array.isArray(filter.excludedTopics) ? filter.excludedTopics : [];
              const excludedSet = new Set(excludedTopics.map(w => String(w).replace(/\s+/g, ' ').trim().toLowerCase()));
              const setExcludedTopics = next => updateConfig(c => ({
                ...c,
                postSettings: {
                  ...(c.postSettings || {}),
                  hotFilter: { ...(c.postSettings?.hotFilter || {}), excludedTopics: next },
                },
              }));
              const excludeTopic = topic => {
                const value = String(topic || '').replace(/\s+/g, ' ').trim();
                if (!value) return;
                setExcludedTopics([...new Set([...excludedTopics, value])].slice(0, 300));
                setNotice(`已剔除「${value}」，保存后长期生效。`);
              };
              const restoreTopic = topic => {
                setExcludedTopics(excludedTopics.filter(item => item !== topic));
                setNotice(`已恢复「${topic}」，保存后长期生效。`);
              };
              const judge = topic => {
                const normalized = String(topic).replace(/\s+/g, ' ').trim();
                if (excludedSet.has(normalized.toLowerCase())) return { ok: false, reason: '手动剔除' };
                if (topic.length < minLength) return { ok: false, reason: '太短' };
                if (topic.length > maxLength) return { ok: false, reason: '太长' };
                const lower = topic.toLowerCase();
                const hit = excludes.find(w => w && lower.includes(w));
                if (hit) return { ok: false, reason: `敏感词「${hit}」` };
                const preferred = prefers.some(w => w && lower.includes(w));
                return { ok: true, reason: preferred ? '偏好优先' : '可用' };
              };
              const all = (trends?.topics || []);
              if (!all.length) {
                return h('div', { style: { marginTop: 10, padding: '10px', background: C.layerTwo, borderRadius: 8, fontSize: 12, color: C.faint } },
                  '还没有热榜数据。点右上角「🔄 立即抓取热榜」或等 Worker 自动抓取。');
              }
              const judged = all.map(topic => ({ topic, ...judge(topic) }));
              const usable = judged.filter(x => x.ok);
              const dropped = judged.filter(x => !x.ok);
              const chip = (item, index, action) => h('div', {
                key: index + '-' + item.topic,
                title: item.reason,
                style: {
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11, padding: '3px 8px', borderRadius: 6,
                  background: item.ok ? C.layerTwo : 'rgba(220,80,80,0.10)',
                  border: `1px solid ${item.ok ? C.border : 'rgba(220,80,80,0.35)'}`,
                  color: item.ok ? C.text : C.faint,
                  textDecoration: item.ok ? 'none' : 'line-through',
                  maxWidth: 280, overflow: 'hidden', whiteSpace: 'nowrap',
                },
              },
                h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, item.topic),
                action || null);
              const chipAction = (label, title, onClick, color) => h('button', {
                type: 'button', title, onClick,
                style: { border: 'none', background: 'transparent', color, cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1, flex: '0 0 auto' },
              }, label);
              return h('div', { style: { marginTop: 10 } },
                h('div', { style: { fontSize: 12, color: C.muted, marginBottom: 6 } },
                  `上次抓取：${trends.fetchedAt || '-'} · 共 ${all.length} 条 · ` +
                  (trends.sources || []).map(x => `${x.label}${x.ok ? '✓' : '✗'}`).join(' ')),
                h('div', { style: { fontSize: 12, marginBottom: 6 } },
                  h('span', { style: { color: C.success, fontWeight: '600' } }, `可用 ${usable.length} 条`),
                  h('span', { style: { color: C.faint, margin: '0 8px' } }, '/'),
                  h('span', { style: { color: C.error } }, `已剔除 ${dropped.length} 条`),
                  h('span', { style: { color: C.faint, marginLeft: 8 } }, '（带删除线的会被自动跳过，悬停可看原因）')),
                h('div', { style: { fontSize: 12, fontWeight: '600', margin: '8px 0 4px', color: C.text } }, `✅ 会被采用的（点 ✕ 从热榜里剔除）`),
                h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 140, overflowY: 'auto' } },
                  ...(usable.length
                    ? usable.map((item, index) => chip(item, index, chipAction('✕', '手动剔除，不再采用', () => excludeTopic(item.topic), C.error)))
                    : [h('span', { style: { fontSize: 12, color: C.faint } }, '（无，全部被过滤——请检查筛选规则是否过严）')])),
                h('div', { style: { fontSize: 12, fontWeight: '600', margin: '10px 0 4px', color: C.text } }, '🚫 被剔除的'),
                h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 110, overflowY: 'auto' } },
                  ...(dropped.length ? dropped.map((item, index) => chip(item, index)) : [h('span', { style: { fontSize: 12, color: C.faint } }, '（无）')])),
                h('div', { style: { fontSize: 12, fontWeight: '600', margin: '10px 0 4px', color: C.text } }, `🚫 手动剔除的话题（${excludedTopics.length} 条，点 ↩ 恢复）`),
                h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 5, maxHeight: 110, overflowY: 'auto' } },
                  ...(excludedTopics.length
                    ? excludedTopics.map((topic, index) => chip({ topic, ok: false, reason: '手动剔除，点 ↩ 恢复' }, index, chipAction('↩', '恢复采用', () => restoreTopic(topic), C.accent)))
                    : [h('span', { style: { fontSize: 12, color: C.faint } }, '（无。在上面的「会被采用的」里点 ✕ 就能剔除任意热榜话题）')])));
            })(),
            h('div', { style: { marginTop: 14, padding: '10px 12px', borderRadius: 8, background: C.layerTwo, border: `1px solid ${C.border}` } },
              h('div', { style: { fontSize: 13, fontWeight: '600', marginBottom: 6 } }, '🎯 热榜挑选规则'),
              h('label', { style: { ...labelStyle, marginTop: 4 } }, '剔除关键词（命中即跳过，逗号分隔）：'),
              h('textarea', {
                style: { ...inputStyle, minHeight: 62, fontSize: 12 },
                value: (config?.postSettings?.hotFilter?.excludeKeywords || []).join(', '),
                onChange: e => updateConfig(c => ({
                  ...c,
                  postSettings: {
                    ...(c.postSettings || {}),
                    hotFilter: {
                      ...(c.postSettings?.hotFilter || {}),
                      excludeKeywords: e.target.value.split(/[,，\s]+/).map(x => x.trim()).filter(Boolean),
                    },
                  },
                })),
              }),
              h('label', { style: { ...labelStyle, marginTop: 10 } }, '偏好关键词（命中的话题优先被选中，逗号分隔）：'),
              h('input', {
                style: inputStyle,
                placeholder: '例如：感情, 职场, 生活, 影视',
                value: (config?.postSettings?.hotFilter?.preferKeywords || []).join(', '),
                onChange: e => updateConfig(c => ({
                  ...c,
                  postSettings: {
                    ...(c.postSettings || {}),
                    hotFilter: { ...(c.postSettings?.hotFilter || {}), preferKeywords: e.target.value.split(/[,，\s]+/).map(x => x.trim()).filter(Boolean) },
                  },
                })),
              }),
              h('div', { style: { display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' } },
                h('label', { style: { ...labelStyle, flex: '1 1 150px' } },
                  '话题最短字数：',
                  h('input', {
                    type: 'number', min: 1, max: 200, style: inputStyle,
                    value: config?.postSettings?.hotFilter?.minLength ?? 4,
                    onChange: e => updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), hotFilter: { ...(c.postSettings?.hotFilter || {}), minLength: e.target.value === '' ? '' : Number(e.target.value) } } })),
                  })),
                h('label', { style: { ...labelStyle, flex: '1 1 150px' } },
                  '话题最长字数：',
                  h('input', {
                    type: 'number', min: 1, max: 200, style: inputStyle,
                    value: config?.postSettings?.hotFilter?.maxLength ?? 50,
                    onChange: e => updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), hotFilter: { ...(c.postSettings?.hotFilter || {}), maxLength: e.target.value === '' ? '' : Number(e.target.value) } } })),
                  })))),
            h('div', { style: { marginTop: 12 } },
              h('div', { style: { fontSize: 13, fontWeight: '600', marginBottom: 6 } }, '来源列表（可开关 / 改名 / 换地址）'),
              h('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
                ...((config?.learningSettings?.trendSources) || []).map(source => h('div', {
                  key: source.id,
                  style: { display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px', background: C.layerTwo, borderRadius: 6, border: `1px solid ${C.border}` }
                },
                  h('input', {
                    type: 'checkbox', checked: source.enabled !== false,
                    onChange: e => updateConfig(c => ({
                      ...c,
                      learningSettings: {
                        ...(c.learningSettings || {}),
                        trendSources: (c.learningSettings?.trendSources || []).map(item => (item.id === source.id ? { ...item, enabled: e.target.checked } : item)),
                      },
                    })),
                  }),
                  h('input', {
                    style: { ...inputStyle, flex: '0 0 150px', margin: 0, fontSize: 12 },
                    value: source.label,
                    onChange: e => updateConfig(c => ({
                      ...c,
                      learningSettings: { ...(c.learningSettings || {}), trendSources: (c.learningSettings?.trendSources || []).map(item => (item.id === source.id ? { ...item, label: e.target.value } : item)) },
                    })),
                  }),
                  h('input', {
                    style: { ...inputStyle, flex: '1 1 300px', margin: 0, fontSize: 12 },
                    value: source.url,
                    onChange: e => updateConfig(c => ({
                      ...c,
                      learningSettings: { ...(c.learningSettings || {}), trendSources: (c.learningSettings?.trendSources || []).map(item => (item.id === source.id ? { ...item, url: e.target.value } : item)) },
                    })),
                  })))))),

          // Cookie 配置（需登录态的榜单）
        h('section', { style: cardStyle },
          h('h2', { style: { margin: 0, fontSize: 15 } }, '🍪 榜单 Cookie（需登录态的源才要填）'),
          h('p', { style: { margin: '6px 0 10px', fontSize: 12, color: C.faint, lineHeight: 1.6 } },
            '打开对应网站登录后：F12 → Network → 任一请求 → Request Headers → 复制 Cookie 整段粘贴进来，然后勾选启用该源。已保存的 Cookie 不会回显（只显示「已配置」）；要更换就重新粘贴，清空输入框再保存即删除。'),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 6 } },
            ...((config?.learningSettings?.trendSources) || []).map(source => {
              const isSet = source.cookie === '__COOKIE_SET__';
              return h('div', {
                key: 'cookie-' + source.id,
                style: { display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px', background: C.layerTwo, borderRadius: 6, border: `1px solid ${C.border}` }
              },
                h('span', { style: { flex: '0 0 110px', fontSize: 12, color: C.muted } }, source.label),
                h('span', { style: { flex: '0 0 64px', fontSize: 11, color: isSet ? C.success : C.faint } }, isSet ? '✓ 已配置' : '未配置'),
                h('input', {
                  type: 'password',
                  style: { ...inputStyle, flex: '1 1 260px', margin: 0, fontSize: 12 },
                  placeholder: isSet ? '已保存；留空保持不变' : '粘贴 Cookie，例如 SUB=...; SUBP=...',
                  value: isSet ? '' : (source.cookie || ''),
                  onChange: e => {
                    const next = e.target.value;
                    updateConfig(c => ({
                      ...c,
                      learningSettings: {
                        ...(c.learningSettings || {}),
                        trendSources: (c.learningSettings?.trendSources || []).map(item => {
                          if (item.id !== source.id) return item;
                          // An empty box on a saved cookie means "keep it as is".
                          if (!next && item.cookie === '__COOKIE_SET__') return item;
                          return { ...item, cookie: next };
                        }),
                      },
                    }));
                  },
                }));
            })))
        ,

        // 2. X 榜单拆解
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '② X 榜单高曝光帖拆解（可选）'),
            h('p', { style: { margin: '6px 0 10px', fontSize: 12, color: C.faint, lineHeight: 1.6 } },
              'Worker 会用发帖用的 Chrome 打开榜单页，抓取高曝光推文交给大模型拆解套路。该站为动态渲染，必须在 Chrome 可用时执行。'),
            h('label', { style: { ...labelStyle, marginTop: 4 } }, '榜单地址（默认 X 榜单推文榜）：'),
            h('input', {
              style: inputStyle,
              value: config?.learningSettings?.benchmarkUrl || '',
              placeholder: 'https://xbangdan.com/posts/',
              onChange: e => updateConfig(c => ({ ...c, learningSettings: { ...(c.learningSettings || {}), benchmarkUrl: e.target.value } })),
            }),
            h('div', { style: { display: 'flex', gap: 10, marginTop: 10 } },
              h('a', {
                href: config?.learningSettings?.benchmarkUrl || 'https://xbangdan.com/posts/',
                target: '_blank', rel: 'noreferrer',
                style: { ...buttonStyle(false), padding: '6px 14px', fontSize: 12, textDecoration: 'none', display: 'inline-block' },
              }, '🔗 在浏览器打开榜单'),
              h('button', {
                type: 'button',
                disabled: busy || learnBusy,
                style: { ...buttonStyle(false), padding: '6px 14px', fontSize: 12 },
                onClick: async () => {
                  setLearnBusy(true);
                  try {
                    await act('trigger-learn', undefined, { withBenchmark: true });
                    setNotice('已触发学习，榜单拆解结果会在 1~3 分钟后写入「学习成果」。');
                  } catch (err) {
                    setError(err.message || String(err));
                  } finally { setLearnBusy(false); }
                }
              }, '📊 抓取并拆解榜单'))
          ),

          // 3. 手动粘贴
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '③ 手动粘贴高曝光帖拆解'),
            h('p', { style: { margin: '6px 0 10px', fontSize: 12, color: C.faint, lineHeight: 1.6 } },
              '把你看到的高曝光推文粘进来（多条之间空一行）。大模型会拆出结构、钩子和选题方向，并沉淀到「学习成果」。'),
            h('textarea', {
              style: { ...inputStyle, minHeight: 120, resize: 'vertical' },
              placeholder: '粘贴推文原文，多条之间空一行…',
              value: learnPasteText,
              onChange: e => setLearnPasteText(e.target.value),
            }),
            h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 } },
              h('button', {
                type: 'button',
                disabled: busy || learnBusy || !learnPasteText.trim(),
                style: { ...buttonStyle(true), padding: '6px 18px', fontSize: 13 },
                onClick: async () => {
                  setLearnBusy(true);
                  setError('');
                  try {
                    const res = await act('learn-manual', undefined, { text: learnPasteText });
                    setLearnPasteText('');
                    setNotice(res?.note || '拆解完成，已沉淀到学习成果。');
                  } catch (err) {
                    setError(`拆解失败：${err.message || String(err)}`);
                  } finally { setLearnBusy(false); }
                }
              }, learnBusy ? '⏳ 拆解中...' : '🔍 拆解学习'))
          ),

          // 4. 学习成果
          h('section', { style: cardStyle },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 } },
              h('h2', { style: { margin: 0, fontSize: 15 } }, '📚 学习成果'),
              h('button', {
                type: 'button',
                disabled: busy,
                style: { ...buttonStyle(false), fontSize: 12, padding: '4px 10px', color: C.error, borderColor: C.error },
                onClick: () => setConfirmModal({
                  title: '清空学习成果',
                  prompt: '确认清空全部学习成果吗？\n\n套路总结、赢家话题、避写话题和已提炼的结构都会被删除，且不可恢复。',
                  confirmText: '确认清空',
                  onConfirm: () => void act('clear-learnings'),
                })
              }, '🗑️ 清空学习成果')),

            h('label', { style: { ...labelStyle, marginTop: 12 } }, '套路总结（会拼进生成提示词，可手动编辑）：'),
            h('textarea', {
              style: { ...inputStyle, minHeight: 90 },
              placeholder: '大模型从样本中总结的选题角度 / 情绪 / 节奏 / 收尾方式…',
              value: styleGuideDraft !== '' ? styleGuideDraft : (state?.learnings?.styleGuide || ''),
              onChange: e => setStyleGuideDraft(e.target.value),
            }),
            h('div', { style: { display: 'flex', justifyContent: 'flex-end', marginTop: 6 } },
              h('button', {
                type: 'button',
                disabled: busy,
                style: { ...buttonStyle(false), fontSize: 12, padding: '4px 12px' },
                onClick: async () => {
                  try {
                    await act('save-style-guide', undefined, { styleGuide: styleGuideDraft });
                    setStyleGuideDraft('');
                    setNotice('套路总结已保存。');
                  } catch (err) { setError(err.message || String(err)); }
                }
              }, '💾 保存套路总结')),

            h('div', { style: { marginTop: 12 } },
              h('div', { style: { fontSize: 13, fontWeight: '600', marginBottom: 6 } }, `✅ 优先话题（${(state?.learnings?.winningTopics || []).length}）`),
              (state?.learnings?.winningTopics || []).length
                ? h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } },
                    ...(state.learnings.winningTopics).map(topic => h('span', {
                      key: topic,
                      style: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 999, background: C.layerTwo, border: `1px solid ${C.border}`, fontSize: 12 }
                    }, topic,
                      h('button', {
                        type: 'button', title: '改为避写',
                        style: { border: 'none', background: 'none', color: C.error, cursor: 'pointer', fontSize: 12, padding: 0 },
                        onClick: () => void act('promote-topic', undefined, { topic, target: 'banned' })
                      }, '🚫'))))
                : h('small', { style: { color: C.faint } }, '暂无。学习达标后会出现在这里。')),

            h('div', { style: { marginTop: 12 } },
              h('div', { style: { fontSize: 13, fontWeight: '600', marginBottom: 6 } },
                `🚫 避写话题（手动 ${(config?.postSettings?.manualBannedTopics || []).length} · 学习 ${(state?.learnings?.bannedTopics || []).length}）`),
              h('div', { style: { display: 'flex', gap: 8, marginBottom: 8 } },
                h('input', {
                  style: { ...inputStyle, margin: 0, flex: 1 },
                  placeholder: '输入要避开的话题，如：政治, 明星八卦, 股市（回车或点添加）',
                  value: bannedDraft,
                  onChange: e => setBannedDraft(e.target.value),
                  onKeyDown: e => { if (e.key === 'Enter') addBanned(); },
                }),
                h('button', {
                  type: 'button', style: { ...buttonStyle(true), padding: '7px 14px', fontSize: 12, whiteSpace: 'nowrap' },
                  onClick: addBanned,
                }, '＋ 添加')),
              h('small', { style: { color: C.faint, fontSize: 11, display: 'block', marginBottom: 8 } },
                '手动添加的不会被「重新学习」覆盖；生成时优先避开，热榜话题命中也会被跳过。'),
              (() => {
                const manual = config?.postSettings?.manualBannedTopics || [];
                const learned = state?.learnings?.bannedTopics || [];
                const learnedOnly = learned.filter(t => !manual.some(m => m.toLowerCase() === String(t).toLowerCase()));
                const chip = (topic, isManual) => h('span', {
                  key: (isManual ? 'm-' : 'l-') + topic,
                  style: {
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 999,
                    background: C.raised, border: `1px solid ${isManual ? C.accent : C.error}`,
                    fontSize: 12, color: isManual ? C.text : C.error,
                  },
                }, (isManual ? '手动 · ' : '学习 · ') + topic,
                  h('button', {
                    type: 'button', title: isManual ? '移出手动避写' : '解除避写',
                    style: { border: 'none', background: 'none', color: C.muted, cursor: 'pointer', fontSize: 12, padding: 0 },
                    onClick: () => {
                      if (isManual) {
                        updateConfig(c => ({
                          ...c,
                          postSettings: {
                            ...(c.postSettings || {}),
                            manualBannedTopics: (c.postSettings?.manualBannedTopics || []).filter(x => x !== topic),
                          },
                        }));
                      } else {
                        void act('remove-learning', undefined, { kind: 'banned', id: topic });
                      }
                    },
                  }, '✕'));
                if (!manual.length && !learnedOnly.length) {
                  return h('small', { style: { color: C.faint } }, '暂无。可在上面输入框自行添加，或等历史表现差的话题被自动加入。');
                }
                return h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } },
                  ...manual.map(topic => chip(topic, true)),
                  ...learnedOnly.map(topic => chip(topic, false)));
              })()),

            h('div', { style: { marginTop: 12 } },
              h('div', { style: { fontSize: 13, fontWeight: '600', marginBottom: 6 } }, `🧩 已提炼套路（${(state?.learnings?.patterns || []).length}）`),
              (state?.learnings?.patterns || []).length
                ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
                    ...(state.learnings.patterns).map(pattern => h('div', {
                      key: pattern.id,
                      style: { padding: '10px 12px', background: C.layerTwo, borderRadius: 8, border: `1px solid ${C.border}` }
                    },
                      h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' } },
                        h('div', { style: { flex: 1, minWidth: 0 } },
                          h('div', { style: { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' } },
                            h('strong', { style: { fontSize: 13 } }, pattern.title),
                            h('span', { style: { fontSize: 11, color: C.faint, padding: '1px 6px', borderRadius: 4, background: C.raised } },
                              pattern.source === 'history' ? '历史帖子' : (pattern.source === 'benchmark' ? 'X 榜单' : '手动粘贴'))),
                          pattern.structure ? h('p', { style: { margin: '0 0 4px', fontSize: 12, color: C.text, lineHeight: 1.5 } }, pattern.structure) : null,
                          pattern.hooks?.length ? h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6 } },
                            ...pattern.hooks.map((hook, i) => h('span', { key: i, style: { fontSize: 11, padding: '2px 8px', borderRadius: 999, background: C.raised, color: C.muted } }, hook))) : null),
                        h('button', {
                          type: 'button', title: '删除这条套路',
                          style: { ...buttonStyle(false), padding: '2px 8px', fontSize: 11, color: C.error, borderColor: C.error },
                          onClick: () => void act('remove-learning', undefined, { kind: 'pattern', id: pattern.id })
                        }, '✕')))
                    ))
                : h('small', { style: { color: C.faint } }, '暂无。三种学习方式任一完成都会产生套路。'))
          )
        ) : null,

        // TAB 6: 🧭 主页巡航与定向互动独立配置
        activeTab === 'profile' ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
          statusCard('profile', '🧭 ' + t('profile') + '（任务状态与控制）'),
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '🧭 巡航策略、模型与互动提示词'),
            h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginTop: 8 } },
              h('input', { type: 'checkbox', checked: config?.cruiseSettings?.enabled !== false, onChange: e => updateConfig(c => ({ ...c, cruiseSettings: { ...(c.cruiseSettings || {}), enabled: e.target.checked } })) }),
              '启用主页巡航 Worker', h(SideBadge, { side: 'profile' })),
            h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginTop: 8 } },
              h('input', { type: 'checkbox', checked: config?.cruiseSettings?.autoVisitInvited !== false, onChange: e => updateConfig(c => ({ ...c, cruiseSettings: { ...(c.cruiseSettings || {}), autoVisitInvited: e.target.checked } })) }),
              '⚡ 自动优先消费提及对话中的“回踩/主页访问邀请”（闭环任务插队）', h(SideBadge, { side: 'profile' })),
            h(ModelPicker, {
              value: config?.cruiseSettings?.model || '',
              onChange: val => updateConfig(c => ({ ...c, cruiseSettings: { ...(c.cruiseSettings || {}), model: val } })),
              side: 'profile',
              label: '🧭 主页巡航互动专用大模型：'
            }),
            h('label', { style: { ...labelStyle, marginTop: 10 } }, '主页巡航互动提示词（自定义 Prompt）：', h(SideBadge, { side: 'profile' })),
            h('textarea', { style: { ...inputStyle, minHeight: 90 }, value: config?.cruiseSettings?.customPrompt || '', onChange: e => updateConfig(c => ({ ...c, cruiseSettings: { ...(c.cruiseSettings || {}), customPrompt: e.target.value } })) }),
            h('label', { style: { ...labelStyle, marginTop: 10 } }, '每日巡航互动上限次数：', h(SideBadge, { side: 'profile' })),
            h('input', { type: 'number', min: 1, max: 200, style: inputStyle, value: config?.cruiseSettings?.dailyTargetCount ?? 50, onChange: e => {
              const val = e.target.value === '' ? '' : Number(e.target.value);
              updateConfig(c => ({ ...c, cruiseSettings: { ...(c.cruiseSettings || {}), dailyTargetCount: val } }));
            } }),
            h('label', { style: { ...labelStyle, marginTop: 10 } }, '同一主页重复互动冷却时长（小时）：', h(SideBadge, { side: 'profile' })),
            h('input', { type: 'number', min: 1, max: 720, style: inputStyle, value: config?.cruiseSettings?.interactionCooldownHours ?? 48, onChange: e => {
              const val = e.target.value === '' ? '' : Number(e.target.value);
              updateConfig(c => ({ ...c, cruiseSettings: { ...(c.cruiseSettings || {}), interactionCooldownHours: val } }));
            } }),
            h('div', { style: { display: 'flex', gap: 16, marginTop: 10 } },
              h('label', { style: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 } },
                h('input', { type: 'checkbox', checked: config?.cruiseSettings?.crawlFollowing !== false, onChange: e => updateConfig(c => ({ ...c, cruiseSettings: { ...(c.cruiseSettings || {}), crawlFollowing: e.target.checked } })) }), '巡航关注列表'),
              h('label', { style: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 } },
                h('input', { type: 'checkbox', checked: config?.cruiseSettings?.crawlFollowers !== false, onChange: e => updateConfig(c => ({ ...c, cruiseSettings: { ...(c.cruiseSettings || {}), crawlFollowers: e.target.checked } })) }), '巡航粉丝列表'))),

          // 重点名单整轮巡
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '🔁 重点名单整轮巡（按小时把全部名单走一遍）'),
            h('p', { style: { margin: '6px 0 10px', fontSize: 12, color: C.faint, lineHeight: 1.6 } },
              '到达设定间隔后，巡航 Worker 会按「Apex → Tier 1 → … → 其他」的顺序，把「👥 重点名单」里的所有用户名逐个拜访一遍；中途不会因为随机爬取而丢掉进度，走完才重新计时。设 0 表示关闭，仅保留随机巡航。'),
            h('label', { style: { ...labelStyle, marginTop: 4 } }, '每隔多少小时轮巡一次全部重点名单（0=关闭）：', h(SideBadge, { side: 'profile' })),
            h('input', {
              type: 'number', min: 0, max: 720, style: inputStyle,
              value: config?.cruiseSettings?.tierSweepHours ?? 6,
              onChange: e => {
                const val = e.target.value === '' ? '' : Number(e.target.value);
                updateConfig(c => ({ ...c, cruiseSettings: { ...(c.cruiseSettings || {}), tierSweepHours: val } }));
              }
            }),
            h('div', { style: { display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' } },
              h('label', { style: { ...labelStyle, flex: '1 1 260px', margin: 0 } },
                '每次巡览对该主页评论几条「未评论过」的帖子（0=只看不评）：', h(SideBadge, { side: 'profile' }),
                h('input', {
                  type: 'number', min: 0, max: 10, style: inputStyle,
                  value: config?.cruiseSettings?.commentsPerProfile ?? 1,
                  onChange: e => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    updateConfig(c => ({ ...c, cruiseSettings: { ...(c.cruiseSettings || {}), commentsPerProfile: val } }));
                  }
                })),
              h('div', { style: { flex: '1 1 260px', fontSize: 12, color: C.faint, lineHeight: 1.6, paddingTop: 22 } },
                'Worker 会记住已评论过的帖子 ID，重复拜访同一个人时自动往下找没评过的，不会重复刷同一条。')),
            (() => {
              const sweep = state?.cruiseSweep;
              const every = config?.cruiseSettings?.tierSweepHours ?? 6;
              if (!sweep) return h('div', { style: { marginTop: 10, fontSize: 12, color: C.faint } }, '暂无轮巡记录。');
              if (sweep.pending > 0) {
                return h('div', { style: { marginTop: 10, fontSize: 12, color: C.text, lineHeight: 1.7 } },
                  h('div', { style: { color: C.accent, fontWeight: '600' } },
                    `🔄 本轮巡览进行中：已完成 ${sweep.done}/${sweep.total}，剩余 ${sweep.pending}`),
                  sweep.nextHandle ? h('div', { style: { color: C.faint } }, `下一个：@${sweep.nextHandle}`) : null);
              }
              if (every === 0) return h('div', { style: { marginTop: 10, fontSize: 12, color: C.faint } }, '当前已关闭整轮巡，仅按随机策略巡航。');
              return h('div', { style: { marginTop: 10, fontSize: 12, color: C.muted, lineHeight: 1.7 } },
                sweep.lastFinishedAt
                  ? h('div', null, `✅ 上一轮完成于 ${new Date(sweep.lastFinishedAt).toLocaleString()}（共 ${sweep.total} 个名单）`)
                  : h('div', { style: { color: C.faint } }, '尚未执行过整轮巡，保存后 Worker 下一轮就会开始。'),
                h('div', { style: { color: C.faint } }, `下次轮巡：约 ${every} 小时后`));
            })()))
        : null,

        // 统一保存按钮栏
        h('footer', { style: { display: 'flex', gap: 12, alignItems: 'center', marginTop: 12, padding: '12px 0', borderTop: `1px solid ${C.border}`, flexWrap: 'wrap' } },
          h('button', {
            disabled: busy || !state?.ok || state?.configSource === 'invalid',
            onClick: async () => {
              // Commit the free-text fields at save time so a value typed but not
              // yet blurred is still persisted.
              // Special-person rows: drop blank rows (a freshly added row the
              // operator never filled in) and mirror apex/yijing back into their
              // legacy objects so old worker builds read the same values.
              const keptRows = normalizeSpecialRows(config?.specialPersons)
                .filter(row => String(row.handle || '').trim())
                .slice(0, 50);
              const legacyPeople = {};
              for (const row of keptRows) {
                if (row.id !== 'apex' && row.id !== 'yijing') continue;
                legacyPeople[row.id] = {
                  handle: row.handle, enabled: row.enabled !== false,
                  replyStyle: row.replyStyle || '', rules: row.rules || {},
                };
              }
              // A deleted row must actually stop contributing rules, otherwise the
              // legacy apex/yijing objects would keep injecting old prompts.
              for (const key of ['apex', 'yijing']) {
                if (legacyPeople[key]) continue;
                const legacy = (config.specialPersons || {})[key];
                if (!legacy || typeof legacy !== 'object') continue;
                legacyPeople[key] = { ...legacy, replyStyle: '', rules: {} };
              }
              const current = {
                ...config,
                postSettings: { ...(config.postSettings || {}), topics: splitTopics(topicsText) },
                specialPersons: {
                  ...(config.specialPersons || {}),
                  ...legacyPeople,
                  list: keptRows.map(row => ({
                    id: row.id, label: row.label, handle: row.handle,
                    enabled: row.enabled !== false, replyStyle: row.replyStyle || '',
                  })),
                  skipReplyHandles: splitList(skipHandlesText),
                },
                tiers: (config.tiers || []).map(tier => (
                  tierHandlesText[tier.id] !== undefined
                    ? { ...tier, handles: splitList(tierHandlesText[tier.id]) }
                    : tier
                )),
              };
              // Rebase onto the current disk config so untouched fields (prompts,
              // model choices, …) keep their stored values instead of being
              // overwritten by an older in-page snapshot.
              let freshConfig = serverSnapshot.current;
              let expectedHash = latestSaveHash.current;
              try {
                const response = await fetch(ROUTE, { cache: 'no-store' });
                const data = await response.json();
                if (data && data.ok !== false && data.config) {
                  freshConfig = data.config;
                  expectedHash = data.configHash ?? expectedHash;
                }
              } catch { /* offline: fall back to the last snapshot */ }
              const saveConfig = composeSaveConfig(current, serverSnapshot.current, freshConfig);
              await act('save-config', undefined, { config: saveConfig, expectedConfigHash: expectedHash });
            },
            style: { ...buttonStyle(true), padding: '8px 20px', fontSize: 14 }
          }, t('save')),
          draftDirty ? h('span', { style: { color: C.accent, fontSize: 13, fontWeight: '500' } }, '● 有未保存的修改') : h('span', { style: { color: C.faint, fontSize: 12 } }, '所有修改点击保存后，两端工作进程每轮读取生效。')),

        confirmModal ? h('div', {
          style: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999,
          }
        },
          h('div', {
            role: 'alertdialog',
            style: {
              background: C.layerTwo, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20,
              maxWidth: 420, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            }
          },
            h('h3', { style: { margin: '0 0 10px', fontSize: 16 } }, confirmModal.title || '操作确认'),
            h('p', { style: { margin: '0 0 20px', fontSize: 13, color: C.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' } }, confirmModal.prompt),
            h('div', { style: { display: 'flex', gap: 10, justifyContent: 'flex-end' } },
              h('button', { type: 'button', style: buttonStyle(), onClick: () => setConfirmModal(null) }, '取消'),
              h('button', { type: 'button', style: buttonStyle(true), onClick: () => { const cb = confirmModal.onConfirm; setConfirmModal(null); cb(); } }, confirmModal.confirmText || '确认执行')
            )
          )
        ) : null
      );
    }

    function Root(props) {
      return h(SafeBoundary, null, h(Panel, props));
    }

    const XIcon = ({ size = 20 }) => h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true },
      h('path', { d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' }));

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh }), 'x-bot-ops-console: locale');
        const tr = ctx.locale.bind(NS);
        const RootComponent = () => h(Root);
        if (DESKTOP) {
          ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'dsh-x-bot-ops-console' }, RootComponent));
          ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: 'dsh-x-bot-ops-console', order: 35, label: () => tr('panel') }, XIcon));
        } else {
          ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: 'dsh-x-bot-ops-console', order: 35, locale: NS, label: () => tr('panel') }, XIcon));
          ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'dsh-x-bot-ops-console', locale: NS }, RootComponent));
        }
      },
    };
  },
});
