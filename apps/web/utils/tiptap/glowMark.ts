import { Mark, mergeAttributes } from '@tiptap/core';

export interface GlowMarkAttributes {
  candidates?: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    glowMark: {
      setGlowMark: (attributes?: GlowMarkAttributes) => ReturnType;
      toggleGlowMark: () => ReturnType;
      unsetGlowMark: () => ReturnType;
    };
  }
}

export const GlowMark = Mark.create({
  name: 'glow',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'verra-glow-text cursor-help',
      },
    };
  },

  addAttributes() {
    return {
      candidates: {
        default: null,
        parseHTML: (element) => {
          const raw = element.getAttribute('data-candidates');
          try {
            return raw ? JSON.parse(raw) : null;
          } catch (e) {
            return null;
          }
        },
        renderHTML: (attributes) => {
          if (!attributes.candidates) {
            return {};
          }
          return {
            'data-candidates': JSON.stringify(attributes.candidates),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.verra-glow-text',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setGlowMark: (attributes) => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      toggleGlowMark: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
      unsetGlowMark: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});
