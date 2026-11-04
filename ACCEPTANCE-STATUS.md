# X 运维台插件验收状态

**结论：E3 通过（Web 运行时及公开 Connection 鉴权验证完成），准备发布 v0.1.5。**

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
