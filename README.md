# Quanta Pages 官方模板（monorepo）

Quanta 成员的个人网站模板集合。每套模板都是纯静态 HTML/CSS/JS，共四个页面：首页、文章列表、文章详情（含留言）、关于。

- **门户一键创建**：在 `https://www.quantacenter.com` → 塔员门户 → 个人网站，选择一套模板即可创建，不需要 GitHub 账号。
- **内容实时同步**：文章、留言和公开资料都来自 Quanta 门户的开放 API，发文章/改资料后刷新页面即可看到。
- **无构建步骤**：每套模板目录是自包含的静态站点，Pages 直接把该目录作为 `publishDir` 发布。

## 模板一览

| key | 名称 | 风格 | 发布目录 | 适合 |
| --- | --- | --- | --- | --- |
| `classic` | 经典浅色 | 白底、橙色强调、圆角卡片、双列网格 | `/templates/classic` | 技术笔记、日常记录 |
| `paper` | 纸感文字 | 米白纸底、衬线标题、窄栏、编号文章 | `/templates/paper` | 长文写作、读书笔记 |
| `magazine` | 杂志作品集 | 奶油底、超大姓名、粗边框卡片、分类色块 | `/templates/magazine` | 项目、作品集、活动 |
| `terminal` | 终端深色 | 深色背景、等宽字体、绿色/琥珀、prompt 风格 | `/templates/terminal` | 极客/系统/网络内容 |

四套模板共用同一套页面结构与数据逻辑，仅视觉不同；切换模板不会改变文章和资料内容。

## 仓库结构

```
README.md
package.json                 # 仅 sync / check 脚本，无运行时依赖
index.html                   # 兼容入口：默认跳转到 templates/classic/
scripts/
  sync-shared.mjs            # 把 shared 复制进每套模板
  check-shared.mjs           # 校验复制文件与 shared 一致
shared/
  layout/                    # 四页共享 HTML 骨架
  site-core.js               # slug/API/资料/文章/留言/头像/Markdown
  site-core.css              # 共享结构样式
  app.js                     # 启动入口：window.QuantaSite.start()
  markdown-it.min.js         # 唯一 Markdown 渲染器源
templates/
  classic/  paper/  magazine/  terminal/
    index.html blog.html article.html about.html
    assets/site-core.js      # 由 sync 生成
    assets/site-core.css     # 由 sync 生成
    assets/app.js            # 由 sync 生成
    assets/styles.css        # 模板专属视觉（源文件）
    vendor/markdown-it.min.js
    favicon.svg              # 模板专属图标
    README.md                # 模板说明
```

**只有 `assets/styles.css`、`favicon.svg`、`README.md` 是每套模板独有的源文件**；页面 HTML、`site-core.*`、`app.js`、`markdown-it` 都由 `shared/` 同步生成并提交，Pages 部署时无需构建。

## 本地预览

```bash
npm run sync
python -m http.server 8099
```

然后打开：

- `http://127.0.0.1:8099/templates/classic/index.html?slug=sususu`
- `http://127.0.0.1:8099/templates/paper/blog.html?slug=sususu`
- `http://127.0.0.1:8099/templates/magazine/about.html?slug=sususu`
- `http://127.0.0.1:8099/templates/terminal/article.html?slug=sususu&id=13`

开放 API 的 CORS 只放行 `*.page.quantacenter.com`，本地 `localhost` 请求会被浏览器拦截；本地适合看静态布局，接口联调请部署后测试。

## 修改共享代码

```bash
# 1. 修改 shared/ 下的文件
# 2. 同步到四套模板
npm run sync
# 3. 确认没有遗漏
npm run check
# 4. 提交并推送
```

`npm run check` 会逐字节比较每套模板中的生成文件与 `shared/`；不一致会以非零退出码失败。

## 新增一套模板

1. 新建 `templates/<key>/`，放入 `assets/styles.css`、`favicon.svg`、`README.md`。
2. 运行 `npm run sync`，生成四个页面、共享脚本和 vendor。
3. 在门户 `Quanta-admin-web/src/api/portal/pages.js` 的 `PAGE_TEMPLATES` 中增加一项（key、名称、描述、`publishDir: '/templates/<key>'`、主题色）。
4. 本地预览 + Playwright 验收后提交。

## 部署与发布目录

门户创建站点时会把 `repoUrl` 指向本仓库、`branch` 设为 `main`、`publishDir` 设为所选模板目录：

```
repoUrl   = https://github.com/subingbo/quanta-pages-template
branch    = main
publishDir = /templates/classic | /templates/paper | /templates/magazine | /templates/terminal
```

仓库根目录的 `index.html` 是一个兼容入口：如果早期站点仍使用 `publishDir=/`，会跳转到 `/templates/classic/`，避免旧站点失效。新站点应直接使用模板子目录。

## 更新策略

- 本仓库任一提交都会让所有使用官方模板的站点在轮询周期（约 5 分钟）内重新部署；四套模板共用同一个 commit。
- 如果你 fork 到自己的仓库，模板后续更新不会影响你，按自己的节奏维护。
- 不要把个人信息或文章内容写进仓库；所有个人数据都应由 API 实时读取。

## 使用的开放 API

| 接口 | 用途 |
| --- | --- |
| `GET /open/pages/{slug}/profile` | 站主公开资料 |
| `GET /open/pages/{slug}/posts` | 文章列表 |
| `GET /open/pages/{slug}/posts/{postId}` | 文章详情（Markdown） |
| `GET /open/pages/{slug}/posts/{postId}/comments` | 留言 |

接口匿名只读，无需 Token；限流为每 IP 每接口 60 秒 120 次。公开资料只含社区昵称、头像、headline、bio、技能、GitHub/网站和勾选公开的邮箱，不含实名、学号、部门等信息。

## 维护

由 Quanta 社团维护。模板仓库如果迁移到组织账号，会同步更新门户里的模板地址。
