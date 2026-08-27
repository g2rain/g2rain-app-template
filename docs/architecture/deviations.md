# 已知架构偏差

本项目采用 g2rain `frontend-app 1.0.0-draft`。本页记录当前源码相对中央 Profile 的已知偏差；状态为“待迁移”不表示普通需求自动获得修改授权，新增代码不得扩大这些依赖。

## DEV-001：components 反向依赖 platform/runtime/views

### 状态

待迁移。

### 证据

- `components/http/index.ts` 引用 `platform/apps/types`。
- `components/http/interceptors/base.ts` 引用 `platform/locale`。
- `components/http/mock-data` 引用 runtime 资源类型和 shared 生成配置。
- `components/RemoteSelect` 中 Dict、Organ、StatusSwitch 引用 platform Store/i18n 和 views API。

### 风险与方向

通用组件无法脱离当前 App 复用，并可能形成循环依赖。应将通用 HTTP/Select 内核与 g2rain 平台封装拆开，通过接口、props 或 provider 注入 Token、Locale、字典和机构查询；领域封装上移到 platform/runtime/views。

## DEV-002：platform 反向依赖 runtime

### 状态

待迁移。

### 证据

- `platform/apps/adapter.qiankun.ts` 调用 runtime boot、router 和 micro-shells。
- `platform/i18n`、`platform/stores/locale.store.ts` 调用 runtime API。

### 风险与方向

平台能力与当前应用启动实现绑定。qiankun 适配器应只实现平台协议，具体 boot/router 回调由组合根注入；i18n/locale 的远程加载接口由 runtime 注册 provider。

## DEV-003：runtime 直接引用 views

### 状态

接受为当前组合方案，目标是依赖反转。

### 证据

- `runtime/boot/router.ts` 引用 `views/route-map.ts`。
- `runtime/router` 的系统路由直接导入 Home 和 SSO Callback 页面。

### 风险与方向

runtime 无法作为独立应用运行时复用。建议由 views 导出页面注册表，在 `main.ts` 创建 runtime 时传入；系统页面可以定义清晰的 application-shell 边界。

## DEV-004：TypeScript any 技术债

### 状态

渐进治理。

### 说明

`tsconfig` 已启用 `strict`，但 HTTP 泛型、qiankun/window 扩展、错误详情、Mock 和部分 UI 适配仍存在显式 `any`。旧规范中的“禁止任何 any”与当前实现不一致。

新代码默认使用 `unknown`、泛型、类型守卫和模块扩展；确需 `any` 时限定在第三方边界并说明原因。迁移不应为了消除文本而引入错误断言。

## DEV-005：开发端口与容器端口声明不一致

### 状态

待统一。

### 说明

- `.env` 和 shared env 默认值写 `3000`，Vite server 实际从 `process.env.VITE_SERVER_PORT` 读取并回退到 `3001`。
- Dockerfile `EXPOSE 8080`，容器入口的 `SERVER_PORT` 默认值为 `80`。

在代码统一前，开发命令显式设置 `VITE_SERVER_PORT`，部署显式设置 `SERVER_PORT=8080`。文档按当前执行代码说明，不把声明值混为同一个端口。

## DEV-006：资源配置 API 端点生成未启用

### 状态

功能未完成。

### 说明

`parser/api.ts` 已存在，但 `config-util/index.ts` 中调用被注释，`generator/json.ts` 也未写出 `api-endpoints.json`。当前命令只生成页面和页面元素，`resources.json.apiEndpoints` 为空。启用前需要测试解析准确性、去重、服务/路由前缀语义和后端导入契约。

## DEV-007：生产构建存在循环分块与体积警告

### 状态

构建通过，待专项优化。

### 当前警告

- `runtime/auth` 的 `sso` 重导出与 SSO Callback 形成 Rollup 循环分块风险，构建器提示可能破坏执行顺序。
- platform/apps、runtime/boot、runtime/router、micro-shells 和 main 的静态/动态导入交织，无法按预期拆分 Chunk。
- 主 JavaScript Chunk 当前约 `1.6 MB`（未压缩），超过 Vite 默认警告阈值。
- MockJS 的 `eval` 被生产构建扫描，说明 Mock 相关代码仍进入依赖图。
- `env-config.js` 作为在主模块前执行的经典脚本，会产生 Vite “无法打包”提示；这是当前运行时注入设计，但仍需验证 CSP、缓存和加载顺序。

### 演进方向

优先解除跨层循环依赖和 `sso` 重导出循环，再设计稳定的 manualChunks；让 Mock 注册仅在开发/显式 Mock 条件下进入构建图；为 `env-config.js` 明确缓存与 CSP 策略。不能只提高 chunk 警告阈值隐藏问题。

## DEV-008：脚手架生成后文档身份未参数化

### 状态

待 CLI 与模板协同修复。

### 说明

`g2rain-app-cli` 当前会复制本仓库的 `AGENTS.md` 和 `docs/**`，但只替换固定业务文件与 `package.json.name`。实测生成项目的 `docs/project.yaml` 仍标识为 `g2rain-app-template`，其他文档也可能继续使用模板维护语境。

模板与 CLI 应共同定义生成项目文档 manifest，写入真实项目名、仓库标识、中央 Profile 版本、CLI 版本和模板 Ref；生成集成测试应确认业务 App 不再携带模板仓库身份。修复前，使用模板创建项目后必须人工校正文档元数据。
