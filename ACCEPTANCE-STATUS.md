# X 运维台插件验收状态

**结论：E3 通过，v0.1.6 修复前端白屏与交互问题。**

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
