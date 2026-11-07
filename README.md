# X 自动化运维台

**License:** MIT. See [`LICENSE`](LICENSE); copyright and permission notice must accompany copies or substantial portions.

这是一个 DSH 插件，为用户自备的两类 X 自动化工作进程提供可视化运维面板：自动评论和提及回复。本插件不包含这两类工作进程。桌面面板默认显示中文，不随系统英文语言设置切换为英文。

**Host 适配说明：**客户端检测 Desktop 的 `dsh-app:` 渲染器，并注册原生 `main` 主面板与侧栏入口。Web 与 Desktop 的 Host API 均计划通过 DSH 公开 Connection Fetch API 注册，并使用同源 `/api/x-bot-ops-console`。该公共 API 在 route handler 前完成 Connection Host/Origin 与 signed browser/API credential 验证；本插件不会将可伪造的 Fetch Metadata 当授权。当前仍需在最终临时包验证 Web 运行与 UI，Desktop 也未验收。客户端包元数据遵循已安装 DSH Store 的 `platform: web` 惯例，同时增加 Desktop 渲染器分支；源码测试不能证明界面已可见或操作可用。

## 当前功能

- 展示已核验的工作/监控进程身份、心跳时长、暂停状态、Chrome 调试端口和有限长度的日志尾部。
- 桌面端面板默认使用中文，并会说明操作按钮为何不可用。只有相应脚本文件存在、且所有运行中的进程身份均核验通过时，才开放生命周期控制。
- 面板主体是一个固定视口高度的滚动容器，内容再长也可在面板内滚动到底部的配置与保存按钮。
- 每项任务均提供暂停/恢复、监控进程启动/停止和工作进程重启控制。每项操作均需确认；启动会拒绝重复监控进程，且只报告已提交启动请求；停止通过协作标记进行；重启只会向命令行匹配配置脚本的进程发送信号。
- 可视化参数明确标记读取方：模型名称、回复轮次和风格仅回复 worker 使用；模型端口覆盖、评论窗口和作者冷却仅评论 worker 使用；名单与共享节奏字段两侧读取。关键人物用户名与专属提示词两侧读取，回复跳过名单由回复 worker 读取；`rules.skipFinanceComments` 由评论 worker 读取。`specialReplies` 和其余规则仍为草稿。
- 从完全停止状态启动前，必须为目标任务在本机 `console-targets.json` 配置 `python`、`interpreterPidArgvToken`、`workerPidArgvToken` 与 `watchdogPidArgvToken` 四个绝对路径。不会从进程名推断解释器，也不会猜测系统默认 `python3`；进程归属检查以实际 argv token 精确匹配。
- 默认数值与 worker 内置运行默认保持一致。共享配置缺失时，界面会提示“尚未创建”；不能盲目保存空名单，因为空名单会覆盖内置重点名单。可通过“用 worker 内置名单填充”恢复脚本中读取到的名单。
- 两个工作进程每轮读取 `~/Library/Application Support/XBotOpsConsole/config.json`；插件仅把它作为运行真值写入（权限 0600）。`xops_config.json` 不被当前 worker 当作运行配置。本插件不包含工作进程脚本，需用户自行提供；启用控制前请核对脚本路径和 Python 解释器。

## 发布与验收状态

当前 `0.1.5-e3blocked.1` 是隔离测试候选，不是可部署 release：DSH 0.2.1-rc.5 disposable Web Host route authorization 的 E3 尚未通过。请先查看 [ACCEPTANCE-STATUS.md](ACCEPTANCE-STATUS.md)。**不要将候选包安装到真实 Profile**，即使官方 CLI 安装命令接受它。

## 安装与配置

1. 自行准备评论和提及回复工作进程脚本。本插件不包含或安装这些脚本。
2. 默认路径为 `~/XBotOpsConsole/comment-worker/comment_worker.py` 和 `~/XBotOpsConsole/reply-worker/reply_worker.py`；每个目录还应有对应的 `*_watchdog.py`。可把自有脚本放到这些位置，或使用下方本地 `console-targets.json` 修改目录/脚本路径。只有对应 worker/watchdog 脚本均存在且进程状态已核验时，面板才开放控制按钮。
3. 无论默认位置还是自定义目录，从完全停止状态启动都必须提供上述四项。若脚本不在默认位置，可在用户本机创建 `~/Library/Application Support/XBotOpsConsole/console-targets.json`，按任务写出真实路径，无需修改或重新安装插件。若需从完全停止状态启动，必须为每个任务提供 `python`、`interpreterPidArgvToken`、`workerPidArgvToken` 和 `watchdogPidArgvToken` 四个绝对路径：分别指定启动解释器、核对解释器 argv、核对 worker argv、核对 watchdog argv；后三项必须与进程实际参数中的完整 token 完全一致。插件不会猜 Python，也不会以未核实的别名作为可执行路径。

   ```json
   {
     "targets": {
       "comment": { "dir": "/绝对路径/comment", "worker": "/绝对路径/comment/worker.py", "watchdog": "/绝对路径/comment/watchdog.py", "watchdogPid": "/绝对路径/comment/watchdog.pid", "stop": "/绝对路径/comment/watchdog.stop", "pid": "/绝对路径/comment/worker.pid", "log": "/绝对路径/comment/worker.log", "heartbeat": "/绝对路径/comment/heartbeat.json", "rate": "/绝对路径/comment/rate_limit.json", "port": 9222 },
       "reply": { "dir": "/绝对路径/reply", "worker": "/绝对路径/reply/worker.py", "watchdog": "/绝对路径/reply/watchdog.py", "watchdogPid": "/绝对路径/reply/watchdog.pid", "stop": "/绝对路径/reply/watchdog.stop", "pid": "/绝对路径/reply/worker.pid", "log": "/绝对路径/reply/worker.log", "heartbeat": "/绝对路径/reply/heartbeat.json", "rate": "/绝对路径/reply/rate_limit.json", "port": 9223 }
     }
   }
   ```

   仅接受绝对路径；缺失的 worker、watchdog 和配置文件路径字段沿用默认值。独立启动所需的四个字段不使用默认值；`python` 必须指向 worker 依赖所在的解释器。该文件位于本机，不随插件仓库分发。
