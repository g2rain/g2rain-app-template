# Components、Platform、Runtime 与 Shared

## Components

当前通用组件包括：

| 模块 | 能力 | 注意事项 |
| --- | --- | --- |
| `http` | 多类型 Axios Client、认证拦截、刷新屏障、参数/请求体序列化和 Mock | 当前仍反向依赖 platform/runtime，新增能力先保持边界 |
| `permission` | 页面元素和 API permission provider、Vue 指令 | 前端判断不替代后端鉴权 |
| `loading` | 全局 Loading 引用管理 | 异常和取消路径必须关闭 |
| `micro-app` | 主子应用事件、消息工厂、类型守卫和 Window 适配 | 新消息需要版本/兼容性和清理设计 |
| `QueryForm` | 查询、基础时间和排序表单 | 业务字段通过插槽扩展 |
| `RemoteSelect` | RemoteSelect、ApiSelect、StatusSwitch 等 | Organ/Dict 封装当前有业务反向依赖，待拆分 |
| `TableSort` | 表格排序、排序管理对话框 | 与后端排序字段白名单保持一致 |
| `error` / `ErrorMessage` | 错误语义和展示 | 与 platform/error 存在重叠，新增前先判断归属 |

新增通用组件前确认至少有跨页面或跨项目复用价值，并通过 props、emits、slots、provider 暴露能力。不要把某个服务路径、业务 DTO 或 Store 写入组件内核。

## Platform

platform 管理 g2rain 前端平台语义：

- `apps`：qiankun props、事件和生命周期适配。
- `stores`：Token/Client 与 Locale 状态。
- `i18n`：应用文案加载、翻译和全局注入。
- `locale`：语言持久化、HTTP Header 与 Element Plus 包。
- `types`：分页、结果、菜单、HTTP 等平台契约。
- `error`：平台错误模型。

平台层不能知道具体页面目录、业务表字段和领域操作。远程 API 实现应由 runtime 注入或注册，而不是 platform 直接引用应用 API。

## Runtime

runtime 是每个生成项目可定制的组合层，不等同通用组件库。它将平台能力连接到该应用的 SSO、Gateway、资源接口、路由和页面注册。

修改 runtime 时必须覆盖独立/集成两种模式和 mount/update/unmount 生命周期。多个 `appKey` 可能同时存在，禁止回退为单例路由假设。

## Shared

shared 只保存无业务工具和构建期生成器。运行时 shared 不能导入 Vue Store 或页面；Node 生成工具不能被浏览器入口打包执行。

## 能力迁移判断

```text
只服务一个页面 → views
服务当前应用多个页面但含应用语义 → runtime
服务多个同类 g2rain App 且无业务语义 → platform
纯 UI/交互/协议能力 → components
无框架、无业务的基础函数 → shared
```

下沉前必须先去除业务依赖；发现下层出现业务逻辑时应上移，而不是增加更多跨层别名。
