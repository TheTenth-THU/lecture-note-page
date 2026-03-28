"use client";

import { Children, isValidElement, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MDXComponents } from "mdx/types";
import ReactMarkdown, { Components, defaultUrlTransform } from "react-markdown";

import Image from "next/image";
import clsx from "clsx";

import { components } from "@/components/mdx-components";
import InlineLink from "@/app/ui/inline-link";
import MathJaxComponent from "@/components/mathjax-component";
import TikzBlock from "@/components/tikz-block";
import { useTheme } from "@/contexts/theme-context";
import { firaCode } from "@/app/ui/fonts";
import { mdxSerializeOptions } from "@/lib/mdx/mdx-options";

import {
  FolderOpenIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  Bars3Icon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

export interface GitHubDirectoryDetailTerm {
  name: string;
  type: string;
  path: string;
  children?: GitHubDirectoryDetailTerm[];
}

export type DocResponse =
  | {
      kind: "mdx";
      title: string;
      source: string;
      options?: unknown;
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

export interface DocClientProps {
  semester: string;
  currentCourse: string;
  fullPath: string;
  courses: GitHubDirectoryDetailTerm[];
  courseStructure: GitHubDirectoryDetailTerm[];
  doc: DocResponse | null;
}

function readTextContent(node: unknown): string {
  if (typeof node === "string") {
    return node;
  }

  if (Array.isArray(node)) {
    return node.map(readTextContent).join("");
  }

  if (
    isValidElement<{ children?: unknown }>(node) &&
    Object.prototype.hasOwnProperty.call(node.props, "children")
  ) {
    return readTextContent(node.props.children);
  }

  return "";
}

function extractTikzFence(children: unknown) {
  const onlyChild =
    Children.count(children) === 1 ? Children.only(children) : null;

  if (
    !onlyChild ||
    !isValidElement<{ className?: string; children?: unknown }>(onlyChild)
  ) {
    return null;
  }

  const className = onlyChild.props.className || "";
  if (!className.includes("language-tikz")) {
    return null;
  }

  return {
    className,
    source: readTextContent(onlyChild.props.children)
      .trim()
      .replaceAll("\\begin{tikzpicture}\n", "\\begin{tikzpicture}[scale=0.8]\n")
      .replaceAll("\\Large", "")
      .replaceAll("\\large", ""),
  };
}

/**
 * 渲染课程目录的下拉选择组件
 * @param courses 可选课程列表
 * @param currentCourse 当前选中的课程
 * @param onSelect 选择课程后的回调函数，参数为选中的课程名称
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
      <AcademicCapIcon className="text-primary-f25 h-6 w-6" />
      <select
        value={currentCourse || ""}
        onChange={(e) => onSelect(e.target.value)}
        className="bg-mixed-25 focus:bg-primary-b25 w-full rounded-md px-3 py-2 shadow-sm focus:outline-none">
        <option value="" disabled className="text-sm italic">
          选择课程 / Select a course
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
 * 递归渲染目录结构为嵌套列表，支持文件和目录两种类型
 *
 * 通过 `currentPath` 参数高亮当前选中的文档路径，`onSelect` 回调函数在点击文件项时触发并传递文件路径。
 *
 * 特别地，对于目录项，如果名称为 `<scene>` 则特殊处理为无标题的场景分隔符，仅显示子项而不显示目录名称。
 *
 * @param semester 学期标识，用于构建链接路径
 * @param items 当前目录下的文件和子目录列表
 * @param onSelect 点击文件项后的回调函数，参数为选中文件的路径
 * @param currentPath 当前选中文档的完整路径，用于高亮显示
 * @param leftMargin 递归调用时的左侧缩进距离，默认为 0
 */
function RecursiveDirectoryList({
  semester,
  items,
  onSelect,
  currentPath,
  leftMargin = 0,
}: {
  semester: string;
  items: GitHubDirectoryDetailTerm[];
  onSelect: (path: string) => void;
  currentPath?: string;
  leftMargin?: number;
}) {
  return (
    <ul
      className="border-mixed-75 space-y-0.5 border-l"
      style={{ marginLeft: leftMargin }}>
      {items.map((item, index) => (
        <li key={`${item.path}:${index}`}>
          {item.type === "file" ?
            item.name.startsWith(".") ?
              null
            : <button
                className={`group flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                  currentPath === `${semester}/${item.path}` ?
                    "bg-primary-b75 text-primary-f25 font-medium"
                  : "text-mixed-75 hover:bg-primary-b50 hover:text-primary-f25"
                } `}
                onClick={() => onSelect(item.path)}>
                <DocumentTextIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">
                  {item.name.endsWith(".mdx") ?
                    item.name.slice(0, -4)
                  : item.name.endsWith(".md") ?
                    item.name.slice(0, -3)
                  : item.name}
                </span>
              </button>

          : item.name.startsWith(".") ?
            null
          : <div className="select-none">
              {item.name === "<scene>" ? null : (
                <div className="text-mixed-75 flex items-center px-2 py-1.5 text-sm font-medium">
                  <FolderOpenIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">{item.name}/</span>
                </div>
              )}
              {item.children && (
                <RecursiveDirectoryList
                  semester={semester}
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

import TocSidebar from "@/components/toc-sidebar";
import GithubSlugger from "github-slugger";

type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

function normalizeHeadingText(raw: string) {
  return (
    raw
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*_~]/g, "")
      // 关键：不要把 <br/> 强制替换成单空格；直接去掉标签本体即可
      .replace(/<br\s*\/?>/gi, "")
      .replace(/<[^>]*>/g, "")
      .replace(/\\([\\`*_{}\[\]()#+\-.!])/g, "$1")
      // 关键：不要再合并连续空白
      .trim()
  );
}

function extractH2TocItems(source: string): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];

  for (const line of source.split("\n")) {
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!match) {
      continue;
    }

    const level = match[1].length;
    const text = normalizeHeadingText(match[2]);
    if (!text) {
      continue;
    }

    const id = slugger.slug(text);
    if (level !== 2 && level !== 3) {
      continue;
    }

    items.push({
      id,
      text,
      level,
    });
  }

  return items;
}

/**
 * 根据 URL 参数解析学期、课程和文档路径，并从 GitHub 获取对应的文档内容进行渲染
 *
 * @param semester 学期标识，例如 "24Spring"
 * @param currentCourse 当前课程名称
 * @param fullPath 当前文档的完整路径，用于高亮目录结构
 * @param courses 可选的课程列表，用于渲染课程选择下拉框
 * @param courseStructure 当前课程的目录结构，用于渲染侧边栏目录树
 * @param doc 当前文档的内容和类型信息，用于渲染文档主体内容
 */
export default function DocClient({
  semester,
  currentCourse,
  fullPath,
  courses,
  courseStructure,
  doc,
}: DocClientProps) {
  const router = useRouter();
  const { font, vectorStyle } = useTheme();
  const mathJaxFontName = font === "sans" ? "mathjax-fira" : "mathjax-tex";
  const mathRenderKey = `${fullPath}:${mathJaxFontName}:${vectorStyle}`;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isShrunk, setIsShrunk] = useState(false);

  // 监听滚动事件，根据滚动位置调整侧边栏的显示状态和页面布局
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
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const mdUrlTransform = (url: string) => {
    if (url.startsWith("wiki://")) {
      return url;
    }
    return defaultUrlTransform(url);
  };

  // 定义 MDX 组件的覆盖版本，针对特定元素（如 pre、code、a、img）进行自定义渲染以支持特殊功能
  const overrideComponents: MDXComponents = {
    ...components,
    pre: ({ children, ...props }) => {
      const tikzFence = extractTikzFence(children);
      if (tikzFence?.source) {
        return <TikzBlock source={tikzFence.source} />;
      }

      return (
        <pre
          className={`doc-pre overflow-x-auto rounded-2xl px-4 py-3 ${firaCode.className}`}
          {...props}>
          {children}
        </pre>
      );
    },
    code: ({ children, className, ...props }) => {
      if (className?.includes("language-tikz")) {
        return (
          <code className={clsx(className, firaCode.className)} {...props}>
            {children}
          </code>
        );
      }

      if (!className) {
        return (
          <code
            className={clsx(
              "rounded-md bg-black/8 px-1.5 py-0.5 text-[0.9em] dark:bg-white/10",
              firaCode.className,
            )}
            {...props}>
            {children}
          </code>
        );
      }

      return (
        <code className={clsx(className, firaCode.className)} {...props}>
          {children}
        </code>
      );
    },
    a: ({ children, href, ...props }) => {
      let finalHref = href || "";
      if (href && href.startsWith("wiki://#")) {
        finalHref = href.replace("wiki://#", `/${fullPath}#`);
        if (children && typeof children === "string") {
          children = children.replace("#", "");
        }
      } else if (href && href.startsWith("wiki://")) {
        const prefix = currentCourse ? `${currentCourse}/` : "";
        finalHref = href.replace("wiki://", `/${semester}/${prefix}`);
      }
      finalHref = finalHref.replace(/_/g, " ");
      console.debug(
        "[DocClient::overrideComponents] Processing link:\n正在处理链接：\n",
        { href, finalHref },
      );

      return (
        <InlineLink href={finalHref} {...props}>
          {children}
        </InlineLink>
      );
    },
    img: ({ alt, src, ...props }) => {
      console.debug(
        "[DocClient::overrideComponents] Processing image with src:\n正在处理图片，`src` 字段为：\n",
        src,
      );
      let finalSrc = src || "";
      if (src && src.startsWith("wiki://")) {
        const filename = src.replace("wiki://", "");
        const pagePath =
          currentCourse ?
            `${currentCourse}/res/${filename}`
          : `res/${filename}`;
        finalSrc = `/api/get-asset?semester=${encodeURIComponent(semester)}&page=${encodeURIComponent(pagePath)}`;
      }

      return (
        <Image
          src={finalSrc}
          alt={alt || ""}
          width={1600}
          height={900}
          sizes="(min-width: 1024px) 896px, 100vw"
          unoptimized
          {...props}
          className="mx-auto max-w-full rounded-2xl border border-gray-300 bg-white/75 dark:border-gray-600"
        />
      );
    },
  };

  const renderMessageOrContent = () => {
    if (!doc) {
      return <div className="text-gray-500">No documents are available.</div>;
    }

    if (doc.kind === "mdx") {
      const tocItems = extractH2TocItems(doc.source);
      const tocTitle = "本页内容";

      return (
        <div key={fullPath} className="mx-auto max-w-7xl px-10 md:px-20">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
            <TocSidebar title={tocTitle} items={tocItems} />
            <article className="max-w-5xl min-w-0">
              <components.h1>
                <p className="mb-1 text-lg">
                  <AcademicCapIcon className="mr-1 inline h-6 w-5 pb-1" />
                  {currentCourse}
                </p>
                {doc.title?.replace(/\.mdx?$/, "")}
              </components.h1>
              <div className="mathjax-wrapper-isolation">
                <MathJaxComponent
                  fontName={mathJaxFontName}
                  key={mathRenderKey}
                  renderKey={mathRenderKey}>
                  <ReactMarkdown
                    urlTransform={mdUrlTransform}
                    remarkPlugins={mdxSerializeOptions.mdxOptions.remarkPlugins}
                    rehypePlugins={mdxSerializeOptions.mdxOptions.rehypePlugins}
                    components={overrideComponents as Components}>
                    {doc.source}
                  </ReactMarkdown>
                </MathJaxComponent>
              </div>
            </article>
          </div>
        </div>
      );
    }

    if (doc.kind === "pdf") {
      return (
        <div key={fullPath} className="mx-auto my-8 max-w-5xl">
          <article className="prose dark:prose-invert lg:prose-xl">
            <components.h1>{doc.title}</components.h1>
            <iframe
              src={doc.url}
              title={doc.title}
              width="100%"
              height="800px"
              className="border border-gray-300 dark:border-gray-600"
            />
          </article>
        </div>
      );
    }

    if (doc.kind === "image") {
      return (
        <div key={fullPath} className="mx-auto my-8 max-w-5xl">
          <article className="prose dark:prose-invert lg:prose-xl">
            <components.h1>{doc.title}</components.h1>
            <Image
              src={doc.url}
              alt={doc.title}
              width={1600}
              height={900}
              sizes="(min-width: 1024px) 896px, 100vw"
              unoptimized
              className="mx-auto max-w-full rounded-2xl border border-gray-300 bg-white/75 dark:border-gray-600"
            />
          </article>
        </div>
      );
    }

    return (
      <div className="mx-auto text-gray-500">Unsupported document type.</div>
    );
  };

  return (
    <div className="min-h-screen">
      <aside
        className={` ${isSidebarOpen ? "w-72 border-r" : "w-0"} border-mixed-50 bg-mixed-10/80 fixed left-0 z-40 shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
          isShrunk ?
            "top-32 h-[calc(100vh-128px)]"
          : "top-56 h-[calc(100vh-224px)]"
        }`}>
        <div className="scrollbar-thin h-full w-72 overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-mixed-75 text-xl font-bold">Contents</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="bg-mixed-25 hover:bg-primary-f75 rounded-md p-2 transition-colors"
              title="收起">
              <ChevronLeftIcon className="text-mixed-50 h-5 w-5" />
            </button>
          </div>

          <CourseDropdown
            courses={courses}
            currentCourse={currentCourse}
            onSelect={(course) => router.push(`/${semester}/${course}`)}
          />

          <RecursiveDirectoryList
            semester={semester}
            items={courseStructure}
            onSelect={(path) => router.push(`/${semester}/${path}`)}
            currentPath={fullPath}
          />
        </div>
      </aside>

      <main className="relative min-w-0">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={`fixed left-4 ${
            isShrunk ? "top-36" : "top-60"
          } bg-mixed-25 hover:bg-primary-f75 border-mixed-50 rounded-md border p-2 transition-all duration-300 ease-in-out ${isSidebarOpen ? "-z-50 opacity-0" : "z-50 opacity-100"} `}
          title="展开">
          <Bars3Icon className="h-5 w-5" />
        </button>
        <div className="mx-auto mt-10 w-full">{renderMessageOrContent()}</div>
      </main>
    </div>
  );
}
