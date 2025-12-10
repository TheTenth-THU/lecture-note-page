import type { MDXComponents } from 'mdx/types'
 
export const components: MDXComponents = {
  // Add custom MDX components here
  h1: ({ children }) => <h1 className="text-4xl font-bold my-4">{children}</h1>,
  h2: ({ children }) => <h2 className="text-3xl font-bold my-3">{children}</h2>,
  h3: ({ children }) => <h3 className="text-2xl font-bold my-2.5">{children}</h3>,
  h4: ({ children }) => <h4 className="text-xl font-bold my-2">{children}</h4>,
  h5: ({ children }) => <h5 className="text-lg font-bold my-1.5">{children}</h5>,
  h6: ({ children }) => <h6 className="text-base font-bold my-1">{children}</h6>,
}

export default function useMDXComponents(): MDXComponents {
  return components
}