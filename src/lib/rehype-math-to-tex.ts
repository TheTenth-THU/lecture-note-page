import { visit } from "unist-util-visit";
import type { Plugin } from "unified";
import type { Root } from "hast";

/**
 * A rehype plugin to convert math nodes back to their TeX representation.
 * This allows client-side MathJax to process them.
 */
const rehypeMathToTex: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      // Ensure the node has a parent and is not the first child
      if (!parent || index === null) {
        return;
      }

      // Get the className and first child node
      const className = node.properties?.className;
      const childNode = node.children[0];
      if (
        !childNode ||
        (childNode.type !== "text" && childNode.type !== "element")
      ) {
        return;
      }

      // remark-math converts inline math to a <code> with class "math-inline"
      if (
        node.tagName === "code" &&
        Array.isArray(className) &&
        className.includes("math-inline")
      ) {
        if (childNode && childNode.type === "text") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (node as any).type = "text";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (node as any).value = `\\(${childNode.value}\\)`;
          // @ts-expect-error - Transforming `element` to `text` node requires removing `tagName`
          delete node.tagName;
          // @ts-expect-error - Transforming `element` to `text` node requires removing `properties`
          delete node.properties;
          // @ts-expect-error - Transforming `element` to `text` node requires removing `children`
          delete node.children;
        }
      }

      // remark-math converts display math to a <pre> with a <code> child with class `.math-display`
      if (node.tagName === "pre") {
        const childNode = node.children[0];
        if (
          childNode &&
          childNode.type === "element" &&
          childNode.tagName === "code"
        ) {
          const className = childNode.properties?.className;
          if (
            !Array.isArray(className) ||
            !className.includes("math-display")
          ) {
            return;
          }
          const textNode = childNode.children[0];
          if (textNode && textNode.type === "text") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (node as any).type = "text";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (node as any).value = `\\[${textNode.value}\\]`;
            // @ts-expect-error - Transforming `element` to `text` node requires removing `tagName`
            delete node.tagName;
            // @ts-expect-error - Transforming `element` to `text` node requires removing `properties`
            delete node.properties;
            // @ts-expect-error - Transforming `element` to `text` node requires removing `children`
            delete node.children;
          }
        }
      }
    });
  };
};

export default rehypeMathToTex;
