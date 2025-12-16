import type { Root, Element, Text } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

function normalizeClassName(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string");
  if (typeof value === "string") return value.split(/\s+/).filter(Boolean);
  return [];
}

/**
 * Rehype 插件：支持 Obsidian 的 block id 语法 `^id`
 *
 * 支持两种常见写法：
 *  1) 行末： <p>some text ^abc123</p>
 *  2) 独占一段：<p>^abc123</p>（你提到主要是这种）
 *
 * 输出：
 *  <p id="abc123" class="... scroll-mt-36">...</p>
 */
const rehypeObsidianId: Plugin<[], Root> = () => {
  // 1) 只匹配“行末”的 block id：空白 + ^ + (字母数字/_/-) + 可选空白
  const trailingBlockIdRegex = /(?:\s+)(\^[A-Za-z0-9_-]+)\s*$/;

  // 2) 匹配“整段只有 block id”（允许前后空白）
  const standaloneBlockIdRegex = /^\s*(\^[A-Za-z0-9_-]+)\s*$/;

  return (tree) => {
    visit(tree, "element", (node) => {
      const el = node as Element;
      if (el.tagName !== "p") return;

      // 已经有 id 的就不覆盖（避免和你已有的 id/插件冲突）
      const existingId = (el.properties as any)?.id;
      if (typeof existingId === "string" && existingId.length > 0) return;

      const children = el.children;
      if (!Array.isArray(children) || children.length === 0) return;

      // 情况 (2)：整段只由 Text 构成，且内容形如 "^id"
      // 例如 mdast->hast 后的 <p>^JumuHanshuDeDaoshu</p>
      const allTextChildren = children.every((c) => c && c.type === "text");
      if (allTextChildren) {
        const combined = (children as Text[]).map((t) => t.value).join("");
        const mStandalone = combined.match(standaloneBlockIdRegex);
        if (mStandalone) {
          const id = mStandalone[1];

          el.properties ??= {};
          (el.properties as any).id = id;

          const classList = normalizeClassName(
            (el.properties as any).className,
          );
          if (!classList.includes("scroll-mt-108"))
            classList.push("scroll-mt-108");
          (el.properties as any).className = classList;

          // 移除段落中的 "^id" 文本，保留一个空的锚点节点
          el.children = [];
          return;
        }
      }

      // 情况 (1)：从后向前找最后一个 Text 节点，匹配 “... ^id”
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (!child || child.type !== "text") continue;

        const textNode = child as Text;
        if (typeof textNode.value !== "string") return;

        const mTrailing = textNode.value.match(trailingBlockIdRegex);
        if (!mTrailing) return;

        const id = mTrailing[1];

        // 删除末尾 " ^id"
        textNode.value = textNode.value
          .replace(trailingBlockIdRegex, "")
          .replace(/\s+$/, "");

        // 写 id + className(scroll-mt-36)
        el.properties ??= {};
        (el.properties as any).id = id;

        const classList = normalizeClassName((el.properties as any).className);
        if (!classList.includes("scroll-mt-108"))
          classList.push("scroll-mt-108");
        (el.properties as any).className = classList;

        return;
      }
    });
  };
};

export default rehypeObsidianId;
