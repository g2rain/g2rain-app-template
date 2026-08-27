# 代码生成

`src/shared/generator` 从 MySQL `CREATE TABLE` 解析表、字段和注释，生成业务页面骨架。它是一次性开发加速器，不是数据库迁移工具，也不会理解完整领域规则。

## 输入和输出

输入：`src/shared/generator/database.sql`

默认输出：

```text
src/views/<table>/
├── index.vue
├── api.ts
├── type.ts
└── mock.ts
```

同时更新 `src/views/route-map.ts`。

## 命令

单表：

```bash
npm run build:generate -- --tables=dict
```

多表：

```bash
npm run build:generate -- --tables=dict,medicine_users
```

参数可以写为 `--tables=a,b` 或 `--tables a,b`。可选开关：

- `--no-view`：不生成 `index.vue`。
- `--no-api`：不生成 `api.ts` 和 `type.ts`。
- `--no-mock`：不生成 `mock.ts`。
- `--no-route`：不更新 `route-map.ts`。

局部示例：

```bash
npm run build:generate -- --tables=dict --no-view --no-mock
```

## 交互式演练

当前生成器没有问答式 Prompt，所有输入通过命令参数提供。一次安全的人机协作流程如下：

```text
开发者：把待生成表的 CREATE TABLE 写入 database.sql
开发者：确认 git status 没有未保存的同名页面改动
终端：npm run build:generate -- --tables=member
生成器：显示 tables=member，view/api/mock/route=true
生成器：写入 src/views/member 并更新 route-map.ts
开发者/Agent：Review Git Diff，校正字段类型、接口路径、权限和领域文案
终端：npm run build:config
开发者/Agent：Review resources.json/pages.json/page-elements.json
终端：npm run build
```

如果目标目录已有手写页面，先使用 `--no-*` 或在独立分支处理；生成器会覆盖同名 view/api/type/mock 文件，Git 未提交内容可能丢失。

## 生成后必须调整

- 数据库字段不等于前端可编辑字段，重新定义 Payload。
- 校验 JavaScript number 是否适合后端 ID；必要时使用 string 契约。
- 校正 API 路径、HTTP 方法、响应包装和状态变化用例。
- 删除不需要的通用 CRUD，补充真实业务动作。
- 校正文案国际化、权限编码、表格列和敏感信息展示。
- Mock 与真实接口契约保持一致。
- 确认 route-map 的 path/name/title 与后端资源一致。

## 修改生成器

修改 parser/template/command 时，使用临时表和临时工作分支验证全量与 `--no-*` 组合。不能直接在有重要手写页面的目录试验覆盖行为。生成模板本身也必须遵守当前架构和代码规范。
