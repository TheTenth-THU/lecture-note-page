import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: [
    "next-mdx-remote",
    "gray-matter",
    "remark-gfm",
    "remark-math",
    "remark-obsidian-callout",
    "remark-wiki-link",
    "rehype-raw",
  ],
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
