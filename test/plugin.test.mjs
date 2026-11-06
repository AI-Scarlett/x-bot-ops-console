import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { authorize, createService, DEFAULT_CONFIG, DEFAULT_TARGETS, DESKTOP_ROUTE, WEB_ROUTE, installRoute, readPriorityHandles, resolveTargets, validateConfig, workerAcceptance, FIELD_SIDE } from '../index.js';

const clone = value => JSON.parse(JSON.stringify(value));

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'x-bot-console-'));
  const paths = {
    comment: { dir, worker:join(dir,'comment.py'), watchdog:join(dir,'watchdog.py'), watchdogPid:join(dir,'comment-watchdog.pid'), stop:join(dir,'comment.stop'), pid:join(dir,'comment.pid'), log:join(dir,'comment.log'), heartbeat:join(dir,'comment-heartbeat.json'), rate:join(dir,'comment-rate.json'), port:19222 },
    reply: { dir, worker:join(dir,'reply.py'), watchdog:join(dir,'reply-watchdog.py'), watchdogPid:join(dir,'reply-watchdog.pid'), stop:join(dir,'reply.stop'), pid:join(dir,'reply.pid'), log:join(dir,'reply.log'), heartbeat:join(dir,'reply-heartbeat.json'), rate:join(dir,'reply-rate.json'), port:19223 },
  };
  const ephemeralWatchdog = join(dir, 'watchdog.py');
  writeFileSync(ephemeralWatchdog, '# test fixture\n');
  return { dir, paths, cleanup:()=>rmSync(dir,{recursive:true,force:true}) };
}

test('Connection is the authority; caller-controlled headers cannot authorize requests', async () => {
  let calls=0;
  const connection={requestRejection:()=>{calls++;return undefined;}};
  const accepted = { requestRejection: async () => undefined };
  const sameOrigin = {headers:{host:'127.0.0.1:64905',origin:'http://127.0.0.1:64905','sec-fetch-site':'same-origin'}};
  const forgedSameSite = {headers:{host:'127.0.0.1:64905',origin:'http://127.0.0.1:64905','sec-fetch-site':'same-site'}};
  const forgedNone = {headers:{host:'127.0.0.1:64905','sec-fetch-site':'none'}};
  assert.equal(await authorize(sameOrigin,connection),true);
  assert.equal(await authorize(sameOrigin,{}),'unavailable');
  assert.equal(await authorize(forgedSameSite,{requestRejection:async()=>403}),false);
  assert.equal(await authorize(forgedNone,{requestRejection:async()=>401}),false);
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905',origin:'https://attacker.invalid','sec-fetch-site':'cross-site'}},connection),false);
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905',origin:'http://127.0.0.1:64905','sec-fetch-site':'same-origin'}},{requestRejection:async()=>403}),false);
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905',origin:'http://127.0.0.1:64905','sec-fetch-site':'same-origin'}},{requestRejection:async()=>undefined}),true);
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905','sec-fetch-site':'cross-site'}},connection),false);
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905',origin:'http://attacker.invalid'}},connection),false);
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905'}},{requestRejection:async()=>401}),false);
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905'}},{requestRejection:async()=>500}),'unavailable');
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905'}},accepted),true);
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905'}},{}),'unavailable');
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905'}},{requestRejection:()=>{throw new Error('denied');}}),'unavailable');
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905'}},{requestRejection:()=>Promise.resolve(undefined)}),true);
  assert.equal(calls,1);
});

test('Host manifest requires only the Connection public service', async () => {
  const { inject } = await import('../index.js');
  assert.deepEqual(inject, ['connection']);
});

test('Host registers one exact route through authenticated Connection Fetch', async () => {
  for (const [desktop, expected] of [[false, WEB_ROUTE], [true, DESKTOP_ROUTE]]) {
    let registered; let disposed=false;
    const ctx={connection:{fetch:{register(route){registered=route;return()=>{disposed=true;};}}}};
    ctx.effect = run => { ctx.cleanup = run(); };
    installRoute(ctx,{inspect:async()=>({ok:true}),action:async request=>({action:request.action})},{desktop});
    assert.equal(registered.path,expected);
    assert.deepEqual(registered.methods,['GET','POST']);
    assert.equal(registered.requestBody,'buffered');
    assert.equal((await registered.fetch(new Request('http://dsh.invalid/api/x-bot-ops-console'))).status,200);
    const post=await registered.fetch(new Request('http://dsh.invalid/api/x-bot-ops-console',{method:'POST',headers:{'content-type':'application/json'},body:'{"action":"state"}'}));
    assert.equal(post.status,200);
    await ctx.cleanup(); assert.equal(disposed,true);
  }
});



test('Desktop UI uses relative DSH route and Chinese-first controls', () => {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /const ROUTE = '\/api\/x-bot-ops-console'/);
  assert.match(source, /const t = key => zh\[key\]/);
  assert.match(source, /overflowY:\s*'auto'/);
  assert.doesNotMatch(source, /navigator\.language/);
  assert.match(source, /disabled:\s*busy\s*\|\|\s*!controlsEnabled/);
  assert.match(source, /const pageStyle = /);
  assert.match(source, /SafeBoundary/);
  assert.doesNotMatch(source, /window\.confirm/);
});

test('local target overrides are read from a user-owned file and validated', () => {
  const dir = mkdtempSync(join(tmpdir(), 'x-bot-targets-'));
  const overridePath = join(dir, 'console-targets.json');
  const base = { comment: { dir:'/base/comment', worker:'/base/comment/w.py', watchdog:'/base/comment/d.py', watchdogPid:'/base/comment/d.pid', stop:'/base/comment/d.stop', pid:'/base/comment/w.pid', log:'/base/comment/w.log', heartbeat:'/base/comment/h.json', rate:'/base/comment/r.json', port:9222 }, reply: { dir:'/base/reply', worker:'/base/reply/w.py', watchdog:'/base/reply/d.py', watchdogPid:'/base/reply/d.pid', stop:'/base/reply/d.stop', pid:'/base/reply/w.pid', log:'/base/reply/w.log', heartbeat:'/base/reply/h.json', rate:'/base/reply/r.json', port:9223 } };
  writeFileSync(overridePath, JSON.stringify({ targets: { comment: { dir:'/real/comment', worker:'/real/comment/w.py', watchdog:'/real/comment/d.py', port: 9222 }, reply: { worker:'relative.py', port:'9223' } } }));
  const resolved = resolveTargets(base, overridePath);
  assert.equal(resolved.comment.worker, '/real/comment/w.py');
  assert.equal(resolved.comment.log, '/base/comment/w.log');
  assert.equal(resolved.reply.worker, '/base/reply/w.py');
  assert.equal(resolved.reply.port, 9223);
  assert.equal(resolved.comment.port, 9222);
  assert.equal(resolved.comment.python, undefined);
  rmSync(dir, { recursive:true, force:true });
  assert.deepEqual(resolveTargets(base, join(dir, 'missing.json')).comment, base.comment);
  assert.equal(resolveTargets(base, join(dir, 'missing.json')).reply.port, 9223);
});

test('local target overrides apply only when a service explicitly opts in', async () => {
  const f = fixture();
  const overrideDir = mkdtempSync(join(tmpdir(), 'x-bot-override-'));
  const overridePath = join(f.dir, 'console-targets.json');
  writeFileSync(overridePath, JSON.stringify({ targets: { comment: { rate: join(overrideDir, 'rate_limit.json'), python: '/test/python', interpreterPidArgvToken:'/test/python', workerPidArgvToken:'/test/comment.py', watchdogPidArgvToken:'/test/watchdog.py' } } }));
  try {
    const plain = createService({ paths: f.paths, configPath: join(f.dir, 'config.json'), platform: 'darwin' });
    await assert.rejects(plain.action({ action: 'pause', target: 'comment', minutes: 5 }), /监控进程未运行/);
    assert.equal(existsSync(f.paths.comment.rate), false);
    assert.equal(existsSync(join(overrideDir, 'rate_limit.json')), false);

    const opted = createService({ paths: f.paths, configPath: join(f.dir, 'config.json'), platform: 'darwin', targetsPath: overridePath });
    await assert.rejects(opted.action({ action: 'pause', target: 'comment', minutes: 5 }), /监控进程未运行/);
    assert.equal(existsSync(join(overrideDir, 'rate_limit.json')), false);
  } finally { rmSync(overrideDir, { recursive: true, force: true }); f.cleanup(); }
});

test('Desktop UI uses a viewport-sized scrolling panel and local target override', () => {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /height:\s*'calc\(100vh - 24px\)'/);
  assert.match(source, /overflowY:\s*'auto'/);
  assert.match(source, /WebkitOverflowScrolling:\s*'touch'/);
  assert.match(source, /const pageStyle =/);
  assert.match(source, /h\('main',\s*\{\s*style:\s*pageStyle\s*\}/);
  assert.match(source, /--dsw-alias-bg-layer-1/);
  assert.match(source, /内置名单填充|builtin/);
  assert.match(source, /workerAcceptance/);
});

test('default config validates and preserves privacy boundaries', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  assert.equal(validateConfig(config).model.name, '');
  assert.equal(validateConfig(config).timing.publishMinSeconds, 30);
  assert.equal(validateConfig(config).timing.publishMaxSeconds, 100);
  assert.equal(validateConfig(config).timing.authorCooldownSeconds, 1800);
  assert.equal(validateConfig(config).timing.commentWindowHours, 6);
  assert.equal(validateConfig(config).timing.mentionWindowHours, 12);
  assert.match(validateConfig(config).tiers[0].label, /优先级/);
  assert.match(validateConfig(config).specialReplies.asksAi, /如实回答/);
  assert.equal(validateConfig(config).specialPersons.apex.handle, '4ggug');
  assert.deepEqual(validateConfig(config).specialPersons.skipReplyHandles, ['grok']);
  assert.match(config.model.keySource, /密钥不会被读取或显示/);
  assert.throws(()=>validateConfig({...config,tiers:[]}),/配置结构无效/);
});

test('worker acceptance mirrors the two python loaders', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  const ok = workerAcceptance(config);
  assert.equal(ok.comment.accepted, true);
  assert.equal(ok.reply.accepted, true);
  const bad = structuredClone(DEFAULT_CONFIG);
  bad.timing.mentionWindowHours = 12.5;
  assert.equal(workerAcceptance(bad).comment.accepted, true);
  assert.equal(workerAcceptance(bad).reply.accepted, false);
  const missingTier = structuredClone(DEFAULT_CONFIG);
  missingTier.tiers = missingTier.tiers.filter(tier => tier.id !== 'apex');
  assert.equal(workerAcceptance(missingTier).comment.accepted, false);
  assert.match(workerAcceptance(missingTier).comment.reasons.join(' '), /apex/);
});

test('reads the priority handles that a worker hard-codes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'x-bot-source-'));
  const script = join(dir, 'worker.py');
  writeFileSync(script, [
    'APEX_HANDLE = "4ggug"',
    'PRIORITY_APEX = (APEX_HANDLE,)',
    'PRIORITY_TIER1 = ("alpha_one", "beta_two",)',
    'PRIORITY_TIER2 = (',
    '    "gamma3",',
    '    "delta4",',
    ')',
    'PRIORITY_TIER3 = ("eps5",)',
    'PRIORITY_TIER4 = ("zeta6",)',
  ].join('\n'));
  const handles = readPriorityHandles(script);
  assert.deepEqual(handles.apex, ['4ggug']);
  assert.deepEqual(handles.tier1, ['alpha_one', 'beta_two']);
  assert.deepEqual(handles.tier2, ['gamma3', 'delta4']);
  assert.deepEqual(handles.tier3, ['eps5']);
  assert.deepEqual(handles.tier4, ['zeta6']);
  assert.deepEqual(readPriorityHandles(join(dir, 'missing.py')).apex, []);
  rmSync(dir, { recursive: true, force: true });
});

test('the shared config file is the only source of truth', async () => {
  const f = fixture();
  const configPath = join(f.dir, 'config.json');
  try {
    const service = createService({ paths: f.paths, configPath, platform: 'linux' });
    const missing = await service.inspect();
    assert.equal(missing.configSource, 'missing');
    assert.equal(missing.config.model.name, '');
    const saved = structuredClone(DEFAULT_CONFIG);
    saved.model.name = 'gpt-6-luna';
    await service.action({ action: 'save-config', expectedConfigHash: missing.configHash, config: saved });
    const shared = await service.inspect();
    assert.equal(shared.configSource, 'shared');
    assert.equal(shared.config.model.name, 'gpt-6-luna');
    assert.equal(shared.workerAcceptance.comment.accepted, true);
    assert.equal(shared.workerAcceptance.reply.accepted, true);
  } finally { f.cleanup(); }
});

test('shared config writes are protected against concurrent changes', async () => {
  const f = fixture();
  const configPath = join(f.dir, 'config.json');
  try {
    const service = createService({ paths: f.paths, configPath, platform: 'linux' });
    const initial = await service.inspect();
    const first = structuredClone(DEFAULT_CONFIG);
    const firstResult = await service.action({ action: 'save-config', expectedConfigHash: initial.configHash, config: first });
    assert.match(firstResult.configHash, /^[0-9a-f]{64}$/);
    const second = structuredClone(DEFAULT_CONFIG); second.model.name = 'new-model';
    await service.action({ action: 'save-config', expectedConfigHash: firstResult.configHash, config: second });
    await assert.rejects(service.action({ action: 'save-config', expectedConfigHash: firstResult.configHash, config: first }), /共享配置已被其他进程修改/);
    assert.equal((await service.inspect()).config.model.name, 'new-model');
  } finally { f.cleanup(); }
});

test('rejects duplicate or malformed priority handles', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  config.tiers[1].handles.push('priorityuser');
  config.tiers[0].handles.push('priorityuser');
  assert.throws(()=>validateConfig(config),/用户名重复/);
  const invalid = structuredClone(DEFAULT_CONFIG); invalid.tiers[0].handles=['bad handle'];
  assert.throws(()=>validateConfig(invalid),/用户名格式无效/);
});

