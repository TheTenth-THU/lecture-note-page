"use client";

import { useState, useEffect, useCallback } from "react";
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

import {
  FolderOpenIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";

/**
 * Overrides the default MDX components with custom ones.
 * 覆盖默认的 MDX 组件以使用自定义组件。
 */
const overrideComponents: MDXComponents = {
  ...components,
  a: ({ children, href, ...props }) => (
    <InlineLink href={href} {...props}>
      {children}
    </InlineLink>
  ),
};

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
interface DirResponse {
  // represents a directory listing
  error: string;
  details: GitHubDirectoryDetailTerm[];
}
interface DocResponse {
  // represents a markdown document
  title: string;
  content: MDXRemoteSerializeResult;
}

/**
 * Directory list component for navigating the file structure.
 * 目录列表组件，用于导航文件结构。
 */
function DirectoryList({
  dir,
  onSelect,
}: {
  dir: GitHubDirectoryDetailTerm[];
  onSelect: (path: string) => void;
}) {
  return (
    <ul className="space-y-0.5">
      {dir.map((item) => (
        <li key={item.path}>
          {item.type === "file" ? ( // only files are selectable
            <button
              className="
                flex items-center w-full text-left px-2 py-1.5 text-sm 
                text-gray-600 dark:text-gray-300 
                hover:bg-purple-200 hover:text-[#660974] 
                hover:dark:bg-[#41044a] hover:dark:text-purple-200
                rounded-md transition-colors group"
              onClick={() => onSelect(item.path)}>
              <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-400 group-hover:text-purple-200 shrink-0" />
              <span className="truncate">{item.name}</span>
            </button>
          ) : (
            // directories, not selectable
            <div className="select-none">
              <div className="flex items-center px-2 py-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                <FolderOpenIcon className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                <span className="truncate">{item.name}/</span>
              </div>
              {item.children && (
                <div className="ml-4 pl-2 border-l border-gray-200 dark:border-gray-700">
                  <DirectoryList dir={item.children} onSelect={onSelect} />
                </div>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * Fetches and processes the markdown content for a given slug.
 * @returns An object containing the serialized source and front matter.
 */
export default function DocPage() {
  /**
   * State variables & their setter functions
   * 状态变量及其设置函数
   */
  // 目录
  const [dir, setDir] = useState<GitHubDirectoryDetailTerm[]>([]);
  // 文档
  const [doc, setDoc] = useState<DocResponse | null>(null);
  // 当前页面路径
  const [currentPage, setCurrentPage] = useState<string>("量子与统计");
  // 加载与错误状态
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 控制侧边栏开关的状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // 控制页眉缩小的状态
  const [isShrunk, setIsShrunk] = useState(false);

  // Effect to add and remove the scroll event listener
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

  /**
   * Updates the directory state variable `dir` with new data.
   * If the `currentPage` path exists in the current directory, it will put the new directory data under `dir` as the children of the current page.
   * @param data
   */
  const updateDir = useCallback((data: DirResponse) => {
    const dataDir = data.details;
    // look for current page in current dir
    const current = dir.find((item) => item.path === currentPage);
    if (current) {
      // if found, update as its children
      current.children = dataDir;
      setDir([...dir]);
      return;
    } else {
      // if not found, set as current entry
      setDir(dataDir);
      return;
    }
  }, [currentPage, dir]);

  useEffect(() => {
    const fetchDoc = async (page: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/get-doc?page=${page}`);
        if (!res.ok && res.status !== 400) {
          throw new Error(`Failed to fetch document: ${res.statusText}`);
        }

        // if status is 400, it might be a directory
        if (res.status === 400) {
          const dirData: DirResponse = await res.json();
          console.log("Directory data:", dirData);
          if (dirData.details.length === 0) {
            throw new Error(
              "The specified path is a directory but it is empty."
            );
          }
          updateDir(dirData);
          setDoc(null);
          return fetchDoc(dirData.details[0].path); // fetch the first file in the directory
        }
        // otherwise, it is a document
        const data: DocResponse = await res.json();
        setDoc(data);
      } catch (e: unknown) {
        const errorMessage =
          e instanceof Error
            ? e.message
            : e instanceof Object && "toString" in e
            ? e.toString()
            : "An unknown error occurred";
        setError(errorMessage);
        setDoc(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoc(currentPage);
  }, [currentPage]); // re-fetch when currentPage changes

  /**
   * Render loading, error, or document content
   * 渲染加载中、错误信息或文档内容
   */
  const renderMessageOrContent = () => {
    if (isLoading) {
      return <div className="text-gray-500">Loading...</div>;
    }
    if (error) {
      return <div className="text-red-500">Error: {error}</div>;
    }
    if (!doc) {
      return <div className="text-gray-500">No document found.</div>;
    }
    return (
      <article className="prose dark:prose-invert lg:prose-xl">
        <h1 className="my-4 text-4xl font-bold">{doc.title}</h1>
        <MathJaxComponent>
          <MDXRemote {...doc.content} components={overrideComponents} />
        </MathJaxComponent>
      </article>
    );
  };

  return (
    <div className="min-h-screen">
      <aside
        className={`
          ${isSidebarOpen ? "w-72 border-r" : "w-0"} 
          transition-all duration-300 ease-in-out 
          border-gray-200 dark:border-gray-400
          bg-[#fbdfffd0] dark:bg-[#0d010fD0]
          overflow-hidden shrink-0
          fixed left-0 z-40 ${
            isShrunk
              ? "top-32 h-[calc(100vh-128px)]"
              : "top-56 h-[calc(100vh-224px)]"
          }
        `}>
        <div className="h-full overflow-y-auto p-6 w-72">
          {" "}
          {/* w-72 强制宽度，防止收起时内容挤压 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-xl text-gray-700 dark:text-gray-200">
              Contents
            </h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="
                rounded-md p-2 
                bg-[#1e293944]
                hover:bg-purple-200 hover:text-[#660974] 
                hover:dark:bg-[#41044a] hover:dark:text-purple-200
               transition-colors
              "
              title="收起">
              <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <DirectoryList dir={dir} onSelect={(path) => setCurrentPage(path)} />
        </div>
      </aside>

      {/* 主要内容区域 */}
      <main className="min-w-0 relative max-w-4xl px-14 md:px-28 content-center mx-auto">
        {/* 当侧边栏关闭时显示的展开按钮 */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`
            fixed left-4 ${
              isShrunk ? "top-36" : "top-60"
            } transition-all duration-300 ease-in-out
            rounded-md p-2 
            bg-[#1e293944] border border-gray-400 
            hover:bg-purple-200 hover:text-[#660974] 
            hover:dark:bg-[#41044a] hover:dark:text-purple-200
            ${isSidebarOpen ? "opacity-0 -z-50" : "opacity-100 z-50"}
          `}
          title="展开">
          <Bars3Icon className="w-5 h-5" />
        </button>

        {renderMessageOrContent()}
      </main>
    </div>
  );
}