4. 使用 DSH 官方支持的插件管理器，将插件安装到目标 Profile。
5. 打开 **X 运维台**，先刷新并核对两侧 worker 接受状态、名单来源和当前模型。配置文件缺失时，先使用“用 worker 内置名单填充”恢复已知重点账号，再修改并保存；模型名留空代表沿用 worker 内置默认值。
6. 初次使用先只查看状态。启动、停止、暂停和重启都会影响真实自动化任务，请仅在确认希望产生对应效果时操作。

## 运行配置的生效范围

两个工作进程都会读取名单。模型名称、回复轮次与回复风格仅由提及回复进程读取；模型端口覆盖、评论时间窗口和作者冷却仅由评论进程读取。限流等待、工作/休息时长、发布间隔、静默时段与完全停止时段由两侧读取；各侧特有的时间窗口只由对应 worker 使用。Apex/易经人物身份、启用状态和额外提示词可在面板修改；两 worker 每轮热加载，不需重启。任意特定人物都可以勾选「两行：文言 + 白话」，勾上之后对这个人的**回复和评论**都发两行：第一行文言文，第二行是它的白话译文；旧配置里在专属规则写成「要文言文+白话文、一行翻译」的，worker 会按同样的意思识别，不用重填。回复 worker 使用 `specialPersons.skipReplyHandles` 跳过名单，评论 worker 使用 `rules.skipFinanceComments`。特殊回复文本及其余布尔规则仍仅保存为建议稿，原始 Python 内置提示/安全分支不由 UI 覆盖。界面标注两侧、仅回复侧、仅评论侧或未接入的字段。

面板不会读取 LocalModelHub 凭据、Cookie、消息正文或私有数据库；仅显示有限长度的工作进程/看门狗日志尾部，并隐藏类似 Bearer 的令牌文本。控制操作仅支持 macOS，会影响真实自动化进程。本次修复没有触发任何进程操作。自动限流等待由 worker/watchdog 控制；面板不会提前移除仍有效的 `rate_limit.json` 保护。

## DSH 插件包说明

- 本插件采用 Standard Bundle 结构，并添加唯一的 `dsh-x-bot-ops-console` 条目。客户端保留 Web 侧栏/主面板，并针对 `dsh-app:` 桌面渲染器注册独立的主面板和侧栏入口；该接入方式参考已安装的 DSH Store 插件。
- Host 使用 DSH Connection 的 `/api` transport 注册运维端点，Web 与 Desktop 客户端均调用 `/api/x-bot-ops-console`。DSH 0.2.1-rc.5 临时 Web Profile 早期候选曾有同源 GET 返回 200，但其授权逻辑随后发现问题并已修复；最终候选仍需重新完成授权/跨站负向 smoke、Client UI 载入和 Desktop 验收，详见验收状态。
- 源码包含桌面原生面板/API 适配，但桌面专属的路由与界面仍未在隔离的 Desktop 运行环境中验收。完成隔离运行和可见界面回读前，不应声称 E3/E4 验收通过。
- 浏览器端代码不导入 Node.js 模块；请求保持同源，并使用 DSH Connection 授权。
- macOS Host 使用固定参数数组直接启动独立 Python 看门狗（不经过 shell），并追加日志；若用户在本机配置 `python`，启动时使用该解释器。进程身份核验及异步启动语义仍需在隔离的 DSH 环境中实测。
- 架构选择：使用 Host + Client Bundle，而不是让浏览器直接编辑脚本或执行系统操作；也不采用仅提供 Tool API 的方案，因为需求是一个常驻的可视化配置面板。Host API 由公开 Connection Fetch 服务注册及鉴权；无 Connection 的 Profile 不激活运维 API。代价是维护子进程服务接入及独立桌面界面验收。

## 测试

运行 `npm test`。单元测试使用临时目录和模拟的工作进程路径，不会读取或操作真实工作进程、X 账号或模型凭据。

## 验证情况

当前验证：29 项隔离 Node 测试通过；DSH 0.2.1-rc.5 临时 Web Profile 通过官方 CLI 安装本地 tarball，`--dump-config` 确认 Host 插入行含 `inject: [connection]`；cold boot 成功，最终候选同源 API GET 返回 200；未授权/跨站和 Client 可见 UI 等 E3 项仍需验收，不据单个 GET 宣称 E3 完成。静态审计 77/80（无 blocker）；Desktop E3/E4 验收仍未完成。桌面端 `dsh-app:` 主面板/侧栏插槽与相对 `/api2` 路由参考了已安装的 DSH Store，但本插件的路由尚未在隔离 Desktop 环境中实测，界面也未做可视化核验。仓库不包含工作进程实现；下载源码不代表已安装 Profile 或操作任何进程。