test('saves bounded user-owned config without real home writes', async () => {
  const f=fixture();
  try {
    const configPath=join(f.dir,'config.json');
    const service=createService({paths:f.paths,configPath,platform:'linux'});
    const changed=structuredClone(DEFAULT_CONFIG); changed.model.name='gpt-test';
    const revision = (await service.inspect()).configHash;
    const result=await service.action({action:'save-config',expectedConfigHash:revision,config:changed});
    assert.equal(result.config.model.name,'gpt-test');
    assert.match(result.configHash,/^[0-9a-f]{64}$/);
    assert.equal(result.runtimeConfigApplied,true);
    assert.equal(result.note.includes('仍为建议字段'),true);
    assert.equal(result.note.includes('回复轮次'),true);
    assert.equal(JSON.parse(readFileSync(configPath,'utf8')).model.name,'gpt-test');
  } finally { f.cleanup(); }
});

test('reports the Chrome debug port as reachable only while something listens', async () => {
  const f = fixture();
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  try {
    const paths = structuredClone(f.paths);
    paths.comment.port = port; paths.reply.port = port + 1;
    const service = createService({ paths, configPath: join(f.dir, 'config.json'), platform: 'linux', targetsPath: join(f.dir, 'missing-targets.json') });
    const state = await service.inspect();
    assert.equal(state.items.comment.cdpAvailable, true);
    assert.equal(state.items.reply.cdpAvailable, false);
  } finally {
    await new Promise(resolve => server.close(resolve));
    f.cleanup();
  }
});

test('pause writes only the selected marker; resume removes it', async () => {
  const f=fixture();
  try {
    const watchdogPid=process.pid;
    writeFileSync(f.paths.comment.watchdogPid,String(watchdogPid));
    const service=createService({paths:f.paths,configPath:join(f.dir,'config.json'),platform:'darwin',clock:()=>100_000});
    await assert.rejects(service.action({action:'pause',target:'comment',minutes:10}),/监控进程未运行或身份未验证/);
    assert.throws(()=>readFileSync(f.paths.comment.rate));
    assert.throws(()=>readFileSync(f.paths.reply.rate));
  } finally { f.cleanup(); }
});

test('manual pause and resume cannot bypass active X rate-limit protection', async () => {
  const f = fixture();
  const now = 1_000_000;
  try {
    writeFileSync(f.paths.comment.watchdogPid, String(process.pid));
    writeFileSync(f.paths.comment.rate, JSON.stringify({ until: now / 1000 + 600, reason: 'rate_limit' }));
    const service = createService({ paths: f.paths, configPath: join(f.dir, 'config.json'), platform: 'darwin', clock: () => now });
    await assert.rejects(service.action({ action: 'pause', target: 'comment', minutes: 5 }), /不能用手动暂停覆盖/);
    await assert.rejects(service.action({ action: 'resume', target: 'comment' }), /不能提前恢复/);
    assert.equal(JSON.parse(readFileSync(f.paths.comment.rate, 'utf8')).reason, 'rate_limit');
  } finally { f.cleanup(); }
});

test('validates numeric timing, reply rules and copies input without mutation', () => {
  const config=structuredClone(DEFAULT_CONFIG); config.tiers[5].handles=['normal_account'];
  const original=structuredClone(config); const validated=validateConfig(config);
  assert.deepEqual(config,original); assert.deepEqual(validated.tiers[5].handles,['normal_account']);
  const bad=structuredClone(DEFAULT_CONFIG); bad.timing.publishMaxSeconds=1;
  assert.throws(()=>validateConfig(bad),/timing|publishMax/);
  const oversized=structuredClone(DEFAULT_CONFIG); oversized.specialReplies.care='x'.repeat(2001);
  assert.throws(()=>validateConfig(oversized),/特殊回复设置无效/);
  const invalidSpecial=structuredClone(DEFAULT_CONFIG); invalidSpecial.specialPersons.skipReplyHandles=['bad handle'];
  assert.throws(()=>validateConfig(invalidSpecial),/用户名格式无效/);
  const tooLongStyle=structuredClone(DEFAULT_CONFIG); tooLongStyle.specialPersons.apex.replyStyle='x'.repeat(3001);
  assert.throws(()=>validateConfig(tooLongStyle),/关键人物 apex 设置无效/);
});

test('start reports a request, not an unverified success', async () => {
  const f=fixture(); const calls=[];
  try {
    writeFileSync(f.paths.comment.watchdog,'# fixture watchdog\n');
    const python = join(f.dir, 'python'); writeFileSync(python, '');
    const paths = structuredClone(f.paths); Object.assign(paths.comment, { python, interpreterPidArgvToken: python, workerPidArgvToken: f.paths.comment.worker, watchdogPidArgvToken: f.paths.comment.watchdog });
    const service=createService({paths,configPath:join(f.dir,'config.json'),platform:'darwin',spawnProcess:(command,args,options)=>{calls.push({command,args,options});return {pid:12345,unref(){}};}});
    const result=await service.action({action:'start',target:'comment'});
    assert.equal(result.started,null); assert.equal(result.launchRequested,true);
    assert.equal(calls[0].command, python);
    assert.equal(calls[0].args[0], f.paths.comment.watchdog);
    assert.equal(calls[0].args[1], '--loop');
    assert.equal(calls[0].options.detached, true);
    assert.equal(calls[0].options.cwd, f.paths.comment.dir);
  } finally { f.cleanup(); }
});

test('start refuses an unknown interpreter before clearing the stop marker', async () => {
  const f=fixture();
  try {
    writeFileSync(f.paths.comment.watchdog,'# fixture watchdog\n');
    writeFileSync(f.paths.comment.stop,'stop\n');
    const service=createService({paths:f.paths,configPath:join(f.dir,'config.json'),platform:'darwin',spawnProcess:()=>{throw new Error('must not spawn');}});
    await assert.rejects(service.action({action:'start',target:'comment'}), /需要在 console-targets.json 配置/);
    assert.equal(readFileSync(f.paths.comment.stop,'utf8'),'stop\n');
  } finally { f.cleanup(); }
});

test('start rejects an explicit interpreter that does not exist', async () => {
  const f=fixture();
  try {
    writeFileSync(f.paths.comment.watchdog,'# fixture watchdog\n');
    const paths=structuredClone(f.paths); Object.assign(paths.comment,{python:'/missing/python',interpreterPidArgvToken:'/missing/python',workerPidArgvToken:f.paths.comment.worker,watchdogPidArgvToken:f.paths.comment.watchdog});
    const targetsPath=join(f.dir,'console-targets.json'); writeFileSync(targetsPath,JSON.stringify({targets:{comment:{python:'/missing/python',interpreterPidArgvToken:'/missing/python',workerPidArgvToken:f.paths.comment.worker,watchdogPidArgvToken:f.paths.comment.watchdog}}}));
    const service=createService({paths,targetsPath,configPath:join(f.dir,'config.json'),platform:'darwin'});
    await assert.rejects(service.action({action:'start',target:'comment'}), /解释器不存在/);
  } finally { f.cleanup(); }
});

test('invalid and missing shared config are distinct', async () => {
  const f=fixture(); const configPath=join(f.dir,'config.json');
  try {
    writeFileSync(configPath,'{broken');
    const service=createService({paths:f.paths,configPath,platform:'linux'});
    assert.equal((await service.inspect()).configSource,'invalid');
    writeFileSync(configPath,'null');
    assert.equal((await service.inspect()).configSource,'invalid');
  } finally { f.cleanup(); }
});

test('model name is reply-only and endpoint override is comment-only', () => {
  assert.equal(FIELD_SIDE['model.name'],'reply');
  assert.equal(FIELD_SIDE['model.endpointPort'],'comment');
});

test('saving shared config does not write unused worker mirrors', async () => {
  const f=fixture();
  try {
    const service=createService({paths:f.paths,configPath:join(f.dir,'config.json'),platform:'linux'});
    const revision = (await service.inspect()).configHash;
    await service.action({action:'save-config',expectedConfigHash:revision,config:structuredClone(DEFAULT_CONFIG)});
    assert.equal(existsSync(join(f.paths.comment.dir,'xops_config.json')),false);
    assert.equal(existsSync(join(f.paths.reply.dir,'xops_config.json')),false);
  } finally { f.cleanup(); }
});

test('custom model port cannot be null-invalid or zero', () => {
  const config=structuredClone(DEFAULT_CONFIG);
  config.model.endpointPort=0;
  assert.throws(()=>validateConfig(config), /模型设置无效/);
});

test('pause and resume controls require verified worker identity when PID is present', async () => {
  const f=fixture();
  try {
    const service=createService({paths:f.paths,configPath:join(f.dir,'config.json'),platform:'darwin'});
    writeFileSync(f.paths.comment.pid,String(process.pid));
    await assert.rejects(service.action({action:'pause',target:'comment',minutes:5}),/监控进程未运行或身份未验证/);
    await assert.rejects(service.action({action:'resume',target:'comment'}),/监控进程未运行或身份未验证/);
    assert.equal(existsSync(f.paths.comment.rate),false);
  } finally { f.cleanup(); }
});

test('distinguishes live foreign PID from stopped PID and fails closed', async () => {
  const f=fixture();
  try {
    const service=createService({paths:f.paths,configPath:join(f.dir,'config.json'),platform:'darwin'});
    const pid=process.pid;
    const {writeFileSync}=await import('node:fs');
    writeFileSync(f.paths.comment.watchdogPid,String(pid));
    const state=await service.inspect();
    assert.equal(state.items.comment.watchdog.running,true);
    assert.equal(state.items.comment.watchdog.owned,false);
    await assert.rejects(service.action({action:'stop',target:'comment'}),/监控进程身份未验证/);
    await assert.rejects(service.action({action:'start',target:'comment'}),/发现正在运行但身份未验证/);
  } finally { f.cleanup(); }
});

test('refuses process actions without verified owned PID identity', async () => {
  const f=fixture();
  try {
    const service=createService({paths:f.paths,configPath:join(f.dir,'config.json'),platform:'darwin'});
    await assert.rejects(service.action({action:'stop',target:'comment'}),/监控进程身份未验证/);
    await assert.rejects(service.action({action:'restart',target:'reply'}),/监控进程身份未验证/);
  } finally { f.cleanup(); }
});

test('rejects unsafe actions and non-mac process control', async () => {
  const f=fixture();
  try {
    const service=createService({paths:f.paths,configPath:join(f.dir,'config.json'),platform:'linux'});
    await assert.rejects(service.action({action:'start-watchdog',target:'comment'}),/未知操作类型/);
    await assert.rejects(service.action({action:'shell',command:'rm -rf /'}),/未知操作类型/);
    await assert.rejects(service.action({action:'pause',target:'bad',minutes:3}),/目标必须是评论或提及回复/);
  } finally { f.cleanup(); }
});

test('exposes DSH pnpm and profile discovery helpers', async () => {
  const { resolveDshPnpm, resolveDshProfiles } = await import('../index.js');
  const pnpmPath = resolveDshPnpm();
  assert.ok(pnpmPath === null || typeof pnpmPath === 'string');
  const profiles = resolveDshProfiles();
  assert.ok(Array.isArray(profiles));
});

test('client source is valid JavaScript and includes post queue controls', async () => {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  const body = source.replace(/^window\.__ModuleLoader__\.load\(\{/, 'const __plugin = {').replace(/\}\);\s*$/, '};');
  assert.doesNotThrow(() => new Function(body));
  assert.match(source, /待发推文队列看板/);
  assert.match(source, /立即插队置顶发送/);
  assert.match(source, /AI 批量生成草稿/);
  assert.match(source, /待发队列补仓策略/);
});

test('handles post queue operations (enqueue, urgent, remove, clear)', async () => {
  const f = fixture();
  try {
    const service = createService({
      paths: f.paths,
      configPath: join(f.dir, 'config.json'),
      queuePath: join(f.dir, 'post_queue.json'),
      platform: 'darwin',
    });
    const res1 = await service.action({ action: 'enqueue-post', text: '第一条普通测试推文', urgent: false });
    assert.equal(res1.ok, true);
    assert.equal(res1.queue.length, 1);
    assert.equal(res1.item.urgent, false);

    const res2 = await service.action({ action: 'enqueue-post', text: '加急插队推文', urgent: true });
    assert.equal(res2.ok, true);
    assert.equal(res2.queue.length, 2);
    assert.equal(res2.queue[0].text, '加急插队推文');
    assert.equal(res2.queue[0].urgent, true);

    const res3 = await service.action({ action: 'remove-queued-post', id: res2.queue[0].id });
    assert.equal(res3.ok, true);
    assert.equal(res3.queue.length, 1);

    const res4 = await service.action({ action: 'clear-post-queue' });
    assert.equal(res4.ok, true);
    assert.equal(res4.queue.length, 0);
  } finally { f.cleanup(); }
});

test('post queue survives concurrent enqueue and remove without losing drafts', async () => {
  const f = fixture();
  try {
    const queuePath = join(f.dir, 'post_queue.json');
    const service = createService({
      paths: f.paths,
      configPath: join(f.dir, 'config.json'),
      queuePath,
      platform: 'darwin',
    });
    const results = await Promise.all([
      service.action({ action: 'enqueue-post', text: '并发稿件一', urgent: false }),
      service.action({ action: 'enqueue-post', text: '并发稿件二', urgent: false }),
      service.action({ action: 'enqueue-post', text: '并发稿件三', urgent: false }),
    ]);
    for (const result of results) assert.equal(result.ok, true);

    const stored = JSON.parse(readFileSync(queuePath, 'utf8'));
    assert.equal(stored.queue.length, 3);
    const texts = stored.queue.map(item => item.text);
    assert.ok(texts.includes('并发稿件一'));
    assert.ok(texts.includes('并发稿件二'));
    assert.ok(texts.includes('并发稿件三'));
  } finally { f.cleanup(); }
});

test('post queue settings accept batch size, threshold and auto refill knobs', async () => {
  const f = fixture();
  try {
    const config = clone(DEFAULT_CONFIG);
    config.postSettings.queueBatchSize = 10;
    config.postSettings.queueLowThreshold = 3;
    config.postSettings.queueAutoRefill = true;
    config.postSettings.queueMaxSize = 80;
    const validated = validateConfig(config);
    assert.equal(validated.postSettings.queueBatchSize, 10);
    assert.equal(validated.postSettings.queueLowThreshold, 3);
    assert.equal(validated.postSettings.queueAutoRefill, true);
    assert.equal(validated.postSettings.queueMaxSize, 80);

    const bad = clone(DEFAULT_CONFIG);
    bad.postSettings.queueBatchSize = 0;
    assert.throws(() => validateConfig(bad), /每批生成条数/);
    bad.postSettings.queueBatchSize = 10;
    bad.postSettings.queueLowThreshold = 99;
    assert.throws(() => validateConfig(bad), /自动补仓阈值/);
    bad.postSettings.queueLowThreshold = 3;
    bad.postSettings.queueAutoRefill = 'yes';
    assert.throws(() => validateConfig(bad), /自动补仓开关/);
  } finally { f.cleanup(); }
});

