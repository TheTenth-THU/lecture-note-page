import { visit } from "unist-util-visit";

/**
 * 将 math 节点转换回 TeX 表示形式的 remark 插件。
 * @returns {function} Remark 插件函数
 */
export default function remarkMathToTex() {
  return (tree: any) => {
    visit(tree, (node) => {
      if (node.type === "inlineMath") {
        node.type = "text";
        node.value = `\\(${node.value}\\)`;
      } else if (node.type === "math") {
        node.type = "text";
        node.value = `\\[${node.value}\\]`;
      }
    });
  };
}
