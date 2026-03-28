"use client";

import { Children, isValidElement, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MDXComponents } from "mdx/types";
import ReactMarkdown from "react-markdown";

import Image from "next/image";
import clsx from "clsx";

import { components } from "@/components/mdx-components";
import InlineLink from "@/app/ui/inline-link";
import MathJaxComponent from "@/components/mathjax-component";
import TikzBlock from "@/components/tikz-block";
import { useTheme } from "@/contexts/theme-context";
import { firaCode } from "@/app/ui/fonts";

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
      options?: any;
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
        className="border-primary-b50 bg-primary-b50 focus:border-primary-f50 focus:ring-primary-f50 w-full rounded-md border px-3 py-2 shadow-sm focus:ring-1 focus:outline-none">
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
      className="space-y-0.5 border-l border-gray-200 dark:border-gray-700"
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

// 引入插件
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkWikiLink from "remark-wiki-link";
import remarkRuby from "@/lib/mdx/remark-ruby";
import remarkMathToTex from "@/lib/mdx/remark-math-to-tex";

import rehypeObsidianId from "@/lib/mdx/rehype-obsidian-id";
import rehypeCallouts, {
  type UserOptions as RehypeCalloutsOptions,
} from "rehype-callouts";
import rehypeSlug from "rehype-slug";
import rehypeRaw from "rehype-raw";
import rehypeMathToTex from "@/lib/mdx/rehype-math-to-tex";

import GithubSlugger from "github-slugger";
import calloutIcons from "@/app/ui/callout-icons";

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
      indicator: calloutIcons.info,
    },
    theorem: {
      title: "Theorem",
      indicator: calloutIcons.tldr,
    },
    lemma: {
      title: "Lemma",
      indicator: calloutIcons.tldr,
    },
    proof: {
      title: "Proof",
      indicator: calloutIcons.info,
    },
  },
};

const slugger = new GithubSlugger();
export const mdxSerializeOptions: any = {
  parseFrontmatter: false,
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
      rehypeMathToTex,
    ],
  },
};

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
  const { font } = useTheme();
  const mathJaxFontName = font === "sans" ? "mathjax-fira" : "mathjax-tex";

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
      return (
        <InlineLink href={finalHref} {...props}>
          {children}
        </InlineLink>
      );
    },
    img: ({ alt, src, ...props }) => {
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
      return (
        <div key={fullPath}>
          <article className="prose dark:prose-invert lg:prose-xl">
            <components.h1>
              <p className="text-lg">{currentCourse}</p>
              {doc.title?.replace(/\.mdx?$/, "")}
            </components.h1>
            <div className="mathjax-wrapper-isolation">
              <MathJaxComponent
                fontName={mathJaxFontName}
                key={`${fullPath}:${mathJaxFontName}`}
                renderKey={`${fullPath}:${mathJaxFontName}`}>
                <ReactMarkdown
                  remarkPlugins={mdxSerializeOptions.mdxOptions.remarkPlugins}
                  rehypePlugins={mdxSerializeOptions.mdxOptions.rehypePlugins}
                  components={overrideComponents as any}>
                  {doc.source}
                </ReactMarkdown>
              </MathJaxComponent>
            </div>
          </article>
        </div>
      );
    }

    if (doc.kind === "pdf") {
      return (
        <div key={fullPath} className="my-8">
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
        <div key={fullPath} className="my-8">
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

    return <div className="text-gray-500">Unsupported document type.</div>;
  };

  return (
    <div className="min-h-screen">
      <aside
        className={` ${isSidebarOpen ? "w-72 border-r" : "w-0"} fixed left-0 z-40 shrink-0 overflow-hidden border-gray-200 bg-[#fbdfffd0] transition-all duration-300 ease-in-out dark:border-gray-400 dark:bg-[#0d010fD0] ${
          isShrunk ?
            "top-32 h-[calc(100vh-128px)]"
          : "top-56 h-[calc(100vh-224px)]"
        }`}>
        <div className="scrollbar-thin h-full w-72 overflow-y-auto p-6">
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

      <main className="relative mx-auto max-w-4xl min-w-0 content-center px-14 md:px-28">
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