test('queue settings are exposed to the post worker side', async () => {
  const { FIELD_SIDE } = await import('../index.js');
  assert.equal(FIELD_SIDE['postSettings.queueBatchSize'], 'post');
  assert.equal(FIELD_SIDE['postSettings.queueLowThreshold'], 'post');
  assert.equal(FIELD_SIDE['postSettings.queueAutoRefill'], 'post');
  assert.equal(FIELD_SIDE['postSettings.queueMaxSize'], 'post');
});

test('comma separated inputs keep raw text so a typed separator is not swallowed', async () => {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');

  // The separator fields must not re-parse the raw value on every keystroke,
  // otherwise the comma the user just typed disappears immediately.
  assert.doesNotMatch(source, /onChange: e => updateConfig\(c => \(\{ \.\.\.c, postSettings: \{ \.\.\.\(c\.postSettings \|\| \{\}\), topics: e\.target\.value\.split/);
  assert.doesNotMatch(source, /onChange: e => setTier\(index, 'handles', e\.target\.value\)/);
  assert.doesNotMatch(source, /onChange: e => setSkipHandles\(e\.target\.value\)/);

  // Raw text is held in local state and committed on blur plus at save time.
  assert.match(source, /onChange: e => setTopicsText\(e\.target\.value\)/);
  assert.match(source, /onChange: e => setSkipHandlesText\(e\.target\.value\)/);
  assert.match(source, /onChange: e => setTierHandlesText\(/);
  assert.match(source, /onBlur: e => \{/);
  assert.match(source, /topics: splitTopics\(topicsText\)/);
  assert.match(source, /skipReplyHandles: splitList\(skipHandlesText\)/);

  // The parser itself must split on real commas, not on a literal backslash.
  const splitTopics = source.match(/const splitTopics = value => String\(value \|\| ''\)\.split\(([^)]*)\)/);
  assert.ok(splitTopics, 'splitTopics helper is missing');
  assert.match(splitTopics[1], /\\s/);
  assert.doesNotMatch(splitTopics[1], /\\\\s/);
});

test('the topics parser keeps every comma separated entry', async () => {
  const { validateConfig } = await import('../index.js');
  const config = clone(DEFAULT_CONFIG);
  const raw = '文言雅趣, 周朝掌故, 易经随笔, 日常感悟';
  config.postSettings.topics = raw.split(/[,，\s]+/).map(x => x.trim()).filter(Boolean);
  assert.deepEqual(config.postSettings.topics, ['文言雅趣', '周朝掌故', '易经随笔', '日常感悟']);
  assert.deepEqual(validateConfig(config).postSettings.topics, config.postSettings.topics);
});

test('learning settings validate thresholds and reject out of range values', async () => {
  const config = clone(DEFAULT_CONFIG);
  config.learningSettings = {
    ...config.learningSettings,
    checkIntervalMinutes: 720,
    historyHours: 48,
    minImpressions: 5000,
    minComments: 5,
    minLikes: 20,
    maxSamples: 30,
    autoLearn: false,
    injectIntoPost: true,
  };
  const validated = validateConfig(config);
  assert.equal(validated.learningSettings.checkIntervalMinutes, 720);
  assert.equal(validated.learningSettings.minImpressions, 5000);
  assert.equal(validated.learningSettings.autoLearn, false);

  const bad = clone(DEFAULT_CONFIG);
  bad.learningSettings.checkIntervalMinutes = 1;
  assert.throws(() => validateConfig(bad), /学习检查间隔/);
  bad.learningSettings.checkIntervalMinutes = 360;
  bad.learningSettings.minImpressions = -5;
  assert.throws(() => validateConfig(bad), /曝光量门槛/);
  bad.learningSettings.minImpressions = 1000;
  bad.learningSettings.benchmarkUrl = 'javascript:alert(1)';
  assert.throws(() => validateConfig(bad), /榜单地址/);
});

test('learning analysis window accepts a band and rejects inverted ranges', async () => {
  const config = clone(DEFAULT_CONFIG);
  assert.equal(config.learningSettings.minAgeHours, 12);
  assert.equal(config.learningSettings.historyHours, 36);

  config.learningSettings.minAgeHours = 12;
  config.learningSettings.historyHours = 36;
  const ok = validateConfig(config);
  assert.equal(ok.learningSettings.minAgeHours, 12);
  assert.equal(ok.learningSettings.historyHours, 36);

  // 12h-ago .. 36h-ago is valid; 48 .. 24 would silently analyse nothing.
  const inverted = clone(DEFAULT_CONFIG);
  inverted.learningSettings.minAgeHours = 48;
  inverted.learningSettings.historyHours = 24;
  assert.throws(() => validateConfig(inverted), /必须小于或等于上限/);

  const zero = clone(DEFAULT_CONFIG);
  zero.learningSettings.minAgeHours = 0;
  assert.throws(() => validateConfig(zero), /分析时间下限/);
});

test('learning module has its own model selection independent of the post model', async () => {
  const config = clone(DEFAULT_CONFIG);
  config.postSettings.model = 'gpt-6-luna';
  config.learningSettings.model = 'gemini-3.8-flash-high';
  const ok = validateConfig(config);
  assert.equal(ok.learningSettings.model, 'gemini-3.8-flash-high');
  assert.equal(ok.postSettings.model, 'gpt-6-luna');
  // Empty means "follow the post model", so it must stay an accepted value.
  const empty = clone(config);
  empty.learningSettings.model = '';
  assert.equal(validateConfig(empty).learningSettings.model, '');

  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /发帖学习专用大模型/);
  assert.match(source, /config\?\.learningSettings\?\.model/);
  assert.match(source, /只分析「至少」多少小时前/);
  assert.match(source, /只分析「最多」多少小时前/);
});

test('cruise priority sweep interval is bounded and explained in the UI', async () => {
  const config = clone(DEFAULT_CONFIG);
  assert.equal(config.cruiseSettings.tierSweepHours, 6);
  const ok = validateConfig(config);
  assert.equal(ok.cruiseSettings.tierSweepHours, 6);

  const zero = clone(DEFAULT_CONFIG);
  zero.cruiseSettings.tierSweepHours = 0;
  assert.equal(validateConfig(zero).cruiseSettings.tierSweepHours, 0);

  const bad = clone(DEFAULT_CONFIG);
  bad.cruiseSettings.tierSweepHours = 900;
  assert.throws(() => validateConfig(bad), /重点名单轮巡间隔/);

  const { FIELD_SIDE } = await import('../index.js');
  assert.equal(FIELD_SIDE['cruiseSettings.tierSweepHours'], 'profile');

  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /重点名单整轮巡/);
  assert.match(source, /每隔多少小时轮巡一次全部重点名单/);
});

test('cruise comments per profile is bounded and configurable', async () => {
  const config = clone(DEFAULT_CONFIG);
  assert.equal(config.cruiseSettings.commentsPerProfile, 1);
  assert.equal(validateConfig(config).cruiseSettings.commentsPerProfile, 1);

  const two = clone(DEFAULT_CONFIG);
  two.cruiseSettings.commentsPerProfile = 2;
  assert.equal(validateConfig(two).cruiseSettings.commentsPerProfile, 2);

  // 0 means browse only, and must stay valid.
  const off = clone(DEFAULT_CONFIG);
  off.cruiseSettings.commentsPerProfile = 0;
  assert.equal(validateConfig(off).cruiseSettings.commentsPerProfile, 0);

  const bad = clone(DEFAULT_CONFIG);
  bad.cruiseSettings.commentsPerProfile = 11;
  assert.throws(() => validateConfig(bad), /每次巡航评论条数/);

  const { FIELD_SIDE } = await import('../index.js');
  assert.equal(FIELD_SIDE['cruiseSettings.commentsPerProfile'], 'profile');

  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /每次巡览对该主页评论几条/);
});

test('readCruiseSweep reports pending progress or an empty state', async () => {
  const { readCruiseSweep } = await import('../index.js');
  const f = fixture();
  try {
    const path = join(f.dir, 'profile_cruise_history.json');
    assert.deepEqual(
      { pending: readCruiseSweep(path).pending, total: readCruiseSweep(path).total },
      { pending: 0, total: 0 },
    );

    writeFileSync(path, JSON.stringify({
      sweep: { pending: ['a', 'b'], total: 5, done: 3, startedAt: 1700000000, lastFinishedAt: 0 },
    }));
    const running = readCruiseSweep(path);
    assert.equal(running.pending, 2);
    assert.equal(running.total, 5);
    assert.equal(running.done, 3);
    assert.equal(running.nextHandle, 'a');
    assert.equal(running.lastFinishedAt, null);
    assert.ok(running.startedAt);
  } finally { f.cleanup(); }
});

test('every save snapshots the previous config and can be rolled back', async () => {
  const f = fixture();
  try {
    const configPath = join(f.dir, 'config.json');
    const backupDir = join(f.dir, 'config-history');
    const service = createService({
      paths: f.paths,
      configPath,
      backupDir,
      queuePath: join(f.dir, 'post_queue.json'),
      learningsPath: join(f.dir, 'learnings.json'),
      platform: 'darwin',
    });

    const initial = await service.action({ action: 'state' });
    const first = clone(initial.config);
    first.commentSettings = { ...first.commentSettings, customPrompt: '第一版评论提示词' };
    await service.action({ action: 'save-config', config: first, expectedConfigHash: initial.configHash });

    const afterFirst = await service.action({ action: 'state' });
    assert.equal(afterFirst.config.commentSettings.customPrompt, '第一版评论提示词');
    // The very first save has nothing on disk yet, so there is no snapshot to take.
    assert.equal(afterFirst.configBackups.length, 0);

    // A second save snapshots the first version and changes the prompt.
    const second = clone(afterFirst.config);
    second.commentSettings = { ...second.commentSettings, customPrompt: '第二版评论提示词' };
    await service.action({ action: 'save-config', config: second, expectedConfigHash: afterFirst.configHash });

    const afterSecond = await service.action({ action: 'state' });
    assert.equal(afterSecond.config.commentSettings.customPrompt, '第二版评论提示词');
    assert.equal(afterSecond.configBackups.length, 1, 'the previous version must be snapshotted');

    // Roll back to the newest snapshot, which still holds the first version.
    const restored = await service.action({ action: 'restore-config-backup', name: afterSecond.configBackups[0].name });
    assert.equal(restored.config.commentSettings.customPrompt, '第一版评论提示词');
    assert.ok(restored.configHash);

    // Restoring also snapshots the pre-restore state, so the act itself is reversible.
    const afterRestore = await service.action({ action: 'state' });
    assert.ok(afterRestore.configBackups.length >= 2, 'restore must snapshot what it replaced');
  } finally { f.cleanup(); }
});

test('restore rejects a tampered backup name', async () => {
  const f = fixture();
  try {
    const service = createService({
      paths: f.paths,
      configPath: join(f.dir, 'config.json'),
      backupDir: join(f.dir, 'config-history'),
      platform: 'darwin',
    });
    await assert.rejects(service.action({ action: 'restore-config-backup', name: '../../etc/passwd' }), /备份文件名无效/);
    await assert.rejects(service.action({ action: 'restore-config-backup', name: 'config-nope.json' }), /找不到该备份文件/);
  } finally { f.cleanup(); }
});

test('time-window style schedule validates and is worker-owned', async () => {
  const config = clone(DEFAULT_CONFIG);
  assert.equal(config.postSettings.styleSchedule.length, 3);
  const ok = validateConfig(config);
  assert.deepEqual(
    ok.postSettings.styleSchedule.map(slot => `${slot.label}:${slot.startHour}-${slot.endHour}`),
    ['楚辞:0-1', '英文:1-7', '文言文:7-24'],
  );

  const { FIELD_SIDE } = await import('../index.js');
  assert.equal(FIELD_SIDE['postSettings.styleSchedule'], 'post');

  const inverted = clone(DEFAULT_CONFIG);
  inverted.postSettings.styleSchedule = [{ id: 'x', label: '坏', startHour: 8, endHour: 8, prompt: '' }];
  assert.throws(() => validateConfig(inverted), /结束小时必须大于开始小时/);

  const outOfRange = clone(DEFAULT_CONFIG);
  outOfRange.postSettings.styleSchedule = [{ id: 'x', label: '坏', startHour: 0, endHour: 25, prompt: '' }];
  assert.throws(() => validateConfig(outOfRange), /0~24/);

  const duplicate = clone(DEFAULT_CONFIG);
  duplicate.postSettings.styleSchedule = [
    { id: 'same', label: 'A', startHour: 0, endHour: 1, prompt: '' },
    { id: 'same', label: 'B', startHour: 1, endHour: 2, prompt: '' },
  ];
  assert.throws(() => validateConfig(duplicate), /编号缺失或重复/);

  const noLabel = clone(DEFAULT_CONFIG);
  noLabel.postSettings.styleSchedule = [{ id: 'x', label: '  ', startHour: 0, endHour: 1, prompt: '' }];
  assert.throws(() => validateConfig(noLabel), /名称需为/);

  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /分时段文风调度/);
  assert.match(source, /当前生效/);
});

test('config history keeps only the most recent snapshots', async () => {
  const { backupConfigFile, listConfigBackups } = await import('../index.js');
  const f = fixture();
  try {
    const configPath = join(f.dir, 'config.json');
    const backupDir = join(f.dir, 'config-history');
    writeFileSync(configPath, JSON.stringify({ schemaVersion: 1 }));
    for (let i = 0; i < 25; i += 1) {
      backupConfigFile(configPath, backupDir);
      // Timestamped names only differ by milliseconds, so make each unique.
      await new Promise(resolve => setTimeout(resolve, 2));
    }
    const backups = listConfigBackups(backupDir);
    assert.ok(backups.length <= 20, `expected at most 20 snapshots, got ${backups.length}`);
    assert.ok(backups[0].savedAt, 'newest snapshot should carry a timestamp');
  } finally { f.cleanup(); }
});

test('learning influence and topic mix validate and weight picks correctly', async () => {
  const { pickTopicTheme, buildLearningPromptBlock } = await import('../index.js');
  const config = clone(DEFAULT_CONFIG);
  assert.equal(config.postSettings.learningInfluence, 100);
  assert.deepEqual(config.postSettings.topicMix, []);

  const mix = [
    { id: 'a', label: '文言文', weight: 50, prompt: '古奥' },
    { id: 'b', label: '撩女人', weight: 30, prompt: '风趣' },
    { id: 'c', label: '谈生活', weight: 20, prompt: '生活' },
  ];
  const ok = clone(DEFAULT_CONFIG);
  ok.postSettings.topicMix = mix;
  ok.postSettings.learningInfluence = 40;
  assert.equal(validateConfig(ok).postSettings.learningInfluence, 40);

  const wrongTotal = clone(DEFAULT_CONFIG);
  wrongTotal.postSettings.topicMix = [{ id: 'a', label: 'X', weight: 70, prompt: '' }];
  assert.throws(() => validateConfig(wrongTotal), /合计必须等于 100%/);

  const badWeight = clone(DEFAULT_CONFIG);
  badWeight.postSettings.topicMix = [{ id: 'a', label: 'X', weight: 150, prompt: '' }];
  assert.throws(() => validateConfig(badWeight), /主题比例需为 0~100/);

  const badInfluence = clone(DEFAULT_CONFIG);
  badInfluence.postSettings.learningInfluence = 101;
  assert.throws(() => validateConfig(badInfluence), /学习规则强度需为 0~100/);

  // Weighted pick honours the configured ratio.
  const counts = { 文言文: 0, 撩女人: 0, 谈生活: 0 };
  for (let i = 0; i < 4000; i += 1) counts[pickTopicTheme(mix).label] += 1;
  assert.ok(Math.abs(counts['文言文'] / 4000 - 0.5) < 0.04, `文言文 ratio ${counts['文言文'] / 4000}`);
  assert.ok(Math.abs(counts['撩女人'] / 4000 - 0.3) < 0.04, `撩女人 ratio ${counts['撩女人'] / 4000}`);
  assert.ok(Math.abs(counts['谈生活'] / 4000 - 0.2) < 0.04, `谈生活 ratio ${counts['谈生活'] / 4000}`);
  assert.equal(pickTopicTheme([]), null);

  // Influence 0 removes the learned block entirely; 100 keeps it whole.
  const learnings = { styleGuide: '反差开局', winningTopics: ['打工账本'], bannedTopics: [], patterns: [{ title: 'T', structure: 'S', hooks: ['H'] }] };
  assert.equal(buildLearningPromptBlock(learnings, { influence: 0 }), '');
  const full = buildLearningPromptBlock(learnings, { influence: 100 });
  const half = buildLearningPromptBlock(learnings, { influence: 50 });
  assert.ok(full.length > 0);
  assert.ok(half.length <= full.length);
  assert.match(full, /反差开局/);

  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /生成配比（提示词 \/ 学习规则 \/ 主题）/);
  assert.match(source, /学习规则强度/);
  assert.match(source, /主题配比（合计需为 100%）/);
});

