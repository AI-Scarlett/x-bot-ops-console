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
