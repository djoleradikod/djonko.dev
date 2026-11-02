// Wraps every Markdown table in <div class="table-wrap" tabindex="0">, so a wide table scrolls
// inside its own box on a phone instead of widening the page. The tabindex lets keyboard users
// scroll it; the role and label make the scroll region announce itself.
import { visit } from 'unist-util-visit';

export default function rehypeTableWrap() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || index == null) return;
      if (parent.type === 'element' && (parent.properties?.className ?? []).includes('table-wrap')) return;
      parent.children[index] = {
        type: 'element', tagName: 'div',
        properties: { className: ['table-wrap'], tabIndex: 0, role: 'region', ariaLabel: 'Table, scrolls sideways on small screens' },
        children: [node],
      };
      return index + 1;
    });
  };
}