test('post batch rest settings validate and stay post-owned', async () => {
  const config = clone(DEFAULT_CONFIG);
  assert.equal(config.postSettings.restEveryPosts, 8);
  assert.equal(config.postSettings.restMinutes, 3);
  const ok = validateConfig(config);
  assert.equal(ok.postSettings.restEveryPosts, 8);
  assert.equal(ok.postSettings.restMinutes, 3);

  const off = clone(DEFAULT_CONFIG);
  off.postSettings.restEveryPosts = 0;
  assert.equal(validateConfig(off).postSettings.restEveryPosts, 0);

  const badEvery = clone(DEFAULT_CONFIG);
  badEvery.postSettings.restEveryPosts = 101;
  assert.throws(() => validateConfig(badEvery), /发帖批次数/);

  const badMinutes = clone(DEFAULT_CONFIG);
  badMinutes.postSettings.restMinutes = 0;
  assert.throws(() => validateConfig(badMinutes), /发帖批次休息时长/);

  const { FIELD_SIDE } = await import('../index.js');
  assert.equal(FIELD_SIDE['postSettings.restEveryPosts'], 'post');
  assert.equal(FIELD_SIDE['postSettings.restMinutes'], 'post');

  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /发帖批次休息/);
  assert.match(source, /每发多少条后休息/);
});

test('the general tab no longer duplicates task-specific send settings', async () => {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  // The send gap belongs to the comment/reply tabs now, not the shared page.
  assert.match(source, /\['publishMinSeconds', 5, 3600, 'send'/);
  assert.match(source, /side === 'comment' \|\| side === 'send'/);
  assert.match(source, /side === 'reply' \|\| side === 'send'/);
  assert.match(source, /这里只放「全局作息与风控」/);
  // General tab must only render the 'both' bucket.
  assert.match(source, /timingFields\.filter\(\(\[, , , side\]\) => side === 'both'\)/);
});

test('one-sentence-per-line formatter splits Chinese and English correctly', async () => {
  const { enforceOneSentencePerLine } = await import('../index.js');

  assert.equal(
    enforceOneSentencePerLine('周天子观卦。乾为天！寡人曰：先搞钱？'),
    '周天子观卦。\n乾为天！\n寡人曰：先搞钱？',
  );
  // Already-paragraphed input is flattened and rebuilt.
  assert.equal(
    enforceOneSentencePerLine('第一句。\n第二句。\n\n第三句。'),
    '第一句。\n第二句。\n第三句。',
  );
  // A closing quote stays with its own sentence; the rest still breaks.
  assert.equal(
    enforceOneSentencePerLine('掌柜曰：「此事急。」孤问何时发俸。'),
    '掌柜曰：「此事急。」\n孤问何时发俸。',
  );
  // English
  assert.equal(
    enforceOneSentencePerLine('He works hard. She reads books!'),
    'He works hard.\nShe reads books!',
  );
  // Decimals must not be treated as sentence ends.
  assert.equal(enforceOneSentencePerLine('涨了 3.5% 而已。'), '涨了 3.5% 而已。');
  // No punctuation: leave it as a single line.
  assert.equal(enforceOneSentencePerLine('没有标点的一句话'), '没有标点的一句话');
  assert.equal(enforceOneSentencePerLine('   '), '');
});

test('one-sentence rule is on by default and can be turned off', async () => {
  const config = clone(DEFAULT_CONFIG);
  assert.equal(config.postSettings.oneSentencePerLine, true);
  assert.equal(validateConfig(config).postSettings.oneSentencePerLine, true);

  const off = clone(DEFAULT_CONFIG);
  off.postSettings.oneSentencePerLine = false;
  assert.equal(validateConfig(off).postSettings.oneSentencePerLine, false);

  const bad = clone(DEFAULT_CONFIG);
  bad.postSettings.oneSentencePerLine = 'yes';
  assert.throws(() => validateConfig(bad), /一句一行开关无效/);

  const { FIELD_SIDE } = await import('../index.js');
  assert.equal(FIELD_SIDE['postSettings.oneSentencePerLine'], 'post');

  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /格式硬性要求/);
  assert.match(source, /强制「一句一行」/);
});

test('random post interval range validates and beats the fixed value', async () => {
  const config = clone(DEFAULT_CONFIG);
  assert.equal(config.postSettings.intervalMinSeconds, 480);
  assert.equal(config.postSettings.intervalMaxSeconds, 600);
  const zeroed = clone(DEFAULT_CONFIG);
  zeroed.postSettings.intervalMinSeconds = 0;
  zeroed.postSettings.intervalMaxSeconds = 0;
  assert.equal(validateConfig(zeroed).postSettings.intervalMinSeconds, 0);

  const ranged = clone(DEFAULT_CONFIG);
  ranged.postSettings.intervalMinSeconds = 300;
  ranged.postSettings.intervalMaxSeconds = 600;
  const ok = validateConfig(ranged);
  assert.equal(ok.postSettings.intervalMinSeconds, 300);
  assert.equal(ok.postSettings.intervalMaxSeconds, 600);

  const inverted = clone(DEFAULT_CONFIG);
  inverted.postSettings.intervalMinSeconds = 600;
  inverted.postSettings.intervalMaxSeconds = 300;
  assert.throws(() => validateConfig(inverted), /随机间隔上限必须大于或等于下限/);

  const tooLow = clone(DEFAULT_CONFIG);
  tooLow.postSettings.intervalMinSeconds = 10;
  assert.throws(() => validateConfig(tooLow), /随机间隔下限至少 30 秒/);

  const tooBig = clone(DEFAULT_CONFIG);
  tooBig.postSettings.intervalMaxSeconds = 90000;
  assert.throws(() => validateConfig(tooBig), /随机间隔上限/);

  const { FIELD_SIDE } = await import('../index.js');
  assert.equal(FIELD_SIDE['postSettings.intervalMinSeconds'], 'post');
  assert.equal(FIELD_SIDE['postSettings.intervalMaxSeconds'], 'post');

  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /发帖间隔模式/);
  assert.match(source, /⏱ 固定间隔/);
  assert.match(source, /🎲 随机区间/);
});

test('interval mode is exclusive so fixed and random never fight', async () => {
  const config = clone(DEFAULT_CONFIG);
  assert.equal(config.postSettings.intervalMode, 'fixed');

  const random = clone(DEFAULT_CONFIG);
  random.postSettings.intervalMode = 'random';
  random.postSettings.intervalMinSeconds = 300;
  random.postSettings.intervalMaxSeconds = 600;
  assert.equal(validateConfig(random).postSettings.intervalMode, 'random');

  const bad = clone(DEFAULT_CONFIG);
  bad.postSettings.intervalMode = 'sometimes';
  assert.throws(() => validateConfig(bad), /间隔模式只能是固定或随机/);

  // An old config that only had a range is migrated to random mode.
  const legacy = clone(DEFAULT_CONFIG);
  delete legacy.postSettings.intervalMode;
  legacy.postSettings.intervalMinSeconds = 300;
  legacy.postSettings.intervalMaxSeconds = 600;
  assert.equal(validateConfig(legacy).postSettings.intervalMode, 'random');

  const legacyFixed = clone(DEFAULT_CONFIG);
  delete legacyFixed.postSettings.intervalMode;
  legacyFixed.postSettings.intervalMinSeconds = 0;
  legacyFixed.postSettings.intervalMaxSeconds = 0;
  assert.equal(validateConfig(legacyFixed).postSettings.intervalMode, 'fixed');
});

test('post settings signature changes when content-shaping settings change', async () => {
  const { postSettingsSignature } = await import('../index.js');
  const base = clone(DEFAULT_CONFIG).postSettings;
  const sig = postSettingsSignature(base);
  assert.equal(typeof sig, 'string');
  assert.equal(sig.length, 16);
  assert.equal(postSettingsSignature(clone(base)), sig, 'stable for identical settings');

  const themeChanged = clone(base);
  themeChanged.topicMix = [{ id: 'a', label: '撩女人', weight: 100, prompt: '风趣' }];
  assert.notEqual(postSettingsSignature(themeChanged), sig);

  const weightChanged = clone(base);
  weightChanged.topicMix = [{ id: 'a', label: '撩女人', weight: 50, prompt: '风趣' }];
  assert.notEqual(postSettingsSignature(weightChanged), sig);

  const slotChanged = clone(base);
  slotChanged.styleSchedule = [{ id: 's', label: '英文', startHour: 0, endHour: 24, prompt: 'English' }];
  assert.notEqual(postSettingsSignature(slotChanged), sig);

  const influenceChanged = clone(base);
  influenceChanged.learningInfluence = 10;
  assert.notEqual(postSettingsSignature(influenceChanged), sig);

  const formatChanged = clone(base);
  formatChanged.oneSentencePerLine = false;
  assert.notEqual(postSettingsSignature(formatChanged), sig);

  // Cosmetic-only changes must not invalidate every queued draft.
  const cosmetic = clone(base);
  cosmetic.queueBatchSize = 99;
  cosmetic.restEveryPosts = 3;
  cosmetic.intervalMinSeconds = 120;
  assert.equal(postSettingsSignature(cosmetic), sig);
});

test('queued drafts record the signature so stale ones are detectable', async () => {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /intervalMode/);
  const indexSource = readFileSync(new URL('../index.js', import.meta.url), 'utf8');
  assert.match(indexSource, /export function postSettingsSignature/);
  assert.match(indexSource, /sig: postSettingsSignature\(postCfg\)/);
});

test('built-in worker rules are editable and validated', async () => {
  const config = clone(DEFAULT_CONFIG);
  assert.ok(config.replySettings.lengthRule.length > 0);
  assert.ok(config.replySettings.cannedForbidden.length > 0);
  assert.deepEqual(config.replySettings.thinReplyExtra, []);
  assert.deepEqual(config.commentSettings.skipKeywords, []);
  assert.equal(config.commentSettings.minLength, 8);
  assert.equal(config.commentSettings.maxLength, 60);

  const edited = clone(DEFAULT_CONFIG);
  edited.replySettings.lengthRule = '12到40字。';
  edited.replySettings.thinReplyExtra = ['收到', '收到 ', '好的'];
  edited.commentSettings.skipKeywords = ['广告', '广告', '抽奖'];
  const ok = validateConfig(edited);
  assert.equal(ok.replySettings.lengthRule, '12到40字。');
  assert.deepEqual(ok.replySettings.thinReplyExtra, ['收到', '好的'], 'duplicates are removed');
  assert.deepEqual(ok.commentSettings.skipKeywords, ['广告', '抽奖']);

  const badLen = clone(DEFAULT_CONFIG);
  badLen.commentSettings.minLength = 100;
  badLen.commentSettings.maxLength = 20;
  assert.throws(() => validateConfig(badLen), /最短长度不能大于最长长度/);

  const badType = clone(DEFAULT_CONFIG);
  badType.commentSettings.skipKeywords = 'not-an-array';
  assert.throws(() => validateConfig(badType), /跳过关键词/);

  const { FIELD_SIDE } = await import('../index.js');
  assert.equal(FIELD_SIDE['replySettings.lengthRule'], 'reply');
  assert.equal(FIELD_SIDE['commentSettings.skipKeywords'], 'comment');

  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /内置评论规则/);
  assert.match(source, /内置回复规则/);
  assert.match(source, /跳过关键词/);
});

