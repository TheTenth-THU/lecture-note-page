import { getCloudflareContext } from "@opennextjs/cloudflare";

import matter from "gray-matter";
import { mdxSerializeOptions } from "@/lib/mdx/mdx-options";
import transformExtendedTableSyntax from "@/lib/mdx/transform-extended-table";

export async function readPublicAssetText(assetPath: string): Promise<string> {
  const normalized = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;

  try {
    const { env } = getCloudflareContext();

    const assets = env.ASSETS;
    if (!assets) {
      throw new Error(
        "Missing Cloudflare assets binding: env.ASSETS\n缺少 Cloudflare 资源绑定：env.ASSETS",
      );
    }
    const res = await assets.fetch(`https://assets.local/${normalized}`);
    if (!res.ok) {
      throw new Error(
        `Asset not found: /${normalized} (${res.status})\n资源未找到：/${normalized} (${res.status})`,
      );
    }
    return await res.text();
  } catch (error) {
    // 在开发环境中尝试从本地文件系统读取
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[readPublicAssetText] Attempting to read local file for asset "/${normalized}" in development mode...\n正在开发环境中尝试读取本地文件资源 "/${normalized}"...`,
      );
      const fs = await import("fs/promises");
      const path = await import("path");
      const localPath = path.join(process.cwd(), "public", normalized);
      try {
        return await fs.readFile(localPath, "utf-8");
      } catch (fsError) {
        console.error(
          `[readPublicAssetText] Error reading local file "${localPath}": \n无法读取本地文件 "${localPath}"：\n`,
          fsError,
        );
        throw fsError;
      }
    }

    throw error;
  }
}

/**
 * 从 Markdown 文件中提取第一段描述文字
 * @param filePath 相对于 `src/content` 的文件路径，例如 `projects/example.zh.md`
 * @returns 描述文字或 undefined
 */
export async function getProjectDescription(filePath: string) {
  // 从 public/content 目录读取 MDX 文件
  let fileContents: string;
  try {
    fileContents = await readPublicAssetText(`content/${filePath}`);
  } catch (error) {
    console.warn(
      `[getProjectDescription] Could not read file "content/${filePath}": \n无法读取文件 "content/${filePath}"：\n`,
      error,
    );
    return undefined;
  }
  // 使用 gray-matter 解析 frontmatter
  const { content, data } = matter(fileContents);

  // 按双换行符分割段落
  const blocks = content.split(/\n\s*\n/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // 过滤掉标题
    if (trimmed.startsWith("#")) continue;
    // 过滤掉图片 (![...](...) 或 ![[...]])
    if (trimmed.startsWith("![")) continue;
    // 过滤掉 import/export 语句
    if (trimmed.startsWith("import ") || trimmed.startsWith("export "))
      continue;
    // 过滤掉 HTML/JSX 标签
    if (trimmed.startsWith("<")) continue;
    // 过滤掉引用块 (视情况而定，如果描述在引用块中则去掉此行)
    if (trimmed.startsWith(">")) continue;

    // 过滤掉由斜体包裹的元数据行 (例如: _2024 Summer_ | ...)
    // 这是一个强假设：假设元数据行总是以 _ 或 * 开头并结尾
    if (
      (trimmed.startsWith("_") && trimmed.endsWith("_")) ||
      (trimmed.startsWith("*") && trimmed.endsWith("*"))
    ) {
      continue;
    }

    // 找到第一段，进行简单的 Markdown 格式清除
    return trimmed
      .replace(/\[\[(.*?)(?:\|(.*?))?\]\]/g, "$2$1") // Obsidian 链接 [[link|text]] -> textlink (简化处理)
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // 标准链接 [text](url) -> text
      .replace(/(\*\*|__)(.*?)\1/g, "$2") // 粗体
      .replace(/(\*|_)(.*?)\1/g, "$2") // 斜体
      .replace(/`([^`]+)`/g, "$1") // 行内代码
      .replace(/!\[.*?\]\(.*?\)/g, "") // 行内图片
      .replace(/\s+/g, " "); // 合并空白字符
  }

  return undefined;
}

//////////////////
// 处理 MDX 文件的主函数
// 支持两种调用方式：
// 1. 直接传入相对于 `src/content` 的文件路径，函数内部读取文件内容
// 2. 传入 MDX 文件的 URL 和 Fetch 配置，函数内部通过 Fetch 获取文件内容
//////////////////

type MdxResult = {
  source: string;
  frontmatter: Record<string, any>;
  options: any;
};

/**
 * 处理 MDX 文件，返回序列化后的内容和 frontmatter 数据
 * @param filePath 相对于 `src/content` 的文件路径，例如 `notes/example.mdx`
 * @returns 包含序列化 MDX 内容和 frontmatter 数据的对象
 */
export async function processMdx(filePath: string): Promise<MdxResult>;

/**
 * 处理 MDX 文件，返回序列化后的内容和 frontmatter 数据
 * @param fileUrl MDX 文件的 URL
 * @param fetchOptions Fetch 配置，如 headers
 * @returns 包含序列化 MDX 内容和 frontmatter 数据的对象
 */
export async function processMdx(
  fileUrl: string,
  fetchOptions: RequestInit,
  getContents?: (res: Response) => Promise<string>,
): Promise<MdxResult>;

/**
 * 处理 MDX 文件，返回序列化后的内容和 frontmatter 数据
 * @param filePath 相对于 `src/content` 的文件路径，例如 `notes/example.mdx`
 * @returns 包含序列化 MDX 内容和 frontmatter 数据的对象
 */
export async function processMdx(input: {
  contentDecoded: string;
  fileName: string;
}): Promise<MdxResult>;

export default async function processMdx(
  input: string | { contentDecoded: string; fileName: string },
  options?: RequestInit,
  getContents?: (res: Response) => Promise<string>,
): Promise<MdxResult> {
  let fileContents: string;
  if (options && typeof input === "string") {
    // 通过 Fetch 获取 MDX 文件内容
    const res = await fetch(input, options);
    if (!res.ok) {
      throw new Error(
        `Failed to fetch MDX file from "${input}": ${res.status}`,
      );
    }
    fileContents = getContents ? await getContents(res) : await res.text();
  } else if (typeof input === "object" && "contentDecoded" in input) {
    // 直接使用传入的 MDX 内容
    fileContents = input.contentDecoded;
  } else {
    fileContents = await readPublicAssetText(`content/${input}`);
  }

  // 使用 gray-matter 解析 frontmatter
  const { content, data } = matter(fileContents);

  // 序列化 MDX
  // 将 content 中的 `<br>` 替换为闭合的 `<br />`
  let processedContent = content.replace(/<br\s*\/?>/g, "<br />");
  // 兼容 Obsidian table-extended 的 tx 与 -tx- 触发语法
  processedContent = transformExtendedTableSyntax(processedContent);
  // 处理 Obsidian 图片链接 ![[path/to/image.png|alt text]]
  // 替换为标准的 markdown 图片链接 ![alt text](/path/to/image.png)
  processedContent = processedContent.replace(
    /!\[\[(.*?)(?:\|(.*?))?\]\]/g,
    (match, path: string, caption: string) => {
      const replaced =
        path.startsWith("http") ?
          `![${caption || ""}](${path})`
        : `![${caption || ""}](wiki://${path})`;
      console.info(
        "[processMdx] Processing Obsidian image link:\n正在处理 Obsidian 图片链接：\n",
        {
          match,
          path,
          caption,
          replaced,
        },
      );
      return replaced;
    },
  );
  return {
    source: processedContent,
    frontmatter: data,
    options: mdxSerializeOptions,
  };
}
