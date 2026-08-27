# 资源配置生成工具

本工具根据 `src/views/route-map.ts` 和页面中的静态 `v-permission` 生成页面、页面元素资源配置。

完整规则、示例和平台导入注意事项见 [`docs/development/resource-generation.md`](../../../docs/development/resource-generation.md)。

## 命令

```bash
npm run build:config
```

## 当前输入

- `src/views/route-map.ts`
- route-map 对应页面目录中的 `.vue` 文件

## 当前实际输出

输出目录：`src/shared/config-util/config/`

- `resources.json`：页面和页面元素的合并结构，其中 `apiEndpoints` 当前为空。
- `pages.json`：页面资源。
- `page-elements.json`：页面元素资源。

当前不会生成 `api-endpoints.json`。`parser/api.ts` 虽已存在，但主流程和 JSON 输出尚未启用。

## 静态权限示例

```vue
<el-button v-permission="'dict:add'">新增</el-button>
<StatusSwitch v-permission="'dict:status_update'" />
```

动态表达式无法被当前解析器扫描。生成后必须 Review JSON Diff，确认新增、修改和删除都符合真实页面与权限设计，再执行 `npm run build` 并在测试环境验证。
