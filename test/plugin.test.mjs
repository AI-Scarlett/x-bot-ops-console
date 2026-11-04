import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { authorize, createService, DEFAULT_CONFIG, DESKTOP_ROUTE, WEB_ROUTE, installRoute, validateConfig } from '../index.js';

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
    assert.equal(registered.kind, 'exact');
  }
});

test('default config validates and preserves privacy boundaries', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  assert.equal(validateConfig(config).model.name, 'your-model-name');
  assert.match(config.model.keySource, /secret never read/);
  assert.throws(()=>validateConfig({...config,tiers:[]}),/invalid config/);
});

test('rejects duplicate or malformed priority handles', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  config.tiers[1].handles.push('priorityuser');
  config.tiers[0].handles.push('priorityuser');
  assert.throws(()=>validateConfig(config),/duplicate handle/);
  const invalid = structuredClone(DEFAULT_CONFIG); invalid.tiers[0].handles=['bad handle'];
  assert.throws(()=>validateConfig(invalid),/valid X username/);
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
    assert.equal(result.note.includes('SpecialReplies'),true);
    assert.equal(result.note.includes('round caps only by replies'),true);
    assert.equal(JSON.parse(readFileSync(configPath,'utf8')).model.name,'gpt-test');
  } finally { f.cleanup(); }
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
  assert.throws(()=>validateConfig(oversized),/special reply/);
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
    await assert.rejects(service.action({action:'stop',target:'comment'}),/watchdog identity not verified/);
    await assert.rejects(service.action({action:'start',target:'comment'}),/live process has an unverified identity/);
  } finally { f.cleanup(); }
});

test('refuses process actions without verified owned PID identity', async () => {
  const f=fixture();
  try {
    const service=createService({paths:f.paths,configPath:join(f.dir,'config.json'),platform:'darwin'});
    await assert.rejects(service.action({action:'stop',target:'comment'}),/watchdog identity not verified/);
    await assert.rejects(service.action({action:'restart',target:'reply'}),/watchdog identity not verified/);
  } finally { f.cleanup(); }
});

test('rejects unsafe actions and non-mac process control', async () => {
  const f=fixture();
  try {
    const service=createService({paths:f.paths,configPath:join(f.dir,'config.json'),platform:'linux'});
    await assert.rejects(service.action({action:'start-watchdog',target:'comment'}),/unknown action/);
    await assert.rejects(service.action({action:'shell',command:'rm -rf /'}),/unknown action/);
    await assert.rejects(service.action({action:'pause',target:'bad',minutes:3}),/target must be comment or reply/);
  } finally { f.cleanup(); }
});
