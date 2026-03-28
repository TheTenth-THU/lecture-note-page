# lecture-note-page

English documentation. 中文版: [README.md](README.md)

lecture-note-page is a Cloudflare-hosted lecture note website built with Next.js. Instead of storing note content directly in this repository, it reads Markdown or MDX files from GitHub repositories at request time, runs them through a custom remark/rehype pipeline, and renders them with support for math, TikZ, Obsidian-style extensions, asset proxying, and theme-aware typography.

This repository currently serves a specific course-note workflow, but this README is written as a reusable template: it documents both the current defaults and the parts you will usually change after forking.

## Features

- Built on Next.js App Router and deployed to Cloudflare Workers through OpenNext.
- Reads note content by semester/course/slug instead of bundling notes into the app repository.
- Serializes Markdown/MDX on the server with support for GFM, heading slugs, raw HTML, wiki links, and Obsidian-style image links.
- Renders math with MathJax 4 on the client, with local static assets first, CDN fallback, font switching, and custom TeX macros.
- Supports TikZ fenced code blocks as well as full LaTeX documents, rendered through an internal proxy endpoint.
- Supports Obsidian callouts, plus academic-style callouts such as theorem, lemma, definition, and proof.
- Supports a custom Ruby annotation syntax for phonetics and terminology.
- Proxies non-Markdown assets such as images and PDFs through an internal route.

## Stack

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

## Pages And Data Flow

### Page entry points

- [src/app/page.tsx](src/app/page.tsx)
  Renders the semester list and course entry points. The list of semesters is currently hardcoded.
- [src/app/[...slug]/page.tsx](src/app/%5B...slug%5D/page.tsx)
  Handles routes of the form semester/course/doc-path and loads both the course tree and the document content.

### API routes

- [src/app/api/get-doc/route.ts](src/app/api/get-doc/route.ts)
  Fetches directories or files from the GitHub Contents API. Directory requests can be recursive; Markdown/MDX files are serialized through the remark/rehype pipeline; non-Markdown files are returned as proxied asset URLs.
- [src/app/api/get-asset/route.ts](src/app/api/get-asset/route.ts)
  Proxies attachments such as images and PDFs and infers Content-Type from the filename.
- [src/app/api/render-tikz/route.ts](src/app/api/render-tikz/route.ts)
  Accepts TikZ source, preprocesses it, forwards it to an external render service, and returns image metadata.

### Current source conventions

The current implementation assumes:

- The GitHub owner is fixed to TheTenth-THU.
- Repository names follow the pattern THUEE23-${semester}.
- The homepage semester list is hardcoded in [src/app/page.tsx](src/app/page.tsx).
- Documents are fetched dynamically from GitHub rather than imported at build time.

If you fork this project, these are usually the first conventions you will need to change.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the runtime

This project depends on the Cloudflare Workers runtime and reads a GitHub token through a secret binding.

You need at least:

- a GitHub token that can read your content repositories
- a Cloudflare account with Wrangler already authenticated

The current secret name is:

- GITHUB_NOTE_TOKEN

The current runtime variables are:

- TIKZ_RENDER_ENDPOINT
- TIKZ_RENDER_HOST
- TIKZ_RENDER_TIMEOUT_MS

Their default values are defined in [wrangler.jsonc](wrangler.jsonc).

### 3. Start local development

```bash
npm run dev
```

Before development starts, [download-mathjax.mjs](download-mathjax.mjs) automatically syncs MathJax static assets into public.

### 4. Preview on the Cloudflare runtime locally

```bash
npm run preview
```

### 5. Deploy

```bash
npm run deploy
```

## Available Scripts

From [package.json](package.json):

```bash
npm run dev
npm run build
npm run start
npm run preview
npm run deploy
npm run upload
npm run cf-typegen
```

What they do:

- dev: starts the Next.js development server with Turbopack.
- build: runs the Next.js production build.
- start: starts the production Next.js server.
- preview: builds with OpenNext and previews the app locally on the Cloudflare runtime.
- deploy: builds and deploys to Cloudflare.
- upload: builds and uploads the OpenNext output.
- cf-typegen: regenerates Cloudflare environment typings.

## Content Repository Conventions

### Document source

The current implementation maps the semester segment in the URL to a GitHub repository name and then loads both the course tree and file contents through the GitHub Contents API.

Example:

- semester = 25Spring
- repo = THUEE23-25Spring

After forking, you will usually want to change:

- the GitHub owner
- the repository naming rule
- the homepage semester list
- the course directory layout

### Sidebar ordering

The course page recursively reads the course directory and renders it as the sidebar tree.

If a course contains index.md or index.mdx and its front matter defines longform.scenes, the server reorders the sidebar items according to that sequence. This is useful for long-form lecture notes or scene-based writeups.

## Markdown And Extended Syntax

### Extended Tables (tx / -tx-)

The project supports two extended-table modes:

- Standard markdown tables are parsed by `remark-extended-table`, with `^` (rowspan) and `>` (colspan).
- `tx` and `-tx-` blocks are parsed with MultiMarkdown table syntax, supporting `^^` (rowspan), `||` (colspan), and multi-row headers.

Inside `tx` / `-tx-` blocks, use:

- `^^`: merge with the cell above (rowspan)
- `||`: merge with the cell on the right (colspan)

It also supports two Obsidian-style triggers:

1. `tx` fenced code block

