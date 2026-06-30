import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface InlineSuggestionOptions {
  class: string;
}

export interface InlineSuggestionStorage {
  suggestion: string;
  candidates: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineSuggestion: {
      setSuggestion: (suggestion: string, candidates?: string[]) => ReturnType;
      clearSuggestion: () => ReturnType;
    };
  }
}

export const InlineSuggestion = Extension.create<InlineSuggestionOptions, InlineSuggestionStorage>({
  name: 'inlineSuggestion',

  addOptions() {
    return {
      class: 'verra-ghost-text select-none pointer-events-none opacity-40 italic',
    };
  },

  addStorage() {
    return {
      suggestion: '',
      candidates: [],
    };
  },

  addCommands() {
    return {
      setSuggestion: (suggestion: string, candidates: string[] = []) => ({ view }) => {
        this.storage.suggestion = suggestion;
        this.storage.candidates = candidates;
        // Trigger a transaction to redraw decorations
        view.dispatch(view.state.tr);
        return true;
      },
      clearSuggestion: () => ({ view }) => {
        this.storage.suggestion = '';
        this.storage.candidates = [];
        view.dispatch(view.state.tr);
        return true;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        const suggestion = this.storage.suggestion;
        const candidates = this.storage.candidates;
        
        if (!suggestion) {
          return false;
        }

        // Clear suggestion first
        this.storage.suggestion = '';
        this.storage.candidates = [];

        // Insert suggestion at cursor with the glow mark (containing candidates)
        const { state } = this.editor.view;
        const { selection } = state;
        const { from } = selection;

        this.editor
          .chain()
          // Insert the suggestion text (with a leading space if needed to flow naturally)
          .insertContentAt(from, suggestion)
          .focus()
          .run();

        // Apply the glow mark to the inserted range
        const to = from + suggestion.length;
        this.editor
          .chain()
          .setTextSelection({ from, to })
          .setMark('glow', { candidates })
          // Collapse selection to end of inserted content
          .setTextSelection(to)
          .unsetMark('glow') // remove mark for future typing
          .run();

        return true;
      },
      Escape: () => {
        if (this.storage.suggestion) {
          this.storage.suggestion = '';
          this.storage.candidates = [];
          this.editor.view.dispatch(this.editor.view.state.tr);
          return true;
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    const key = new PluginKey('inlineSuggestion');

    return [
      new Plugin({
        key,
        props: {
          decorations: (state) => {
            const { selection } = state;
            const { suggestion } = this.storage;

            if (!suggestion || !selection.empty) {
              return DecorationSet.empty;
            }

            const widget = document.createElement('span');
            widget.className = this.options.class;
            widget.textContent = suggestion;

            // side: 1 places it after the cursor
            const decoration = Decoration.widget(selection.from, widget, {
              side: 1,
            });

            return DecorationSet.create(state.doc, [decoration]);
          },
        },
      }),
    ];
  },
});
