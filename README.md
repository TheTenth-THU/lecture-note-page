# lecture-note-page

中文说明，English version: [README.en.md](README.en.md)

lecture-note-page 是一个部署在 Cloudflare 上的课程笔记站点。它会按路由动态读取 GitHub 仓库中的 Markdown 或 MDX 文档，经过一套定制的 remark/rehype 处理链后渲染成网页，并支持数学公式、TikZ、Obsidian 风格扩展语法、文档资源代理和主题切换。

这个仓库当前服务于一个具体的数据组织方式，但 README 按“可复用模板”来写：既说明项目默认约定，也指出 fork 后通常需要修改的部分。

## 核心特性

- 基于 Next.js App Router，使用 OpenNext 适配 Cloudflare Workers 运行时。
- 按 semester/course/slug 路由读取 GitHub 仓库中的内容，而不是把笔记直接存放在本仓库里。
- 服务端将 Markdown/MDX 序列化为可渲染内容，支持 GFM、标题 slug、原始 HTML、Wiki Link、Obsidian 风格图片链接等。
- 使用 MathJax 4 在客户端渲染数学公式，支持站内静态脚本优先加载、字体切换和一组自定义 TeX 宏。
- 支持 TikZ fenced code block，也支持完整 LaTeX 文档格式的 TikZ 输入，并通过站内接口代理外部渲染服务。
- 支持 Obsidian callout，并额外定义了 theorem、lemma、definition、proof 等学术风格 callout。
- 支持自定义 Ruby 语法，适合注音、术语标注等场景。
- 非 Markdown 资源可通过站内接口代理，例如图片、PDF 等附件。

## 技术栈

- Next.js 16
- React 19
- OpenNext for Cloudflare
- Wrangler
- next-mdx-remote
- remark-gfm
- remark-math
- remark-wiki-link
- rehype-callouts
- MathJax 4
- Tailwind CSS 4

## 页面与数据流

### 页面入口

- 首页 [src/app/page.tsx](src/app/page.tsx)
	展示学期列表和课程入口。当前学期集合写死在前端代码里，不是自动发现。
- 文档页 [src/app/[...slug]/page.tsx](src/app/%5B...slug%5D/page.tsx)
	路由格式是 semester/course/doc-path，用于拉取课程目录结构和具体文档内容。

### API 路由

- [src/app/api/get-doc/route.ts](src/app/api/get-doc/route.ts)
	从 GitHub Contents API 获取目录或文件内容。目录请求可递归展开，Markdown/MDX 会经过 remark 和 rehype 处理后返回序列化结果，非 Markdown 文件则返回资源代理地址。
- [src/app/api/get-asset/route.ts](src/app/api/get-asset/route.ts)
	代理图片、PDF 等附件资源，并根据文件名推断 Content-Type。
- [src/app/api/render-tikz/route.ts](src/app/api/render-tikz/route.ts)
	接收 TikZ 源码，预处理后转发到外部渲染服务，返回图片地址和尺寸信息。

### 当前默认数据约定

项目当前实现假设：

- GitHub owner 固定为 TheTenth-THU。
- 仓库命名约定为 THUEE23-${semester}。
- 首页学期列表固定写在 [src/app/page.tsx](src/app/page.tsx) 中。
- 文档内容通过 GitHub API 动态读取，而不是在构建时导入。

如果你要 fork 成自己的站点，通常至少需要修改这些约定。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置运行环境

本项目依赖 Cloudflare Workers 运行时，并通过 secret 读取 GitHub Token。

必须准备：

- 一个可读取目标笔记仓库内容的 GitHub token
- Cloudflare 账号与 Wrangler 登录状态

当前项目中用到的 secret 名称是：

- GITHUB_NOTE_TOKEN

当前项目中用到的变量是：

- TIKZ_RENDER_ENDPOINT
- TIKZ_RENDER_HOST
- TIKZ_RENDER_TIMEOUT_MS

默认值定义在 [wrangler.jsonc](wrangler.jsonc) 中。

### 3. 启动本地开发

```bash
npm run dev
```

开发前会自动执行 [download-mathjax.mjs](download-mathjax.mjs)，把 MathJax 静态资源同步到 public 目录。

### 4. 本地预览 Cloudflare 运行时

```bash
npm run preview
```

### 5. 部署

```bash
npm run deploy
```

## 可用脚本

来自 [package.json](package.json)：

```bash
npm run dev
npm run build
npm run start
npm run preview
npm run deploy
npm run upload
npm run cf-typegen
```

说明：

- dev: 启动 Next.js 开发服务器，默认使用 Turbopack。
- build: 执行 Next.js 构建。
- start: 启动生产模式 Next.js 服务器。
- preview: 先用 OpenNext 构建，再在本地预览 Cloudflare 运行时。
- deploy: 构建并部署到 Cloudflare。
- upload: 构建并上传 OpenNext 产物。
- cf-typegen: 生成 Cloudflare 环境类型声明。

## 内容仓库约定

### 文档来源

当前实现会将 URL 中的 semester 映射为 GitHub 仓库名，再通过 GitHub Contents API 拉取课程目录与文档内容。

例如：

- semester = 25Spring
- repo = THUEE23-25Spring

fork 后你通常需要改：

- GitHub owner
- 仓库命名规则
- 首页学期列表
- 课程目录组织方式

### 目录与侧边栏

课程页面会递归读取课程目录，并在侧边栏中显示文件树。

如果课程目录中存在 index.md 或 index.mdx，且 front matter 里定义了 longform.scenes，服务端会按照该顺序重排场景文件。这适合长篇讲义或分场景讲稿。

