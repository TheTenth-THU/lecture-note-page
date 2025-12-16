"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { MDXComponents } from "mdx/types";
// import { MDXRemote } from "next-mdx-remote/rsc";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { components } from "@/components/mdx-components";

// import remarkGfm from "remark-gfm";
// import remarkMath from "remark-math";
// import remarkObsidianCallout from "remark-obsidian-callout";
// import remarkWikiLink from "remark-wiki-link";
// import rehypeRaw from "rehype-raw";
// // import rehypeKatex from "rehype-katex";
// import rehypeMathToTex from "@/lib/rehype-math-to-tex";

import "@/app/markdown.css";
import InlineLink from "@/app/ui/inline-link";
import MathJaxComponent from "@/components/mathjax-component";
import Image from "next/image";

import {
  FolderOpenIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  Bars3Icon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

/**
 * Types for GitHub API responses
 * GitHub API 响应的类型定义
 */
interface GitHubDirectoryDetailTerm {
  // represents a file or directory
  name: string;
  type: string;
  path: string;
  children?: GitHubDirectoryDetailTerm[];
}
interface DocResponse {
  type: "DIR" | "FILE";
  // represents a directory listing
  details?: GitHubDirectoryDetailTerm[];
  // represents a markdown document
  title?: string;
  content?: MDXRemoteSerializeResult;
  url?: string;
}

/**
 * Course list as a dropdown component.
 * 显示为下拉菜单的课程列表组件。
 */
function CourseDropdown({
  courses,
  currentCourse,
  onSelect,
}: {
  courses: GitHubDirectoryDetailTerm[];
  currentCourse?: string;
  onSelect: (course: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-row items-center space-x-2 text-[16px]">
      <AcademicCapIcon className="h-6 w-6 text-[#660974] dark:text-purple-400" />
      <select
        value={currentCourse || ""}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm focus:border-[#660974] focus:ring-1 focus:ring-[#660974] focus:outline-none dark:border-[#400649] dark:bg-[#400649] dark:text-gray-200 dark:focus:border-purple-400 dark:focus:ring-purple-400">
        <option value="" disabled className="text-sm italic">
          Select a course
        </option>
        {courses.map((course) => (
          <option key={course.path} value={course.name}>
            {course.name}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Directory list component for navigating the file structure.
 * 目录列表组件，用于导航文件结构。
 */
function RecursiveDirectoryList({
  items,
  onSelect,
  currentPath,
  leftMargin = 0,
}: {
  items: GitHubDirectoryDetailTerm[];
  onSelect: (path: string) => void;
  currentPath?: string;
  leftMargin?: number;
}) {
  return (
    <ul
      className="space-y-0.5 border-l border-gray-200 dark:border-gray-700"
      style={{ marginLeft: leftMargin }}>
      {items.map((item) => (
        // 每个文件或目录项
        <li key={item.path}>
          {
            item.type === "file" ?
              // 文件项
              item.name.startsWith(".") ?
                null
              : <button
                  className={`group flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    currentPath === item.path ?
                      "bg-purple-100 font-medium text-[#660974] dark:bg-[#41044a] dark:text-purple-200"
                    : "text-gray-600 hover:bg-purple-50 hover:text-[#660974] dark:text-gray-300 hover:dark:bg-[#41044a] hover:dark:text-purple-200"
                  } `}
                  onClick={() => onSelect(item.path)}>
                  <DocumentTextIcon className="mr-2 h-4 w-4 shrink-0 text-gray-400 group-hover:text-purple-200" />
                  <span className="truncate">
                    {item.name.endsWith(".mdx") ?
                      item.name.slice(0, -4)
                    : item.name.endsWith(".md") ?
                      item.name.slice(0, -3)
                    : item.name}
                  </span>
                </button>

              // 目录项
            : <div className="select-none">
                <div className="flex items-center px-2 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                  <FolderOpenIcon className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate">{item.name}/</span>
                </div>
                {item.children && (
                  <RecursiveDirectoryList
                    items={item.children}
                    onSelect={onSelect}
                    currentPath={currentPath}
                    leftMargin={25}
                  />
                )}
              </div>

          }
        </li>
      ))}
    </ul>
  );
}

/**
 * Fetches and processes the markdown content for a given slug.
 * 处理给定 slug 的 markdown 内容的获取和处理。
 * @returns An object containing the serialized source and front matter.
 */
export default function DocPage() {
  const params = useParams();
  const router = useRouter();

  // 解析 URL 参数
  const getParams = () => {
    // 处理空参数情况
    if (!params?.slug) return { course: "", docPath: "" };

    const slugArray = Array.isArray(params.slug) ? params.slug : [params.slug];
    // 第一个部分为课程名
    const course = decodeURIComponent(slugArray[0]);
    // 剩余部分重新组合为路径，如果只有一级则 docPath 为空
    const docPath =
      slugArray.length > 1 ?
        decodeURIComponent(slugArray.slice(1).join("/"))
      : "";

    return {
      course,
      docPath,
      fullPath: decodeURIComponent(slugArray.join("/")),
    };
  };

  const { course: currentCourse, fullPath } = getParams();

  /**
   * State variables & their setter functions
   * 状态变量及其设置函数
   */
  // 一级目录列表
  const [courses, setCourses] = useState<GitHubDirectoryDetailTerm[]>([]);
  // 当前课程的详细结构
  const [courseStructure, setCourseStructure] = useState<
    GitHubDirectoryDetailTerm[]
  >([]);
  // 当前页面显示的文档内容
  const [doc, setDoc] = useState<DocResponse | null>(null);
  // 已经加载的文档路径
  const [loadedPath, setLoadedPath] = useState<string | null>(null);

  // 控制加载状态
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  // 控制错误状态
  const [error, setError] = useState<string | null>(null);

  // 控制侧边栏开关的状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // 控制页眉缩小的状态
  const [isShrunk, setIsShrunk] = useState(false);

  // 添加和移除滚动事件监听器
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsShrunk(true);
        setIsSidebarOpen(false);
      } else {
        setIsShrunk(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // 初始获取所有一级目录（课程列表）
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // 获取根目录内容
        const res = await fetch(`/api/get-doc?page=/`);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch courses due to ${res.statusText}: ${await res.text()}`,
          );
        }

        const data: DocResponse = await res.json();
        if (data.type !== "DIR") {
          throw new Error("Expected a directory response for courses");
        }

        // 过滤出跟目录下的每个目录作为课程列表
        const courseList =
          data.details?.filter((item) => item.type === "dir") || [];
        setCourses(courseList);
      } catch (e) {
        console.error("Failed to fetch courses", e);
      }
    };
    fetchCourses();
  }, []);

  // 当 currentCourse 变化时，获取该课程的详细结构
  useEffect(() => {
    // 如果没有选中课程则不执行
    if (!currentCourse) return;

    const fetchCourseStructure = async (curDir: string) => {
      // // 定义递归获取目录结构
      // const recursiveFetchCourseStructure = async (dir: string): Promise<GitHubDirectoryDetailTerm[]> => {
      //   // 获取目录 `curDir` 下的内容
      //   const res = await fetch(`/api/get-doc?page=${curDir}`);
      //   if (!res.ok) {
      //     throw new Error(`Failed to fetch course structure at "${curDir}": ${res.statusText}`);
      //   }

      //   const data: DocResponse = await res.json();
      //   if (data.type !== "DIR") {
      //     throw new Error("Expected a directory response for course structure");
      //   }

      //   const detailedItems: GitHubDirectoryDetailTerm[] = [];
      //   for (const item of data.details || []) {
      //     if (item.type === "dir") {
      //       // 递归获取子目录内容
      //       const children = await recursiveFetchCourseStructure(item.path);
      //       detailedItems.push({ ...item, children });
      //     } else {
      //       detailedItems.push(item);
      //     }
      //   }
      //   return detailedItems;
      // }

      // try {
      //   const detailedItems = await recursiveFetchCourseStructure(curDir);
      //   setCourseStructure(detailedItems);
      // } catch (e) {
      //   console.error(`Failed to fetch course structure at "${curDir}":`, e);
      // }

      // 使用 recursive 参数调用 get-doc API 获取完整目录结构
      const res = await fetch(`/api/get-doc?page=${curDir}&recursive=true`);
      if (!res.ok) {
        console.error(
          `Failed to fetch course structure at "${curDir}": ${res.statusText}`,
        );
        return;
      }
      const data: DocResponse = await res.json();
      if (data.type !== "DIR" || !data.details) {
        console.error("Expected a directory response for course structure");
        return;
      }

      // 直接使用返回的目录结构
      setCourseStructure(data.details);
    };

    fetchCourseStructure(currentCourse);
  }, [currentCourse]);

  // 获取文档内容
  useEffect(() => {
    const fetchDoc = async () => {
      // 如果没有路径则不执行
      if (!fullPath) return;

      setIsLoadingDoc(true);
      setError(null);

      try {
        const res = await fetch(`/api/get-doc?page=${fullPath}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch document: ${res.statusText}`);
        }
        const data: DocResponse = await res.json();

        if (data.type === "DIR") {
          // 目录
          // 不需要更新 courseStructure，上面已经加载全量结构
          // 只需要处理路由跳转，防止用户停留在空白的文件夹页面
          if (data.details && data.details.length > 0) {
            // 查找 index.md 或 README.md 文件
            const indexFile = data.details.find(
              (d) =>
                d.type === "file" &&
                (d.name.toLowerCase() === "index.md" ||
                  d.name.toLowerCase() === "readme.md"),
            );
            if (indexFile) {
              // 替换当前 URL，不推入历史记录以免回退死循环
              setDoc(null);
              setIsLoadingDoc(false);
              router.replace(`/${indexFile.path}`);
              return;
            }
            // 未找到，则查找第一个文件
            const firstFile = data.details.find((d) => d.type === "file");
            if (firstFile) {
              // 替换当前 URL，不推入历史记录以免回退死循环
              setDoc(null);
              router.replace(`/${firstFile.path}`);
            } else {
              // 只有文件夹，进入第一个文件夹
              const firstDir = data.details[0];
              setDoc(null);
              router.replace(`/${firstDir.path}`);
            }
          }
        } else if (data.type === "FILE") {
          // 是文档
          setDoc(data);
          setLoadedPath(fullPath);
        } else {
          throw new Error(
            `Failed to fetch due to ${res.statusText}: Unknown document type`,
          );
        }
      } catch (e: any) {
        setError(e.message || "Unknown error");
        setDoc(null);
      } finally {
        setIsLoadingDoc(false);
      }
    };

    fetchDoc();
  }, [fullPath, router]);

  /**
   * Overrides the default MDX components with custom ones.
   * 覆盖默认的 MDX 组件以使用自定义组件。
   */
  const overrideComponents: MDXComponents = {
    ...components,
    a: ({ children, href, ...props }) => {
      let finalHref = href || "";
      // 处理 wiki:// 链接
      if (href && href.startsWith("wiki://#")) {
        finalHref = href.replace("wiki://#", `/${fullPath}#`);
        if (children && typeof children === "string") {
          children = children.replace("#", "");
        }
      } else if (href && href.startsWith("wiki://")) {
        finalHref = href.replace("wiki://", `/${currentCourse}/`);
      }
      // 处理空格编码问题
      finalHref = finalHref.replace(/_/g, " ");
      return (
        <InlineLink href={finalHref} {...props}>
          {children}
        </InlineLink>
      );
    },
  };

  /**
   * Render loading, error, or document content
   * 渲染加载中、错误信息或文档内容
   */
  const renderMessageOrContent = () => {
    // 状态信息
    if (fullPath !== loadedPath || isLoadingDoc) {
      return <div className="text-gray-500">Loading the document...</div>;
    }
    if (error) {
      return <div className="text-red-500">Error: {error}</div>;
    }
    if (!doc || !doc.content) {
      return <div className="text-gray-500">No documents are available.</div>;
    }

    // 文档内容
    console.log("Rendering document:", doc);
    if (!doc.title || doc.title.endsWith(".mdx") || doc.title.endsWith(".md")) {
      // MDX 文件
      return (
        <div key={fullPath}>
          <article className="prose dark:prose-invert lg:prose-xl">
            <h1 className="my-4 text-4xl font-bold text-[#660974] dark:text-[#dfaef8]">{doc.title?.replace(/\.mdx?$/, "")}</h1>
            <div className="mathjax-wrapper-isolation">
              <MathJaxComponent>
                <MDXRemote {...doc.content} components={overrideComponents} />
              </MathJaxComponent>
            </div>
          </article>
        </div>
      );
    } else if (doc.title.endsWith(".pdf")) {
      // PDF 文件
      if (!doc.url) {
        return <div className="text-gray-500">No URL available for the PDF document.</div>;
      }
      return (
        <div key={fullPath} className="my-8">
          <iframe
            src={doc.url}
            title={doc.title}
            width="100%"
            height="800px"
            className="border border-gray-300 dark:border-gray-600"
          />
        </div>
      );
    } else if (doc.title.endsWith(".png") || doc.title.endsWith(".jpg") || doc.title.endsWith(".jpeg") || doc.title.endsWith(".gif") || doc.title.endsWith(".svg")) {
      // 图片文件
      if (!doc.url) {
        return <div className="text-gray-500">No URL available for the image document.</div>;
      }
      return (
        <div key={fullPath} className="my-8 text-center">
          <Image
            src={doc.url}
            alt={doc.title}
            className="mx-auto max-w-full rounded-md border border-gray-300 dark:border-gray-600"
          />
        </div>
      );
    } else {
      return <div className="text-gray-500">Unsupported document type.</div>;
    }
  };

  return (
    <div className="min-h-screen">
      <aside
        className={` ${isSidebarOpen ? "w-72 border-r" : "w-0"} fixed left-0 z-40 shrink-0 overflow-hidden border-gray-200 bg-[#fbdfffd0] transition-all duration-300 ease-in-out dark:border-gray-400 dark:bg-[#0d010fD0] ${
          isShrunk ?
            "top-32 h-[calc(100vh-128px)]"
          : "top-56 h-[calc(100vh-224px)]"
        }`}>
        <div className="h-full w-72 overflow-y-auto p-6">
          {/* 标题 */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">
              Contents
            </h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-md bg-[#1e293944] p-2 transition-colors hover:bg-purple-200 hover:text-[#660974] hover:dark:bg-[#41044a] hover:dark:text-purple-200"
              title="收起">
              <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* 课程列表 */}
          <CourseDropdown
            courses={courses}
            currentCourse={currentCourse}
            onSelect={(course) => router.push(`/${course}`)}
          />

          {/* 目录列表 */}
          <RecursiveDirectoryList
            items={courseStructure}
            onSelect={(path) => router.push(`/${path}`)}
            currentPath={fullPath}
          />
        </div>
      </aside>

      {/* 主要内容区域 */}
      <main className="relative mx-auto max-w-4xl min-w-0 content-center px-14 md:px-28">
        {/* 当侧边栏关闭时显示的展开按钮 */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`fixed left-4 ${
            isShrunk ? "top-36" : "top-60"
          } rounded-md border border-gray-400 bg-[#1e293944] p-2 transition-all duration-300 ease-in-out hover:bg-purple-200 hover:text-[#660974] hover:dark:bg-[#41044a] hover:dark:text-purple-200 ${isSidebarOpen ? "-z-50 opacity-0" : "z-50 opacity-100"} `}
          title="展开">
          <Bars3Icon className="h-5 w-5" />
        </button>

        {renderMessageOrContent()}
      </main>
    </div>
  );
}