test('persona override, stop keywords and finance keywords are configurable', async () => {
  const config = clone(DEFAULT_CONFIG);
  assert.equal(config.replySettings.personaOverride, '');
  assert.deepEqual(config.replySettings.stopKeywords, []);
  assert.deepEqual(config.commentSettings.extraFinanceKeywords, []);

  const edited = clone(DEFAULT_CONFIG);
  edited.replySettings.personaOverride = '你是周天子姬霸。';
  edited.replySettings.stopKeywords = ['别私信了', ' 别私信了 ', '到此为止吧'];
  edited.commentSettings.extraFinanceKeywords = ['黄金', '黄金', '期货'];
  const ok = validateConfig(edited);
  assert.equal(ok.replySettings.personaOverride, '你是周天子姬霸。');
  assert.deepEqual(ok.replySettings.stopKeywords, ['别私信了', '到此为止吧']);
  assert.deepEqual(ok.commentSettings.extraFinanceKeywords, ['黄金', '期货']);

  const badPersona = clone(DEFAULT_CONFIG);
  badPersona.replySettings.personaOverride = 123;
  assert.throws(() => validateConfig(badPersona), /人设覆盖文本无效/);

  const { FIELD_SIDE } = await import('../index.js');
  assert.equal(FIELD_SIDE['replySettings.personaOverride'], 'reply');
  assert.equal(FIELD_SIDE['replySettings.stopKeywords'], 'reply');
  assert.equal(FIELD_SIDE['commentSettings.extraFinanceKeywords'], 'comment');

  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /人设覆盖/);
  assert.match(source, /追加「对方不想继续」判定词/);
  assert.match(source, /追加「财经类」判定关键词/);
});

test('batch theme plan hits the exact quota and interleaves themes', async () => {
  const { planThemeBatch } = await import('../index.js');
  const mix = [
    { label: '文言文', weight: 30 },
    { label: '撩女人', weight: 50 },
    { label: '谈生活', weight: 20 },
  ];

  const plan10 = planThemeBatch(mix, 10);
  assert.equal(plan10.length, 10);
  const counts = plan10.reduce((acc, item) => { acc[item.label] = (acc[item.label] || 0) + 1; return acc; }, {});
  assert.deepEqual(counts, { 文言文: 3, 撩女人: 5, 谈生活: 2 });

  // No two neighbours may share a theme while a schedule exists.
  for (let i = 1; i < plan10.length; i += 1) {
    assert.notEqual(plan10[i].label, plan10[i - 1].label,
      `themes clustered at ${i}: ${plan10.map(t => t.label).join(',')}`);
  }

  // The order must vary between batches, not follow a fixed pattern.
  const orders = new Set();
  for (let i = 0; i < 20; i += 1) {
    orders.add(planThemeBatch(mix, 10).map(t => t.label).join(','));
  }
  assert.ok(orders.size > 1, 'the plan should be randomised between batches');

  // Odd batch sizes still sum to the requested count and keep ratios close.
  for (const size of [1, 3, 7, 13]) {
    const plan = planThemeBatch(mix, size);
    assert.equal(plan.length, size, `size ${size}`);
  }

  const single = planThemeBatch([{ label: '唯一', weight: 100 }], 5);
  assert.deepEqual(single.map(t => t.label), ['唯一', '唯一', '唯一', '唯一', '唯一']);
  assert.deepEqual(planThemeBatch([], 5), []);
  assert.deepEqual(planThemeBatch(mix, 0), []);
});

test('trend sources are configurable and topics are extracted from boards', async () => {
  const { extractTrendTopics, DEFAULT_CONFIG: defaults } = await import('../index.js');
  const sources = defaults.learningSettings.trendSources;
  assert.ok(sources.length >= 2);
  assert.ok(sources.some(item => item.id === 'baidu' && item.enabled));
  assert.ok(sources.some(item => item.id === 'toutiao' && item.enabled));

  const config = clone(DEFAULT_CONFIG);
  config.learningSettings.trendSources = [
    { id: 'a', label: '百度热搜', url: 'https://example.com/hot', enabled: true },
    { id: 'b', label: '自定义榜', url: 'http://example.org/list', enabled: false },
  ];
  const ok = validateConfig(config);
  assert.equal(ok.learningSettings.trendSources.length, 2);

  const badUrl = clone(DEFAULT_CONFIG);
  badUrl.learningSettings.trendSources = [{ id: 'x', label: 'X', url: 'javascript:alert(1)', enabled: true }];
  assert.throws(() => validateConfig(badUrl), /热榜来源地址/);

  // Extraction works for both JSON payloads and plain HTML.
  assert.deepEqual(
    extractTrendTopics('{"data":[{"query":"第一个热词"},{"Title":"Second trending headline"}]}').sort(),
    ['Second trending headline', '第一个热词'].sort(),
  );
  assert.deepEqual(extractTrendTopics('<html><title>页面标题足够长</title></html>'), ['页面标题足够长']);
  assert.deepEqual(extractTrendTopics('short'), []);

  // Per-batch hot quota is bounded.
  const hot = clone(DEFAULT_CONFIG);
  hot.postSettings.hotTopicPerBatch = 3;
  assert.equal(validateConfig(hot).postSettings.hotTopicPerBatch, 3);
  const badHot = clone(DEFAULT_CONFIG);
  badHot.postSettings.hotTopicPerBatch = 21;
  assert.throws(() => validateConfig(badHot), /每批热榜条数/);

  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /热榜话题源/);
  assert.match(source, /立即抓取热榜/);
});

test('trend cookies are stored, masked in responses and preserved on save', async () => {
  const f = fixture();
  try {
    const configPath = join(f.dir, 'config.json');
    const service = createService({
      paths: f.paths,
      configPath,
      backupDir: join(f.dir, 'history'),
      queuePath: join(f.dir, 'q.json'),
      learningsPath: join(f.dir, 'l.json'),
      platform: 'darwin',
    });
    const initial = await service.action({ action: 'state' });
    const config = clone(initial.config);
    config.learningSettings = {
      ...config.learningSettings,
      trendSources: [
        { id: 'weibo', label: '微博热搜', url: 'https://weibo.com/ajax/side/hotSearch', enabled: true, cookie: 'SUB=secret-token; SUBP=more' },
        { id: 'baidu', label: '百度热搜', url: 'https://top.baidu.com/board', enabled: true, cookie: '' },
      ],
    };
    await service.action({ action: 'save-config', config, expectedConfigHash: initial.configHash });

    // The API must never hand the raw cookie back.
    const after = await service.action({ action: 'state' });
    const weibo = after.config.learningSettings.trendSources.find(item => item.id === 'weibo');
    assert.equal(weibo.cookie, '__COOKIE_SET__');
    assert.ok(!JSON.stringify(after).includes('secret-token'), 'raw cookie leaked through state');
    const baidu = after.config.learningSettings.trendSources.find(item => item.id === 'baidu');
    assert.equal(baidu.cookie, '');

    // Saving the masked config again must keep the stored cookie.
    await service.action({ action: 'save-config', config: after.config, expectedConfigHash: after.configHash });
    const stored = JSON.parse(readFileSync(configPath, 'utf8'));
    const storedWeibo = stored.learningSettings.trendSources.find(item => item.id === 'weibo');
    assert.equal(storedWeibo.cookie, 'SUB=secret-token; SUBP=more');

    // Clearing the box explicitly removes it.
    const cleared = clone(after.config);
    cleared.learningSettings.trendSources = cleared.learningSettings.trendSources.map(item => (
      item.id === 'weibo' ? { ...item, cookie: '' } : item
    ));
    const current = await service.action({ action: 'state' });
    await service.action({ action: 'save-config', config: cleared, expectedConfigHash: current.configHash });
    const storedAfterClear = JSON.parse(readFileSync(configPath, 'utf8'));
    assert.equal(storedAfterClear.learningSettings.trendSources.find(item => item.id === 'weibo').cookie, '');

    const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
    assert.match(source, /榜单 Cookie/);
    assert.match(source, /已配置/);
  } finally { f.cleanup(); }
});

test('cookies pasted as a DevTools table are converted to a request header', async () => {
  const { normalizeCookie, originReferer } = await import('../index.js');

  // Header format passes through cleaned up.
  assert.equal(normalizeCookie('a=1; b=2'), 'a=1; b=2');
  assert.equal(normalizeCookie('Cookie: a=1;  b=2'), 'a=1; b=2');
  assert.equal(normalizeCookie(''), '');

  // DevTools table: Name, Value, Domain, Path, … with the Priority column
  // running into the next row's name.
  const table = [
    'd_c0', 'abc|123', '.zhihu.com', '/', '2027-01-26T01:46:30.779Z', '51', '', '', '', '', 'Medium delPer', '0', '.zhihu.com', '/',
    'stale', '', '', '', '', 'Medium z_c0', 'secret==', '.zhihu.com', '/', '2027-01-26T01:46:30.779Z',
  ].join('\t');
  const parsed = normalizeCookie(table);
  assert.match(parsed, /d_c0=abc\|123/);
  assert.match(parsed, /delPer=0/);
  assert.match(parsed, /z_c0=secret==/);
  assert.ok(!parsed.includes('Medium'), 'priority column leaked into the header');

  // A row whose name is a Priority word must not become a cookie.
  assert.ok(!/;\s*Medium=/.test(normalizeCookie(table)));

  // Referer is derived from the endpoint origin so boards accept the request.
  assert.deepEqual(originReferer('https://weibo.com/ajax/side/hotSearch'), { referer: 'https://weibo.com/', origin: 'https://weibo.com' });
  assert.deepEqual(originReferer('not a url'), {});
});

test('trending topics are screened by rule before reuse', async () => {
  const { screenHotTopics, DEFAULT_CONFIG: defaults } = await import('../index.js');
  const filter = defaults.postSettings.hotFilter;
  assert.ok(filter.excludeKeywords.includes('死'));
  assert.ok(filter.excludeKeywords.includes('被查'));

  const topics = [
    '蔡天凤遭碎尸案死因查明',   // sensitive
    '余艳红被查',               // politics
    '手机越来越卷 凭什么阔直板火了', // fine
    '明日立冬',                 // fine (4 chars)
    '美国男子遭警察连开至少12枪击毙', // sensitive
    '这是一个明显超过五十个字长度限制而且没有任何意义的特别长的话题标题用来测试长度过滤规则是否真的会生效并且不会误判正常话题',
  ];
  const { usable, dropped } = screenHotTopics(topics, filter);
  assert.ok(usable.includes('手机越来越卷 凭什么阔直板火了'));
  assert.ok(usable.includes('明日立冬'));
  assert.ok(!usable.some(topic => topic.includes('碎尸')));
  assert.ok(!usable.some(topic => topic.includes('被查')));
  assert.ok(!usable.some(topic => topic.includes('枪击')));
  assert.ok(dropped.some(item => item.reason.includes('死')));
  assert.ok(dropped.some(item => item.reason === '太长'));

  // Preference keywords float matching topics to the front.
  const ranked = screenHotTopics(['随便一个话题', '聊聊感情里的边界感'], { ...filter, preferKeywords: ['感情'] });
  assert.equal(ranked.usable[0], '聊聊感情里的边界感');

  // Over-strict rules must not silently produce nonsense.
  const strict = screenHotTopics(topics, { ...filter, minLength: 30, maxLength: 31 });
  assert.equal(strict.usable.length, 0);

  const config = clone(DEFAULT_CONFIG);
  config.postSettings.hotFilter.minLength = 200;
  config.postSettings.hotFilter.maxLength = 10;
  assert.throws(() => validateConfig(config), /最短长度不能大于最长长度/);

  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /热榜挑选规则/);
  assert.match(source, /会被采用的/);
  assert.match(source, /被剔除的/);
});

test('operator banned topics merge with learned ones and survive learning', async () => {
  const { mergeBannedTopics } = await import('../index.js');
  const learnings = { bannedTopics: ['感情', '职场'] };
  const postCfg = { manualBannedTopics: ['政治', '感情', ' 政治 '] };
  const merged = mergeBannedTopics(learnings, postCfg);
  assert.deepEqual(merged, ['政治', '感情', '职场'], 'manual first, de-duplicated, learned kept');

  assert.deepEqual(mergeBannedTopics({}, {}), []);
  assert.deepEqual(mergeBannedTopics(null, null), []);

  const config = clone(DEFAULT_CONFIG);
  assert.deepEqual(config.postSettings.manualBannedTopics, []);
  config.postSettings.manualBannedTopics = ['政治', '政治', '明星八卦'];
  const ok = validateConfig(config);
  assert.deepEqual(ok.postSettings.manualBannedTopics, ['政治', '明星八卦']);

  const tooMany = clone(DEFAULT_CONFIG);
  tooMany.postSettings.manualBannedTopics = Array.from({ length: 201 }, (_, i) => 'topic' + i);
  assert.throws(() => validateConfig(tooMany), /手动避写话题最多/);

  const tooLong = clone(DEFAULT_CONFIG);
  tooLong.postSettings.manualBannedTopics = ['长'.repeat(81)];
  assert.throws(() => validateConfig(tooLong), /不能超过 80 字/);

  const { FIELD_SIDE } = await import('../index.js');
  assert.equal(FIELD_SIDE['postSettings.manualBannedTopics'], 'post');

  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /输入要避开的话题/);
  assert.match(source, /手动 · /);
  assert.match(source, /学习 · /);

  // A fresh learning run must not drop the operator's own entries.
  const worker = readFileSync('/Users/zhouxiaoming/Documents/Codex/tmp-84e0365a44937636/scripts/post_worker.py', 'utf8');
  assert.match(worker, /def merged_banned_topics/);
  assert.match(worker, /manualBannedTopics/);
});

test('maintenance panel offers bulk restarts and manual cache cleanup', async () => {
  const { diskFreeBytes, readCacheCleanupState } = await import('../index.js');
  const free = diskFreeBytes();
  assert.ok(free === null || (Number.isFinite(free) && free >= 0), 'disk free must be a number or null');
  const state = readCacheCleanupState();
  assert.ok(state === null || typeof state === 'object');

  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /运维操作/);
  assert.match(source, /重启全部工作进程/);
  assert.match(source, /重启全部看门狗/);
  assert.match(source, /全量重启/);
  assert.match(source, /立即清理缓存/);

  const host = readFileSync(new URL('../index.js', import.meta.url), 'utf8');
  assert.match(host, /request\.action === 'clean-cache'/);
  assert.match(host, /request\.action === 'restart-watchdog'/);
  assert.match(host, /cache_cleanup\.py/);
  assert.match(host, /maintenance: \{ diskFreeBytes/);
});

