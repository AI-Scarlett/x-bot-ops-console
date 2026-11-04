# Security and permissions

Risk class: **R3**. This source bundle writes a shared config and pause/stop marker files, requests a fixed watchdog start via the DSH subprocess service, and can signal an identity-verified worker for restart. These controls affect real X automation; the default assumption is one local macOS user controlling their own account.

## Boundaries

- Web uses `/_dsh/x-bot-ops-console`; official Desktop uses `/api2/x-bot-ops-console`. Both reject cross-site Fetch Metadata and require any supplied HTTP(S) Origin to exactly match Host before parsing request bodies, then defer authentication to the injected public Connection `requestRejection(req)` and await its result. Missing/throwing authority fails closed.
- No arbitrary path, executable, command string, shell, URL, account, or credential is accepted from the browser.
- The client sees no LocalModelHub key, cookie, DB, or full log. Log tail is limited to 6 KB and bearer-like text is redacted. Worker watchdogs verify the configured script token from `ps` before signaling, and the Host treats a live foreign PID as occupied; identity is rechecked before forced termination.
- Config is stored under the user's Application Support with mode 0600 and contains no API key; the older per-script mirrors are consulted only as fallback when the primary file is absent and are refreshed on save to preserve worker compatibility.
- Before worker restart or watchdog stop, the manager checks the PID file, non-zombie process state, and exact expected script path/required watchdog mode. Ambiguous ownership fails closed.
- Watchdogs record their own PID, reject duplicate tracked supervisors, and cooperate with a stop marker by shutting down their managed worker. PID records and marker behavior are not yet verified against live processes.
- Special-case prompt toggles remain partially source-defined; README identifies fields that are visible but not fully runtime-wired.

## Recovery

Pause writes a JSON marker honored by the existing watchdogs. Resume removes only the selected marker; do not resume early while X rate-limits are active. Stop creates a cooperative stop marker, and the watchdog shuts down its worker before exiting. Restart signals only the verified worker and relies on its already running watchdog to relaunch it. Start refuses an already verified watchdog and refuses any live process with an unverified identity. Check the status panel afterwards; do not infer sustained health from an accepted request.

No live process was started, stopped, paused, resumed, or restarted while producing this source. No DSH Profile was installed or changed. Uninstalling the plugin does not delete its config or affect processes.

## Known risks and gates

Default worker locations are generic templates under `~/XBotOpsConsole/{comment-worker,reply-worker}`; users must place their worker/watchdog scripts there or adapt the reviewed fixed paths before enabling controls. The Desktop-native UI contribution now follows the installed Store's `dsh-app:` detection and root `main`/`sidebar.panellist` registration; the Host selects a Desktop `/api2` route using public `profileContext` and `webServer` injection, and requests are authorized by public Connection. Unit tests cover route selection and async authorization. However, this plugin's Desktop loader, route reachability, UI visibility, and process behavior have not yet been verified in an isolated Desktop-target runtime. Do not claim Desktop delivery acceptance until those gates pass. The Desktop `configForms` preference facade is not used as an operations transport. Automatic watchdog spawn semantics and actual host subprocess `pid` behavior have not been verified in the running DSH Host; the API therefore reports only a launch request, not start success. Verify a matching watchdog, worker and stable heartbeat in state before treating it as started.

Rollback: stop exposing the bundle, leave existing workers alone, and restore the three Python sources from the user's separately retained source backup if a later reviewed deployment causes issues. The plugin does not modify DSH core or Profile state. Runtime control of the two external Python systems remains R3-like operational authority even though the DSH Profile itself is untouched.
- Alternative considered: let the Browser Client signal Python processes directly. Rejected because it would expose OS control to the browser surface and lack Host-side identity checks.
- Alternative considered: arbitrary PID kill or process-name scan. Rejected because it can terminate unrelated apps/Chrome and is not recoverable.
- Reconsider lifecycle controls only after the worker/watchdog PID contract and Host subprocess contract pass disposable tests.

| Decision | Objective | Benefit | Cost | Evidence | Reconsider when |
|---|---|---|---|---|---|
| Host-only fixed actions with PID identity checks | Prevent arbitrary command execution and foreign-process signals | Narrow process scope and fail-closed behavior | Depends on exact macOS command lines and watchdog cooperation | Source/tests only | Host API and real watchdog contract are verified |
| Shared JSON config | Give user visual control over documented policy values | Tier membership/style feed both workers | Model names/round caps/port are asymmetric; runtime changes alter posting behavior | Source wiring and isolated Python tests | Add schema migration and converge remaining mappings |
| Keep OAuth/model keys out of UI | Avoid secret exposure | Existing LocalModelHub credential owner preserved | Port and model service remain external dependencies | Source inspection | Never expose key without a separate credential design |
| Preserve prompt branches in code | Avoid accidental semantic changes to unusual special cases | Existing behavior remains intact | Not every specialReplies field is effective yet | Source inspection | Each branch has isolated tests and explicit mapping |
| No real lifecycle operation now | Avoid unexpected changes to active users/account state | No surprise posting/process effect | Runtime acceptance remains pending | No operation performed | User separately confirms a specific real operation |

Next gate: in a disposable DSH Desktop-target runtime, prove this Bundle loads its Client module, displays the native sidebar/main slot, and can read/update only fixture-backed Host state through `/api2`; then test subprocess lifecycle against disposable worker fixtures. Only after those pass should a separate confirmed plan be considered for real Desktop installation or any live process action.