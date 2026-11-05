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

    const specialPersonCards = [
      { key: 'apex', title: 'Apex 专属对象', badge: '👑 Apex 最高优先级', voice: '文言与诗词歌赋，直抒情欲与爱恋', guidance: '规则提示会作为附加提示词进入两个 Worker；账号、启用状态与提示词均可编辑。' },
      { key: 'yijing', title: '易经专属对象', badge: '⭐ Tier 1 易经特例', voice: '《易经》卦象与爻辞，阴阳吉凶往来', guidance: '易经模式与无限轮次例外跟随当前用户名和启用状态；专属提示词由此编辑。' },
    ];

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
      ['publishMinSeconds', 5, 3600, 'both', '两次发送最短间隔（秒）'],
      ['publishMaxSeconds', 5, 3600, 'both', '两次发送最长间隔（秒）'],
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

    function Panel() {
      const [state, setState] = React.useState(null);
      const [error, setError] = React.useState('');
      const [notice, setNotice] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [config, setConfig] = React.useState(null);
      const [configHash, setConfigHash] = React.useState(null);
      const [draftDirty, setDraftDirty] = React.useState(false);
      const [activeTab, setActiveTab] = React.useState('general');
      const [pause, setPause] = React.useState({ comment: 30, reply: 30, post: 30, profile: 30 });
      const [confirmModal, setConfirmModal] = React.useState(null);
      const saveLock = React.useRef(false);
      const latestSaveHash = React.useRef(null);

      const refresh = React.useCallback(async ({ preserveDraft = false } = {}) => {
        try {
          const response = await fetch(ROUTE, { cache: 'no-store' });
          const data = await response.json();
          if (!response.ok || data.ok === false) throw new Error(data.error || `请求失败，状态码 ${response.status}`);
          setState(data);
          if (!draftDirty && !preserveDraft) {
            setConfig(data.config);
            setConfigHash(data.configHash ?? null);
            latestSaveHash.current = data.configHash ?? null;
          }
          setError('');
        } catch (err) {
          setError(`${t('unavailable')} ${err.message || ''}`);
        }
      }, [draftDirty]);
      React.useEffect(() => { void refresh(); const timer = setInterval(() => void refresh(), 15000); return () => clearInterval(timer); }, [refresh]);

      const act = async (action, target, extra = {}) => {
        if (action === 'save-config' && saveLock.current) return;
        if (action === 'save-config') saveLock.current = true;
        setBusy(true); setError(''); setNotice('');
        try {
          const response = await fetch(ROUTE, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, target, ...extra }) });
          const data = await response.json();
          if (!response.ok || data.ok !== true) throw new Error(data.error || `请求失败，状态码 ${response.status}`);
          const value = data.value || {};
          if (action === 'save-config') { setNotice(value.note || t('saved')); setConfig(value.config); setConfigHash(value.configHash ?? null); latestSaveHash.current = value.configHash ?? null; setDraftDirty(false); }
          else if (value.launchRequested) setNotice(t('launchRequested'));
          else if (value.note) setNotice(value.note);
          await refresh();
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
      const setTier = (index, key, value) => updateConfig(current => ({
        ...current,
        tiers: (current.tiers || []).map((tier, i) => {
          if (i !== index) return tier;
          if (key === 'handles') {
            const handles = Array.isArray(value)
              ? value.map(x => String(x || '').trim().replace(/^@/, '').toLowerCase()).filter(Boolean)
              : String(value || '').split(/[\s,，]+/).map(x => x.trim().replace(/^@/, '').toLowerCase()).filter(Boolean);
            return { ...tier, handles };
          }
          return { ...tier, [key]: value };
        }),
      }));
      const setTiming = (key, value) => updateConfig(current => ({ ...current, timing: { ...current.timing, [key]: value } }));
      const setSpecialPerson = (key, field, value) => updateConfig(current => ({ ...current, specialPersons: { ...current.specialPersons, [key]: { ...current.specialPersons[key], [field]: value } } }));
      const setSkipHandles = value => updateConfig(current => ({ ...current, specialPersons: { ...current.specialPersons, skipReplyHandles: Array.isArray(value) ? value : String(value || '').split(/[\s,，]+/).map(x => x.trim().replace(/^@/, '').toLowerCase()).filter(Boolean) } }));

      const askConfirm = (promptKey, onConfirm) => setConfirmModal({ prompt: t(promptKey), onConfirm });

      const SideBadge = ({ side }) => h('span', { style: badgeStyle(side) }, sideText(side));
      const StatusLine = ({ label, value, tone }) => h('div', { style: { display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' } },
        h('span', { style: { color: C.muted, fontSize: 12 } }, label),
        h('strong', { style: { color: tone || C.text, fontSize: 13 } }, value));

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
          h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
            h('button', { disabled: busy, onClick: () => void refresh(), style: buttonStyle() }, t('refresh')),
            state?.checkedAt ? h('small', { style: { color: C.faint } }, `${t('checked')}：${new Date(state.checkedAt).toLocaleTimeString()}`) : null)),

        error ? h('p', { role: 'alert', style: { margin: 0, padding: '10px 12px', borderRadius: 10, background: C.raised, color: C.error, fontSize: 13 } }, error) : null,
        notice ? h('p', { role: 'status', style: { margin: 0, padding: '10px 12px', borderRadius: 10, background: C.raised, color: C.success, fontSize: 13 } }, notice) : null,

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
          h('button', { type: 'button', style: tabItemStyle('profile'), onClick: () => setActiveTab('profile') }, t('tabProfile')),
          h('button', { type: 'button', style: tabItemStyle('tiers'), onClick: () => setActiveTab('tiers') }, t('tabTiers'))),

        // TAB 1: 👥 重点名单与个性化配置（独立维护专区）
        activeTab === 'tiers' ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
          // 1. 关键特例人物专属回复配置
          h('section', { style: { ...cardStyle, background: C.layerTwo } },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 } },
              h('div', null,
                h('h2', { style: { margin: 0, fontSize: 16 } }, '🌟 关键特例人物专属回复配置（Special Person Rules）'),
                h('p', { style: { margin: '4px 0 0', fontSize: 12, color: C.faint } }, '标注 worker 中仍由代码固定的内置分支，以及你可以覆盖的动态句柄和提示词规则。')),
              h('span', { style: { fontSize: 12, color: C.accent, background: C.raised, padding: '4px 8px', borderRadius: 6 } }, 'Worker 核心内置策略')),
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginTop: 14 } },
              specialPersonCards.map(p => {
                const person = config?.specialPersons?.[p.key] || {};
                return h('div', { key: p.key, style: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 } },
                  h('strong', { style: { fontSize: 14, color: C.text } }, p.title),
                  h('div', { style: { fontSize: 12, color: C.muted } }, p.badge),
                  h('label', { style: labelStyle }, '特殊用户名（可替换）', h('input', { style: inputStyle, value: person.handle || '', onChange: e => setSpecialPerson(p.key, 'handle', e.target.value.trim().replace(/^@/, '').toLowerCase()) })),
                  h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 } },
                    h('input', { type: 'checkbox', checked: person.enabled !== false, onChange: e => setSpecialPerson(p.key, 'enabled', e.target.checked) }), '启用该人物特例'),
                  h('div', { style: { fontSize: 12, color: C.text } }, `默认文风：${p.voice}`),
                  h('small', { style: { color: C.faint } }, p.guidance),
                  h('label', { style: labelStyle }, '专属回复规则 / 附加提示词（空白使用 Worker 内置规则）',
                    h('textarea', { style: { ...inputStyle, minHeight: 100 }, maxLength: 3000, value: person.replyStyle || '', onChange: e => setSpecialPerson(p.key, 'replyStyle', e.target.value) })),
                  p.key === 'apex' ? h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 } },
                    h('input', { type: 'checkbox', checked: person.rules?.careEnabled !== true, onChange: e => setSpecialPerson(p.key, 'rules', { ...(person.rules || {}), careEnabled: !e.target.checked }) }), '禁用日常问候关怀分支') : null);
              })),
            h('section', { style: { marginTop: 12, padding: 14, border: `1px solid ${C.border}`, borderRadius: 10, background: C.surface } },
              h('h3', { style: { margin: '0 0 6px', fontSize: 14 } }, '🤖 回复时跳过名单'),
              h('p', { style: { margin: '0 0 8px', fontSize: 12, color: C.faint } }, '这些句柄不会进入 mention 回复流程；支持增加、删除和批量粘贴。'),
              h('textarea', { style: { ...inputStyle, minHeight: 70, fontFamily: 'monospace' }, value: (config?.specialPersons?.skipReplyHandles || []).join(', '), onChange: e => setSkipHandles(e.target.value) }),
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
                      type: 'button', disabled: busy, onClick: () => setTier(index, 'handles', builtin),
                      style: { ...buttonStyle(), padding: '3px 8px', fontSize: 11 },
                    }, '一键恢复内置名单') : null),
                  h('textarea', {
                    style: { ...inputStyle, minHeight: 64, margin: '4px 0 6px', fontFamily: 'monospace', fontSize: 13 },
                    value: handlesList.join(', '), placeholder: '例如：user1, user2, user3',
                    onChange: e => setTier(index, 'handles', e.target.value)
                  }),
                  h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 } },
                    ...handlesList.map(handle => h('button', { key: handle, type: 'button', disabled: busy, title: `移除 @${handle}`, onClick: () => setTier(index, 'handles', handlesList.filter(item => item !== handle)), style: { ...buttonStyle(), padding: '3px 8px', fontSize: 11 } }, `@${handle} ×`)),
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
          // 概览与校验
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, t('sharedConfig')),
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
            h('h2', { style: { margin: 0, fontSize: 15 } }, '🎯 自动评论独立参数与本地模型池覆盖'),
            h('label', { style: labelStyle }, t('modelPort'), h(SideBadge, { side: 'comment' })),
            h('input', { type: 'number', min: 1, max: 65535, style: inputStyle, value: config?.model?.endpointPort || '', placeholder: '留空表示使用默认端口（如 3040）', onChange: e => updateConfig(current => ({ ...current, model: { ...current.model, endpointPort: e.target.value === '' ? null : Number(e.target.value) } })) }),
            h('small', { style: { color: C.faint, fontSize: 12 } }, t('portHint')),
            h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 } },
              ...timingFields.filter(([, , , side]) => side === 'comment').map(([key, min, max, side, hint]) =>
                h('label', { key, style: { ...labelStyle, flex: '1 1 45%', minWidth: 240, margin: 0 } },
                  hint, h(SideBadge, { side }),
                  h('input', { type: 'number', min, max, style: inputStyle, value: config?.timing?.[key] ?? 0, onChange: e => setTiming(key, Number(e.target.value)) }))))))
        : null,

        // TAB 4: ↩️ 提及回复独立配置
        activeTab === 'reply' ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
          statusCard('reply', '↩️ ' + t('reply') + '（任务状态与控制）'),
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '🤖 提及回复模型选择与参数'),
            h('label', { style: labelStyle }, t('modelName'), h(SideBadge, { side: 'reply' })),
            h('input', { style: inputStyle, value: config?.model?.name || '', placeholder: '例如 gpt-6-luna / claude-opus-5-5-high（留空沿用默认）', onChange: e => updateConfig(current => ({ ...current, model: { ...current.model, name: e.target.value } })) }),
            h('small', { style: { color: C.faint, fontSize: 12 } }, t('modelNameHint')),
            h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 } },
              ...timingFields.filter(([, , , side]) => side === 'reply').map(([key, min, max, side, hint]) =>
                h('label', { key, style: { ...labelStyle, flex: '1 1 45%', minWidth: 240, margin: 0 } },
                  hint, h(SideBadge, { side }),
                  h('input', { type: 'number', min, max, style: inputStyle, value: config?.timing?.[key] ?? 0, onChange: e => setTiming(key, Number(e.target.value)) }))))))
        : null,

        // TAB 5: 📝 自动发帖独立配置
        activeTab === 'post' ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
          statusCard('post', '📝 ' + t('post') + '（任务状态与控制）'),
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '⚙️ 自动发帖策略与节奏'),
            h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginTop: 8 } },
              h('input', { type: 'checkbox', checked: config?.postSettings?.enabled !== false, onChange: e => updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), enabled: e.target.checked } })) }),
              '启用自动发帖 Worker', h(SideBadge, { side: 'post' })),
            h('label', { style: { ...labelStyle, marginTop: 10 } }, '发帖间隔（分钟）：', h(SideBadge, { side: 'post' })),
            h('input', { type: 'number', min: 10, max: 1440, style: inputStyle, value: config?.postSettings?.intervalMinutes ?? 180, onChange: e => updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), intervalMinutes: Number(e.target.value) } })) }),
            h('label', { style: { ...labelStyle, marginTop: 10 } }, '原创发帖文案提示词（自定义 Prompt）：', h(SideBadge, { side: 'post' })),
            h('textarea', { style: { ...inputStyle, minHeight: 90 }, value: config?.postSettings?.customPrompt || '', onChange: e => updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), customPrompt: e.target.value } })) }),
            h('label', { style: { ...labelStyle, marginTop: 10 } }, '随机发帖话题灵感池（逗号分隔）：', h(SideBadge, { side: 'post' })),
            h('input', { style: inputStyle, value: (config?.postSettings?.topics || []).join(', '), onChange: e => updateConfig(c => ({ ...c, postSettings: { ...(c.postSettings || {}), topics: e.target.value.split(/[,，\s]+/).filter(Boolean) } })) })))
        : null,

        // TAB 6: 🧭 主页巡航与定向互动独立配置
        activeTab === 'profile' ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
          statusCard('profile', '🧭 ' + t('profile') + '（任务状态与控制）'),
          h('section', { style: cardStyle },
            h('h2', { style: { margin: 0, fontSize: 15 } }, '🧭 巡航策略与主页互动设置'),
            h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginTop: 8 } },
              h('input', { type: 'checkbox', checked: config?.cruiseSettings?.enabled !== false, onChange: e => updateConfig(c => ({ ...c, cruiseSettings: { ...(c.cruiseSettings || {}), enabled: e.target.checked } })) }),
              '启用主页巡航 Worker', h(SideBadge, { side: 'profile' })),
            h('label', { style: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginTop: 8 } },
              h('input', { type: 'checkbox', checked: config?.cruiseSettings?.autoVisitInvited !== false, onChange: e => updateConfig(c => ({ ...c, cruiseSettings: { ...(c.cruiseSettings || {}), autoVisitInvited: e.target.checked } })) }),
              '⚡ 自动优先消费提及对话中的“回踩/主页访问邀请”（闭环任务插队）', h(SideBadge, { side: 'profile' })),
            h('label', { style: { ...labelStyle, marginTop: 10 } }, '每日巡航互动上限次数：', h(SideBadge, { side: 'profile' })),
            h('input', { type: 'number', min: 1, max: 200, style: inputStyle, value: config?.cruiseSettings?.dailyTargetCount ?? 50, onChange: e => updateConfig(c => ({ ...c, cruiseSettings: { ...(c.cruiseSettings || {}), dailyTargetCount: Number(e.target.value) } })) }),
            h('label', { style: { ...labelStyle, marginTop: 10 } }, '同一主页重复互动冷却时长（小时）：', h(SideBadge, { side: 'profile' })),
            h('input', { type: 'number', min: 1, max: 720, style: inputStyle, value: config?.cruiseSettings?.interactionCooldownHours ?? 48, onChange: e => updateConfig(c => ({ ...c, cruiseSettings: { ...(c.cruiseSettings || {}), interactionCooldownHours: Number(e.target.value) } })) }),
            h('div', { style: { display: 'flex', gap: 16, marginTop: 10 } },
              h('label', { style: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 } },
                h('input', { type: 'checkbox', checked: config?.cruiseSettings?.crawlFollowing !== false, onChange: e => updateConfig(c => ({ ...c, cruiseSettings: { ...(c.cruiseSettings || {}), crawlFollowing: e.target.checked } })) }), '巡航关注列表'),
              h('label', { style: { display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 } },
                h('input', { type: 'checkbox', checked: config?.cruiseSettings?.crawlFollowers !== false, onChange: e => updateConfig(c => ({ ...c, cruiseSettings: { ...(c.cruiseSettings || {}), crawlFollowers: e.target.checked } })) }), '巡航粉丝列表'))))
        : null,

        // 统一保存按钮栏
        h('footer', { style: { display: 'flex', gap: 12, alignItems: 'center', marginTop: 12, padding: '12px 0', borderTop: `1px solid ${C.border}`, flexWrap: 'wrap' } },
          h('button', { disabled: busy || !state?.ok || state?.configSource === 'invalid', onClick: () => act('save-config', undefined, { config, expectedConfigHash: latestSaveHash.current }), style: { ...buttonStyle(true), padding: '8px 20px', fontSize: 14 } }, t('save')),
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
            h('h3', { style: { margin: '0 0 10px', fontSize: 16 } }, '操作确认'),
            h('p', { style: { margin: '0 0 20px', fontSize: 13, color: C.text, lineHeight: 1.5 } }, confirmModal.prompt),
            h('div', { style: { display: 'flex', gap: 10, justifyContent: 'flex-end' } },
              h('button', { type: 'button', style: buttonStyle(), onClick: () => setConfirmModal(null) }, '取消'),
              h('button', { type: 'button', style: buttonStyle(true), onClick: () => { const cb = confirmModal.onConfirm; setConfirmModal(null); cb(); } }, '确认执行')
            )
          )
        ) : null
      );
    }

    function Root() {
      return h(SafeBoundary, null, h(Panel));
    }

    const XIcon = ({ size = 20 }) => h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true },
      h('path', { d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' }));

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh }), 'x-bot-ops-console: locale');
        const tr = ctx.locale.bind(NS);
        if (DESKTOP) {
          ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'dsh-x-bot-ops-console' }, Root));
          ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: 'dsh-x-bot-ops-console', order: 35, label: () => tr('panel') }, XIcon));
        } else {
          ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: 'dsh-x-bot-ops-console', order: 35, locale: NS, label: () => tr('panel') }, XIcon));
          ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'dsh-x-bot-ops-console', locale: NS }, Root));
        }
      },
    };
  },
});
