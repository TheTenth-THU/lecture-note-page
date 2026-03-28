import { getCloudflareContext } from "@opennextjs/cloudflare";
import matter from "gray-matter";

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
 * 获取 GitHub 仓库中指定目录的内容，支持递归获取子目录结构
 *
 * 在以下情形下会返回 `undefined`：
 * - 请求的目录不存在或无法访问
 * - GitHub API 返回的内容不是预期的目录列表格式
 * - 发生网络错误或其他异常
 *
 * @param semester 学期标识，例如 "24Spring"
 * @param directoryPath 仓库中的目录路径，例如 "CourseName/Notes"
 * @param recursive 是否递归获取子目录结构，默认为 false
 * @returns 包含目录内容的对象，或在发生错误时返回 undefined
 */
export default async function getGitHubDir(
  semester: string,
  directoryPath: string,
  recursive = false,
): Promise<
  | {
      type: "DIR";
      details: GitHubDirectoryDetailTerm[];
    }
  | undefined
> {
  // 从环境变量中获取 GitHub 仓库信息
  const { env } = getCloudflareContext();
  const GITHUB_TOKEN = await env.GITHUB_NOTE_TOKEN.get();
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

  const fileUrl =
    directoryPath.startsWith("/") ?
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents${directoryPath}`
    : `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${directoryPath}`;

  try {
    // 从 GitHub 获取文件内容
    const res = await fetch(fileUrl, fetchOptions);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        `Failed to fetch ${fileUrl}: \n拉取 ${fileUrl} 时发生错误:`,
        errorText,
      );
      return undefined;
    }
    const contents = await res.json();

    if (!Array.isArray(contents)) {
      console.error(
        "Expected an array response for directory contents, got: \n预期目录内容应该是一个数组，但实际返回了：",
        contents,
        "You might want to use `get-github-file` instead of `get-github-dir` for this path. \n你可能需要针对这个路径使用 `get-github-file` 而不是 `get-github-dir`。",
      );
      return undefined;
    }
    if (!recursive) {
      // 仅返回目录下的文件和子目录列表
      return {
        type: "DIR",
        details: contents.map((item) => {
          return {
            name: item.name,
            type: item.type,
            path: item.path,
          };
        }),
      };
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
          console.error(
            `Failed to fetch directory ${path}: \n拉取目录 ${path} 时发生错误:`,
            await dirRes.text(),
          );
          return { results: [], indexFilePath: "" };
        }
        const dirContents = await dirRes.json();
        if (!Array.isArray(dirContents)) {
          console.error(
            "Expected an array response for directory contents, got: \n预期目录内容应该是一个数组，但实际返回了：",
            dirContents,
          );
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
        await recursiveFetch(directoryPath);
      // 如果找到了 index 文件，立即获取其 front matter 中的 longform.scenes 字段
      if (indexFilePath) {
        console.log("Found index file at: \n找到索引文件于：", indexFilePath);
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
              "Index file front matter `longform.scenes`: \n索引文件 front matter 中的 `longform.scenes:`",
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
            frontMatter.longform.scenes.forEach((scene: string | string[]) => {
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
                      (item) => item.name.replace(/\.mdx?$/, "") === subScene,
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
            });
            // 添加剩余未在 scenes 中出现的文件和目录
            for (const item of allDetails) {
              if (!sceneSet.has(item.path)) {
                newDetails.push(item);
              }
            }
            console.log(
              "Reordered directory details based on scenes: \n根据 scenes 重新排序后的目录详情:",
              newDetails,
            );
            return {
              type: "DIR",
              details: newDetails,
            };
          }
        }
      }

      return {
        type: "DIR",
        details: allDetails,
      };
    }
  } catch (error) {
    console.error(
      "Error fetching file from GitHub:\n从 GitHub 获取文件时发生错误:",
      error,
    );
    return undefined;
  }
}
