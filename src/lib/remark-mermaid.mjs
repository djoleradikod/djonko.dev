// Turns ```mermaid fenced blocks into <pre class="mermaid"> so they render as diagrams, not code.
import { visit } from 'unist-util-visit';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export default function remarkMermaid() {
  return (tree, file) => {
    const isMdx = String(file.path ?? file.history?.[0] ?? '').endsWith('.mdx');
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'mermaid' || !parent || index == null) return;
      if (isMdx) {
        const attr = (name, value) => ({ type: 'mdxJsxAttribute', name, value });
        parent.children[index] = {
          type: 'mdxJsxFlowElement', name: 'figure', attributes: [attr('className', 'fig mermaid-fig')],
          children: [{ type: 'mdxJsxFlowElement', name: 'pre', attributes: [attr('className', 'mermaid')], children: [{ type: 'text', value: node.value }] }],
        };
      } else {
        parent.children[index] = { type: 'html', value: `<figure class="fig mermaid-fig"><pre class="mermaid">${esc(node.value)}</pre></figure>` };
      }
    });
  };
}
