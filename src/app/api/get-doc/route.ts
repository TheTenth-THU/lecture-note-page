import { NextRequest, NextResponse } from "next/server";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import { visit } from "unist-util-visit";

import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkObsidian from "remark-obsidian";
import remarkWikiLink from "remark-wiki-link";
import remarkRuby from "@/lib/remark-ruby";
import remarkMathToTex from "@/lib/remark-math-to-tex";

import rehypeObsidianId from "@/lib/rehype-obsidian-id";
import rehypeCallouts, {
  type UserOptions as RehypeCalloutsOptions,
} from "rehype-callouts";
import rehypeSlug from "rehype-slug";
import rehypeRaw from "rehype-raw";
import rehypeMathToTex from "@/lib/rehype-math-to-tex";

import GithubSlugger from "github-slugger";
import { getCloudflareContext } from "@opennextjs/cloudflare";

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

const svgCheck =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
const svgTldr =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg>';
const svgTip =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>';
const svgCross =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
const svgWarning =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
const svgHelp =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
const svgError =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>';
const svgCite =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path></svg>';
const svgNote =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="2" x2="22" y2="6"></line><path d="M7.5 20.5 19 9l-4-4L3.5 16.5 2 22z"></path></svg>';
const svgInfo =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
const svgTodo =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>';
const svgBug =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="14" x="8" y="6" rx="4"></rect><path d="m19 7-3 2"></path><path d="m5 7 3 2"></path><path d="m19 19-3-2"></path><path d="m5 19 3-2"></path><path d="M20 13h-4"></path><path d="M4 13h4"></path><path d="m10 4 1 2"></path><path d="m14 4-1 2"></path></svg>';
const svgExample =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>';

const rehypeCalloutOptions: RehypeCalloutsOptions = {
  theme: "obsidian",
  aliases: {
    definition: ["def", "def."],
    theorem: ["thm", "thm."],
    lemma: ["lem"],
    proof: ["pf"],
  },
  callouts: {
    definition: {
      title: "Definition",
      indicator: svgInfo,
    },
    theorem: {
      title: "Theorem",
      indicator: svgTldr,
    },
    lemma: {
      title: "Lemma",
      indicator: svgTldr,
    },
    proof: {
      title: "Proof",
      indicator: svgInfo,
    },
  },
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
    let processedContent = content.replace(/<br\s*\/?>/g, "<br />");
    // 处理 Obsidian 图片链接 ![[path/to/image.png|alt text]]
    // 替换为标准的 markdown 图片链接 ![alt text](wiki://path/to/image.png)
    processedContent = processedContent.replace(
      /!\[\[(.*?)(?:\|(.*?))?\]\]/g,
      (match, path, caption) => `![${caption || ""}](wiki://${path})`,
    );

    const slugger = new GithubSlugger();
    const mdxSource = await serialize(processedContent, {
      mdxOptions: {
        format: "md",
        remarkPlugins: [
          remarkGfm,
          [
            remarkWikiLink,
            {
              aliasDivider: "|",
              pageResolver: (name: string) => [name],
              hrefTemplate: (permalink: string) =>
                `wiki://${slugger.slug(permalink)}`,
            },
          ],
          remarkRuby,
          remarkMath,
          remarkMathToTex,
          // debugPlugin,
          // remarkObsidian,
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
          [rehypeCallouts, rehypeCalloutOptions],
          rehypeSlug,
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
