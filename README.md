# X 自动化运维台

**License:** MIT. See [`LICENSE`](LICENSE); copyright and permission notice must accompany copies or substantial portions.

这是一个 DSH 插件，为用户自备的两类 X 自动化工作进程提供可视化运维面板：自动评论和提及回复。本插件不包含这两类工作进程。桌面面板默认显示中文，不随系统英文语言设置切换为英文。

**Host 适配说明：**客户端检测 Desktop 的 `dsh-app:` 渲染器，并注册原生 `main` 主面板与侧栏入口。Host 在 `profileContext.name === 'desktop'` 时选择 `/api2/x-bot-ops-console`；Web 仍使用原有路由。桌面端通过相对 `/api2` URL 请求服务，遵循已安装 DSH Store 的精确路由模式。两个路由均使用 DSH 公共 `Connection.requestRejection` 授权接口。客户端包元数据遵循已安装 DSH Store 的 `platform: web` 惯例，同时增加 Desktop 渲染器分支。此实现参考了已安装的路由/插槽模式，但 X 面板尚未在隔离或真实 Desktop 环境中验收；源码测试不能证明界面已可见或操作可用。

## 当前功能

- 展示已核验的工作/监控进程身份、心跳时长、暂停状态、Chrome 调试端口和有限长度的日志尾部。
- 桌面端面板默认使用中文，并会说明操作按钮为何不可用。只有相应脚本文件存在、且所有运行中的进程身份均核验通过时，才开放生命周期控制。
- 面板主体是一个固定视口高度的滚动容器，内容再长也可在面板内滚动到底部的配置与保存按钮。
- 每项任务均提供暂停/恢复、监控进程启动/停止和工作进程重启控制。每项操作均需确认；启动会拒绝重复监控进程，且只报告已提交启动请求；停止通过协作标记进行；重启只会向命令行匹配配置脚本的进程发送信号。
- 提供模型名称及可选 LocalModelHub 端口覆盖、六档重点名单（默认名单为空）、回复风格与轮次上限、工作/休息时段、静默/完全暂停时段、发布间隔、评论/提及时间窗口、作者冷却和限流等待等可视化配置。特殊回复文本仅作为明确标注的草稿。
- 两个工作进程每轮会重新读取经过校验的共享配置；配置文件权限为 0600，大小受限且不含模型密钥。插件将配置写入 Application Support 主文件，并原子同步 `xops_config.json` 到各工作进程目录。插件不包含工作进程脚本，需用户自行提供；启用控制前请核对固定脚本路径。

## 安装与配置

1. 自行准备评论和提及回复工作进程脚本。本插件不包含或安装这些脚本。
2. 固定默认路径为 `~/XBotOpsConsole/comment-worker/comment_worker.py` 和 `~/XBotOpsConsole/reply-worker/reply_worker.py`；每个目录还应有对应的 `*_watchdog.py`。将自有脚本放到这些位置，或修改 Host 源码中的路径并重新安装。只有对应的两个脚本都存在且运行中的进程身份已核验时，面板才会开放操作按钮。
3. 如果脚本不在默认位置，可在用户本机创建 `~/Library/Application Support/XBotOpsConsole/console-targets.json`，按任务写出真实路径，无需修改或重新安装插件：

   ```json
   {
     "targets": {
       "comment": { "dir": "/绝对路径/comment", "worker": "/绝对路径/comment/worker.py", "watchdog": "/绝对路径/comment/watchdog.py", "watchdogPid": "/绝对路径/comment/watchdog.pid", "stop": "/绝对路径/comment/watchdog.stop", "pid": "/绝对路径/comment/worker.pid", "log": "/绝对路径/comment/worker.log", "heartbeat": "/绝对路径/comment/heartbeat.json", "rate": "/绝对路径/comment/rate_limit.json", "port": 9222 },
       "reply": { "dir": "/绝对路径/reply", "worker": "/绝对路径/reply/worker.py", "watchdog": "/绝对路径/reply/watchdog.py", "watchdogPid": "/绝对路径/reply/watchdog.pid", "stop": "/绝对路径/reply/watchdog.stop", "pid": "/绝对路径/reply/worker.pid", "log": "/绝对路径/reply/worker.log", "heartbeat": "/绝对路径/reply/heartbeat.json", "rate": "/绝对路径/reply/rate_limit.json", "port": 9223 }
     }
   }
   ```

   仅接受绝对路径；缺失字段沿用默认值。该文件位于本机，不随插件仓库分发。
