# g2rain-app-template

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

官方微前端子应用模板（Vue 3 + Vite + qiankun + Element Plus）。推荐使用脚手架 [**create-g2rain-app**](https://github.com/g2rain/g2rain-app-cli) 基于本仓库生成工程；技术栈、目录结构、环境变量与运行方式**以本 README 为准**。

**占位符说明**：模板中的 `{{PROJECT_NAME}}`（如 `package.json`、`VITE_APPLICATION_CODE`）与 `{{CONTEXT_PATH}}`（如 `VITE_CONTEXT_PATH`）在通过 CLI 创建项目时会被替换；若直接 clone 本仓库开发模板本身，请自行理解或替换占位符。

## 📋 目录

- [环境](#1-环境)
- [安装](#2-安装)
- [`.env` 最小配置](#3-env-最小配置)
- [启动](#4-启动)
- [构建与预览](#5-构建与预览)
- [Docker](#6-docker)
- [生成代码](#7-生成代码)
- [生成配置](#8-生成配置)
- [文档](#9-文档)
- [贡献指南](#-贡献指南)
- [许可证](#-许可证)
- [联系我们](#-联系我们)
- [致谢](#-致谢)

## 1. 环境

- Node.js >= 18
- npm >= 9

## 2. 安装

```bash
npm install
```

## 3. `.env` 最小配置

```env
VITE_APPLICATION_CODE={{PROJECT_NAME}}
VITE_BASE_URL=/test/
VITE_BACKEND_ORIGIN=http://localhost:8080
VITE_APPLICATION_CONTEXT=/test
VITE_IAM_ORIGIN=http://localhost:8080
VITE_REFRESH_TOKEN_URL=/auth/refresh-token
VITE_GENERATE_TOKEN_URL=/auth/token
VITE_SSO_BASE_URL=https://sso.example.com
VITE_AUTH_END_POINT=/auth/authorize
VITE_REDIRECT_URI=http://localhost:3000/test/sso_callback
VITE_SERVER_PORT=3000
```

## 4. 启动

```bash
npm run dev
```

## 5. 构建与预览

```bash
npm run build
npm run preview
```

## 6. Docker

```bash
docker build -t {{PROJECT_NAME}} .
docker run -d -p 8080:8080 {{PROJECT_NAME}}
```

## 7. 生成代码

```bash
npm run build:generate -- --tables=dict
```

可选：`--no-view` `--no-api` `--no-mock` `--no-route`

## 8. 生成配置

```bash
npm run build:config
```

输出：`src/shared/config-util/config/`

## 9. 文档

- 架构：`ARCHITECHTURE.md`
- 代码生成器：`src/shared/generator/README.md`
- 配置生成器：`src/shared/config-util/README.md`

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
