# 资源配置生成工具

这个工具用于在完成开发后，根据 `route-map.ts` 自动生成应用资源配置文件。

## 功能

1. **页面资源 (Page Resource)**: 从 `route-map.ts` 中提取页面配置
2. **页面元素 (Page Element)**: 从 Vue 组件中提取 `v-permission` 指令
3. **API 端点 (API Endpoint)**: 从 API 文件中提取接口配置

## 使用方法

运行以下命令生成配置文件：

```bash
npm run build:config
```

## 输出文件

生成的配置文件位于 `src/shared/config-util/config/` 目录下：

- `resources.json` - 完整的资源配置（包含所有页面、页面元素和 API 端点）
- `pages.json` - 页面资源列表
- `page-elements.json` - 页面元素列表
- `api-endpoints.json` - API 端点列表

## 配置格式

### 页面资源 (ResourcePage)

```json
{
  "pageName": "字典配置",
  "pageCode": "dict",
  "linkPath": "/dict"
}
```

### 页面元素 (ResourcePageElement)

```json
{
  "parentId": null,
  "pageElementName": "新增",
  "pageElementCode": "dict:add",
  "pageElementType": "button",
  "pageCode": "dict"
}
```

### API 端点 (ResourceApiEndpoint)

```json
{
  "apiName": "查询",
  "apiUrl": "/dict",
  "requestMethod": "GET",
  "apiTag": "字典配置"
}
```

## 工作原理

1. **解析 route-map.ts**: 提取 `routeMap` 中的路由配置，生成页面资源
2. **解析 Vue 文件**: 对每个页面递归扫描 `views/{page}/**/*.vue`，提取静态 `v-permission`（如 `v-permission="'foo:bar'"`）；生成条目的 `pageCode` 为**宿主路由页面**，可与 `pageElementCode` 的前缀不同（例如 `dictionary_usage` 目录下的子组件使用 `dictionary_item:add`）
3. **解析 API 文件**: 扫描 `views/{page}/api.ts`；若存在 `views/{page}/dictionary_item/api.ts`（字典项与字典用途同页），一并解析并归入该页的 `pageCode`

## 注意事项

- 工具会自动跳过根路径 `/` 和 `/home` 路由
- 页面编码 (`pageCode`) 由路由路径自动生成（如 `/dict` -> `dict`）
- 权限编码格式应为 `命名空间:action`（如 `dict:add`）；`v-permission` 须为**静态字符串**（含 `"'xxx:yyy'"` 写法），动态表达式无法被扫描
- 同一 `pageElementCode` 在多个文件中出现时，生成结果会去重为一条
- API 路径中的模板字符串会被转换为路径参数（如 `/dict/${id}` -> `/dict/:id`）

