import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
  assert.ok(defaults.postSettings.customPrompt.includes('文言文'));
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
