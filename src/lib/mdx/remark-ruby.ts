interface TextNode {
  type: "text";
  value: string;
}

interface ParentNode {
  type: string;
  children?: RubyNodeChild[];
}

interface HtmlNode {
  type: "html";
  value: string;
}

type RubyNodeChild = TextNode | ParentNode | HtmlNode;

type Atom =
  | {
      type: "char";
      value: string;
    }
  | {
      type: "node";
      node: RubyNodeChild;
    };

const EXCLUDED_PARENTS = new Set([
  "link",
  "image",
  "linkReference",
  "imageReference",
  "definition",
  "footnoteDefinition",
  "footnoteReference",
  "html",
  "inlineCode",
  "code",
  "yaml",
]);

function isParentNode(node: unknown): node is ParentNode {
  return Boolean(
    node &&
    typeof node === "object" &&
    "type" in node &&
    Array.isArray((node as ParentNode).children),
  );
}

function isTextNode(node: RubyNodeChild): node is TextNode {
  return node.type === "text";
}

function isHtmlNode(node: RubyNodeChild): node is HtmlNode {
  return node.type === "html";
}

function flattenChildren(children: RubyNodeChild[]): Atom[] {
  const atoms: Atom[] = [];

  for (const child of children) {
    if (isTextNode(child)) {
      for (const character of child.value) {
        atoms.push({ type: "char", value: character });
      }
      continue;
    }

    atoms.push({ type: "node", node: child });
  }

  return atoms;
}

function atomsToNodes(atoms: Atom[]): RubyNodeChild[] {
  const nodes: RubyNodeChild[] = [];
  let textBuffer = "";

  const flushText = () => {
    if (!textBuffer) {
      return;
    }

    nodes.push({
      type: "text",
      value: textBuffer,
    });
    textBuffer = "";
  };

  for (const atom of atoms) {
    if (atom.type === "char") {
      textBuffer += atom.value;
      continue;
    }

    flushText();
    nodes.push(atom.node);
  }

  flushText();
  return nodes;
}

function hasRenderableContent(atoms: Atom[]): boolean {
  return atoms.some((atom) => {
    if (atom.type === "node") {
      return true;
    }

    return atom.value.trim().length > 0;
  });
}

function hasLineBreak(atoms: Atom[]): boolean {
  return atoms.some(
    (atom) => atom.type === "char" && /[\r\n]/.test(atom.value),
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stringifyNode(node: RubyNodeChild): string {
  if (isTextNode(node)) {
    return node.value;
  }

  if (isHtmlNode(node)) {
    return node.value;
  }

  if (isParentNode(node) && Array.isArray(node.children)) {
    return node.children.map(stringifyNode).join("");
  }

  return "";
}

function stringifyAtoms(atoms: Atom[]): string {
  return atoms
    .map((atom) => {
      if (atom.type === "char") {
        return atom.value;
      }

      return stringifyNode(atom.node);
    })
    .join("");
}

function createRubyNode(baseAtoms: Atom[], rubyAtoms: Atom[]): HtmlNode {
  const baseText = escapeHtml(stringifyAtoms(baseAtoms));
  const rubyText = escapeHtml(stringifyAtoms(rubyAtoms));

  return {
    type: "html",
    value: `<ruby>${baseText}<rt>${rubyText}</rt></ruby>`,
  };
}

function isCharAtom(atom: Atom | undefined, value: string): boolean {
  return atom?.type === "char" && atom.value === value;
}

function transformChildren(children: RubyNodeChild[]): RubyNodeChild[] {
  const atoms = flattenChildren(children);
  const transformedAtoms: Atom[] = [];

  let index = 0;
  while (index < atoms.length) {
    const atom = atoms[index];

    if (atom.type !== "char" || atom.value !== "{") {
      transformedAtoms.push(atom);
      index += 1;
      continue;
    }

    let separatorIndex = -1;
    let closingIndex = -1;

    for (let cursor = index + 1; cursor < atoms.length; cursor += 1) {
      const current = atoms[cursor];
      if (current.type !== "char") {
        continue;
      }

      if (current.value === "|" && separatorIndex === -1) {
        separatorIndex = cursor;
        continue;
      }

      if (current.value === "}" && separatorIndex !== -1) {
        closingIndex = cursor;
        break;
      }
    }

    if (separatorIndex === -1 || closingIndex === -1) {
      transformedAtoms.push(atom);
      index += 1;
      continue;
    }

    const baseAtoms = atoms.slice(index + 1, separatorIndex);
    const rubyAtoms = atoms.slice(separatorIndex + 1, closingIndex);

    if (
      !hasRenderableContent(baseAtoms) ||
      !hasRenderableContent(rubyAtoms) ||
      hasLineBreak(baseAtoms) ||
      hasLineBreak(rubyAtoms)
    ) {
      transformedAtoms.push(atom);
      index += 1;
      continue;
    }

    const rubyNode = createRubyNode(baseAtoms, rubyAtoms);

    const wrappedByStrong =
      transformedAtoms.length >= 2 &&
      isCharAtom(transformedAtoms[transformedAtoms.length - 1], "*") &&
      isCharAtom(transformedAtoms[transformedAtoms.length - 2], "*") &&
      isCharAtom(atoms[closingIndex + 1], "*") &&
      isCharAtom(atoms[closingIndex + 2], "*");

    if (wrappedByStrong) {
      transformedAtoms.pop();
      transformedAtoms.pop();
      transformedAtoms.push({
        type: "node",
        node: {
          type: "html",
          value: `<strong>${rubyNode.value}</strong>`,
        },
      });
      index = closingIndex + 3;
      continue;
    }

    transformedAtoms.push({
      type: "node",
      node: rubyNode,
    });
    index = closingIndex + 1;
  }

  return atomsToNodes(transformedAtoms);
}

function visitRubyCandidates(node: ParentNode) {
  if (!node.children || EXCLUDED_PARENTS.has(node.type)) {
    return;
  }

  for (const child of node.children) {
    if (isParentNode(child)) {
      visitRubyCandidates(child);
    }
  }

  node.children = transformChildren(node.children);
}

export default function remarkRuby() {
  return (tree: ParentNode) => {
    visitRubyCandidates(tree);
  };
}
