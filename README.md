# X Bot Ops Console

**License:** MIT. See [`LICENSE`](LICENSE); copyright and permission notice must accompany copies or substantial portions.

DSH bundle that provides a visual operations console for two user-provided X automation workers: an auto-commenter and a mention-reply worker. This package does not include either worker implementation.

**Host fit:** the Client detects Desktop's `dsh-app:` renderer and registers a native `main` panel and sidebar entry. The Host selects `/api2/x-bot-ops-console` for `profileContext.name === 'desktop'`; Web retains its existing route. Both use the public DSH `Connection.requestRejection` authority. Client metadata follows the installed DSH Store's `platform: web` convention while adding a Desktop renderer branch. This adapts the installed route/slot pattern, but the X panel remains unverified in a disposable or real Desktop runtime; source tests do not prove visible UI acceptance.

## Current capabilities

- Visual status for verified worker/watchdog PID identity, heartbeat age, pause marker, Chrome CDP port and a bounded log tail.
- Per-side pause/resume, watchdog start/stop, and worker restart through the watchdog. Each button requires confirmation; start refuses duplicate verified supervisors and reports only a launch request, stop uses a cooperative stop file, and restart signals only a worker whose PID command matches the fixed script path.
- Shared visual configuration for model name and optional LocalModelHub port override; six priority lists with empty handle lists by default; tier styles and reply-round caps; work/rest windows, quiet/full-stop hours, publish spacing, comment/mention windows, author cooldown and rate-limit waits. Special-case prompt text appears as an explicitly labeled draft only.
- Workers reload the validated shared JSON once per loop; config is mode 0600, bounded, and contains no model secret. Plugin saves write the canonical Application Support file and atomically mirror `xops_config.json` beside each configured worker. Worker scripts are not bundled and must be supplied by the user; verify the fixed script paths in Host source before enabling controls.

## Install and configure

1. Supply your own commenter and reply-worker scripts. This bundle does not ship or configure them.
2. Review the fixed worker/watchdog paths in Host source and adapt them to your setup before installing; never run controls while paths point at the wrong scripts.
3. Install the bundle into the intended DSH profile using DSH's supported plugin manager.
4. Open **X 运维台**. Configure model name, reply tiers, account handles, and schedules. The default handles are empty and the model is a placeholder. Review every remaining generic schedule and prompt default for your own policy before using automation.
5. First verify status only. Start/stop/pause/restart controls affect real automation; use them only when you intend that operational effect.

## Runtime configuration boundaries

Tier membership and style are read by both workers. Model name and round limits are consumed by the reply worker only; model port override is consumed by the commenter only. Several timing fields are shared but not all timing keys affect identical paths in both workers. Existing specialized prompt branches (AI admission, care/affection, daddy, named address, imperial-title and vernacular logic) remain largely source-defined; the specialReplies fields are displayed/saved as drafts and do not override built-in branches. Boolean rule toggles are also not wired. Runtime fields are individually marked as partial, reply-only or commenter-only in the UI. Boolean rules are also not all runtime-switchable. Do not treat those fields as effective until separately wired and tested.

The panel does not read LocalModelHub credentials, cookies, message bodies, or private databases. It displays only bounded log tails and redacts bearer-token-like text. Controls are macOS-specific and affect real local automation. No process operation was triggered during source development.

## DSH package

- Standard Bundle with a unique `dsh-x-bot-ops-console` patch row. The Client keeps the Web sidebar/main panel and adds a separate `dsh-app:` Desktop main/sidebar entry modeled on the installed DSH Store.
- The Host selects a Desktop-specific `/api2/x-bot-ops-console` route when `ctx.profileContext.name === 'desktop'`; other profiles keep `/_dsh/x-bot-ops-console`. Both use DSH's public `webServer` seam and await the public Connection authorization authority. The Desktop UI calls its same-origin `/api2` endpoint, following the installed Store's route pattern.
- This is a native Desktop panel/API adapter in source, but Desktop-specific visual and route acceptance are still unverified. Do not claim E3/E4 acceptance until tested with a disposable Desktop-target runtime and visible readback.
- Browser code contains no Node imports; requests stay same-origin and use DSH Connection authorization.
- Process start uses fixed script paths and argv through the DSH `subprocess` service; no shell strings are constructed. Identity verification and asynchronous-launch semantics still require disposable DSH runtime acceptance.
- Architecture decision: a Host + Client Bundle is chosen over direct script editing UI because browser code should never own OS operations; it is chosen over a Tool-only API because the requested outcome is a persistent human configuration console. Host routes are profile-specific and optional in headless profiles. Costs are a Host auth boundary, subprocess contract, and separate UI runtime verification.

## Tests

Run `npm test`. Unit fixtures use temporary directories and mocked worker paths; they do not read or operate a real worker, X account, or model credential.

## Evidence

Current verification: isolated Node and Python tests are run before release; Desktop E3/E4 acceptance remains outstanding. The Desktop `dsh-app:` main/sidebar slots and same-origin `/api2` route pattern are modeled on the installed DSH Store, but this plugin's route has not been exercised in a disposable DSH Desktop runtime or visually verified. No worker implementation is included. No Profile install or worker operation is implied by downloading this source.
