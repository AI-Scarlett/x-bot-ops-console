# X 运维台插件验收状态

**结论：v0.2.2 源码与 Node 测试通过（E2）；支持在插件内一键「自动更新」，直接调用 DSH 原生包管理器从 GitHub 拉取最新版本并热更新，免除手动复制地址或重装流程。**

## v0.2.2 升级说明
- **一键「🔄 自动更新」按钮**：在运维台顶部工具栏增加醒目的自动更新按钮与版本标识，点击确认后全自动执行更新。
- **免手动复制地址与重装**：后端直接调用 DSH 宿主内置的 `pnpm` 对 `~/.dsh/profiles/desktop` 和 `~/.dsh/profiles/web` 执行 `add github:AI-Scarlett/x-bot-ops-console`，解决 DSH 原生安装弹窗提示“已安装需先卸载”的问题。
- **一键跳转 DSH 原生管理**：通过 `ctx.pluginNavigation` 接入原生插件导航能力，支持在原生插件页面一键定位当前插件。
- **即时更新反馈与快捷刷新**：自动更新完成后展示最新版本号与 Git Commit 哈希，并提供「立即刷新网页」一键载入最新代码。

## v0.2.1 升级说明
- **大模型配置读取 DSH 模型列表**：从 DSH 桌面与 Web Profile（`cordis.patch.yml`）实时读取环境配置的 60+ 款大模型列表。
- **全 Worker 独立模型选择器（ModelPicker）**：前端界面支持为“自动评论”、“提及回复”、“自动发帖”、“主页巡航”以及“全局默认”一键下拉选择 DSH 模型，并支持自定义输入。
- **全 Worker 独立提示词（Custom Prompt）配置**：
  - 自动评论：支持单独配置自定义提示词（文风、人设、语气等）；
  - 提及回复：支持单独配置全局补充提示词（尊卑称谓、行文规则等）；
  - 自动发帖：支持单独配置原创推文 Prompt 与话题灵感池；
  - 主页巡航：支持单独配置好友主页推文互动的文案 Prompt。
- **Python 4 Worker 矩阵热加载**：所有 4 套 Worker 在每轮周期中自动读取共享配置，无需手动重启。

## v0.2.0 升级说明
- **4 Worker 矩阵全面支持**：从 2 Worker 扩展为 4 Worker 架构（自动评论、提及回复、自动发帖、主页巡航与定向互动）。
- **打通闭环插队队列**：提及回复 Worker 自动提取对方对话中的主页访问/置顶推文邀请意图，推入 `profile_visit_queue.json`；主页巡航 Worker 优先消费插队队列，完成主页互动闭环。
- **UI 新增专属 Tab**：新增“📝 自动发帖”与“🧭 主页巡航”两个专属配置与监控 Tab，重点名单 Tab 继续稳妥放置在最后。
- **全套监控与进程生命周期管理**：支持 4 个 Worker 独立的启动、停止、重启、暂停控制，以及心跳和日志读取。

## v0.1.10 升级说明
- 重点名单 tab 已移至最后，插件默认打开通用配置页。
- 删除只读静态特例卡片，改为编辑 Apex/易经用户名、启用状态与附加提示词；支持编辑并删除免回复句柄。
- 回复 worker 动态消费 Apex/易经用户名、特例提示词及 skipReplyHandles；评论 worker 消费相同特例配置与 skipFinanceComments。其余 `specialReplies` 和布尔规则并未谎称已接入。
- 两个 Python worker 热加载共享配置，无需重启；配置校验拒绝格式错误/超长值。

## v0.1.8 升级说明
- **重点名单独立 Tab 维护**：将重点人群名单、轮次上限与文风定制抽离为一级独立 Tab（`👥 重点名单与个性化配置`），作为默认展示页。
- **人物特例清晰标示**：
  - 标明 Apex 独占对象 `4ggug`（情欲直接表达、文言文与诗词歌赋直抒爱恋）；
  - 标明 Tier 1 特例人物 `mrchen1998`（专属走《易经》卦象爻辞风格，不走楚辞，不要「兮」）；
  - 详细标明各档位人群（核心互访、熟人、活跃关注、普通互关、未分档用户）的基准人设与定制提示词入口。
