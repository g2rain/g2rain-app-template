# g2rain-app-template

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-22%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Vue](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite&logoColor=white)](https://vite.dev/)

## 1. 徽标与状态标识
- 当前项目面向 `Node.js 22+`
- 当前模板技术栈为 `Vue 3 + Vite + qiankun + Element Plus`
- 当前默认交付形态为 `OpenResty + Docker`
- 当前开源许可证为 `Apache 2.0`

## 2. 项目简介
`g2rain-app-template` 是 G2rain 平台官方前端子应用模板仓库，用于统一微前端子应用的工程骨架、运行模式、认证安全链路与交付方式。它不仅提供页面开发起点，还提供资源配置生成、权限扫描、独立运行调试、主壳接入联调，以及基于 `OpenResty + Lua` 的应用身份签名能力，是平台子应用的标准实现模板。

## 3. 平台定位

`g2rain-app-template` 位于 G2rain 平台工程化能力层，是平台前端子应用的标准模板仓库。  
它主要服务于需要快速创建、开发、联调和交付子应用的前端研发团队。  
它负责提供统一的前端运行时约定与交付基线，而初始化命令入口由 `g2rain-app-cli` 负责。

## 4. 核心能力

- 微前端模板基座：统一 `Vue 3 + Vite + qiankun` 子应用工程结构
- 多运行模式：支持主壳挂载、独立运行、集成意图直链三种入口模式
- 认证与权限链路：内置 SSO、Token 初始化、权限指令与资源加载机制
- OpenResty + Lua 安全能力：支持 IAM 公钥获取、应用私钥签名与前端到 API 的安全链路
- 代码生成能力：支持根据表结构快速生成页面、API、类型与 Mock
- 资源配置生成能力：支持根据页面、权限点和 API 自动输出平台资源配置 JSON
- 标准交付能力：提供 `Dockerfile`、`build.sh` 与运行时环境注入机制

## 5. 技术栈

- 前端框架：`Vue 3`
- 构建工具：`Vite 7`
- 微前端框架：`qiankun`
- UI 组件：`Element Plus`
- 状态管理：`Pinia`
- 国际化：`vue-i18n`
- 请求与安全：`axios`、`jose`、`elliptic`、`crypto-js`、`js-sha256`
- 工程化工具：`tsx`、`ejs`、`ts-morph`
- 容器运行时：`OpenResty` + `Nginx` + `Lua`

## 6. 快速开始
### 环境要求

- `Node.js 22+`
- `npm 10+`
- 本地调试或镜像构建时可用的 `Docker`

### 安装依赖

```bash
npm install
```

### 开发阶段独立运行

开发阶段可独立运行，方便页面开发与接口调试：

```bash
npm run dev
```

默认可结合以下环境变量使用：

```env
VITE_RUN_MODE=alone
VITE_SERVER_PORT=3001
VITE_CONTEXT_PATH=/{{CONTEXT_PATH}}
VITE_BACKEND_ORIGIN=http://localhost:8080
```

### 联调阶段接入主壳

联调阶段建议部署到测试环境，并接入 `g2rain-main-shell` 进行验证：

1. 保持 `VITE_RUN_MODE` 为空，表示集成意图模式
2. 在主壳中注册该子应用
3. 通过主壳路由进入子应用验证挂载、Token 与资源初始化行为

### 构建前端产物

```bash
npm run build
```

### 构建代码生成产物

```bash
npm run build:generate -- --tables=dict
```

### 生成平台资源配置

```bash
npm run build:config
```

### 构建 Docker 镜像

```bash
./build.sh --image g2rain/{{PROJECT_NAME}} --tag latest --build-mode production
```

## 7. 项目结构

```text
g2rain-app-template/
├── src/
│   ├── components/
│   ├── platform/
│   ├── runtime/
│   ├── shared/
│   └── views/
├── lua/
├── nginx/
├── Dockerfile
├── build.sh
├── .env
├── .env.production
├── ARCHITECHTURE.md
└── ARCHITECTURE_SPEC.md
```

### 核心能力结构说明

#### 1. `src/main.ts`：运行入口与模式分发
- 解决问题：统一处理主壳挂载、独立运行、集成意图直链三种运行模式
- 核心逻辑：
  - 判断当前是否处于 `qiankun` 运行时
  - 判断是否启用 `VITE_RUN_MODE=alone`
  - 在独立模式下自行完成资源初始化与路由装载
  - 在集成模式下注册 `qiankun` 生命周期并等待主壳协同
- 典型场景：开发期独立调试页面，联调期接入 `g2rain-main-shell`

#### 2. `src/runtime`：认证、SSO、路由与资源装载主链路
- 解决问题：让子应用在不同入口模式下都能完成登录态建立、菜单路由生成和页面启动
- 核心逻辑：
  - `auth/sso.ts` 处理 SSO 与 Token 初始化
  - `boot/resource.ts` 负责应用资源加载
  - `boot/router.ts` 根据平台资源生成可访问路由
  - `micro-shells.ts` 管理独立模式与多实例壳上下文
- 典型接入方式：业务页面通常只关心 `views/`，而运行时主链路由模板统一承载

#### 3. `src/platform`：平台适配层
- 解决问题：把标准 Vue 应用包装成可纳入 G2rain 平台治理体系的子应用
- 核心逻辑：
  - `platform/apps` 提供 `qiankun` 生命周期适配与主壳消息协同
  - `platform/stores` 提供语言、Token 等平台级全局状态
  - `platform/error` 提供统一错误模型
- 典型场景：当主壳、平台消息协议或平台级状态约定发生变化时，优先调整这一层

#### 4. `src/shared/generator`：页面生成器
- 解决问题：根据表结构快速生成标准页面、API、类型和 Mock，降低重复开发成本
- 核心逻辑：
  - 读取 `database.sql`
  - 按 `--tables` 解析目标表
  - 渲染 EJS 模板生成 `src/views/<table>/` 目录内容
  - 按规则更新 `src/views/route-map.ts`
- 典型用法：

```bash
npm run build:generate -- --tables=dict,organ --no-mock
```

#### 5. `src/shared/config-util`：资源配置生成器
- 解决问题：把前端页面、按钮权限和 API 端点提取为平台可导入的资源配置
- 核心逻辑：
  - 扫描 `route-map.ts` 获取页面资源
  - 扫描 Vue 中静态 `v-permission` 获取页面元素
  - 扫描 `api.ts` 获取 API 端点
  - 输出 `resources.json`、`pages.json`、`page-elements.json`、`api-endpoints.json`
- 典型用法：

```bash
npm run build:config
```

#### 6. `src/views`：业务页面组织规范
- 解决问题：统一业务页面目录结构，支撑生成式开发与后续手工扩展
- 核心逻辑：
  - 默认按数据库表对应一个目录
  - 每个目录通常包含页面、`api.ts`、`type.ts`、`mock.ts`
  - 也支持根据实际业务新增页面，但建议继续遵循同样的组织规范
- 典型场景：生成后的 CRUD 页面可继续按业务需要扩展复杂页面或子组件

#### 7. `lua` 与 `nginx`：默认应用运行环境与安全链路
- 解决问题：让前端子应用具备默认可交付的容器运行环境，并具备应用级签名能力
- 核心逻辑：
  - `nginx/` 提供默认运行环境配置，基于 `OpenResty` 默认支持 `Lua`
  - `lua/` 中脚本提供 IAM 公钥获取、应用私钥签名等能力
  - `docker-entrypoint.sh` 在启动时生成运行时环境配置并启动服务
- 典型场景：部署到测试或生产环境后，前端通过 `/keys/iam-public-key` 与 `/lua/sign_code` 参与完整身份链路

### 环境变量说明

| 变量 | 含义 | 示例 |
| --- | --- | --- |
| `VITE_APPLICATION_CODE` | 应用编码 | `g2rain-manager-app` |
| `VITE_CONTEXT_PATH` | 子应用访问上下文路径 | `/manager` |
| `VITE_BACKEND_ORIGIN` | 后端服务地址 | `http://localhost:8080` |
| `VITE_SSO_BASE_URL` | SSO 基础地址 | `https://sso.example.com` |
| `VITE_AUTH_END_POINT` | 认证端点 | `/auth/authorize` |
| `VITE_TOKEN_END_POINT` | Token 端点 | `/auth/token` |
| `VITE_REDIRECT_URI` | 登录回调地址 | `https://xxx/manager/sso_callback` |
| `VITE_RUN_MODE` | 运行模式，空表示集成意图，`alone` 表示独立运行 | `alone` |
| `VITE_MAIN_SHELL_REDIRECT_PREFIX` | 主壳重定向前缀 | `/main/redirect` |
| `VITE_MAIN_SHELL_ORIGIN` | 开发联调时主壳地址 | `http://localhost:5173` |
| `VITE_MOCK_ENABLED` | 是否启用 Mock | `true` |
| `VITE_SERVER_PORT` | 本地开发端口 | `3001` |
| `VITE_I18N_TAGS` | 国际化标签集合 | `G2RAIN_SHARED` |

## 8. 常用命令

```bash
npm install
npm run dev
npm run build
npm run build:generate -- --tables=dict
npm run build:config
./build.sh --image g2rain/{{PROJECT_NAME}} --tag latest --build-mode production
```

## 9. 质量与测试
- 当前扫描到源码文件 `144` 个，其中 `TypeScript` 文件 `116` 个、`Vue` 文件 `14` 个
- 当前未识别到自动化测试目录
- 当前质量保障主要依赖构建通过、独立运行验证、主壳联调验证与容器部署验证
- 如后续补充测试，建议优先覆盖运行模式分支、资源扫描规则与安全链路相关工具函数

## 10. 相关仓库

- `g2rain-app-cli`
- `g2rain-main-shell`
- `g2rain-basis`
- `g2rain-iam`
- `g2rain-manager-app`

## 11. 使用建议

- 适合作为所有 G2rain 前端子应用的统一起点
- 开发阶段建议优先独立运行，提高页面调试效率
- 联调阶段应接入 `g2rain-main-shell`，验证主壳协同、资源加载与权限链路
- 生成式页面适合快速起步，复杂业务页面也建议沿用 `src/views` 的统一组织规范
- 若调整 `lua`、`nginx` 或环境变量语义，应同步更新架构文档与 README

## 12. 贡献指南

欢迎通过文档改进、Issue 反馈、模板增强、生成器优化、运行时能力补充等形式参与贡献。  
建议流程：
1. Fork 本仓库
2. 创建特性分支
3. 提交修改
4. 推送分支
5. 提交 Pull Request

提交前请尽量确保：
- 遵循现有技术栈与目录规范
- 更新相关文档
- 补充必要验证
- 不破坏主壳接入与独立运行两类核心场景

## 13. 许可证

本项目基于 [Apache 2.0许可证](LICENSE) 开源。

## 14. 联系我们

- **站点**: https://www.g2rain.com/
- **Issues**: [GitHub Issues](https://github.com/g2rain/g2rain/issues)
- **讨论**: [GitHub Discussions](https://github.com/g2rain/g2rain/discussions)
- **邮箱**: g2rain_developer@163.com

## 15. 致谢

感谢所有为这个项目做出贡献的开发者们。  
如果这个项目对您有帮助，欢迎 Star 支持。
