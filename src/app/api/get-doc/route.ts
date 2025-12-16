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

  // 解析查询参数
  const { searchParams } = new URL(request.url);
  const semester = searchParams.get("semester");
  if (!semester) {
    return NextResponse.json(
      { error: "Semester path `semester` is required" },
      { status: 400 },
    );
  }
  const page = searchParams.get("page");
  if (!page) {
    return NextResponse.json(
      { error: "Page path `page` is required" },
      { status: 400 },
    );
  }
  const recursive = searchParams.get("recursive") === "true";

  const REPO_OWNER = "TheTenth-THU";
  const REPO_NAME = `THUEE23-${semester}`;

  const fetchOptions = {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "THUEE23-NotesOnWebsite",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: 3600 }, // 缓存 1 小时
  };

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
        ): Promise<{
          results: GitHubDirectoryDetailTerm[];
          indexFilePath: string;
        }> => {
          const dirRes = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
            fetchOptions,
          );
          if (!dirRes.ok) {
            console.error(`Failed to fetch directory ${path}`);
            return { results: [], indexFilePath: "" };
          }
          const dirContents = await dirRes.json();
          if (!Array.isArray(dirContents)) {
            return { results: [], indexFilePath: "" };
          }

          // 递归处理子目录，同时查找 index.md 文件
          const results: GitHubDirectoryDetailTerm[] = [];
          let indexFilePath = "";
          for (const item of dirContents) {
            if (item.type === "dir") {
              const children = await recursiveFetch(item.path);
              results.push({
                name: item.name,
                type: item.type,
                path: item.path,
                children: children.results,
              });
              if (children.indexFilePath) {
                indexFilePath = children.indexFilePath;
              }
            } else {
              results.push({
                name: item.name,
                type: item.type,
                path: item.path,
              });
              if (
                item.name.toLowerCase() === "index.md" ||
                item.name.toLowerCase() === "index.mdx"
              ) {
                indexFilePath = item.path;
              }
            }
          }
          return { results, indexFilePath };
        };

        // 调用递归函数
        const { results: allDetails, indexFilePath } =
          await recursiveFetch(page);
        // 如果找到了 index 文件，立即获取其 front matter 中的 longform.scenes 字段
        if (indexFilePath) {
          console.log("Found index file at:", indexFilePath);
          const indexRes = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${indexFilePath}`,
            fetchOptions,
          );
          if (indexRes.ok) {
            const indexData = (await indexRes.json()) as GitHubFileResponse;
            const indexFileContents = Buffer.from(
              indexData.content,
              indexData.encoding,
            ).toString("utf-8");
            const { data: frontMatter } = matter(indexFileContents);
            if (
              frontMatter &&
              frontMatter.longform &&
              frontMatter.longform.scenes &&
              Array.isArray(frontMatter.longform.scenes)
            ) {
              console.log(
                "Index file front matter longform.scenes:",
                frontMatter.longform.scenes,
              );
              // 按照 scenes 顺序重新排序 allDetails
              // scenes 结构：[Doc1, Doc2, [Doc2-1, Doc2-2], Doc5]，至多 3 层
              const sceneSet = new Set<string>();
              const newDetails: GitHubDirectoryDetailTerm[] = [];
              // 首先添加 index 文件本身
              newDetails.push({
                name: indexData.name,
                type: indexData.type,
                path: indexFilePath,
              });
              sceneSet.add(indexFilePath);
              // 然后按照 scenes 顺序添加文件和目录
              frontMatter.longform.scenes.forEach(
                (scene: string | string[]) => {
                  // Doc1 or [Doc1-1, Doc1-2]
                  if (Array.isArray(scene)) {
                    const founds = {
                      name: "<scene>",
                      path: "<scene>",
                      type: "dir",
                      children: [] as GitHubDirectoryDetailTerm[],
                    };
                    scene.forEach((subScene) => {
                      // Doc1-1 or [Doc1-1-1, Doc1-1-2]
                      if (Array.isArray(subScene)) {
                        const subFounds = {
                          name: "<scene>",
                          path: "<scene>",
                          type: "dir",
                          children: [] as GitHubDirectoryDetailTerm[],
                        };
                        subScene.forEach((subSubScene) => {
                          // Doc1-1-1
                          const found = allDetails.find(
                            (item) =>
                              item.name.replace(/\.mdx?$/, "") === subSubScene,
                          );
                          if (found && !sceneSet.has(found.path)) {
                            subFounds.children.push(found);
                            sceneSet.add(found.path);
                          }
                        });
                        if (subFounds.children.length > 0) {
                          founds.children.push(subFounds);
                        }
                      } else {
                        // Doc1-1
                        const found = allDetails.find(
                          (item) =>
                            item.name.replace(/\.mdx?$/, "") === subScene,
                        );
                        if (found && !sceneSet.has(found.path)) {
                          founds.children.push(found);
                          sceneSet.add(found.path);
                        }
                      }
                    });
                    if (founds.children.length > 0) {
                      newDetails.push(founds);
                    }
                  } else {
                    // Doc1
                    const found = allDetails.find(
                      (item) => item.name.replace(/\.mdx?$/, "") === scene,
                    );
                    if (found && !sceneSet.has(found.path)) {
                      newDetails.push(found);
                      sceneSet.add(found.path);
                    }
                  }
                },
              );
              // 添加剩余未在 scenes 中出现的文件和目录
              for (const item of allDetails) {
                if (!sceneSet.has(item.path)) {
                  newDetails.push(item);
                }
              }
              console.log(
                "Reordered directory details based on scenes:",
                newDetails,
              );
              return NextResponse.json(
                {
                  type: "DIR",
                  details: newDetails,
                },
                { status: 200 },
              );
            }
          }
        }

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
          type: "FILE",
          title,
          url: `/api/get-asset?semester=${encodeURIComponent(semester)}&page=${encodeURIComponent(page)}`,
        },
        { status: 200 },
      );
    }

    // 序列化 MDX 内容
    console.log("Serializing MDX content for page:", page);
    // 将 content 中的 `<br>` 替换为闭合的 `<br />`，避免 MDX 解析问题
    const contentWithNewlines = content.replace(/<br\s*\/?>/g, "<br />");
    const mdxSource = await serialize(contentWithNewlines, {
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
          [
            rehypeRaw,
            {
              passThrough: [
                "mdxJsxFlowElement",
                "mdxJsxTextElement",
                "mdxTextExpression",
                "mdxFlowExpression",
                "mdxjsEsm",
              ],
            },
          ],
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
