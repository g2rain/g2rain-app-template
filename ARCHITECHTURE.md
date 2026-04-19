# {{PROJECT_NAME}} 架构说明

本文档沉淀模板项目的架构与设计；启动、发布、代码生成、配置生成请看 `README.md`。

## 1. 目标与定位

`{{PROJECT_NAME}}` 是一个可复用的微前端子应用模板，目标是：
- 兼容独立运行与 qiankun 子应用挂载
- 统一认证与 Token 传递规范
- 提供可扩展的业务代码生成与资源配置生成能力
- 支持容器化部署与可选 Lua 签名链路

## 2. 总体技术栈

前端：
- Vue 3 + TypeScript + Vite
- Vue Router + Pinia
- Element Plus
- Axios
- qiankun

运行时（可选）：
- OpenResty（Nginx + Lua）
- lua-resty-openssl
- ES256 签名（ECDSA P-256 + SHA-256）

## 3. 运行模型

### 3.1 双模式运行

1) 独立运行模式  
- 直接访问子应用地址  
- Token 可在本地持久化  

2) 子应用模式  
- 由主应用通过 qiankun 加载  
- Token 从主应用 `props` 注入  
- 关闭子应用本地 token 持久化，避免冲突  

模式识别基于 `window.__POWERED_BY_QIANKUN__`。

### 3.2 qiankun 生命周期

核心在 `src/main.ts` 与 `src/qiankun.ts`：
- `bootstrap`
- `mount`
- `unmount`
- `update`

`mount` 阶段负责接收主应用参数并初始化 token。

## 4. 认证与 Token 设计

Token 管理位于 `src/store/modules/token.ts`，核心策略：
- 子应用模式：只接收主应用 token，不持久化
- 独立运行模式：按本地登录链路持久化与刷新

主应用与子应用约定的最小参数：
- `token`
- `tokenKid`

`QiankunProps` 保留扩展字段，便于主应用后续传递更多上下文。

## 5. 环境配置设计

环境变量由 `src/utils/env.ts` 统一读取。模板变量保留如下：
- `VITE_APPLICATION_CODE={{PROJECT_NAME}}`
- `VITE_BASE_URL`
- `VITE_BACKEND_ORIGIN`
- `VITE_APPLICATION_CONTEXT`
- `VITE_IAM_ORIGIN`
- `VITE_REFRESH_TOKEN_URL`
- `VITE_GENERATE_TOKEN_URL`
- `VITE_SSO_BASE_URL`
- `VITE_AUTH_END_POINT`
- `VITE_REDIRECT_URI`
- `VITE_SERVER_PORT`

设计原则：
- 前端构建变量在构建阶段注入
- 容器运行变量用于 Nginx/Lua 层，不直接替代前端构建变量

## 6. 路由与基路径

路由入口：`src/router/index.ts`  
历史模式：`createWebHistory(env.VITE_BASE_URL)`

因此可按部署路径灵活挂载（如 `/test/`），并与主应用分配路径保持一致。

## 7. Vite 与代理设计

配置入口：`vite.config.ts`，核心关注点：
- `base` 由 `VITE_BASE_URL` 驱动
- 本地代理按网关与 IAM 分流
- 按 `mode` 加载环境变量
- 保证开发态与部署态路径语义一致

## 8. Docker 与运行时

### 8.1 多阶段构建

1) Node 构建阶段：安装依赖并输出 `dist`  
2) OpenResty 运行阶段：托管静态资源，加载 nginx/lua 配置

### 8.2 Lua 签名能力（可选）

`lua/` 目录提供签名示例：
- `config.lua`
- `sign.lua`
- `sign_api.lua`

可通过挂载 `./lua/keys` 注入密钥文件。

## 9. 生成能力（架构视角）

### 9.1 代码生成器

目录：`src/shared/generator/`  
用途：从 `database.sql` 解析表结构，生成视图与配套文件。

### 9.2 资源配置生成器

目录：`src/shared/config-util/`  
用途：从路由、Vue 权限点、API 定义生成资源配置 JSON。

这两部分构成模板的“低代码加速层”。

## 10. 目录结构

```text
{{PROJECT_NAME}}/
├── src/
│   ├── main.ts
│   ├── qiankun.ts
│   ├── router/
│   ├── store/
│   ├── utils/
│   ├── views/
│   ├── shared/generator/
│   └── shared/config-util/
├── lua/
├── nginx/
├── Dockerfile
├── vite.config.ts
└── package.json
```

