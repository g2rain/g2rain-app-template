# g2rain-app-template

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

官方微前端子应用模板（Vue 3 + Vite + qiankun + Element Plus）。推荐使用脚手架 [**create-g2rain-app**](https://github.com/g2rain/g2rain-app-cli) 基于本仓库生成工程；技术栈、目录结构、环境变量与运行方式**以本 README 为准**。

**占位符说明**：模板中的 `{{PROJECT_NAME}}`、`{{CONTEXT_PATH}}` 在通过 CLI 创建项目时会被替换为实际值；若直接 clone 本仓库开发模板本身，请自行理解或替换占位符。

**版本对齐**：依赖版本与 [g2rain-manager-app](https://github.com/g2rain/g2rain-manager-app) 保持一致（Vue 3.5、Vite 7、TypeScript 5.9、Node.js >= 22）。

## 📋 目录

- [环境](#1-环境)
- [安装](#2-安装)
- [`.env` 配置](#3-env-配置)
- [启动](#4-启动)
- [运行模式与 main-shell 交互](#5-运行模式与-main-shell-交互)
- [构建与预览](#6-构建与预览)
- [Docker](#7-docker)
- [生成代码](#8-生成代码)
- [生成配置](#9-生成配置)
- [文档](#10-文档)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)
- [联系我们](#-联系我们)
- [致谢](#-致谢)

## 1. 环境

- Node.js >= 22（与 `package.json` 中 `engines` 一致）
- npm >= 9

## 2. 安装

```bash
npm install
```

## 3. `.env` 配置

### 最小配置

```env
VITE_APPLICATION_CODE={{PROJECT_NAME}}
VITE_CONTEXT_PATH=/{{CONTEXT_PATH}}
VITE_BACKEND_ORIGIN=http://localhost:8080
VITE_TOKEN_END_POINT=/auth/token
VITE_AUTH_END_POINT=/auth/authorize
VITE_MOCK_ENABLED=false
VITE_SERVER_PORT=3000
VITE_SSO_BASE_URL=http://localhost:8080
VITE_REDIRECT_URI=/sso_callback
# 运行模式：空=集成意图（直链会跳 main-shell 网关）；alone=独立运行
# VITE_RUN_MODE=alone
# main-shell 子应用网关前缀（与 main-shell VITE_CONTEXT_PATH 一致时为 /main/redirect）
VITE_MAIN_SHELL_REDIRECT_PREFIX=/main/redirect
# 开发时子应用与 main-shell 不同端口时填写 main-shell 的 origin
VITE_MAIN_SHELL_ORIGIN=http://localhost:3000
# 国际化文案包 tags（逗号分隔；共享层在前，应用 tag 在后）
VITE_I18N_TAGS=G2RAIN_SHARED
```

### 环境变量说明

| 变量名 | 说明 | 示例 | 必填 |
|--------|------|------|------|
| `VITE_APPLICATION_CODE` | 应用代码（资源路由、qiankun 名称） | `g2rain-cms-app` | ✅ |
| `VITE_CONTEXT_PATH` | 上下文路径（URL 前缀，带前导 `/`） | `/cms` | ✅ |
| `VITE_BACKEND_ORIGIN` | 后端服务地址 | `http://localhost:8080` | ✅ |
| `VITE_SSO_BASE_URL` | SSO 跳转基础地址 | `http://localhost:8080` | ✅ |
| `VITE_AUTH_END_POINT` | 认证端点路径 | `/auth/authorize` | ✅ |
| `VITE_REDIRECT_URI` | SSO 回调路径 | `/sso_callback` | ✅ |
| `VITE_TOKEN_END_POINT` | Token 端点路径 | `/auth/token` | ✅ |
| `VITE_MOCK_ENABLED` | 是否启用 Mock | `true` / `false` | ❌ |
| `VITE_SERVER_PORT` | 开发服务器端口 | `3001` | ❌ |
| `VITE_RUN_MODE` | 运行模式（空=集成意图；`alone`=独立运行） | `alone` | ❌ |
| `VITE_MAIN_SHELL_REDIRECT_PREFIX` | main-shell 网关前缀 | `/main/redirect` | ❌ |
| `VITE_MAIN_SHELL_ORIGIN` | 开发跨端口时 main-shell 的 origin | `http://localhost:3000` | ❌ |
| `VITE_I18N_TAGS` | 国际化文案包 tags（逗号分隔） | `G2RAIN_SHARED,MY_APP` | ❌ |

生产环境使用 `.env.production`，配置方式相同。`VITE_SSO_BASE_URL` 可使用 `${SSO_BASE_URL}` 占位符，在 Docker 容器启动时替换。

## 4. 启动

```bash
npm run dev
```

默认访问：`http://localhost:3000/{{CONTEXT_PATH}}/`（端口与 `VITE_CONTEXT_PATH` 以 `.env` 为准）。

## 5. 运行模式与 main-shell 交互

子应用有三种入口，由 `VITE_RUN_MODE`、是否在 qiankun 内、以及浏览器 URL 共同决定（`?mode=alone` 优先于环境变量）。

| 场景 | 条件 | 行为 |
|------|------|------|
| **qiankun 集成** | 由 [g2rain-main-shell](https://github.com/g2rain/g2rain-main-shell) 挂载 | Token / 语言等由主应用 props 下发；路由 base 为 `VITE_CONTEXT_PATH` |
| **集成意图直链** | `VITE_RUN_MODE` 为空，且未在 qiankun 内 | 自动跳转 main-shell 网关：`/main/redirect{当前 path}` |
| **独立运行** | `VITE_RUN_MODE=alone` 或 URL 带 `?mode=alone` | 子应用自行完成 SSO、Token 持久化与路由初始化 |

### 开发时独立运行（推荐日常开发页面）

在 `.env` 中设置：

```env
VITE_RUN_MODE=alone
```

然后启动子应用，无需同时启动 main-shell：

```bash
npm run dev
```

也可不改 `.env`，临时用查询参数：`http://localhost:3001/{{CONTEXT_PATH}}/?mode=alone`

### 开发时联调 main-shell 集成

1. 注释或删除 `.env` 中的 `VITE_RUN_MODE=alone`（保持为空）。
2. 配置 `VITE_MAIN_SHELL_ORIGIN` 为 main-shell 开发地址（如 `http://localhost:3000`）。
3. 分别启动 main-shell 与本仓库。

跨端口本地开发时必须配置 `VITE_MAIN_SHELL_ORIGIN`，否则网关跳转会无法命中 main-shell dev server。

## 6. 构建与预览

```bash
npm run build
npm run preview
```

## 7. Docker

### 构建镜像

```bash
docker build -t g2rain/{{PROJECT_NAME}}:latest .
```

### 运行容器

```bash
docker run -d \
  -p 8080:80 \
  -e CONTEXT_PATH=/{{CONTEXT_PATH}} \
  -e SSO_BASE_URL=https://sso.example.com \
  -e GATEWAY_HOST=gateway.example.com \
  -e GATEWAY_PORT=80 \
  -e IAM_HOST=iam.example.com \
  -e IAM_PORT=80 \
  g2rain/{{PROJECT_NAME}}:latest
```

## 8. 生成代码

```bash
npm run build:generate -- --tables=dict
```

可选：`--no-view` `--no-api` `--no-mock` `--no-route`

## 9. 生成配置

```bash
npm run build:config
```

输出：`src/shared/config-util/config/`

## 10. 文档

- 架构：`ARCHITECHTURE.md`
- 代码生成器：`src/shared/generator/README.md`
- 配置生成器：`src/shared/config-util/README.md`
- 国际化：`src/platform/i18n/README.md`

## 🤝 贡献指南

我们欢迎所有形式的贡献！

**Issue 与讨论**请统一到主仓库 [g2rain/g2rain](https://github.com/g2rain/g2rain/issues) 提交，便于集中跟踪；请在标题或正文中注明与 **g2rain-app-template** 相关。

### 贡献流程

1. **Fork** 本仓库
2. **创建特性分支**：`git checkout -b feature/your-feature-name`
3. 本地修改后执行 `npm run build`，确保可正常编译
4. **提交更改**：`git commit -m "Add some feature"`
5. **推送分支**：`git push origin feature/your-feature-name`
6. **提交 Pull Request**

维护者信息与 `package.json` 中 `contributors` 字段一致（与 [g2rain-spring-boot-starter](https://github.com/g2rain/g2rain-spring-boot-starter) 开发者信息对齐）。

安全相关问题请见 [SECURITY.md](SECURITY.md)。

## 📄 许可证

本项目基于 [Apache 2.0许可证](LICENSE) 开源。

## 📞 联系我们

- **Issues**: [GitHub Issues](https://github.com/g2rain/g2rain/issues)
- **讨论**: [GitHub Discussions](https://github.com/g2rain/g2rain/discussions)
- **邮箱**: g2rain_developer@163.com

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者们！

---

⭐ 如果这个项目对您有帮助，请给我们一个Star！