test('writer rules enforce three lines, closing question and banned words', async () => {
  const { checkPostDraft, DEFAULT_CONFIG: defaults } = await import('../index.js');
  const fmt = defaults.postSettings.format;
  assert.equal(fmt.lineCount, 3);
  assert.equal(fmt.minChars, 30);
  assert.equal(fmt.maxChars, 60);

  const good = '余昨夜赴宴，卿举杯便解罗带。\n满座皆惊，余却只顾看她嘴角那点酒。\n尔若同席，先劝酒还是先劝归？';
  const pass = checkPostDraft(good, fmt, []);
  assert.equal(pass.ok, true);
  assert.equal(pass.lineCount, 3);

  const twoLines = '余昨夜赴宴，卿举杯便解罗带，满座皆惊，余只顾看她嘴角那点酒，实在难当。\n尔若同席，先劝酒还是先劝归？';
  assert.ok(checkPostDraft(twoLines, fmt, []).reasons.some(r => r.includes('行数')));

  const noQuestion = '余昨夜赴宴，卿举杯便解罗带，满座皆惊。\n余只顾看她嘴角那点酒，实在难当得很。\n尔若同席，先劝酒还是先劝归';
  assert.ok(checkPostDraft(noQuestion, fmt, []).reasons.some(r => r.includes('问号')));

  const wrongPrefix = '余昨夜赴宴，卿举杯便解罗带，满座皆惊。\n余只顾看她嘴角那点酒，实在难当得很。\n你若同席，先劝酒还是先劝归？';
  const prefixVerdict = checkPostDraft(wrongPrefix, fmt, []);
  assert.ok(prefixVerdict.reasons.some(r => r.includes('尔')));

  const softOpener = '昨夜月色很好，卿举杯便解罗带，满座皆惊。\n余只顾看她嘴角那点酒，实在难当得很。\n尔若同席，先劝酒还是先劝归？';
  assert.ok(checkPostDraft(softOpener, fmt, []).reasons.some(r => r.includes('软铺垫')));

  const colloquial = '余昨夜赴宴，卿举杯便解罗带，大家都觉得不错。\n余只顾看她嘴角那点酒，实在难当得很。\n尔若同席，先劝酒还是先劝归？';
  assert.ok(checkPostDraft(colloquial, fmt, []).reasons.some(r => r.includes('白话虚词')));

  const retired = '君不见余昨夜赴宴，卿举杯便解罗带，满座皆惊。\n余只顾看她嘴角那点酒，实在难当得很。\n尔若同席，先劝酒还是先劝归？';
  assert.ok(checkPostDraft(retired, fmt, []).reasons.some(r => r.includes('作废句式')));

  // Long verbatim overlap with an already published post is rejected.
  // maxOverlapChars lives in dedupe and is merged into the format at generation.
  const dup = checkPostDraft(good, { ...fmt, maxOverlapChars: defaults.postSettings.dedupe.maxOverlapChars }, [good]);
  assert.ok(dup.reasons.some(r => r.includes('重复')));
});

test('writer rule settings are editable and validated', async () => {
  const config = clone(DEFAULT_CONFIG);
  config.postSettings.format.lineCount = 6;
  config.postSettings.format.maxChars = 120;
  const ok = validateConfig(config);
  assert.equal(ok.postSettings.format.lineCount, 6);
  assert.equal(ok.postSettings.format.maxChars, 120);

  const badLines = clone(DEFAULT_CONFIG);
  badLines.postSettings.format.lineCount = 20;
  assert.throws(() => validateConfig(badLines), /行数不能超过/);

  const badChars = clone(DEFAULT_CONFIG);
  badChars.postSettings.format.minChars = 100;
  badChars.postSettings.format.maxChars = 20;
  assert.throws(() => validateConfig(badChars), /字数下限不能大于上限/);

  assert.equal(DEFAULT_CONFIG.postSettings.dedupe.maxOverlapChars, 8);
  assert.equal(DEFAULT_CONFIG.postSettings.dedupe.skeletonCooldownHours, 48);
  assert.equal(DEFAULT_CONFIG.postSettings.politicalCap.dailyMax, 3);
  assert.equal(DEFAULT_CONFIG.postSettings.politicalCap.perEventMax, 1);
  assert.equal(DEFAULT_CONFIG.postSettings.hotTopicShareMinPercent, 33);

  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /写作规则（三行结构/);
  assert.match(source, /末行引导字/);
  assert.match(source, /套用文档配比/);
});

test('style prompt fragments are editable and drive the structure block', async () => {
  const { buildStructureBlock, DEFAULT_CONFIG: defaults } = await import('../index.js');
  const fmt = defaults.postSettings.format;
  const style = defaults.postSettings.style;

  assert.ok(style.persona.includes('余'));
  assert.ok(style.line3Rule.includes('{prefix}'));
  assert.equal(typeof style.hotRewriteRule, 'string');

  const block = buildStructureBlock(fmt, style);
  assert.ok(block.includes('共 3 行'));
  assert.ok(block.includes('30-60'));
  assert.ok(block.includes('以「尔」开头'), 'placeholder must be substituted');
  assert.ok(!block.includes('{prefix}'), 'no raw placeholder should survive');

  // Editing a fragment changes the prompt without touching code.
  const edited = buildStructureBlock(fmt, { ...style, line1Rule: '第 1 行：直接开骂。', languageRule: '' });
  assert.ok(edited.includes('第 1 行：直接开骂。'));
  assert.ok(!edited.includes('软铺垫'), 'replaced fragment must not leak the old text');
  assert.ok(!edited.includes('不写骈赋'), 'blank fragment must drop out');

  // Placeholders follow the configured shape.
  const custom = buildStructureBlock({ ...fmt, lineCount: 5, minChars: 10, maxChars: 20, closingPrefix: '君' }, style);
  assert.ok(custom.includes('共 5 行'));
  assert.ok(custom.includes('汉字 10-20 个'));
  assert.ok(custom.includes('以「君」开头'));

  const config = clone(DEFAULT_CONFIG);
  config.postSettings.style.persona = '自定义人设';
  assert.equal(validateConfig(config).postSettings.style.persona, '自定义人设');

  const bad = clone(DEFAULT_CONFIG);
  bad.postSettings.style.persona = 123;
  assert.throws(() => validateConfig(bad), /文风片段/);

  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /文风片段/);
  assert.match(source, /人设与立场/);
  assert.match(source, /热点改写要求/);

  // The worker reads the same fragments.
  const worker = readFileSync('/Users/zhouxiaoming/Documents/Codex/tmp-84e0365a44937636/scripts/post_worker.py', 'utf8');
  assert.match(worker, /def style_settings/);
  assert.match(worker, /DEFAULT_STYLE = \{/);
});

test('line count can be automatic instead of a fixed number', async () => {
  const { buildStructureBlock, checkPostDraft, enforceOneSentencePerLine, DEFAULT_CONFIG: defaults } = await import('../index.js');
  const fmt = defaults.postSettings.format;
  const style = defaults.postSettings.style;

  // Fixed mode states the exact line count.
  const fixed = buildStructureBlock({ ...fmt, lineCount: 3 }, style);
  assert.ok(fixed.includes('共 3 行，不多不少'));
  assert.ok(fixed.includes('第 1 行'));

  // Auto mode drops the fixed count and keeps the shape via autoLineRule.
  const auto = buildStructureBlock({ ...fmt, lineCount: 0 }, style);
  assert.ok(!auto.includes('共 3 行'), 'auto mode must not demand an exact count');
  assert.ok(auto.includes('行数按内容自然安排'));
  assert.ok(auto.includes('以「尔」开头'), 'closing question still required');
  assert.ok(auto.includes('现成的第 1 行') === false);

  // Auto mode accepts any line count >= 2 but still rejects one solid block.
  const threeLines = '余昨夜赴宴，卿举杯便解罗带，满座皆惊。\n余只顾看她嘴角那点酒，实在难当得很。\n尔若同席，先劝酒还是先劝归？';
  assert.equal(checkPostDraft(threeLines, { ...fmt, lineCount: 0 }, []).ok, true);
  const sixLines = enforceOneSentencePerLine('第一句长一点好通过字数。第二句也要够长才行。第三句继续凑字数。第四句继续凑。第五句继续凑。尔若同席，先劝酒还是先劝归？');
  assert.ok(sixLines.split('\n').length >= 2);
  assert.equal(checkPostDraft(sixLines, { ...fmt, lineCount: 0 }, []).ok, true);

  // A single paragraph is still rejected in auto mode.
  const oneBlock = '余昨夜赴宴卿举杯便解罗带满座皆惊余只顾看她嘴角那点酒实在难当尔若同席先劝酒还是先劝归？';
  const blocked = checkPostDraft(oneBlock, { ...fmt, lineCount: 0 }, []);
  assert.equal(blocked.ok, false);
  assert.ok(blocked.reasons.some(r => r.includes('至少')));

  // 0 must be a valid stored value.
  const config = clone(DEFAULT_CONFIG);
  config.postSettings.format.lineCount = 0;
  assert.equal(validateConfig(config).postSettings.format.lineCount, 0);

  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /自动（按内容自然分行）/);
});

