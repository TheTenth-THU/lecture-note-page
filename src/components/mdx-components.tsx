import type { MDXComponents } from "mdx/types";
import { firaCode } from "@/app/ui/fonts";
import clsx from "clsx";

export const components = {
  // 标题
  h1: ({ children, className, ...props }) => (
    <h1
      className={clsx(
        "text-primary-f50 mt-10 mb-6 text-4xl font-bold",
        className,
      )}
      {...props}>
      {children}
      <hr className="from-primary-f50 my-2 h-0.5 border-0 bg-linear-to-r to-transparent" />
    </h1>
  ),
  h2: ({ children, className, divClassName, ...props }) => (
    <h2
      className={clsx(
        "text-primary-f50 mt-8 mb-5 flex scroll-mt-36 flex-row text-3xl font-bold",
        className,
      )}
      {...props}>
      <p className={`mr-[0.2em] ${firaCode.className}`}>◤</p>
      <div className={divClassName}>{children}</div>
    </h2>
  ),
  h3: ({ children, className, divClassName, ...props }) => (
    <h3
      className={clsx(
        "text-primary-f50 mt-6 mb-3 flex scroll-mt-36 flex-row text-2xl font-bold",
        className,
      )}
      {...props}>
      <p className={`mr-[0.5em] ${firaCode.className}`}>■</p>
      <div className={divClassName}>{children}</div>
    </h3>
  ),
  h4: ({ children, className, divClassName, ...props }) => (
    <h4
      className={clsx(
        "text-primary-f50 my-2 flex scroll-mt-36 flex-row text-xl font-bold",
        className,
      )}
      {...props}>
      <p className={`mr-[0.5em] ${firaCode.className}`}>▶</p>
      <div className={divClassName}>{children}</div>
    </h4>
  ),
  h5: ({ children, className, ...props }) => (
    <h5
      className={clsx(
        "text-primary-f50 my-2 scroll-mt-36 text-lg font-bold",
        className,
      )}
      {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, className, ...props }) => (
    <h6
      className={clsx(
        "text-primary-f50 my-2 scroll-mt-36 text-base font-bold",
        className,
      )}
      {...props}>
      {children}
    </h6>
  ),
  // 文本
  p: ({ children, className, ...props }) => (
    <p className={clsx("my-2 leading-7", className)} {...props}>
      {children}
    </p>
  ),
  strong: ({ children, className, ...props }) => (
    <strong
      className={clsx("text-secondary-f50 font-bold", className)}
      {...props}>
      {children}
    </strong>
  ),
  hr: (props) => (
    <hr
      className="via-mixed-50 my-4 h-px border-0 bg-linear-to-r from-transparent to-transparent"
      {...props}
    />
  ),
  // 列表
  ul: ({ children, className, ...props }) => (
    <ul className={clsx("my-1 list-disc pl-5", className)} {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, className, ...props }) => (
    <ol className={clsx("my-1 list-decimal pl-5", className)} {...props}>
      {children}
    </ol>
  ),
  // 表格
  table: ({ children, className, ...props }) => (
    <table
      className={clsx(
        "border-mixed-25 my-4 w-full border-collapse border",
        className,
      )}
      {...props}>
      {children}
    </table>
  ),
  th: ({ children, className, ...props }) => (
    <th
      className={clsx(
        "border-mixed-25 bg-mixed-10 border px-4 py-2 text-left",
        className,
      )}
      {...props}>
      {children}
    </th>
  ),
  td: ({ children, className, ...props }) => (
    <td
      className={clsx("border-mixed-25 border px-4 py-2", className)}
      {...props}>
      {children}
    </td>
  ),
} satisfies MDXComponents;

export default function useMDXComponents(): MDXComponents {
  return components;
}