````md
```tx
| Method | Applicability ||
| ^^ | Efficient estimators (if any) | Non-efficient estimators |
| :--- | :--- | :--- |
| CRLB | Always solvable | Not applicable |
| Linear model | Always solvable | Not applicable |
| Sufficient statistics | Sometimes solvable | Sometimes solvable |
```
````

2. Leading `-tx-` paragraph (loose mode)

```md
-tx-
| Method | Applicability ||
| ^^ | Efficient estimators (if any) | Non-efficient estimators |
| :--- | :--- | :--- |
| CRLB | Always solvable | Not applicable |
| Linear model | Always solvable | Not applicable |
| Sufficient statistics | Sometimes solvable | Sometimes solvable |
```

Note: `-tx-` must be on its own line; subsequent continuous table-like lines are parsed as MultiMarkdown tables.

### Math

The project uses remark-math to preserve math nodes, then converts them back to TeX text so that MathJax 4 can render them on the client.

Inline math:

```md
Let $f(x)=x^2$.
```

Display math:

```md
$$
\int_0^1 x^2 \, \dif x = \frac13
$$
```

The project also defines a set of TeX macros, including:

- \dif
- \bra
- \ket
- \braket
- \v{E}
- \sinc

These macros are defined in [src/components/mathjax-loader.tsx](src/components/mathjax-loader.tsx).

### TikZ fenced blocks

The most common form is a fenced code block:

````md
```tikz
\begin{tikzpicture}
  \draw (0,0) -- (1,1);
\end{tikzpicture}
```
````

The current implementation detects language-tikz blocks and renders them through [src/components/tikz-block.tsx](src/components/tikz-block.tsx).

### Full LaTeX documents for TikZ

You can also provide a full LaTeX document:

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

[src/lib/tikz.ts](src/lib/tikz.ts) first tries to split the source into preamble and document body. If the input is not a full document, it falls back to a heuristic preamble extraction pass.

### Obsidian-style image links

This syntax is converted into internal asset proxy URLs:

```md
![[images/figure-1.png|Figure 1]]
```

### Wiki links

Basic wiki-link syntax is supported:

```md
[[Linear Algebra/Matrix Multiplication]]
```

The current implementation uses remark-wiki-link and maps links into internal wiki:// targets before they are handled by the front-end components. If you change the routing model after forking, you will likely need to update this link-resolution strategy too.

### Callouts

Standard Obsidian-style callouts are supported:

```md
> [!note]
> This is a note block.
```

The current project also defines academic callouts:

```md
> [!definition]
> Let G be a set with a binary operation.

> [!theorem]
> If the assumptions hold, then the conclusion follows.

> [!lemma]
> This is a lemma.

> [!proof]
> Proof omitted.
```

The current aliases are:

- definition: def, def.
- theorem: thm, thm.
- lemma: lem
- proof: pf

### Ruby annotations

The project supports a custom Ruby syntax:

```md
{漢字|kan ji}
```

It is transformed into HTML ruby/rt elements. The parser lives in [src/lib/remark-ruby.ts](src/lib/remark-ruby.ts).

## MathJax And Fonts

The MathJax runtime is injected by [src/components/mathjax-loader.tsx](src/components/mathjax-loader.tsx).

Current behavior:

- local static MathJax scripts are tried first
- failed local loads fall back to jsDelivr
- the math font follows the current theme context
- the ready event is emitted only after startup.promise resolves

Local MathJax assets live under public/scripts/mathjax.

## Deployment Notes

The deployment target is Cloudflare, with configuration in [wrangler.jsonc](wrangler.jsonc).

The current setup includes:

- compatibility flags: nodejs_compat and global_fetch_strictly_public
- OpenNext worker entry: .open-next/worker.js
- static asset directory: .open-next/assets
- custom domain routes
- TikZ render service variables

Before deploying, make sure that:

- the Cloudflare project has the GITHUB_NOTE_TOKEN secret configured
- the GitHub token can read the content repositories
- your routes, domain, and repository conventions match your own environment

## Fork Checklist

If you want to adapt this into your own notes website, start with these changes:

1. Update the GitHub owner and repository naming rule in [src/app/api/get-doc/route.ts](src/app/api/get-doc/route.ts).
2. Update the same source conventions in [src/app/api/get-asset/route.ts](src/app/api/get-asset/route.ts).
3. Replace the hardcoded semester list in [src/app/page.tsx](src/app/page.tsx).
4. Make sure your repository layout matches the semester/course/doc-path route model.
5. Configure or replace the external TikZ render service.
6. Adjust MathJax macros, font choices, and the theme system if needed.
7. Update your Cloudflare routes, domain, and secrets.

## Project Structure

```text
src/app/
  page.tsx                 homepage with semester and course entry points
  [...slug]/page.tsx       document page, loads the sidebar tree and article body
  api/get-doc/route.ts     GitHub document fetch and MDX serialization
  api/get-asset/route.ts   attachment proxy
  api/render-tikz/route.ts TikZ render proxy
src/components/
  mathjax-loader.tsx       MathJax runtime loading and macro definitions
  mathjax-component.tsx    math rendering component
  tikz-block.tsx           TikZ block component
src/lib/
  tikz.ts                  TikZ source parsing and QuickLaTeX response parsing
  remark-ruby.ts           custom Ruby syntax plugin
  remark-math-to-tex.ts    converts math nodes back to TeX text
  rehype-math-to-tex.ts    preserves TeX output for client-side MathJax
```

## Notes

- This README reflects the current implementation, but it is intentionally written to be reusable.
- If you plan to keep evolving the project, a good next step is to move the source conventions into explicit configuration rather than keeping them hardcoded in routes and pages.
