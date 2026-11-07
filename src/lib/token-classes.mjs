// Code tokens come in seven colours, so each gets a class (global.css) and not its own style attribute.
// Used by the Markdown config and by the Code component where a page renders code itself.
const TOKEN_CLASS = {
  'color:#032563;--shiki-dark:#ADDCFF': 'c1',
  'color:#0E1116;--shiki-dark:#F0F3F6': 'c2',
  'color:#A0111F;--shiki-dark:#FF9492': 'c3',
  'color:#023B95;--shiki-dark:#91CBFF': 'c4',
  'color:#702C00;--shiki-dark:#FFB757': 'c5',
  'color:#66707B;--shiki-dark:#BDC4CC': 'c6',
  'color:#622CBC;--shiki-dark:#DBB7FF': 'c7',
};

export const tokenClasses = {
  name: 'token-classes',
  span(node) {
    const c = TOKEN_CLASS[node.properties.style];
    if (c) {
      delete node.properties.style;
      this.addClassToHast(node, c);
    }
  },
};
