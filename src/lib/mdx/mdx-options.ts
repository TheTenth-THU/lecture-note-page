import GithubSlugger from "github-slugger";

import remarkGfm from "remark-gfm";
import { remarkExtendedTable } from "remark-extended-table";
import remarkMath from "remark-math";
import remarkWikiLink from "remark-wiki-link";
import rehypeCallouts, {
  type UserOptions as RehypeCalloutsOptions,
} from "rehype-callouts";
import rehypeSlug from "rehype-slug";
import rehypeRaw from "rehype-raw";

import calloutIcons from "@/app/ui/callout-icons";
import remarkMathToTex from "@/lib/mdx/remark-math-to-tex";
import remarkRuby from "@/lib/mdx/remark-ruby";
import rehypeMathToTex from "@/lib/mdx/rehype-math-to-tex";
import rehypeObsidianId from "@/lib/mdx/rehype-obsidian-id";

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

export const mdxSerializeOptions: any = {
  parseFrontmatter: false,
  mdxOptions: {
    format: "md",
    remarkPlugins: [
      remarkGfm,
      remarkExtendedTable,
      [
        remarkWikiLink,
        {
          aliasDivider: "|",
          pageResolver: (name: string) => [name],
          hrefTemplate: (permalink: string) => {
            // 分割 permalink，形如：
            // - "Page"
            // - "Page#Heading" | "#Heading"
            // - "Page#^Id" | "#^Id"
            const [page, rest] = permalink.split("#");
            const [heading, id] =
              rest ? rest.split("^") : [undefined, undefined];
            const headingSlug =
              heading ? new GithubSlugger().slug(heading) : "";
            return (
              rest ?
                id ? `wiki://${page}#${headingSlug}^${id}`
                : `wiki://${page}#${headingSlug}`
              : `wiki://${page}`
            );
          },
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