4. 使用 DSH 官方支持的插件管理器，将插件安装到目标 Profile。
5. 打开 **X 运维台**，配置模型名称、回复档位、账号名单和时段。默认名单为空，模型为占位名称。操作前请核对工作进程路径、设置真实模型，并按自身规则审查默认时段与回复风格。
6. 初次使用先只查看状态。启动、停止、暂停和重启都会影响真实自动化任务，请仅在确认希望产生对应效果时操作。

## 运行配置的生效范围

两个工作进程都会读取名单和回复风格。模型名称与回复轮次仅由提及回复进程读取；模型端口覆盖仅由评论进程读取。部分时段字段虽共享，但在两个进程中的实际作用并不完全相同。内置特殊回复分支仍由用户提供的原始脚本决定；面板中的特殊回复内容仅作为建议草稿保存，不会覆盖脚本内置逻辑。布尔规则开关目前也未接入运行逻辑。界面会标注仅部分生效、仅回复侧或仅评论侧的字段；在完成接入和测试前，不应认为这些设置已生效。

面板不会读取 LocalModelHub 凭据、Cookie、消息正文或私有数据库；仅显示有限长度的日志尾部，并隐藏类似 Bearer 的令牌文本。控制操作仅支持 macOS，会影响真实自动化进程。本次修复没有触发任何进程操作。

## DSH 插件包说明

- 本插件采用 Standard Bundle 结构，并添加唯一的 `dsh-x-bot-ops-console` 条目。客户端保留 Web 侧栏/主面板，并针对 `dsh-app:` 桌面渲染器注册独立的主面板和侧栏入口；该接入方式参考已安装的 DSH Store 插件。
- 当 `ctx.profileContext.name === 'desktop'` 时，Host 使用 `/api2/x-bot-ops-console`；其他 Profile 使用 `/_dsh/x-bot-ops-console`。桌面客户端通过相对 `/api2` URL 请求服务，遵循已安装 DSH Store 的精确路由模式。两个路由均通过 DSH 公共 `webServer` 服务注册，并等待 Connection 完成请求授权。
- 源码包含桌面原生面板/API 适配，但桌面专属的路由与界面仍未在隔离的 Desktop 运行环境中验收。完成隔离运行和可见界面回读前，不应声称 E3/E4 验收通过。
- 浏览器端代码不导入 Node.js 模块；请求保持同源，并使用 DSH Connection 授权。
- 进程启动通过 DSH `subprocess` 服务使用固定脚本路径和参数数组，不拼接 shell 命令。进程身份核验及异步启动语义仍需在隔离的 DSH 环境中实测。
- 架构选择：使用 Host + Client Bundle，而不是让浏览器直接编辑脚本或执行系统操作；也不采用仅提供 Tool API 的方案，因为需求是一个常驻的可视化配置面板。Host 路由按 Profile 分别注册，无界面 Profile 可不启用。代价是需要维护 Host 授权边界、子进程服务接入及独立桌面界面验收。

## 测试

运行 `npm test`。单元测试使用临时目录和模拟的工作进程路径，不会读取或操作真实工作进程、X 账号或模型凭据。

## 验证情况

当前验证：发布前已运行隔离的 Node 测试；Desktop E3/E4 验收仍未完成。桌面端 `dsh-app:` 主面板/侧栏插槽与相对 `/api2` 路由参考了已安装的 DSH Store，但本插件的路由尚未在隔离 Desktop 环境中实测，界面也未做可视化核验。仓库不包含工作进程实现；下载源码不代表已安装 Profile 或操作任何进程。
