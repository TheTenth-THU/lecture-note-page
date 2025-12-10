import { NextRequest, NextResponse } from "next/server";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkObsidianCallout from "remark-obsidian-callout";
import remarkWikiLink from "remark-wiki-link";
import rehypeRaw from "rehype-raw";
// import rehypeKatex from "rehype-katex";
import rehypeMathToTex from "@/lib/rehype-math-to-tex";

import { getCloudflareContext } from "@opennextjs/cloudflare";

interface GitHubFileResponse {
  type: string;
  name: string;
  size: number;
  content: string;
  encoding: BufferEncoding;
}

export async function GET(request: NextRequest) {
  // 从环境变量中获取 GitHub 仓库信息
  const { env } = getCloudflareContext();
  const GITHUB_TOKEN = await env.GITHUB_NOTE_TOKEN.get();

  const REPO_OWNER = "TheTenth-THU";
  const REPO_NAME = "THUEE23-25Autumn";

  const fetchOptions = {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "THUEE23-NotesOnWebsite",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: 3600 }, // 缓存 1 小时
  };

  // 获取查询参数中的 page
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");
  if (!page) {
    return NextResponse.json(
      { error: "Page path `page` is required" },
      { status: 400 }
    );
  }

  // 构建完整的文件路径
  const fileUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${page}`;

  try {
    // 从 GitHub 获取文件内容
    const res = await fetch(fileUrl, fetchOptions);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Failed to fetch ${fileUrl}:`, errorText);
      return NextResponse.json(
        { error: "File not found or failed to fetch" },
        { status: res.status }
      );
    }

    const contents = await res.json();
    if (Array.isArray(contents)) {
      // 如果返回的是数组，说明请求的路径是一个目录而不是文件
      return NextResponse.json(
        {
          error: "The specified path is a directory, not a file",
          details: contents.map((item) => {
            return { name: item.name, type: item.type, path: item.path };
          }),
        },
        { status: 400 }
      );
    }

    const fileContents = Buffer.from(
      (contents as GitHubFileResponse).content,
      (contents as GitHubFileResponse).encoding
    ).toString("utf-8");
    const { data: frontMatter, content } = matter(fileContents);

    // 提取标题
    // 无 front matter 标题则使用 page 路径最后的文件名并略去扩展名
    let title =
      frontMatter.title ||
      (contents as GitHubFileResponse).name.replace(/\.mdx?$/, "");
    if (Array.isArray(title)) {
      title = title.join(" ");
    }

    // 序列化 MDX 内容
    const mdxSource = await serialize(content, {
      mdxOptions: {
        remarkPlugins: [
          remarkGfm,
          remarkMath,
          [
            remarkObsidianCallout,
            {
              // This option ensures the content inside the callout is still processed as Markdown
              useDataAttributes: false,
              // This option tells the plugin to parse the content inside the callout
              // instead of treating it as a raw string.
              isFoldable: false,
            },
          ],
          [
            remarkWikiLink,
            {
              aliasDivider: "|",
              hrefTemplate: (permalink: string) => `/schoolwork/${permalink}`,
            },
          ],
        ],
        rehypePlugins: [
          rehypeRaw,
          // rehypeKatex,
          rehypeMathToTex,
        ],
      },
      parseFrontmatter: false,
    });

    return NextResponse.json({ title, content: mdxSource });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