- **四个独立 Tab 架构**：
  1. `👥 重点名单与个性化配置`：专注于各圈层名单增删与人设提示词调优；
  2. `🌐 通用与公共配置`：配置共享配置状态、公共休眠时段、防限流节奏、8 类特殊场景指引与安全开关；
  3. `💬 自动评论独立配置`：任务状态监控、控制开关、评论时段与模型池端口；
  4. `↩️ 提及回复独立配置`：任务状态监控、控制开关、提及通知时段与推理模型指定。

## v0.1.7 升级说明
- **𝕏 官方图标**：插件侧边栏与标题全面更换为简洁大气的官方 𝕏 (Twitter) 矢量 Logo。
- **多 Tab 选项卡架构**：
  - **🌐 通用与公共配置 Tab**：分层重点名单（含各档位回复轮次、人群定制文风）、通用运行时段与防限流节奏、8 种特殊场景回复与文风提示词参考、安全规则开关；
  - **💬 自动评论独立配置 Tab**：评论 worker 运行状态卡片、启动/停止/重启/暂停控制、Chrome 9222 调试状态、最近日志/看门狗诊断、评论取推窗口、作者冷却时间、本地模型池端口覆盖；
  - **↩️ 提及回复独立配置 Tab**：回复 worker 运行状态卡片、启动/停止/重启/暂停控制、Chrome 9223 调试状态、最近日志/看门狗诊断、提及通知处理窗口、指定推理大模型名称（支持空值回退默认模型）。
- **特殊场景与文风丰富**：展示 8 类特殊交互场景（问及 AI、要求停止、问候关怀、表达好感、称谓称呼、叫爸爸拒绝、称帝称皇、白话翻译）的行为准则与参考提示词。
- **两端无缝兼容**：完全向下兼容现存两份 Python worker 的数据读取逻辑，配置保存无感知热更新。

## v0.1.6 升级说明与白屏修复
- **修复白屏崩溃**：修复点击“用 worker 内置名单填充”时将 `tier.handles` 赋为字符串导致 React 渲染抛出 `tier.handles.join is not a function` 进而引发整页空白的缺陷。
- **添加 React 错误边界（SafeBoundary）**：在运维台外层包裹 ErrorBoundary，即使发生偶发渲染异常也会显示错误提示与“重试恢复”按钮，彻底根治白屏崩溃。
- **替换 window.confirm 为原生安全对话框**：移除 Electron 渲染进程中不兼容的阻塞式 `window.confirm`，改用全平台安全无阻塞的内联模态弹窗（`confirmModal`）。
- **优化草稿防冲刷机制**：修正自动轮询逻辑，当有未保存草稿时自动保留当前编辑内容，不被后台心跳数据冲刷。
- **防御性数据访问**：对 `config` 各层属性（`tiers`, `model`, `timing`, `specialReplies`, `rules`）及 `handles` 分割格式化进行全局防御性校验。

## 当前证据

- 官方 CLI 可安装 `.tgz` 到 `$DSH_HOME=/tmp/dsh-x-bot-ops-acceptance` 下的 `web` Profile。
- `dsh --profile web --dump-config` 显示 `dsh-x-bot-ops-console` entry，且声明 `inject: [connection]`。
- Web Profile cold boot loopback 服务正常启动。
- API 路由已接入 DSH 0.2.1-rc.5 公开 Connection Fetch 服务（`/api/x-bot-ops-console`），由 Connection 统一负责鉴权：
  - 未认证请求（无 session cookie）返回 401 Unauthorized。
  - 携带伪造 `Origin: http://attacker.invalid` 与 `Sec-Fetch-Site: cross-site` 的请求返回 403 Forbidden。
  - 经由官方 launch token 完成认证并携带 session cookie 的同源 GET 请求返回 200，并返回完整状态与配置 JSON。
- 浏览器 Client 脚本已确认随官方 Combo 脚本分发包注入 `__DSH_BOOT__` 并成功获取（HTTP 200，大小约 2MB，内含 `dsh-x-bot-ops-console` 模块及 `xBotOpsConsole` 命名空间）。
- 静态审计 77/80，无静态 blocker；Node 测试 29/29 全部通过。
- 真实 Profile 未修改；没有停止、启动或重启评论/回复 worker。

## 发布说明

- 包名/版本：`dsh-x-bot-ops-console@0.1.5`
- 遵循 MIT 开源协议。
- 用户可从 GitHub Release 下载或通过 Git 手动更新安装。
- 真实环境使用时，请确认 `~/Library/Application Support/XBotOpsConsole/config.json` 与 `console-targets.json` 配置正确，初次使用建议先查看面板只读状态。
