# Generator 使用说明

`src/shared/generator` 是一个基于 `database.sql` 的前端代码生成器，主要用于快速生成业务页面骨架与配套文件，减少重复手工编写。

## 目录结构

- `cli.ts`: 命令行入口
- `index.ts`: 生成任务总入口（view/api/mock/route）
- `core/*`: SQL 解析与表结构模型
- `command/*`: 各类文件生成逻辑
- `template/*`: EJS 模板与路由更新逻辑
- `util/*`: 参数解析与文件工具
- `database.sql`: 表结构来源（生成输入）

## 能力说明

执行生成后，会按表名在 `src/views/<table>/` 下生成或覆盖：

- `index.vue`（可关闭：`--no-view`）
- `api.ts`、`type.ts`（可关闭：`--no-api`）
- `mock.ts`（可关闭：`--no-mock`）

并会更新：

- `src/views/route-map.ts`（可关闭：`--no-route`）

## 使用方式

在项目根目录执行：

```bash
npm run build:generate -- --tables=dict
```

多个表：

```bash
npm run build:generate -- --tables=dict,medicine_users
```

关闭部分生成项：

```bash
npm run build:generate -- --tables=dict --no-mock --no-route
```

参数说明：

- `--tables`: 必填，支持 `--tables=a,b` 或 `--tables a,b`
- `--no-view`: 不生成 `index.vue`
- `--no-api`: 不生成 `api.ts`/`type.ts`
- `--no-mock`: 不生成 `mock.ts`
- `--no-route`: 不更新 `route-map.ts`

## 工作机制

1. 从 `src/shared/generator/database.sql` 读取建表语句
2. 按 `--tables` 指定的表解析字段与注释
3. 将蛇形表名转换为目录名与路由信息
4. 渲染模板并写入目标文件
5. 按规则更新 `src/views/route-map.ts`

## 注意事项

- 生成结果会覆盖同名文件，建议先提交或备份已有改动
- `--tables` 中的表必须存在于 `database.sql`，否则会报解析错误
- 若只想更新路由或局部文件，可通过 `--no-*` 组合控制
- 生成后建议执行 `npm run build` 检查类型与模板

