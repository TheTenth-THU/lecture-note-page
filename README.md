[TikZ 代码块]

项目现在支持用 fenced code block 渲染 TikZ：

```md
```tikz
\begin{tikzpicture}
	\draw(0,0)--(1,1);
\end{tikzpicture}
```
```

也支持完整 LaTeX 文档形式的输入。当前实现会把文档拆成 preamble 和正文，然后通过站内接口代理到外部公开渲染服务进行编译并返回图片结果。默认使用 QuickLaTeX，可通过 Wrangler 变量 `TIKZ_RENDER_ENDPOINT`、`TIKZ_RENDER_HOST` 和 `TIKZ_RENDER_TIMEOUT_MS` 覆盖。
# OpenNext Starter

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Read the documentation at https://opennext.js.org/cloudflare.

## Develop

Run the Next.js development server:

```bash
npm run dev
# or similar package manager command
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Preview

Preview the application locally on the Cloudflare runtime:

```bash
npm run preview
# or similar package manager command
```

## Deploy

Deploy the application to Cloudflare:

```bash
npm run deploy
# or similar package manager command
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
