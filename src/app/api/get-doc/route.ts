import { NextRequest, NextResponse } from "next/server";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import { visit } from "unist-util-visit";

import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkObsidian from "remark-obsidian";
import remarkWikiLink from "remark-wiki-link";
import remarkObsidianCallout from "remark-obsidian-callout";
import rehypeObsidianId from "@/lib/rehype-obsidian-id";

import rehypeRaw from "rehype-raw";
// import rehypeKatex from "rehype-katex";
import rehypeMathToTex from "@/lib/rehype-math-to-tex";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import remarkMathToTex from "@/lib/remark-math-to-tex";

interface GitHubFileResponse {
  type: string;
  name: string;
  size: number;
  content: string;
  encoding: BufferEncoding;
}
interface GitHubDirectoryDetailTerm {
  // represents a file or directory
  name: string;
  type: string;
  path: string;
  children?: GitHubDirectoryDetailTerm[];
}

/**
 * Markdown 解析调试插件
 * 将 AST 树打印到控制台，方便调试使用
 * @returns {function} Remark 插件函数
 */
const debugPlugin = () => {
  return (tree: any) => {
    console.log("--- AST DEBUG START ---");

    // 打印整个树结构（注意：树可能很大，建议只打印部分或使用 JSON.stringify）
    console.log(JSON.stringify(tree, null, 2));

    // // 或者只查看特定类型的节点，例如查看所有的数学公式节点
    // visit(tree, (node) => {
    //   if (node.type === "math" || node.type === "inlineMath") {
    //     console.log("Found math node:", node);
    //   }
    // });

    console.log("--- AST DEBUG END ---");
  };
};

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

  // 解析查询参数
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");
  if (!page) {
    return NextResponse.json(
      { error: "Page path `page` is required" },
      { status: 400 },
    );
  }
  const recursive = searchParams.get("recursive") === "true";

  // 构建完整的文件路径
  const fileUrl =
    page.startsWith("/") ?
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents${page}`
    : `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${page}`;

  try {
    // 从 GitHub 获取文件内容
    const res = await fetch(fileUrl, fetchOptions);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Failed to fetch ${fileUrl}:`, errorText);
      return NextResponse.json(
        { error: "File not found or failed to fetch" },
        { status: res.status },
      );
    }
    const contents = await res.json();

    // 如果返回的是数组，说明请求的路径是一个目录而不是文件
    if (Array.isArray(contents)) {
      if (!recursive) {
        // 仅返回目录下的文件和子目录列表
        return NextResponse.json(
          {
            type: "DIR",
            details: contents.map((item) => {
              return {
                name: item.name,
                type: item.type,
                path: item.path,
              };
            }),
          },
          { status: 200 },
        );
      } else {
        // 递归获取目录下的所有文件
        const recursiveFetch = async (
          path: string,
        ): Promise<GitHubDirectoryDetailTerm[]> => {
          const dirRes = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
            fetchOptions,
          );
          if (!dirRes.ok) {
            console.error(`Failed to fetch directory ${path}`);
            return [];
          }
          const dirContents = await dirRes.json();
          if (!Array.isArray(dirContents)) {
            return [];
          }

          const results: GitHubDirectoryDetailTerm[] = [];
          for (const item of dirContents) {
            if (item.type === "dir") {
              const children = await recursiveFetch(item.path);
              results.push({
                name: item.name,
                type: item.type,
                path: item.path,
                children,
              });
            } else {
              results.push({
                name: item.name,
                type: item.type,
                path: item.path,
              });
            }
          }
          return results;
        };
        const allDetails = await recursiveFetch(page);
        return NextResponse.json(
          {
            type: "DIR",
            details: allDetails,
          },
          { status: 200 },
        );
      }
    }

    // 转码解析文件内容
    const fileContents = Buffer.from(
      (contents as GitHubFileResponse).content,
      (contents as GitHubFileResponse).encoding,
    ).toString("utf-8");
    const { data: frontMatter, content } = matter(fileContents);

    // 提取标题
    // 无 front matter 标题则使用 page 路径最后的文件名并略去扩展名
    let title = frontMatter.title || (contents as GitHubFileResponse).name;
    if (Array.isArray(title)) {
      title = title.join(" ");
    }

    // 对非 markdown 文件，返回 get-asset 接口 url
    if (!page.endsWith(".md") && !page.endsWith(".mdx")) {
      return NextResponse.json(
        {
          type: "ASSET",
          title,
          url: `/api/get-asset?page=${encodeURIComponent(page)}`,
        },
        { status: 200 },
      );
    }

    // 序列化 MDX 内容
    console.log("Serializing MDX content for page:", page);
    const mdxSource = await serialize(content, {
      mdxOptions: {
        remarkPlugins: [
          remarkGfm,
          [
            remarkWikiLink,
            {
              aliasDivider: "|",
              pageResolver: (name: string) => [name],
              hrefTemplate: (permalink: string) => `wiki://${permalink}`,
            },
          ],
          remarkMath,
          remarkMathToTex,
          // debugPlugin,
          // remarkObsidian,
          remarkObsidianCallout,
        ],
        rehypePlugins: [
          rehypeRaw,
          rehypeObsidianId,
          // rehypeKatex,
          rehypeMathToTex,
        ],
      },
      parseFrontmatter: false,
    });
    console.log("MDX serialization complete for page:", page);

    return NextResponse.json(
      {
        type: "FILE",
        title,
        content: mdxSource,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
