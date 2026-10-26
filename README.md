# Quanta Pages 官方模板

Quanta 成员的通用个人网站模板：首页、文章列表、文章详情（含留言）、关于，共四个页面。

- **不需要 GitHub 账号**：在门户「个人网站」页面点击「一键创建并部署」，系统会自动把你的站点指向本模板并完成首次部署。
- **内容实时同步**：文章、留言和你的公开资料都来自 Quanta 门户的开放 API，写文章后刷新页面即可看到，不需要改代码或重新部署。
- **无构建步骤**：纯静态 HTML/CSS/JS，仓库根目录就是发布目录。

## 使用方式

### 方式一：门户一键创建（推荐）

1. 登录 `https://www.quantacenter.com` → 塔员门户 → 个人网站。
2. 点击「用官方模板，一分钟上线」，可选填站点标识，提交即可。
3. 首次部署完成后访问 `https://{你的标识}.page.quantacenter.com`。

模板会展示你在「个人资料」里填写的：

- 社区昵称、头像
- 一句话介绍（headline）、个人简介（bio）
- 技能标签
- GitHub / 个人主页链接
- 联系邮箱（仅当你勾选「公开联系邮箱」）

不会展示真实姓名、学号、班级、专业、部门、职位、届次或登录邮箱。

### 方式二：基于本模板改版式

1. 在 GitHub 点击本仓库右上角的 **Use this template**，创建你自己的公开仓库（也可以直接 fork）。
2. 修改 `assets/styles.css`、页面 HTML 或 `assets/app.js`。
3. 回到门户「个人网站」，把仓库地址改成你的仓库，分支 `main`，发布目录 `/`，保存后会按新配置重新部署。
4. 之后每次推送都会由 Pages 轮询自动发布。

> 注意：Pages 只发布**已经构建好的静态文件**，不执行构建脚本。如果你用 Vite/React 等框架改版，请把构建产物放到发布分支/目录后再配置。

## 页面与文件

| 文件 | 说明 |
| --- | --- |
| `index.html` | 首页：资料 hero + 最新 6 篇文章 |
| `blog.html` | 文章列表：分类筛选 + 加载更多 |
| `article.html` | 文章详情：`?id=postId`，Markdown + 留言 |
| `about.html` | 关于：简介、技能、公开链接 |
| `assets/styles.css` | 全站样式（浅色简约、橙色强调） |
| `assets/app.js` | slug 解析、资料/文章/留言渲染、首字头像回退 |
| `vendor/markdown-it.min.js` | 自托管 Markdown 渲染器，不依赖 CDN |

## 站点标识如何确定

页面通过域名第一段识别站点标识：

```
https://your-name.page.quantacenter.com/  →  slug = your-name
```

本地预览时可以加查询参数：

```
http://127.0.0.1:8080/index.html?slug=your-name
```

但开放 API 的 CORS 只放行 `*.page.quantacenter.com`，本地 `localhost` 请求会被浏览器拦截；本地只适合看静态布局，接口联调请部署后测试。

## 使用的开放 API

| 接口 | 用途 |
| --- | --- |
| `GET /open/pages/{slug}/profile` | 站主公开资料 |
| `GET /open/pages/{slug}/posts` | 文章列表 |
| `GET /open/pages/{slug}/posts/{postId}` | 文章详情（Markdown） |
| `GET /open/pages/{slug}/posts/{postId}/comments` | 留言 |

接口匿名只读，无需 Token；限流为每 IP 每接口 60 秒 120 次。

## 更新策略

- 本模板更新后，所有使用模板的站点会在 Pages 轮询周期（约 5 分钟）内自动重新部署。
- 如果你 fork 了自己的仓库，模板的后续更新不会影响你，按自己的节奏维护即可。
- 本仓库不要放任何个人信息或文章内容；所有个人数据都应由 API 实时读取。

## 维护

由 Quanta 社团维护。模板仓库如果迁移到组织账号，会同步更新门户里的模板地址。