## 11. 模板项目约定

- 文档中的 `{{PROJECT_NAME}}`、域名、路径均为占位示例
- 初始化业务项目后需替换为真实值
- 若主应用路径调整，需同步校准 `VITE_BASE_URL` 与回调路径

# {{PROJECT_NAME}} 架构说明

本文档承接原 `README.md` 中的架构与设计内容；操作类说明（启动、发布、生成代码、生成配置）请查看 `README.md`。

## 🎯 项目简介

`{{PROJECT_NAME}}` 是一个微前端子应用模板，支持：

- 作为 qiankun 子应用由主应用加载
- 独立运行（便于开发与排障）
- SSO/DPoP Token 管理
- 前后端联调与容器化部署

## 🛠 技术栈

### 前端技术栈

- Vue 3 + TypeScript + Vite
- Element Plus
- Pinia + 持久化插件
- Vue Router
- Axios
- qiankun

### 后端/运行时（可选）

- OpenResty (Nginx + Lua)
- lua-resty-openssl
- ES256 (ECDSA P-256 + SHA-256) 签名链路

## ✨ 核心设计

### 1) 双模式运行

1. 独立运行模式
   - 直接访问子应用 URL
   - Token 可本地持久化
2. 子应用模式
   - 由主应用通过 qiankun 挂载
   - Token 由主应用 props 下发
   - 自动关闭子应用侧持久化，避免与主应用冲突

运行模式通过 `window.__POWERED_BY_QIANKUN__` 自动识别。

### 2) Token 管理策略

`src/store/modules/token.ts` 中区分了主/子应用模式：
- 子应用：接收主应用 token，不做持久化
- 独立运行：按常规流程存储与刷新 token

### 3) qiankun 生命周期

在 `src/main.ts` / `src/qiankun.ts` 中导出标准生命周期（`bootstrap`、`mount`、`unmount`、`update`），并在 `mount` 时完成 token 初始化。

## ⚙️ 环境配置设计

关键变量由 `src/utils/env.ts` 统一读取，所有模板变量保持可替换：

- `VITE_APPLICATION_CODE={{PROJECT_NAME}}`
- `VITE_BASE_URL`
- `VITE_BACKEND_ORIGIN`
- `VITE_APPLICATION_CONTEXT`
- `VITE_IAM_ORIGIN`
- `VITE_REFRESH_TOKEN_URL`
- `VITE_GENERATE_TOKEN_URL`
- `VITE_SSO_BASE_URL`
- `VITE_AUTH_END_POINT`
- `VITE_REDIRECT_URI`
- `VITE_SERVER_PORT`

设计要点：
- 前端构建变量在构建时注入
- 运行时容器变量用于 Nginx/Lua 层（非前端代码注入）

## 🔗 qiankun 集成约定

主应用加载时需传入（最小集）：
- `token`
- `tokenKid`

`QiankunProps` 接口位于 `src/qiankun.ts`，并保留扩展字段以兼容主应用侧扩展参数。

## 🛣️ 路由设计

- 路由定义：`src/router/index.ts`
- 历史模式：`createWebHistory(env.VITE_BASE_URL)`
- 支持按部署路径调整基础路由（如 `/test/`）

## ⚙️ Vite 配置设计

配置入口：`vite.config.ts`

核心点：
- `base` 由 `VITE_BASE_URL` 驱动
- 开发代理区分网关与 IAM
- 支持按 `mode` 读取环境变量
- 与子应用部署路径保持一致

## 🐳 Docker 与运行时设计

### 多阶段构建

1. Node 阶段：安装依赖并构建前端产物
2. OpenResty 阶段：承载静态资源、Nginx 配置与 Lua 能力

### Lua 签名能力（可选）

目录 `lua/` 提供签名示例实现：
- `config.lua`
- `sign.lua`
- `sign_api.lua`

可选挂载密钥目录：`./lua/keys`

## 🧱 目录结构

```text
{{PROJECT_NAME}}/
├── src/
│   ├── main.ts
│   ├── qiankun.ts
│   ├── router/
│   ├── store/
│   ├── utils/
│   ├── views/
│   ├── shared/generator/
│   └── shared/config-util/
├── lua/
├── nginx/
├── Dockerfile
├── vite.config.ts
└── package.json
```

## 📝 补充说明

- 本项目是模板工程，文档中的 `{{PROJECT_NAME}}`、路径与域名均为占位示例。
- 创建具体业务项目后，请按实际主应用路径、网关地址、IAM 地址替换。
