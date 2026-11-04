window.__ModuleLoader__.load({
  id: 'dsh-x-bot-ops-console',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const DESKTOP = window.location?.protocol === 'dsh-app:';
    const ROUTE = '/api/x-bot-ops-console';
    const NS = 'xBotOpsConsole';

    const zh = {
      panel: 'X 运维台', title: '自动评论与提及回复', subtitle: '两项任务共用一份可视化配置；配置写入后由两个工作进程每轮读取',
      refresh: '刷新状态', comment: '自动评论', reply: '提及回复', worker: '工作进程', watchdog: '监控进程',
      heartbeat: '心跳年龄', chrome: 'Chrome 调试端口', pause: '暂停', resume: '恢复', start: '启动', stop: '停止', restart: '重启工作进程',
      logs: '最近日志', configuration: '可视化运行配置', model: '模型', modelName: '模型名称', modelPort: '模型池端口覆盖',
      tiers: '重点名单与回复风格', handles: '用户名（逗号分隔）', rounds: '每条讨论串回复轮次上限', style: '该档回复风格',
      timing: '运行时段与节奏', specials: '特殊情形回复草稿', rules: '通用规则开关', save: '保存并写入共享配置',
      unavailable: '无法连接本地插件服务。', yes: '运行中', no: '未运行', seconds: '秒', unknown: '未知',
      unsupported: '以下字段两个 worker 都还没有读取，保存只作记录，不会改变运行行为。',
      sourceInvalid: '共享配置内容错误、超限或版本已变化；保存前应刷新并核对 worker 配置。',
      conflict: '配置在编辑期间已被其他进程修改。草稿保留；请先刷新、对比并重新应用需要的修改。',
      confirmPause: '确认暂停该任务？', confirmResume: '确认清除到期或手动暂停标记？有效的 X 限流保护会被插件拒绝清除。',
      confirmStart: '确认启动该监控进程？不会重复启动已验证的监控进程。', confirmStop: '确认停止？监控进程会停止其托管的工作进程。',
      confirmRestart: '确认重启工作进程？将向身份已确认的进程发送终止信号，再由监控进程重新启动。',
      error: '操作失败：', checked: '检查时间', saved: '已保存，两个工作进程会在下轮读取。',
      launchRequested: '启动请求已提交，尚未确认成功；请刷新状态核对进程与心跳。', keySafe: '密钥仍只从 LocalModelHub 读取，界面不显示或保存。',
      errorLabel: '操作失败', pausedUntil: '暂停至', notConfigured: '未配置', sharedConfig: '共享配置', configPath: '配置文件', watchdogLogs: '看门狗诊断',
      configShared: '已创建：两个 worker 每轮读取此文件', configMissing: '尚未创建：保存后两个 worker 才会开始读取',
      configInvalid: '共享配置格式错误或内容超限；worker 可能回退到内置默认值，请检查原文件后再保存。',
      accepted: '接受', rejected: '不接受', workerAccept: 'worker 接受校验', commentWorker: '评论 worker', replyWorker: '回复 worker',
      watchdogUnavailable: '启动需在 console-targets.json 相应目标中设置 python、interpreterPidArgvToken、workerPidArgvToken 和 watchdogPidArgvToken；这些路径用于实际启动及核对进程身份。',
      noWatchdog: '看门狗未运行，暂停标记不会生效。请先启动看门狗，或按对应 worker 的文档恢复它。',
      notActuallyPaused: '已写入暂停标记，但 worker PID 仍在运行；等待看门狗下一轮确认，不代表已暂停。',
      pauseExpired: '暂停期限已过但标记仍存在；可能是看门狗未成功恢复。请检查诊断日志，不要提前删除限流保护。',
      builtin: '用 worker 内置名单填充', builtinStyle: '内置', both: '两侧生效', commentSide: '仅评论侧', replySide: '仅回复侧', none: '未接入',
      modelNameHint: '仅回复 worker 使用；留空表示沿用内置默认模型。', portHint: '留空表示不覆盖内置值；仅评论 worker 会读取此覆盖。',
      styleHint: '留空表示沿用 worker 内置风格；仅回复 worker 会把这段文字追加到提示词。',
      roundsHint: '仅回复 worker 会读取轮次上限。', handlesHint: '两个 worker 都读取重点名单；用户名重复或格式非法会被拒绝保存。',
      sourceMissing: '尚未创建共享配置。注意：保存空重点名单会覆盖并清空 worker 内置名单；请先点每档“用 worker 内置名单填充”，核对名单后再保存。',
      sourceShared: '当前显示的是已写入的共享配置。', pauseMinutes: '暂停分钟', running: '运行中',
      missingFiles: '未找到配置位置的工作进程或监控脚本；请在设置中核对脚本目录。',
      pidForeign: '发现进程身份未确认，控制已禁用', logEmpty: '暂无日志', heartbeatStatus: '心跳状态',
      detailMissing: '未找到进程编号文件', detailDead: '进程编号已失效', detailVerified: '身份已验证', detailForeign: '进程身份未确认',
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
      WebkitOverflowScrolling: 'touch', color: C.text, background: C.surface,
    };
    const cardStyle = { border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, background: C.layerTwo, width: '100%', boxSizing: 'border-box' };
    const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', margin: '4px 0 10px', border: `1px solid ${C.border}`, borderRadius: 8, background: C.surface, color: C.text };
    const labelStyle = { display: 'block', fontSize: 13, color: C.muted, marginTop: 8 };
    const buttonStyle = (primary = false, disabled = false) => ({
      padding: '7px 12px', border: `1px solid ${C.border}`, borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
      background: primary ? C.accent : C.surface, color: primary ? C.onAccent : C.text, opacity: disabled ? 0.55 : 1, fontSize: 13,
    });
    const badgeStyle = side => ({
      display: 'inline-block', marginLeft: 6, padding: '1px 6px', borderRadius: 6, fontSize: 11,
      border: `1px solid ${C.border}`, color: side === 'none' ? C.faint : C.muted, background: C.raised,
    });
    const sideText = side => (side === 'both' ? t('both') : side === 'comment' ? t('commentSide') : side === 'reply' ? t('replySide') : t('none'));
    const tierLabel = id => ({ apex: '最高优先级', tier1: '优先级 1', tier2: '优先级 2', tier3: '优先级 3', tier4: '优先级 4', other: '其他用户' }[id] || '未知档位');
    const specialLabel = key => ({ asksAi: '被问是否为 AI', asksToStop: '被要求停止', care: '问候关怀', affection: '表达好感', namedAddress: '特殊称呼', daddy: '亲属称呼要求', imperialTitle: '头衔称谓', vernacular: '白话翻译' }[key] || '未知设置');
    const ruleLabel = key => ({ skipFinanceComments: '跳过金融类评论', skipGrokMentions: '跳过指定产品提及', doNotReplyAfterStopRequest: '被要求停止后不再回复', keepSensitiveKeyOutOfUi: '密钥不得显示在界面' }[key] || key);
    const timingFields = [
      ['commentWindowHours', 1, 48, 'comment', '评论只取近 N 小时'], ['mentionWindowHours', 1, 48, 'reply', '提及只处理近 N 小时'],
      ['quietHoursStart', 0, 23, 'both', '重点账号安静开始（北京时间小时）'], ['quietHoursEnd', 0, 24, 'both', '重点账号安静结束'],
      ['fullStopStart', 0, 23, 'both', '完全停止开始（北京时间小时）'], ['fullStopEnd', 0, 24, 'both', '完全停止结束'],
      ['publishMinSeconds', 5, 3600, 'both', '两次发布最短间隔（秒）'], ['publishMaxSeconds', 5, 3600, 'both', '两次发布最长间隔（秒）'],
      ['authorCooldownSeconds', 60, 604800, 'comment', '同一作者冷却（秒）'], ['postingWorkMinutes', 1, 120, 'both', '连续可发布时长（分钟）'],
      ['postingRestMinutes', 0, 60, 'both', '随后休息时长（分钟）'], ['rateLimitMinutes', 1, 60, 'both', '限流后等待（分钟）'],
      ['rateLimitLongMinutes', 1, 120, 'both', '第 4 次限流等待（分钟）'],
    ];

    function Panel() {
      const [state, setState] = React.useState(null);
      const [error, setError] = React.useState('');
      const [notice, setNotice] = React.useState('');
      const [busy, setBusy] = React.useState(false);
      const [config, setConfig] = React.useState(null);
      const [configHash, setConfigHash] = React.useState(null);
      const [draftDirty, setDraftDirty] = React.useState(false);
      const [pause, setPause] = React.useState({ comment: 30, reply: 30 });
      const saveLock = React.useRef(false);
      const latestSaveHash = React.useRef(null);

      const refresh = React.useCallback(async ({ preserveDraft = false } = {}) => {
        try {
          const response = await fetch(ROUTE, { cache: 'no-store' });
          const data = await response.json();
          if (!response.ok || data.ok === false) throw new Error(data.error || `请求失败，状态码 ${response.status}`);
          setState(data);
          if (!draftDirty || !preserveDraft) { setConfig(data.config); setConfigHash(data.configHash ?? null); latestSaveHash.current = data.configHash ?? null; }
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
      const setTier = (index, key, value) => updateConfig(current => ({ ...current, tiers: current.tiers.map((tier, i) => i === index ? { ...tier, [key]: value } : tier) }));
      const setTiming = (key, value) => updateConfig(current => ({ ...current, timing: { ...current.timing, [key]: value } }));

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
          disabled: busy || !controlsEnabled || (action === 'start' && startNeedsPython), onClick: () => window.confirm(t(prompt)) && act(action, key), style: buttonStyle(primary),
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
            h('input', { type: 'number', min: 1, max: 1440, value: pause[key], onChange: e => setPause(current => ({ ...current, [key]: Number(e.target.value) })), style: { ...inputStyle, width: 96, margin: 0 } }),
            h('span', { style: { fontSize: 12, color: C.faint } }, t('pauseMinutes')),
            h('button', { disabled: busy || !controlsEnabled || !item.watchdog?.running || !item.watchdog?.owned, onClick: () => window.confirm(t('confirmPause')) && act('pause', key, { minutes: pause[key] }), style: buttonStyle(true) }, t('pause')),
            h('button', { disabled: busy || !controlsEnabled || !pausePending || !item.watchdog?.running || !item.watchdog?.owned, onClick: () => window.confirm(t('confirmResume')) && act('resume', key), style: buttonStyle() }, t('resume')),
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

      return h('main', { style: pageStyle },
        h('header', { style: { display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' } },
          h('div', null,
            h('h1', { style: { margin: 0, fontSize: 20 } }, t('title')),
            h('p', { style: { margin: '4px 0 0', fontSize: 13, color: C.muted } }, t('subtitle'))),
          h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
            h('button', { disabled: busy, onClick: () => void refresh(), style: buttonStyle() }, t('refresh')),
            state?.checkedAt ? h('small', { style: { color: C.faint } }, `${t('checked')}：${new Date(state.checkedAt).toLocaleTimeString()}`) : null)),

        error ? h('p', { role: 'alert', style: { margin: 0, padding: '10px 12px', borderRadius: 10, background: C.raised, color: C.error, fontSize: 13 } }, error) : null,
        notice ? h('p', { role: 'status', style: { margin: 0, padding: '10px 12px', borderRadius: 10, background: C.raised, color: C.success, fontSize: 13 } }, notice) : null,

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

        statusCard('comment', t('comment')),
        statusCard('reply', t('reply')),

        h('section', { style: cardStyle },
          h('h2', { style: { margin: 0, fontSize: 15 } }, t('configuration')),
          h('p', { style: { margin: '6px 0 0', fontSize: 12, color: C.faint } }, t('keySafe')),

          h('h3', { style: { margin: '16px 0 0', fontSize: 14 } }, t('model')),
          h('label', { style: labelStyle }, t('modelName'), h(SideBadge, { side: 'reply' })),
          h('input', { style: inputStyle, value: config.model.name || '', placeholder: t('builtin'), onChange: e => updateConfig(current => ({ ...current, model: { ...current.model, name: e.target.value } })) }),
          h('small', { style: { color: C.faint, fontSize: 12 } }, t('modelNameHint')),
          h('label', { style: labelStyle }, t('modelPort'), h(SideBadge, { side: 'comment' })),
          h('input', { type: 'number', min: 1, max: 65535, style: inputStyle, value: config.model.endpointPort || '', onChange: e => updateConfig(current => ({ ...current, model: { ...current.model, endpointPort: e.target.value === '' ? null : Number(e.target.value) } })) }),
          h('small', { style: { color: C.faint, fontSize: 12 } }, t('portHint')),

          h('h3', { style: { margin: '18px 0 0', fontSize: 14 } }, t('tiers')),
          h('p', { style: { margin: '4px 0 0', fontSize: 12, color: C.faint } }, t('handlesHint')),
          ...config.tiers.map((tier, index) => {
            const builtin = state?.items?.comment?.priorityHandles?.[tier.id] || [];
            return h('fieldset', { key: tier.id, style: { border: `1px solid ${C.border}`, borderRadius: 10, margin: '10px 0', padding: 12, background: C.surface } },
              h('legend', { style: { fontSize: 13, padding: '0 4px' } }, tierLabel(tier.id)),
              h('label', { style: labelStyle }, t('handles'), h(SideBadge, { side: 'both' })),
              h('textarea', { style: { ...inputStyle, minHeight: 64 }, value: tier.handles.join(', '), onChange: e => setTier(index, 'handles', e.target.value.split(/[\s,，]+/).map(x => x.trim().replace(/^@/, '').toLowerCase()).filter(Boolean)) }),
              builtin.length ? h('button', { type: 'button', disabled: busy, onClick: () => setTier(index, 'handles', builtin.join(', ')), style: { ...buttonStyle(), marginBottom: 8 } }, t('builtin')) : null,
              h('label', { style: labelStyle }, t('rounds'), h(SideBadge, { side: 'reply' })),
              h('input', { type: 'number', min: 1, max: 1000, style: inputStyle, value: tier.rounds, onChange: e => setTier(index, 'rounds', Number(e.target.value)) }),
              h('label', { style: labelStyle }, t('style'), h(SideBadge, { side: 'reply' })),
              h('textarea', { style: { ...inputStyle, minHeight: 72 }, maxLength: 5000, value: tier.replyStyle || '', placeholder: t('builtin'), onChange: e => setTier(index, 'replyStyle', e.target.value) }),
              h('small', { style: { color: C.faint, fontSize: 12 } }, t('styleHint')));
          }),

          h('h3', { style: { margin: '18px 0 0', fontSize: 14 } }, t('timing')),
          ...timingFields.map(([key, min, max, side, hint]) => h('label', { key, style: { ...labelStyle, display: 'inline-block', width: '48%', verticalAlign: 'top', marginRight: '2%' } },
            hint, h(SideBadge, { side }),
            h('input', { type: 'number', min, max, style: inputStyle, value: config.timing[key], onChange: e => setTiming(key, Number(e.target.value)) }))),

          h('h3', { style: { margin: '18px 0 0', fontSize: 14 } }, t('specials'), h(SideBadge, { side: 'none' })),
          h('p', { style: { margin: '4px 0 0', fontSize: 12, color: C.faint } }, t('unsupported')),
          ...Object.entries(config.specialReplies).map(([key, value]) => h('label', { key, style: { ...labelStyle, display: 'block', fontSize: 13 } }, specialLabel(key),
            h('textarea', { style: { ...inputStyle, minHeight: 60 }, maxLength: 2000, value, onChange: e => updateConfig(current => ({ ...current, specialReplies: { ...current.specialReplies, [key]: e.target.value } })) }))),

          h('h3', { style: { margin: '18px 0 0', fontSize: 14 } }, t('rules'), h(SideBadge, { side: 'none' })),
          ...Object.entries(config.rules).map(([key, value]) => h('label', { key, style: { ...labelStyle, display: 'inline-flex', gap: 8, alignItems: 'center', width: '48%' } },
            h('input', { type: 'checkbox', checked: value, onChange: e => updateConfig(current => ({ ...current, rules: { ...current.rules, [key]: e.target.checked } })) }),
            ruleLabel(key))),

          h('div', { style: { display: 'flex', gap: 10, alignItems: 'center', marginTop: 16, flexWrap: 'wrap' } },
            h('button', { disabled: busy || !state?.ok || state?.configSource === 'invalid', onClick: () => act('save-config', undefined, { config, expectedConfigHash: latestSaveHash.current }), style: buttonStyle(true) }, t('save')),
            draftDirty ? h('small', { style: { color: C.muted } }, '有未保存的修改') : null)));
    }

    const Icon = ({ size = 20 }) => h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, 'aria-hidden': true }, h('circle', { cx: 12, cy: 12, r: 9 }), h('path', { d: 'M8 12h8M12 8v8' }));
    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh }), 'x-bot-ops-console: locale');
        const tr = ctx.locale.bind(NS);
        if (DESKTOP) {
          ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'dsh-x-bot-ops-console' }, Panel));
          ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: 'dsh-x-bot-ops-console', order: 35, label: () => tr('panel') }, Icon));
        } else {
          ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: 'dsh-x-bot-ops-console', order: 35, locale: NS, label: () => tr('panel') }, Icon));
          ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'dsh-x-bot-ops-console', locale: NS }, Panel));
        }
      },
    };
  },
});
