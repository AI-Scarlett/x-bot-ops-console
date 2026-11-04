# 安全与权限

风险等级：**R3**。本插件会写入共享配置和暂停/停止标记，通过 DSH 子进程服务请求启动固定监控脚本，并可向身份已验证的工作进程发送重启信号。这些控制会影响真实 X 自动化任务；默认假设由 macOS 本地用户控制自己的账号。

## 安全边界

- Web uses `/_dsh/x-bot-ops-console`; official Desktop uses the relative `/api2/x-bot-ops-console` URL. Both reject cross-site Fetch Metadata and require any supplied HTTP(S) Origin to exactly match Host before parsing request bodies, then defer authentication to the injected public Connection `requestRejection(req)` and await its result. Missing/throwing authority fails closed.
- 浏览器端不接受任意路径、可执行程序、命令字符串、Shell 命令、URL、账号或凭据。
- The client sees no LocalModelHub key, cookie, DB, or full log. Log tail is limited to 6 KB and bearer-like text is redacted. Worker watchdogs verify the configured script token from `ps` before signaling, and the Host treats a live foreign PID as occupied; identity is rechecked before forced termination.
- Config is stored under the user's Application Support with mode 0600 and contains no API key; the older per-script mirrors are consulted only as fallback when the primary file is absent and are refreshed on save to preserve worker compatibility.
- Before worker restart or watchdog stop, the manager checks the PID file, non-zombie process state, and exact expected script path/required watchdog mode. Ambiguous ownership fails closed.
- Watchdogs record their own PID, reject duplicate tracked supervisors, and cooperate with a stop marker by shutting down their managed worker. PID records and marker behavior are not yet verified against live processes.
- Special-case prompt toggles remain partially source-defined; README identifies fields that are visible but not fully runtime-wired.

## 恢复与回滚

暂停操作会写入现有监控进程识别的 JSON 标记。恢复只移除所选任务的标记；若 X 限流尚未结束，不要提前恢复。停止操作会创建协作式停止标记，监控进程随后会先停止所托管的工作进程再退出。重启只会向身份已验证的工作进程发送信号，并依赖已运行的监控进程重新拉起它。若监控进程已运行或发现身份未验证的进程，启动会拒绝执行。操作后请检查状态面板，不要把请求已接受当作持续运行健康的证明。

编写和修复源码期间未启动、停止、暂停、恢复或重启任何真实进程；未安装或修改 DSH Profile。卸载插件不会删除配置文件，也不会影响相关进程。

## 已知风险与验收门槛

工作进程默认位置为 `~/XBotOpsConsole/{comment-worker,reply-worker}`。启用控制前，需将自己的工作进程/监控脚本放到这些位置，或审查并修改固定路径。桌面原生界面沿用已安装插件的 `dsh-app:` 检测及根级 `main`/`sidebar.panellist` 注册方式；Host 通过公共 `webServer` 注册精确 Desktop `/api2` 路由，请求由公共 Connection 授权。单元测试覆盖路由选择和异步授权，但尚未在隔离 Desktop 环境验证本插件加载、路由可达性、界面可见性和进程行为。通过这些门槛前，不应声称 Desktop 交付验收通过。桌面 `configForms` 设置偏好接口不作为运维操作通道。当前也未在运行的 DSH Host 中验证监控进程自动启动语义和子进程服务的实际行为；因此 API 只报告“已提交启动请求”，不宣称启动成功。只有状态显示匹配的监控进程、工作进程及持续心跳后，才可认为已经启动。

回滚方式：停止分发此插件，保持现有工作进程不变；若后续经审查的部署造成问题，请从用户另行保管的源码备份中恢复三个 Python 文件。插件不会修改 DSH 核心或 Profile 状态。虽然不触碰 DSH Profile，但对两个外部 Python 系统的运行控制仍属于高影响操作。
- 方案比较：不允许浏览器客户端直接向 Python 进程发送信号，因为这会让浏览器界面直接掌握系统操作能力，并缺少 Host 端身份核验。
- 方案比较：不使用任意 PID 强制结束或按进程名扫描，因为可能误杀无关应用或 Chrome，且难以恢复。
- 只有在隔离测试验证工作/监控进程 PID 协议及 Host 子进程服务后，才考虑重新开放生命周期控制。

| 决策 | 目标 | 收益 | 代价 | 证据 | 重新评估条件 |
|---|---|---|---|---|---|
| 仅由 Host 执行固定操作并核验进程 ID | 防止任意命令执行和向外部进程发送信号 | 缩小控制范围，无法确认时默认拒绝 | 依赖准确的 macOS 命令行和监控进程配合 | 仅源码与单元测试 | Host API 和真实监控进程协议已验证 |
| 使用共享 JSON 配置 | 让用户可视化控制已公开的策略项 | 名单和风格可供两个工作进程读取 | 模型名称、轮次上限和端口接入不对称；运行时变更会影响发布行为 | 源码接线和隔离测试 | 增加模式迁移并统一尚未映射的字段 |
| 不在界面显示 OAuth/模型密钥 | 避免凭据泄露 | 继续由 LocalModelHub 管理现有凭据 | 端口和模型服务仍依赖外部配置 | 源码检查 | 除非另行设计凭据方案，否则永不显示密钥 |
| 保留脚本中的提示词分支 | 避免意外改变特殊情形的语义 | 保持现有工作进程行为 | 目前并非所有特殊回复字段都能生效 | 源码检查 | 每个分支均有隔离测试和明确映射 |
| 当前不执行真实生命周期操作 | 避免意外改变活跃账号或进程状态 | 不会意外发帖或影响进程 | 运行时验收仍未完成 | 未执行真实操作 | 用户另行确认具体操作后 |

下一验收门槛：在隔离的 DSH Desktop 环境中确认本 Bundle 能加载 Client 模块、显示原生侧栏/主面板，并仅通过 `/api2` 读取和更新由测试夹具提供的 Host 状态；之后再使用隔离的工作进程夹具测试子进程生命周期。以上均通过后，才能另行制定并确认真实 Desktop 安装或任何真实进程操作计划。