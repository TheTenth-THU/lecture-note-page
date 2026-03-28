import { notFound, redirect } from "next/navigation";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";

import "@/app/markdown.css";
import "@/app/math.css";
import DocClient from "./client";
import getGitHubDir from "@/lib/github/get-github-dir";
import getGitHubFile from "@/lib/github/get-github-file";
import processMdx from "@/lib/mdx/process-mdx";

/**
 * Types for GitHub API responses
 * GitHub API 响应的类型定义
 */
interface GitHubDirectoryDetailTerm {
  name: string;
  type: string;
  path: string;
  children?: GitHubDirectoryDetailTerm[];
}

type DocResponse =
  | {
      kind: "mdx";
      title: string;
      source: string;
      options?: any;
    }
  | {
      kind: "text";
      title: string;
      content: string;
    }
  | {
      kind: "pdf" | "image" | "other";
      title: string;
      url: string;
    };

type PageParams = {
  params: Promise<{ slug?: string[] }>;
};

/**
 * 解析 slug 为各个组件。
 * @param slug URL 中的 slug 部分，形如 [semester, course, ...docPath]
 */
function parseSlug(slug?: string[]) {
  if (!slug || slug.length === 0) {
    return { semester: "", course: "", docPath: "", fullPath: "" };
  }

  const slugArray = Array.isArray(slug) ? slug : [slug];
  const semester = decodeURIComponent(slugArray[0]);
  const course = slugArray.length > 1 ? decodeURIComponent(slugArray[1]) : "";
  const docPath =
    slugArray.length > 2 ?
      decodeURIComponent(slugArray.slice(2).join("/"))
    : "";

  return {
    semester,
    course,
    docPath,
    fullPath: decodeURIComponent(slugArray.join("/")),
  };
}

/**
 * 根据文件名推断非文本文件类型，返回 "pdf"、"image" 或 "other"
 * @param fileName 文件名
 */
function inferDocKind(fileName: string): "pdf" | "image" | "other" {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) {
    return "pdf";
  }

  if (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".svg")
  ) {
    return "image";
  }

  return "other";
}

/**
 * 解析目录结构，找到合适的目标文件路径进行重定向
 *
 * 规则如下：
 * 1. 优先寻找 index.md、index.mdx、readme.md、readme.mdx 作为目录的默认文档
 * 2. 如果没有上述文件，寻找第一个文本文件（.md/.mdx）作为默认文档
 * 3. 如果没有文本文件，返回第一个文件（无论类型）作为默认文档
 * 4. 如果目录下没有任何文件，返回 undefined
 * @param details 目录详情列表
 * @returns 目标文件路径或 undefined
 */
function resolveDirectoryTarget(details: GitHubDirectoryDetailTerm[]) {
  const indexFile = details.find(
    (entry) =>
      entry.type === "file" &&
      ["index.md", "index.mdx", "readme.md", "readme.mdx"].includes(
        entry.name.toLowerCase(),
      ),
  );
  if (indexFile) {
    return indexFile.path;
  }

  const firstFile = details.find((entry) => entry.type === "file");
  if (firstFile) {
    return firstFile.path;
  }

  return details[0]?.path;
}

export default async function DocPage({ params }: PageParams) {
  const resolvedParams = await params;
  const {
    semester,
    course: currentCourse,
    docPath,
    fullPath,
  } = parseSlug(resolvedParams.slug);

  const availableSemesters = [
    "23Autumn",
    "24Spring",
    "24Autumn",
    "25Spring",
    "25Autumn",
    "26Spring",
  ];
  if (!semester || !availableSemesters.includes(semester)) {
    console.error(
      "[/[...slug]:DocPage] Catch-all route requires at least 1 segment of path as `semester`, but got:\n路由至少需要一个路径段作为 `semester`，但实际解析到的参数为：\n",
      resolvedParams.slug,
    );
    notFound();
  }

  const coursesDir = await getGitHubDir(semester, "/", false);
  const courses =
    coursesDir?.type === "DIR" && coursesDir.details ?
      coursesDir.details.filter(
        (item) => item.type === "dir" && !item.name.startsWith("."),
      )
    : [];

  // 获取当前课程的目录结构以供侧边栏使用
  let courseStructure: GitHubDirectoryDetailTerm[] = [];
  if (currentCourse) {
    const structure = await getGitHubDir(semester, currentCourse, true);
    if (structure?.type === "DIR" && structure.details) {
      courseStructure = structure.details;
    }
  }

  // 获取当前文档内容
  let doc: DocResponse | null = null;
  if (currentCourse) {
    const requestPath =
      docPath ? `${currentCourse}/${docPath}` : `${currentCourse}/`;
    const fileData = await getGitHubFile(semester, requestPath);

    // 如果直接请求的路径没有文件，尝试解析为目录并寻找默认文档进行重定向
    if (!fileData) {
      const directory = await getGitHubDir(semester, requestPath, false);
      if (!directory?.details?.length) {
        notFound();
      }

      const target = resolveDirectoryTarget(directory.details);
      if (!target) {
        notFound();
      }

      redirect(`/${semester}/${target}`);
    }

    // 根据文件名和内容判断文档类型，如果是 MDX 则进行处理，否则直接提供下载链接
    const lowerName = fileData.fileName.toLowerCase();
    const filePath = docPath ? `${currentCourse}/${docPath}` : currentCourse;

    if (lowerName.endsWith(".md") || lowerName.endsWith(".mdx")) {
      const { source, frontmatter, options } = await processMdx(
        fileData as { contentDecoded: string; fileName: string },
      );

      doc = {
        kind: "mdx",
        title: frontmatter.title || fileData.fileName,
        source,
      };
    } else if ("contentDecoded" in fileData) {
      doc = {
        kind: "text",
        title: fileData.fileName,
        content: fileData.contentDecoded,
      };
    } else {
      doc = {
        kind: inferDocKind(fileData.fileName),
        title: fileData.fileName,
        url: `/api/get-asset?semester=${encodeURIComponent(semester)}&page=${encodeURIComponent(filePath)}`,
      };
    }
  }

  return (
    <DocClient
      semester={semester}
      currentCourse={currentCourse}
      fullPath={fullPath}
      courses={courses}
      courseStructure={courseStructure}
      doc={doc}
    />
  );
}
