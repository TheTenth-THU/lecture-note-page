import { getCloudflareContext } from "@opennextjs/cloudflare";

interface GitHubFileResponse {
  type: string;
  name: string;
  size: number;
  content: string;
  encoding: BufferEncoding;
}

/**
 * 获取 GitHub 仓库中指定文件的内容
 *
 * 在以下情形下会返回 `undefined`：
 * - 请求的文件不存在或无法访问
 * - GitHub API 返回的内容是一个目录列表而非文件内容（此时应使用 `get-github-dir` 函数）
 * - 发生网络错误或其他异常
 *
 * @param semester 学期标识，例如 "24Spring"
 * @param filePath 仓库中的文件路径，例如 "CourseName/NotesLecture1.md"
 * @returns 包含文件内容的对象，或在发生错误时返回 undefined
 */
export default async function getGitHubFile(
  semester: string,
  filePath: string,
): Promise<
  | {
      contentDecoded: string;
      fileName: string;
    }
  | {
      contentBuffer: Buffer;
      fileName: string;
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
    filePath.startsWith("/") ?
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents${filePath}`
    : `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;

  try {
    // 从 GitHub 获取文件内容
    const res = await fetch(fileUrl, fetchOptions);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        `[getGitHubFile] Failed to fetch ${fileUrl}: \n获取 ${fileUrl} 时出错：\n`,
        errorText,
      );
      return undefined;
    }
    const contents = await res.json();

    if (Array.isArray(contents)) {
      console.error(
        `[getGitHubFile] Expected a file response but got an array for ${fileUrl}: \n获取 ${fileUrl} 时出错：\n`,
        contents,
        "You might want to use `get-github-dir` instead of `get-github-file` for this path.\n你可能需要针对这个路径使用 `get-github-dir` 而不是 `get-github-file`。",
      );
      return undefined;
    }

    if (
      [".md", ".mdx", ".txt", ".json", ".m", ".tex"].some((ext) =>
        (contents as GitHubFileResponse).name.endsWith(ext),
      )
    ) {
      // 对于文本文件，转码解析文件内容
      const contentDecoded = Buffer.from(
        (contents as GitHubFileResponse).content,
        (contents as GitHubFileResponse).encoding,
      ).toString("utf-8");
      return {
        contentDecoded,
        fileName: (contents as GitHubFileResponse).name,
      };
    } else {
      // 对于非文本文件，返回 get-asset 路径
      return {
        contentBuffer: Buffer.from(
          (contents as GitHubFileResponse).content,
          (contents as GitHubFileResponse).encoding,
        ),
        fileName: (contents as GitHubFileResponse).name,
      };
    }
  } catch (error) {
    console.error(
      `[getGitHubFile] Error fetching file from GitHub: \n获取 GitHub 文件时出错：\n`,
      error,
    );
    return undefined;
  }
}