## Markdown 与扩展语法

### 数学公式

项目使用 remark-math 保留数学节点，再通过自定义插件转回 TeX 文本，由客户端 MathJax 4 完成渲染。

内联公式：

```md
设 $f(x)=x^2$。
```

块级公式：

```md
$$
\int_0^1 x^2 \, \dif x = \frac13
$$
```

项目还内置了一些 TeX 宏，例如：

- \dif
- \bra
- \ket
- \braket
- \v{E}
- \sinc

这些宏定义位于 [src/components/mathjax-loader.tsx](src/components/mathjax-loader.tsx)。

### TikZ 代码块

最常见的写法是 fenced code block：

````md
```tikz
\begin{tikzpicture}
	\draw (0,0) -- (1,1);
\end{tikzpicture}
```
````

当前实现会识别 language-tikz 代码块，并通过 [src/components/tikz-block.tsx](src/components/tikz-block.tsx) 调用站内渲染接口。

### 完整 LaTeX 文档形式的 TikZ

除了直接写 tikzpicture，也支持完整文档输入：

````md
```tikz
\documentclass{standalone}
\usepackage{tikz}
\usetikzlibrary{positioning}

\begin{document}
\begin{tikzpicture}
	\node {Hello};
\end{tikzpicture}
\end{document}
```
````

[src/lib/tikz.ts](src/lib/tikz.ts) 会优先尝试拆分 preamble 和 document body；如果不是完整文档，则按启发式规则提取前导 preamble 指令。

### Obsidian 风格图片链接

项目会把这类语法转换为资源代理地址：

```md
![[images/figure-1.png|示意图]]
```

### Wiki Link

支持基本的 Wiki Link 语法：

```md
[[线性代数/矩阵乘法]]
```

当前实现使用 remark-wiki-link 处理，并将链接映射为站内的 wiki:// 目标后再交给前端组件处理。若你 fork 后调整了站内路由结构，通常也需要同步修改链接解析策略。

### Callout

支持常见 Obsidian callout：

```md
> [!note]
> 这是一个说明块。
```

也支持当前项目额外定义的学术类 callout：

```md
> [!definition]
> 设群 G 是一个带二元运算的集合。

> [!theorem]
> 若条件成立，则结论成立。

> [!lemma]
> 这是一个引理。

> [!proof]
> 证明略。
```

当前还定义了别名：

- definition: def, def.
- theorem: thm, thm.
- lemma: lem
- proof: pf

### Ruby 注音语法

项目支持一种自定义 Ruby 写法：

```md
{汉字|han zi}
```

它会被转换为 HTML ruby/rt 结构。解析逻辑见 [src/lib/remark-ruby.ts](src/lib/remark-ruby.ts)。

## MathJax 与字体

MathJax 运行时由 [src/components/mathjax-loader.tsx](src/components/mathjax-loader.tsx) 负责注入。

当前行为：

- 优先加载本地静态 MathJax 脚本。
- 本地脚本失败时回退到 jsDelivr CDN。
- 根据主题上下文切换数学字体。
- 等待 MathJax startup.promise 完成后再触发就绪事件。

本地静态资源位于 public/scripts/mathjax。

## 部署说明

当前部署目标是 Cloudflare，相关配置位于 [wrangler.jsonc](wrangler.jsonc)。

当前配置包括：

- compatibility_flags: nodejs_compat, global_fetch_strictly_public
- OpenNext Worker 入口: .open-next/worker.js
- 静态资源目录: .open-next/assets
- 自定义域名路由
- TikZ 渲染服务变量

部署前至少需要确认：

- Cloudflare 项目已配置好 secret GITHUB_NOTE_TOKEN
- 目标 GitHub token 对内容仓库有读取权限
- 路由、域名和仓库约定符合你的实际环境

## Fork Checklist

如果你要把这个项目改造成自己的笔记站点，建议先检查：

1. 修改 [src/app/api/get-doc/route.ts](src/app/api/get-doc/route.ts) 中的 GitHub owner 和仓库命名规则。
2. 修改 [src/app/api/get-asset/route.ts](src/app/api/get-asset/route.ts) 中相同的数据源约定。
3. 修改 [src/app/page.tsx](src/app/page.tsx) 中硬编码的学期列表。
4. 检查你的仓库目录结构是否与 semester/course/doc-path 路由匹配。
5. 配置或替换 TikZ 外部渲染服务。
6. 按需调整 MathJax 宏、字体和主题系统。
7. 调整 Cloudflare 域名、路由与 secret 配置。

## 项目结构

```text
src/app/
	page.tsx                首页，展示学期和课程入口
	[...slug]/page.tsx      文档页，负责加载导航树和正文
	api/get-doc/route.ts    GitHub 文档拉取与 MDX 序列化
	api/get-asset/route.ts  附件资源代理
	api/render-tikz/route.ts TikZ 渲染代理
src/components/
	mathjax-loader.tsx      MathJax 运行时加载与宏定义
	mathjax-component.tsx   数学公式渲染组件
	tikz-block.tsx          TikZ 代码块组件
src/lib/
	tikz.ts                 TikZ 源码解析与 QuickLaTeX 响应解析
	remark-ruby.ts          自定义 Ruby 语法插件
	remark-math-to-tex.ts   将数学节点转回 TeX 文本
	rehype-math-to-tex.ts   服务端保留给客户端 MathJax 的 TeX 输出
```

## 备注

- 当前 README 以项目现状为准，但尽量按可复用模板撰写。
- 如果你后续打算把“数据源约定”做成可配置项，可以把 GitHub owner、仓库命名模板和学期列表提取到环境变量或独立配置文件中。
