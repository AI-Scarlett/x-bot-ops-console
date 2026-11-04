import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { authorize, createService, DEFAULT_CONFIG, DEFAULT_TARGETS, DESKTOP_ROUTE, WEB_ROUTE, installRoute, resolveTargets, validateConfig } from '../index.js';

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'x-bot-console-'));
  const paths = {
    comment: { dir, worker:'comment.py', watchdog:'watchdog.py', watchdogPid:join(dir,'comment-watchdog.pid'), stop:join(dir,'comment.stop'), pid:join(dir,'comment.pid'), log:join(dir,'comment.log'), heartbeat:join(dir,'comment-heartbeat.json'), rate:join(dir,'comment-rate.json'), port:19222 },
    reply: { dir, worker:'reply.py', watchdog:'reply-watchdog.py', watchdogPid:join(dir,'reply-watchdog.pid'), stop:join(dir,'reply.stop'), pid:join(dir,'reply.pid'), log:join(dir,'reply.log'), heartbeat:join(dir,'reply-heartbeat.json'), rate:join(dir,'reply-rate.json'), port:19223 },
  };
  return { dir, paths, cleanup:()=>rmSync(dir,{recursive:true,force:true}) };
}

test('route auth requires authoritative async same-origin validation', async () => {
  let calls=0;
  const connection={requestRejection:()=>{calls++;return undefined;}};
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905',origin:'http://127.0.0.1:64905','sec-fetch-site':'same-origin'}},connection),true);
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905',origin:'https://attacker.invalid','sec-fetch-site':'cross-site'}},connection),false);
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905','sec-fetch-site':'cross-site'}},connection),false);
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905'}},{requestRejection:async()=>401}),false);
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905'}},{requestRejection:async()=>500}),'unavailable');
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905'}},{requestRejection:()=>undefined}),true);
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905'}},{}),'unavailable');
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905'}},{requestRejection:()=>{throw new Error('denied');}}),'unavailable');
  assert.equal(await authorize({headers:{host:'127.0.0.1:64905'}},{requestRejection:()=>Promise.resolve(undefined)}),true);
  assert.equal(calls,1);
});

test('Desktop and Web Host adapters register separate routes and require public services', () => {
  for (const [desktop, expected] of [[false, WEB_ROUTE], [true, DESKTOP_ROUTE]]) {
    let injection; let registered;
    const ctx = { inject(deps, callback) { injection = { deps, callback }; } };
    const webCtx = { connection: {}, webServer: { register(route) { registered = route; return () => {}; } }, effect(run) { run(); } };
    installRoute(ctx, { inspect: async()=>({ ok:true }), action: async()=>({}) }, { desktop });
    assert.deepEqual(injection.deps, ['webServer', 'connection']);
    injection.callback(webCtx);
    assert.equal(registered.path, expected);
    if (desktop) assert.equal(registered.path.startsWith('/api2/'), true);
    assert.equal(registered.kind, 'exact');
  }
});

test('Desktop UI uses relative DSH route and Chinese-first controls', () => {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /DESKTOP \? '\/api2\/x-bot-ops-console'/);
  assert.match(source, /const t = key => zh\[key\]/);
  assert.doesNotMatch(source, /navigator\.language/);
  assert.match(source, /disabled:busy\|\|!controlsEnabled/);
  assert.match(source, /const pageStyle = /);
  assert.match(source, /overflowY:'auto'/);
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
  rmSync(dir, { recursive:true, force:true });
  assert.deepEqual(resolveTargets(base, join(dir, 'missing.json')).comment, base.comment);
  assert.equal(resolveTargets(base, join(dir, 'missing.json')).reply.port, 9223);
});

test('Desktop UI uses a viewport-sized scrolling panel and local target override', () => {
  const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
  assert.match(source, /height:'calc\(100vh - 24px\)'/);
  assert.match(source, /overflowY:'auto'/);
  assert.match(source, /WebkitOverflowScrolling:'touch'/);
  assert.match(source, /const pageStyle =/);
  assert.match(source, /h\('main',\{style:pageStyle\}/);
});

test('default config validates and preserves privacy boundaries', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  assert.equal(validateConfig(config).model.name, 'your-model-name');
  assert.match(validateConfig(config).tiers[0].label, /优先级/);
  assert.match(validateConfig(config).specialReplies.asksAi, /如实回答/);
  assert.match(config.model.keySource, /密钥不会被读取或显示/);
  assert.throws(()=>validateConfig({...config,tiers:[]}),/配置结构无效/);
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
    const result=await service.action({action:'save-config',config:changed});
    assert.equal(result.config.model.name,'gpt-test');
    assert.equal(result.runtimeConfigApplied,true);
    assert.equal(result.note.includes('仅为草稿'),true);
    assert.equal(result.note.includes('回复轮次仅由回复进程读取'),true);
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
    const service=createService({paths:f.paths,configPath:join(f.dir,'config.json'),platform:'darwin',clock:()=>100_000});
    const pause=await service.action({action:'pause',target:'comment',minutes:10});
    assert.equal(pause.pausedUntil,700);
    assert.equal(JSON.parse(readFileSync(f.paths.comment.rate,'utf8')).reason,'manual');
    assert.throws(()=>readFileSync(f.paths.reply.rate));
    await service.action({action:'resume',target:'comment'});
    assert.throws(()=>readFileSync(f.paths.comment.rate));
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
});

test('start reports a request, not an unverified success', async () => {
  const f=fixture(); const calls=[];
  try {
    const service=createService({paths:f.paths,configPath:join(f.dir,'config.json'),platform:'darwin',subprocess:{resolveExecutable:async name=>`/usr/bin/${name}`,spawn:spec=>{calls.push(spec);return {pid:12345};}}});
    const result=await service.action({action:'start',target:'comment'});
    assert.equal(result.started,null); assert.equal(result.launchRequested,true);
    assert.deepEqual(calls[0].argv,['/usr/bin/python3',f.paths.comment.watchdog,'--loop']);
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