test('save rebases onto disk so untouched prompts are never wiped', async () => {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');

  // The diff engine and the rebase call must both be present.
  assert.match(source, /function diffConfigPaths\(/);
  assert.match(source, /function composeSaveConfig\(/);
  assert.match(source, /composeSaveConfig\(current, serverSnapshot\.current, freshConfig\)/);
  assert.match(source, /serverSnapshot\.current = data\.config;/);

  // Evaluate the real helpers out of the shipped bundle and check the merge.
  const grab = name => {
    const start = source.indexOf(`function ${name}(`);
    assert.ok(start > -1, `${name} is missing`);
    let depth = 0;
    let i = source.indexOf('{', start);
    const open = i;
    for (; i < source.length; i += 1) {
      if (source[i] === '{') depth += 1;
      else if (source[i] === '}') {
        depth -= 1;
        if (depth === 0) { i += 1; break; }
      }
    }
    return source.slice(source.indexOf(`function ${name}(`), i);
  };
  const isPlainObjectSrc = source.match(/const isPlainObject = value => [^;]+;/)[0];
  const body = `
    ${isPlainObjectSrc}
    ${grab('diffConfigPaths')}
    ${grab('readConfigPath')}
    ${grab('writeConfigPath')}
    ${grab('composeSaveConfig')}
    return { diffConfigPaths, composeSaveConfig };
  `;
  const { composeSaveConfig, diffConfigPaths } = new Function(body)();

  const baseline = {
    commentSettings: { model: 'gpt-6-luna', customPrompt: '旧评论提示词' },
    replySettings: { model: 'gpt-6-luna', customPrompt: '旧回复提示词' },
    postSettings: { topics: ['A'], queueBatchSize: 10 },
  };
  // The in-page snapshot has the prompts blanked and only topics edited.
  const current = {
    commentSettings: { model: 'gpt-6-luna', customPrompt: '' },
    replySettings: { model: 'gpt-6-luna', customPrompt: '' },
    postSettings: { topics: ['A', 'B'], queueBatchSize: 10 },
  };
  // Disk changed meanwhile (someone saved a new prompt).
  const fresh = {
    commentSettings: { model: 'gpt-6-luna', customPrompt: '磁盘上的评论提示词' },
    replySettings: { model: 'gpt-6-luna', customPrompt: '磁盘上的回复提示词' },
    postSettings: { topics: ['A'], queueBatchSize: 20 },
  };

  const changed = diffConfigPaths(baseline, current).map(path => path.join('.')).sort();
  assert.deepEqual(changed, ['commentSettings.customPrompt', 'postSettings.topics', 'replySettings.customPrompt']);

  const merged = composeSaveConfig(current, baseline, fresh);
  // Only what the operator actually changed is carried over.
  assert.deepEqual(merged.postSettings.topics, ['A', 'B']);
  // Untouched settings keep the newer disk value.
  assert.equal(merged.postSettings.queueBatchSize, 20);
  // Explicitly clearing a field is a real edit and must be honoured.
  assert.equal(merged.commentSettings.customPrompt, '');
  assert.equal(merged.replySettings.customPrompt, '');

  // The genuinely dangerous case: the page loaded a blank value and the user
  // never touched it, so "unchanged" must mean "keep whatever disk now holds"
  // instead of wiping the prompt that was saved in another session.
  const staleBaseline = { commentSettings: { customPrompt: '' }, replySettings: { customPrompt: '' } };
  const staleCurrent = { commentSettings: { customPrompt: '' }, replySettings: { customPrompt: '' } };
  const diskWithPrompt = {
    commentSettings: { customPrompt: '磁盘上后来保存的评论提示词' },
    replySettings: { customPrompt: '磁盘上后来保存的回复提示词' },
  };
  const kept = composeSaveConfig(staleCurrent, staleBaseline, diskWithPrompt);
  assert.equal(kept.commentSettings.customPrompt, '磁盘上后来保存的评论提示词');
  assert.equal(kept.replySettings.customPrompt, '磁盘上后来保存的回复提示词');
});

test('an edited prompt still wins over disk after the rebase', async () => {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  const isPlainObjectSrc = source.match(/const isPlainObject = value => [^;]+;/)[0];
  const grab = name => {
    const start = source.indexOf(`function ${name}(`);
    let depth = 0;
    let i = source.indexOf('{', start);
    for (; i < source.length; i += 1) {
      if (source[i] === '{') depth += 1;
      else if (source[i] === '}') { depth -= 1; if (depth === 0) { i += 1; break; } }
    }
    return source.slice(start, i);
  };
  const { composeSaveConfig } = new Function(`
    ${isPlainObjectSrc}
    ${grab('diffConfigPaths')}
    ${grab('readConfigPath')}
    ${grab('writeConfigPath')}
    ${grab('composeSaveConfig')}
    return { composeSaveConfig };
  `)();

  const baseline = { commentSettings: { customPrompt: '旧' } };
  const current = { commentSettings: { customPrompt: '我新写的提示词' } };
  const fresh = { commentSettings: { customPrompt: '磁盘上的' } };
  const merged = composeSaveConfig(current, baseline, fresh);
  assert.equal(merged.commentSettings.customPrompt, '我新写的提示词');
});

test('reply anti-miss settings validate and stay worker-owned', async () => {
  const config = clone(DEFAULT_CONFIG);
  config.timing.replyMinSeconds = 12;
  config.timing.replyMaxSeconds = 30;
  config.timing.mentionWindowHours = 36;
  config.rules.mentionPauseDuringQuiet = false;
  config.rules.mentionPauseDuringFullStop = false;
  const ok = validateConfig(config);
  assert.equal(ok.timing.replyMinSeconds, 12);
  assert.equal(ok.timing.replyMaxSeconds, 30);
  assert.equal(ok.timing.mentionWindowHours, 36);
  assert.equal(ok.rules.mentionPauseDuringQuiet, false);

  // 0 means "inherit the shared publish gap".
  const inherit = clone(DEFAULT_CONFIG);
  assert.equal(inherit.timing.replyMinSeconds, 0);
  assert.equal(validateConfig(inherit).timing.replyMinSeconds, 0);

  const inverted = clone(DEFAULT_CONFIG);
  inverted.timing.replyMinSeconds = 60;
  inverted.timing.replyMaxSeconds = 20;
  assert.throws(() => validateConfig(inverted), /回复最长间隔/);

  const tooWide = clone(DEFAULT_CONFIG);
  tooWide.timing.mentionWindowHours = 96;
  assert.throws(() => validateConfig(tooWide), /mentionWindowHours/);

  const { FIELD_SIDE } = await import('../index.js');
  assert.equal(FIELD_SIDE['timing.replyMinSeconds'], 'reply');
  assert.equal(FIELD_SIDE['rules.mentionPauseDuringQuiet'], 'reply');
  assert.equal(FIELD_SIDE['rules.mentionPauseDuringFullStop'], 'reply');
});

test('reply diagnostics decode backlog age with BigInt snowflakes', async () => {
  const { readReplyDiagnostics } = await import('../index.js');
  const f = fixture();
  try {
    const nowS = Math.floor(Date.now() / 1000);
    const makeId = hoursAgo => String((BigInt(Math.floor((nowS - hoursAgo * 3600) * 1000)) - 1288834974657n) << 22n);
    writeFileSync(join(f.dir, 'mention_backlog.json'), JSON.stringify({
      items: [{ id: makeId(2) }, { id: makeId(5) }],
      seen: [],
    }));
    writeFileSync(join(f.dir, 'skip_cache.json'), JSON.stringify({
      'a:1': { reason: 'too_many_rounds' },
      'a:2': { reason: 'too_many_rounds' },
      'a:3': { reason: 'already_replied' },
    }));
    const diag = readReplyDiagnostics(f.dir);
    assert.equal(diag.backlog, 2);
    assert.ok(diag.oldestHours >= 4.5 && diag.oldestHours <= 6, `unexpected age ${diag.oldestHours}`);
    assert.equal(diag.skipTotal, 3);
    assert.deepEqual(diag.skipReasons[0], { reason: 'too_many_rounds', count: 2 });
  } finally { f.cleanup(); }
});

test('learning prompt block carries topics but never overrides the writing style', async () => {
  const { buildLearningPromptBlock, DEFAULT_CONFIG: defaults } = await import('../index.js');
  assert.equal(buildLearningPromptBlock({ styleGuide: '', winningTopics: [], bannedTopics: [], patterns: [] }), '');

  const block = buildLearningPromptBlock({
    styleGuide: '反差开局再落地',
    winningTopics: ['打工账本'],
    bannedTopics: ['股市理财'],
    patterns: [{ title: '反差', structure: '反问—举例—自嘲', hooks: ['谁还没破防过'] }],
  });
  assert.match(block, /反差开局再落地/);
  assert.match(block, /打工账本/);
  assert.match(block, /股市理财/);
  assert.match(block, /谁还没破防过/);
  // The style remains the caller's; the block only says to borrow structure.
  assert.match(block, /行文风格仍必须严格遵循/);
  assert.doesNotMatch(block, /请改用|改为白话|英文/);
  assert.ok(/文言/.test(defaults.postSettings.customPrompt));
});

test('learnings store normalizes, removes and clears entries', async () => {
  const f = fixture();
  try {
    const learningsPath = join(f.dir, 'learnings.json');
    const service = createService({
      paths: f.paths,
      configPath: join(f.dir, 'config.json'),
      learningsPath,
      platform: 'darwin',
    });

    const initial = await service.action({ action: 'state' });
    assert.deepEqual(initial.learnings.patterns, []);
    assert.deepEqual(initial.learnings.bannedTopics, []);

    // Seed through the public actions that do not need a model call.
    await service.action({ action: 'promote-topic', topic: '股市理财', target: 'banned' });
    await service.action({ action: 'promote-topic', topic: '打工账本', target: 'winning' });
    await service.action({ action: 'save-style-guide', styleGuide: '反差开局' });

    const after = await service.action({ action: 'state' });
    assert.deepEqual(after.learnings.bannedTopics, ['股市理财']);
    assert.deepEqual(after.learnings.winningTopics, ['打工账本']);
    assert.equal(after.learnings.styleGuide, '反差开局');

    // Promoting a topic to the other side removes it from the first list.
    await service.action({ action: 'promote-topic', topic: '打工账本', target: 'banned' });
    const flipped = await service.action({ action: 'state' });
    assert.ok(flipped.learnings.bannedTopics.includes('打工账本'));
    assert.ok(!flipped.learnings.winningTopics.includes('打工账本'));

    await service.action({ action: 'remove-learning', kind: 'banned', id: '打工账本' });
    const removed = await service.action({ action: 'state' });
    assert.ok(!removed.learnings.bannedTopics.includes('打工账本'));

    const cleared = await service.action({ action: 'clear-learnings' });
    assert.equal(cleared.learnings.styleGuide, '');
    assert.deepEqual(cleared.learnings.patterns, []);
    assert.deepEqual(cleared.learnings.bannedTopics, []);
  } finally { f.cleanup(); }
});

test('learn-manual rejects empty input before calling the model', async () => {
  const f = fixture();
  try {
    const service = createService({
      paths: f.paths,
      configPath: join(f.dir, 'config.json'),
      learningsPath: join(f.dir, 'learnings.json'),
      platform: 'darwin',
    });
    await assert.rejects(service.action({ action: 'learn-manual', text: '   ' }), /请先粘贴/);
    await assert.rejects(service.action({ action: 'remove-learning', kind: 'nope', id: 'x' }), /未知的学习记录类型/);
  } finally { f.cleanup(); }
});

test('extractJsonObject tolerates fenced and chatty model replies', async () => {
  const { extractJsonObject } = await import('../index.js');
  assert.deepEqual(extractJsonObject('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJsonObject('好的，分析如下：{"styleGuide":"x","patterns":[]} 以上。'), { styleGuide: 'x', patterns: [] });
  assert.equal(extractJsonObject('没有任何 JSON'), null);
  assert.equal(extractJsonObject(''), null);
});

test('learning tab is present in the client bundle', async () => {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /发帖学习/);
  assert.match(source, /① 我的历史发帖表现/);
  assert.match(source, /② X 榜单高曝光帖拆解/);
  assert.match(source, /③ 手动粘贴高曝光帖拆解/);
  assert.match(source, /避写话题/);
  assert.match(source, /立即学习一次/);
});

test('special person rows are operator-managed: migrate, validate, add, delete', () => {
  // Legacy configs only carried apex/yijing objects; they migrate into rows.
  const legacy = structuredClone(DEFAULT_CONFIG);
  delete legacy.specialPersons.list;
  const migrated = validateConfig(legacy).specialPersons.list;
  assert.deepEqual(migrated.map(row => row.id), ['apex', 'yijing']);
  assert.equal(migrated[0].handle, '4ggug');
  assert.equal(migrated[1].handle, 'mrchen1998');
  assert.equal(migrated[0].replyStyle, '聊两性，撩骚');

  // A fully custom row is accepted, normalised and trimmed.
  const custom = structuredClone(DEFAULT_CONFIG);
  custom.specialPersons.list = [
    ...custom.specialPersons.list,
    { id: 'sp_1', label: '新朋友', handle: '@New_Friend', enabled: true, replyStyle: '聊茶与旧书' },
  ];
  const kept = validateConfig(custom).specialPersons.list;
  assert.equal(kept.length, 3);
  assert.equal(kept[2].handle, 'new_friend');
  assert.equal(kept[2].label, '新朋友');

  // Deleting a row is allowed and stays deleted.
  const removed = structuredClone(DEFAULT_CONFIG);
  removed.specialPersons.list = removed.specialPersons.list.filter(row => row.id !== 'yijing');
  removed.specialPersons.yijing = { ...removed.specialPersons.yijing, replyStyle: '' };
  assert.deepEqual(validateConfig(removed).specialPersons.list.map(row => row.id), ['apex']);

  // Junk rows are rejected with actionable messages.
  const duplicate = structuredClone(DEFAULT_CONFIG);
  duplicate.specialPersons.list = [
    { id: 'a', label: 'A', handle: 'same', enabled: true, replyStyle: '' },
    { id: 'b', label: 'B', handle: 'SAME', enabled: true, replyStyle: '' },
  ];
  assert.throws(() => validateConfig(duplicate), /重复/);
  const badHandle = structuredClone(DEFAULT_CONFIG);
  badHandle.specialPersons.list = [{ id: 'a', label: 'A', handle: 'bad handle!', enabled: true, replyStyle: '' }];
  assert.throws(() => validateConfig(badHandle), /1~15 位字母/);
  const tooMany = structuredClone(DEFAULT_CONFIG);
  tooMany.specialPersons.list = Array.from({ length: 51 }, (_, i) => ({ id: `s${i}`, label: `S${i}`, handle: `h${i}`, enabled: true, replyStyle: '' }));
  assert.throws(() => validateConfig(tooMany), /最多 50 个/);
  const tooLongRow = structuredClone(DEFAULT_CONFIG);
  tooLongRow.specialPersons.list = [{ id: 'a', label: 'A', handle: 'abc', enabled: true, replyStyle: 'x'.repeat(4001) }];
  assert.throws(() => validateConfig(tooLongRow), /4000 字/);
});

test('reply tab ships the special-person editor with add and delete controls', async () => {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /normalizeSpecialRows/);
  assert.match(source, /updateSpecialRow/);
  assert.match(source, /removeSpecialRow/);
  assert.match(source, /moveSpecialRow/);
  assert.match(source, /添加特例人物/);
  assert.match(source, /🗑 删除/);
  assert.match(source, /专属回复规则 \/ 附加提示词/);
  // Legacy objects stay in sync so tier logic in the workers still resolves.
  assert.match(source, /legacyPeople/);
});

test('post skeleton fingerprint is stable and drives the 48h cooldown', async () => {
  const { postSkeleton, checkPostDraft } = await import('../index.js');
  const a = '昔周礼纳征，不过束帛数端；\n今人相亲，茶未凉，彩礼单已摊。\n君以为，今人择偶，求情乎，求账乎？';
  // Same line lengths and same first/last characters => same skeleton.
  const b = '昔聘礼简约，不过丝帛几卷；\n今人相看，话未暖，房产本已陈。\n君以为，今人成家，重义乎，重财乎？';
  assert.equal(postSkeleton(a), postSkeleton(b));
  assert.notEqual(postSkeleton(a), postSkeleton(a.replace(/\n/g, '')));
  assert.equal(postSkeleton(''), '');

  const format = { lineCount: 3, minChars: 10, maxChars: 120, closingPrefix: '君', requireClosingQuestion: true, forbidColloquial: [], softOpeners: [], bannedPatterns: [] };
  const clean = checkPostDraft(a, format, [], [], 48);
  assert.equal(clean.ok, true, clean.reasons.join(';'));
  const clash = checkPostDraft(a, format, [], [b], 48);
  assert.equal(clash.ok, false);
  assert.match(clash.reasons.join(';'), /结构骨架与 48 小时内的旧帖重复/);
  // 0 disables the cooldown entirely.
  assert.equal(checkPostDraft(a, format, [], [b], 0).ok, true);
});

test('manually excluded hot topics are skipped and stay excluded', async () => {
  const { screenHotTopics, validateConfig, DEFAULT_CONFIG } = await import('../index.js');
  const topics = ['某地暴雨致列车停运', '某明星深夜聚餐', '央行宣布降准'];
  const first = screenHotTopics(topics, { minLength: 4, maxLength: 50, excludeKeywords: [] });
  assert.deepEqual(first.usable, topics);

  const filtered = screenHotTopics(topics, { minLength: 4, maxLength: 50, excludeKeywords: [], excludedTopics: ['某明星深夜聚餐'] });
  assert.deepEqual(filtered.usable, ['某地暴雨致列车停运', '央行宣布降准']);
  assert.deepEqual(filtered.dropped, [{ topic: '某明星深夜聚餐', reason: '手动剔除' }]);

  // Matching ignores case and stray whitespace, so a re-fetch still skips it.
  const messy = screenHotTopics(['Some Star  Gossip'], { excludedTopics: ['some star gossip'], excludeKeywords: [] });
  assert.deepEqual(messy.usable, []);
  assert.equal(messy.dropped[0].reason, '手动剔除');

  const config = structuredClone(DEFAULT_CONFIG);
  config.postSettings.hotFilter.excludedTopics = ['  某明星深夜聚餐  ', '某明星深夜聚餐', ''];
  const validated = validateConfig(config);
  assert.deepEqual(validated.postSettings.hotFilter.excludedTopics, ['某明星深夜聚餐']);

  const tooMany = structuredClone(DEFAULT_CONFIG);
  tooMany.postSettings.hotFilter.excludedTopics = Array.from({ length: 301 }, (_, i) => `话题 ${i}`);
  assert.throws(() => validateConfig(tooMany), /手动剔除的热榜话题名单无效/);
  const tooLong = structuredClone(DEFAULT_CONFIG);
  tooLong.postSettings.hotFilter.excludedTopics = ['x'.repeat(81)];
  assert.throws(() => validateConfig(tooLong), /不能超过 80 字/);
});

test('state reports the installed plugin version and the UI no longer hardcodes one', async () => {
  const { readPluginVersion, createService } = await import('../index.js');
  const version = readPluginVersion();
  assert.match(version, /^\d+\.\d+\.\d+$/);
  assert.equal(readPluginVersion(new URL('file:///nonexistent/package.json')), '');

  const f = fixture();
  try {
    const service = createService({ paths: f.paths, configPath: join(f.dir, 'config.json'), platform: 'darwin' });
    const state = await service.action({ action: 'state' });
    assert.equal(state.pluginVersion, version);
  } finally { f.cleanup(); }

  const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(client, /state\?\.pluginVersion/);
  assert.doesNotMatch(client, /'v0\.19\.0'/);
});

test('fetch-trends drops rule-rejected headlines before they are cached', async () => {
  const http = await import('node:http');
  const board = {
    data: [
      { word: '央行宣布降准' },
      { word: '某明星深夜聚餐' },
      { word: '美股暴跌引发恐慌' },
      { word: '短' },
      { word: '某地暴雨致列车停运' },
    ],
  };
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(board));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const f = fixture();
  try {
    const config = structuredClone(DEFAULT_CONFIG);
    config.learningSettings = {
      ...(config.learningSettings || {}),
      trendSources: [{ id: 'fake', label: '测试榜', url: `http://127.0.0.1:${port}/hot`, enabled: true }],
    };
    config.postSettings.hotFilter = {
      ...(config.postSettings.hotFilter || {}),
      excludeKeywords: ['美股'],
      excludedTopics: ['某明星深夜聚餐'],
      // No model call in the offline test: the AI pass has its own coverage.
      aiScreen: false,
      minLength: 4,
      maxLength: 50,
    };
    writeFileSync(join(f.dir, 'config.json'), JSON.stringify(config));

    const trendsPath = join(f.dir, 'trends.json');
    const service = createService({
      paths: f.paths,
      configPath: join(f.dir, 'config.json'),
      learningsPath: join(f.dir, 'learnings.json'),
      trendsPath,
      platform: 'darwin',
    });
    const result = await service.action({ action: 'fetch-trends' });
    assert.equal(result.ok, true);
    // Only the two clean headlines survive; the others never reach the cache.
    assert.deepEqual(result.trends.topics.sort(), ['央行宣布降准', '某地暴雨致列车停运'].sort());
    // Extraction already drops titles shorter than four characters, so the raw
    // set is four headlines and two of those are rejected by the rules.
    assert.equal(result.trends.rawCount, 4);
    assert.equal(result.trends.droppedCount, 2);
    assert.match(result.note, /剔除 2 条/);
    const reasons = result.trends.droppedSamples.map(item => item.reason).sort();
    assert.deepEqual(reasons, ['手动剔除', '含敏感词「美股」'].sort());

    // What the worker reads back is already clean.
    const onDisk = JSON.parse(readFileSync(trendsPath, 'utf8'));
    assert.deepEqual(onDisk.topics.sort(), result.trends.topics.sort());
    const state = await service.action({ action: 'state' });
    assert.equal(state.trends.topics.length, 2);
  } finally {
    f.cleanup();
    await new Promise(resolve => server.close(resolve));
  }
});

test('fetch-trends keeps the previous cache when every board comes back empty', async () => {
  const http = await import('node:http');
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{}');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const f = fixture();
  try {
    const config = structuredClone(DEFAULT_CONFIG);
    config.learningSettings = {
      ...(config.learningSettings || {}),
      trendSources: [{ id: 'empty', label: '空榜', url: `http://127.0.0.1:${port}/hot`, enabled: true }],
    };
    writeFileSync(join(f.dir, 'config.json'), JSON.stringify(config));
    const trendsPath = join(f.dir, 'trends.json');
    writeFileSync(trendsPath, JSON.stringify({ fetchedAt: '2026-11-06T08:00:00.000Z', topics: ['旧的可用话题'], sources: [] }));

    const service = createService({
      paths: f.paths, configPath: join(f.dir, 'config.json'),
      learningsPath: join(f.dir, 'learnings.json'), trendsPath, platform: 'darwin',
    });
    const result = await service.action({ action: 'fetch-trends' });
    assert.equal(result.ok, true);
    assert.deepEqual(result.trends.topics, ['旧的可用话题']);
    assert.match(result.note, /保留上一次的缓存/);
    assert.deepEqual(JSON.parse(readFileSync(trendsPath, 'utf8')).topics, ['旧的可用话题']);
  } finally {
    f.cleanup();
    await new Promise(resolve => server.close(resolve));
  }
});

test('the hot-board safety floor survives an operator list that was replaced wholesale', async () => {
  const { effectiveHotFilter, hotSafetyFloor, screenHotTopics } = await import('../index.js');
  // The live config only keeps a 42-item political list; the floor must still apply.
  const live = { hotFilter: { excludeKeywords: ['政治', '被查'] }, politicalCap: { keywords: ['主席', '总统'] } };
  const filter = effectiveHotFilter(live, { bannedTopics: ['某明星'] });
  for (const word of ['性侵', '战争', '色情', '自杀', '主席', '政治', '某明星']) {
    assert.ok(filter.excludeKeywords.includes(word), `${word} should be in the effective filter`);
  }
  assert.ok(hotSafetyFloor().length >= 90);
  const kept = screenHotTopics(['两人共谋性侵11岁女童', '国防部：须高度警惕日本重启战争机器', '央行宣布降准'], filter);
  assert.deepEqual(kept.usable, ['央行宣布降准']);
  assert.equal(kept.dropped.length, 2);
  // The operator list is never mutated in place.
  assert.deepEqual(live.hotFilter.excludeKeywords, ['政治', '被查']);
});

test('chrome profiles live outside /tmp and the launcher is discovered next to the worker', async () => {
  const { chromeProfileFor, chromeLauncherPath, CHROME_PROFILE_ROOT, readPluginVersion } = await import('../index.js');
  assert.match(CHROME_PROFILE_ROOT, /XBotOpsConsole\/chrome$/);
  assert.ok(!CHROME_PROFILE_ROOT.includes('/tmp/'), 'profiles must not live in /tmp (cleared on reboot)');
  assert.equal(chromeProfileFor('post', {}), join(CHROME_PROFILE_ROOT, 'post'));
  // An explicit target field wins over the default.
  assert.equal(chromeProfileFor('post', { chromeProfile: '/custom/post' }), '/custom/post');
  assert.equal(chromeLauncherPath({ dir: '/nope' }), '');
  assert.equal(chromeLauncherPath({}), '');
  assert.ok(readPluginVersion().length > 0);
});

test('ensure-chrome reports every worker and honours a broken launcher', async () => {
  const f = fixture();
  const dir = join(f.dir, 'workers');
  mkdirSync(dir, { recursive: true });
  // Fake launcher that prints a status line like the real one.
  const launcher = join(dir, 'chrome_launcher.py');
  writeFileSync(launcher, [
    'import json, sys',
    'args = dict(zip(sys.argv[1::2], sys.argv[2::2]))',
    'print(json.dumps({"worker": args.get("--worker"), "port": int(args.get("--port", 0)), "cdpOpen": True, "ready": True}))',
  ].join('\n'));
  // A real executable wrapper: the action runs the launcher through it.
  const python = join(dir, 'python');
  writeFileSync(python, '#!/bin/sh\nexec python3 "$@"\n', { mode: 0o755 });

  const targets = {
    comment: { dir, worker: join(dir, 'comment_worker.py'), port: 9222, python, interpreterPidArgvToken: python, chromeProfile: join(f.dir, 'comment') },
    reply: { dir, worker: join(dir, 'reply_worker.py'), port: 9223, python, interpreterPidArgvToken: python, chromeProfile: join(f.dir, 'reply') },
    post: { dir, worker: join(dir, 'post_worker.py'), port: 9224, python, interpreterPidArgvToken: python, chromeProfile: join(f.dir, 'post') },
    profile: { dir, worker: join(dir, 'profile_worker.py'), port: 9225, python, interpreterPidArgvToken: python, chromeProfile: join(f.dir, 'profile') },
  };
  const targetsPath = join(f.dir, 'console-targets.json');
  writeFileSync(targetsPath, JSON.stringify({ targets }));
  try {
    const service = createService({
      paths: targets, targetsPath,
      configPath: join(f.dir, 'config.json'), platform: 'darwin',
    });
    const res = await service.action({ action: 'ensure-chrome' });
    assert.equal(res.ok, true);
    assert.equal(res.ready, 4);
    assert.deepEqual(res.results.map(item => item.key), ['comment', 'reply', 'post', 'profile']);
    assert.ok(res.results.every(item => item.ok && item.cdpOpen === true));
    assert.match(res.note, /4 个 CDP 就绪/);

    // A worker whose launcher is missing must not abort the whole batch.
    const broken = structuredClone(targets);
    broken.post = { ...broken.post, dir: join(f.dir, 'missing'), chromeLauncher: join(f.dir, 'nope.py') };
    writeFileSync(targetsPath, JSON.stringify({ targets: broken }));
    const partial = await createService({ paths: broken, targetsPath, configPath: join(f.dir, 'config.json'), platform: 'darwin' })
      .action({ action: 'ensure-chrome' });
    assert.equal(partial.ready, 3);
    assert.match(partial.results.find(item => item.key === 'post').error, /chrome_launcher/);
  } finally { f.cleanup(); }
});

test('x session cookies are filtered, scoped and never echoed to the caller', async () => {
  const { xSessionCookies, cdpCookieParams } = await import('../index.js');
  const raw = [
    { name: 'auth_token', value: 'a'.repeat(40), domain: '.x.com', path: '/', secure: true, httpOnly: true, sameSite: 'Lax' },
    { name: 'ct0', value: 'b'.repeat(32), domain: 'x.com', path: '/', secure: true, httpOnly: false, sameSite: 'None' },
    { name: 'guest_id', value: 'v1%3A123', domain: '.x.com', path: '/', expires: 1800000000 },
    { name: '_other', value: 'nope', domain: '.example.com', path: '/' },
    { name: 'junk', value: 'x', domain: 'notx.com', path: '/' },
    { name: '', value: 'empty-name', domain: '.x.com' },
    null,
  ];
  const kept = xSessionCookies(raw);
  assert.deepEqual(kept.map(item => item.name), ['auth_token', 'ct0', 'guest_id']);
  // A bare host domain is widened to the registrable domain so it is sent to x.com.
  assert.equal(cdpCookieParams(kept[1]).domain, '.x.com');
  assert.equal(cdpCookieParams(kept[0]).httpOnly, true);
  assert.equal(cdpCookieParams(kept[1]).sameSite, 'None');
  assert.equal(cdpCookieParams(kept[1]).sameSite === 'None' ? 1 : 0, 1);
  // Unspecified same-site values fall back to Lax, and expiry only when finite.
  assert.equal(cdpCookieParams({ name: 'n', value: 'v', domain: '.x.com', sameSite: 'Unspecified' }).sameSite, 'Lax');
  assert.ok(!('expires' in cdpCookieParams({ name: 'n', value: 'v', domain: '.x.com', expires: -1 })));
  assert.equal(cdpCookieParams(kept[2]).expires, 1800000000);
  assert.deepEqual(xSessionCookies(null), []);
  assert.deepEqual(xSessionCookies([{ name: 'x', domain: '.twitter.com' }]), []);
});

test('login status and sync-login fail cleanly when nothing is reachable', async () => {
  const f = fixture();
  try {
    const closed = await (async () => {
      const server = createServer();
      await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
      const port = server.address().port;
      await new Promise(resolve => server.close(resolve));
      return port;
    })();
    const targets = {
      comment: { dir: f.dir, worker: join(f.dir, 'comment_worker.py'), port: closed },
      reply: { dir: f.dir, worker: join(f.dir, 'reply_worker.py'), port: closed },
      post: { dir: f.dir, worker: join(f.dir, 'post_worker.py'), port: closed },
      profile: { dir: f.dir, worker: join(f.dir, 'profile_worker.py'), port: closed },
    };
    const targetsPath = join(f.dir, 'targets.json');
    writeFileSync(targetsPath, JSON.stringify({ targets }));
    const service = createService({ paths: targets, targetsPath, configPath: join(f.dir, 'config.json'), platform: 'darwin' });
    const status = await service.action({ action: 'chrome-login-status' });
    assert.equal(status.loggedIn, 0);
    assert.equal(status.results.length, 4);
    assert.ok(status.results.every(item => item.ok === false && /连不上|没有可操作|超时/.test(item.error)));
    await assert.rejects(service.action({ action: 'sync-login' }), /都没有可用的 X 登录态/);
  } finally { f.cleanup(); }
});

test('AI hot-board screening prompt and verdicts behave like the worker', async () => {
  const { buildHotScreenPrompt, applyHotScreenVerdict, HOT_AI_DEFAULT_INSTRUCTION, validateConfig, DEFAULT_CONFIG } = await import('../index.js');
  const prompt = buildHotScreenPrompt(['某顶流塌房了', '存款利率拐点'], {
    excludeKeywords: ['娱乐圈', '明星'],
    bannedTopics: ['政治'],
  });
  assert.match(prompt, /娱乐圈、明星/);
  assert.match(prompt, /政治/);
  assert.match(prompt, /1\. 某顶流塌房了/);
  assert.match(prompt, /2\. 存款利率拐点/);
  assert.match(prompt, /\{"keep":\[编号\]/);
  // An editable instruction replaces the built-in one but keeps the placeholders.
  const custom = buildHotScreenPrompt(['话题A'], { aiScreenInstruction: '只留科技，剔除：{keywords}\n{topics}' });
  assert.match(custom, /只留科技/);
  assert.match(custom, /1\. 话题A/);
  assert.ok(!custom.includes('{topics}'));
  assert.match(HOT_AI_DEFAULT_INSTRUCTION, /\{keywords\}/);

  // Whitelist mode: anything unlisted is dropped, rejects carry a reason.
  const whitelist = applyHotScreenVerdict(['明星A', '存款B', '裁员C'], { keep: [2], reject: [{ id: 1, why: '明星娱乐' }] });
  assert.deepEqual(whitelist.usable, ['存款B']);
  assert.deepEqual(whitelist.rejected, [{ topic: '明星A', reason: 'AI：明星娱乐' }]);
  // Blacklist mode: an all-reject reply keeps the rest instead of emptying the board.
  const blacklist = applyHotScreenVerdict(['明星A', '存款B'], { reject: [{ id: 1, why: '明星娱乐' }] });
  assert.deepEqual(blacklist.usable, ['存款B']);
  // Garbage ids never crash or drop everything.
  assert.deepEqual(applyHotScreenVerdict(['A', 'B'], { keep: ['x'] }), { usable: ['A', 'B'], rejected: [] });
  assert.deepEqual(applyHotScreenVerdict(['A', 'B'], {}).usable, ['A', 'B']);

  const config = structuredClone(DEFAULT_CONFIG);
  assert.equal(config.postSettings.hotFilter.aiScreen, true);
  config.postSettings.hotFilter.aiScreenMaxTopics = 3;
  assert.throws(() => validateConfig(config), /5~300/);
  config.postSettings.hotFilter.aiScreenMaxTopics = 40;
  config.postSettings.hotFilter.aiScreenInstruction = 'x'.repeat(3001);
  assert.throws(() => validateConfig(config), /3000 字/);
});
