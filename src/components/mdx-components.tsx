import type { MDXComponents } from "mdx/types";

export const components: MDXComponents = {
  // Add custom MDX components here
  h1: ({ children }) => <h1 className="my-4 text-4xl font-bold text-[#660974] dark:text-[#dfaef8]">{children}</h1>,
  h2: ({ children }) => (
    <h2 className="my-3 text-3xl font-bold text-[#660974] dark:text-[#dfaef8] scroll-mt-36" id={children.toString()}>
      <p className="mr-[0.2em] inline-block">◤</p>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="my-2.5 text-2xl font-bold text-[#660974] dark:text-[#dfaef8] scroll-mt-36" id={children.toString()}>
      <p className="mr-[0.5em] inline-block">■{" "}</p>
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="my-2 text-xl font-bold text-[#660974] dark:text-[#dfaef8] scroll-mt-36" id={children.toString()}>
      <p className="mr-[0.5em] inline-block">▶{" "}</p>
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
  strong: ({ children, ...props }) => (
    <strong className="font-bold text-[#A7064D] dark:text-[#ffb3d4]" {...props}>
      {children}
    </strong>
  ),
  ul: ({ children }) => <ul className="my-1 list-disc pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1 list-decimal pl-5">{children}</ol>,
};

export default function useMDXComponents(): MDXComponents {
  return components;
}
