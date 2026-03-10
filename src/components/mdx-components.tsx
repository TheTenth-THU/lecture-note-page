import type { MDXComponents } from "mdx/types";

export const components = {
  // 标题
  h1: ({ children, ...props }) => (
    <h1 className="text-primary-f50 mt-10 mb-6 text-4xl font-bold" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2
      className="text-primary-f50 mt-6 mb-5 flex scroll-mt-36 flex-row text-3xl font-bold"
      {...props}>
      <p className="mr-[0.2em]">◤</p>
      <div>{children}</div>
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="text-primary-f50 mt-4 mb-3 flex scroll-mt-36 flex-row text-2xl font-bold"
      {...props}>
      <p className="mr-[0.5em]">■ </p>
      <div>{children}</div>
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4
      className="text-primary-f50 my-2 flex scroll-mt-36 flex-row text-xl font-bold"
      {...props}>
      <p className="mr-[0.5em]">▶ </p>
      <div>{children}</div>
    </h4>
  ),
  h5: ({ children, ...props }) => (
    <h5
      className="text-primary-f50 my-2 scroll-mt-36 text-lg font-bold"
      {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }) => (
    <h6
      className="text-primary-f50 my-2 scroll-mt-36 text-base font-bold"
      {...props}>
      {children}
    </h6>
  ),
  // 文本
  p: ({ children }) => <p className="my-2 leading-7">{children}</p>,
  strong: ({ children, ...props }) => (
    <strong className="text-secondary-f50 font-bold" {...props}>
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
  ul: ({ children }) => <ul className="my-1 list-disc pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1 list-decimal pl-5">{children}</ol>,
  // 表格
  table: ({ children }) => (
    <table className="border-mixed-25 my-4 w-full border-collapse border">
      {children}
    </table>
  ),
  th: ({ children }) => (
    <th className="border-mixed-25 bg-mixed-10 border px-4 py-2 text-left">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-mixed-25 border px-4 py-2">{children}</td>
  ),
} satisfies MDXComponents;

export default function useMDXComponents(): MDXComponents {
  return components;
}
