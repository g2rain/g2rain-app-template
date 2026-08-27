# 资源配置生成

`src/shared/config-util` 从前端路由和静态权限指令生成供平台配置使用的 JSON。该工具描述“前端声明了什么”，最终导入、授权和后端鉴权仍由平台服务负责。

## 命令

```bash
npm run build:config
```

输入：

- `src/views/route-map.ts`
- route-map 对应页面目录中的所有 `.vue`

输出目录：`src/shared/config-util/config`

当前实际生成：

- `resources.json`：pages、pageElements，apiEndpoints 当前为空数组。
- `pages.json`：页面资源。
- `page-elements.json`：页面元素资源。

当前不会生成 `api-endpoints.json`。虽然 `parser/api.ts` 已存在，但主流程调用和 JSON 输出仍被注释；旧 README 中“已生成 API 端点”的说法不代表当前能力。

## 页面解析

route-map 中每个非 `/`、非 `/home` 路由生成一个页面资源。页面编码由路径去掉开头 `/` 并将 `/` 转为 `-`。

```typescript
'/system/member': {
  component: () => import('@/views/system/member/index.vue'),
  name: 'Member',
  meta: { title: '会员管理', requiresAuth: true },
}
```

期望页面编码为 `system-member`，linkPath 为 `/system/member`。

## 权限解析

生成器递归扫描页面目录的 `.vue`，只识别静态且包含冒号的权限编码：

```vue
<el-button v-permission="'member:add'">新增</el-button>
<StatusSwitch v-permission="'member:status_update'" />
```

- 动态变量、模板插值和不含冒号的值不会生成。
- `status_update` 生成 `switch`，其他 action 默认生成 `button`。
- 同一 `pageElementCode` 去重。
- 元素归属于宿主路由页面，编码前缀可以与宿主 pageCode 不同。

## 完整工作流

```text
开发页面和 API
→ 更新 route-map.ts
→ 添加静态 v-permission
→ npm run build:config
→ Review 三个 JSON 的新增、修改和删除
→ 与平台资源导入/更新流程核对
→ npm run build
→ 在测试环境验证页面可见性、按钮状态和后端鉴权
```

不要只提交页面而遗漏资源配置，也不要盲目接受生成器删除的权限点。删除可能意味着页面重命名、扫描失败或真实权限下线，必须人工确认。

## 启用 API 端点前

需要先明确 serviceName、routePrefix、path 的组织级语义，覆盖模板字符串、不同 HTTP Client、嵌套页面、重复端点和动态路径测试，并确认后端导入格式。完成前，API 权限由后端网关/服务执行，前端 `hasApiPermission` 也不能被视为安全边界。
