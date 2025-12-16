import type { MDXComponents } from "mdx/types";

export const components: MDXComponents = {
  // 标题
  h1: ({ children }) => <h1 className="my-4 text-4xl font-bold text-[#660974] dark:text-[#dfaef8]">{children}</h1>,
  h2: ({ children }) => (
    <h2 className="mt-6 mb-3 text-3xl font-bold flex flex-row text-[#660974] dark:text-[#dfaef8] scroll-mt-36" id={children.toString()}>
      <p className="mr-[0.2em]">◤</p>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 mb-2.5 text-2xl font-bold flex flex-row text-[#660974] dark:text-[#dfaef8] scroll-mt-36" id={children.toString()}>
      <p className="mr-[0.5em]">■{" "}</p>
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="my-2 text-xl font-bold flex flex-row text-[#660974] dark:text-[#dfaef8] scroll-mt-36" id={children.toString()}>
      <p className="mr-[0.5em]">▶{" "}</p>
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 className="my-1.5 text-lg font-bold text-[#660974] dark:text-[#dfaef8] scroll-mt-36" id={children.toString()}>
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 className="my-1 text-base font-bold text-[#660974] dark:text-[#dfaef8] scroll-mt-36" id={children.toString()}>
      {children}
    </h6>
  ),
  // 文本
  p: ({ children }) => <p className="my-2 leading-7">{children}</p>,
  strong: ({ children, ...props }) => (
    <strong className="font-bold text-[#A7064D] dark:text-[#ffb3d4]" {...props}>
      {children}
    </strong>
  ),
  // 列表
  ul: ({ children }) => <ul className="my-1 list-disc pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1 list-decimal pl-5">{children}</ol>,
  // 表格
  table: ({ children }) => (
    <table className="my-4 w-full border-collapse border border-gray-300 dark:border-gray-600">
      {children}
    </table>
  ),
  th: ({ children }) => (
    <th className="border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 px-4 py-2 text-left">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
      {children}
    </td>
  ),
};

export default function useMDXComponents(): MDXComponents {
  return components;
}
