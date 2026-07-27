import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface ResizableImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableImage: {
      setResizableImage: (options: {
        src: string;
        alt?: string;
        width?: number;
        height?: number;
        alignment?: string;
        textWrap?: string;
      }) => ReturnType;
    };
  }
}

export const ResizableImage = Node.create<ResizableImageOptions>({
  name: 'resizableImage',

  addOptions() {
    return {
      inline: false,
      allowBase64: true,
      HTMLAttributes: {},
    };
  },

  group() {
    return 'block';
  },

  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: null },
      height: { default: null },
      alignment: { default: 'center' }, // left, center, right
      textWrap: { default: 'none' }, // none, left, right
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-resizable-image]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { alignment, textWrap, width, height, ...imgAttrs } = HTMLAttributes;
    
    const wrapperStyle: string[] = [];
    const wrapperClass: string[] = ['resizable-image-wrapper'];
    
    if (textWrap === 'left') {
      wrapperStyle.push('float: left', 'margin-right: 16px', 'margin-bottom: 8px');
    } else if (textWrap === 'right') {
      wrapperStyle.push('float: right', 'margin-left: 16px', 'margin-bottom: 8px');
    } else {
      if (alignment === 'center') wrapperStyle.push('margin-left: auto', 'margin-right: auto');
      else if (alignment === 'right') wrapperStyle.push('margin-left: auto');
    }
    
    if (width) wrapperStyle.push(`width: ${width}px`);

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-resizable-image': '',
        class: wrapperClass.join(' '),
        style: wrapperStyle.join('; '),
      }),
      [
        'img',
        mergeAttributes(imgAttrs, {
          style: 'width: 100%; height: auto; display: block; border-radius: 8px;',
          draggable: 'false',
        }),
      ],
    ];
  },

  addCommands() {
    return {
      setResizableImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('div');
      dom.classList.add('resizable-image-container');
      dom.setAttribute('data-resizable-image', '');
      dom.contentEditable = 'false';

      const applyWrapperStyles = () => {
        const { alignment, textWrap, width } = node.attrs;
        dom.style.cssText = '';
        dom.style.position = 'relative';
        dom.style.display = 'inline-block';
        dom.style.maxWidth = '100%';
        dom.style.cursor = 'default';

        if (width) dom.style.width = `${width}px`;

        if (textWrap === 'left') {
          dom.style.float = 'left';
          dom.style.marginRight = '16px';
          dom.style.marginBottom = '8px';
          dom.style.clear = 'left';
        } else if (textWrap === 'right') {
          dom.style.float = 'right';
          dom.style.marginLeft = '16px';
          dom.style.marginBottom = '8px';
          dom.style.clear = 'right';
        } else {
          dom.style.display = 'block';
          if (alignment === 'center') {
            dom.style.marginLeft = 'auto';
            dom.style.marginRight = 'auto';
          } else if (alignment === 'right') {
            dom.style.marginLeft = 'auto';
          }
        }
      };

      applyWrapperStyles();

      // Image
      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || '';
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.borderRadius = '8px';
      img.draggable = false;
      dom.appendChild(img);

      // Selection overlay & resize handles
      const overlay = document.createElement('div');
      overlay.className = 'image-selection-overlay';
      overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;border:2px solid transparent;border-radius:8px;transition:border-color 0.15s;';
      dom.appendChild(overlay);

      // Toolbar
      const toolbar = document.createElement('div');
      toolbar.className = 'image-toolbar';
      toolbar.style.cssText = 'position:absolute;top:-40px;left:50%;transform:translateX(-50%);display:none;background:var(--background,#fff);border:1px solid var(--border,#e5e7eb);border-radius:8px;padding:3px;gap:2px;align-items:center;box-shadow:0 4px 16px rgba(0,0,0,0.12);z-index:50;white-space:nowrap;';

      const createBtn = (label: string, title: string, onClick: () => void, active = false) => {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.title = title;
        btn.style.cssText = `height:26px;min-width:26px;padding:0 6px;border:none;background:${active ? 'hsl(var(--primary)/0.1)' : 'transparent'};color:${active ? 'hsl(var(--primary))' : 'inherit'};border-radius:4px;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:500;`;
        btn.onmouseenter = () => { if (!active) btn.style.background = 'hsl(var(--muted)/0.5)'; };
        btn.onmouseleave = () => { if (!active) btn.style.background = 'transparent'; };
        btn.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); };
        btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); onClick(); };
        return btn;
      };

      const updateAttrs = (attrs: Record<string, any>) => {
        if (typeof getPos === 'function') {
          const pos = getPos();
          if (pos != null) {
            editor.view.dispatch(
              editor.view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs })
            );
          }
        }
      };

      // Alignment buttons
      toolbar.appendChild(createBtn('◀', 'Align Left', () => updateAttrs({ alignment: 'left', textWrap: 'none' }), node.attrs.alignment === 'left' && node.attrs.textWrap === 'none'));
      toolbar.appendChild(createBtn('◆', 'Align Center', () => updateAttrs({ alignment: 'center', textWrap: 'none' }), node.attrs.alignment === 'center' && node.attrs.textWrap === 'none'));
      toolbar.appendChild(createBtn('▶', 'Align Right', () => updateAttrs({ alignment: 'right', textWrap: 'none' }), node.attrs.alignment === 'right' && node.attrs.textWrap === 'none'));

      const sep1 = document.createElement('div');
      sep1.style.cssText = 'width:1px;height:16px;background:var(--border,#e5e7eb);margin:0 2px;';
      toolbar.appendChild(sep1);

      // Wrap buttons
      toolbar.appendChild(createBtn('⬡◁', 'Wrap Left', () => updateAttrs({ textWrap: 'left' }), node.attrs.textWrap === 'left'));
      toolbar.appendChild(createBtn('▷⬡', 'Wrap Right', () => updateAttrs({ textWrap: 'right' }), node.attrs.textWrap === 'right'));

      const sep2 = document.createElement('div');
      sep2.style.cssText = 'width:1px;height:16px;background:var(--border,#e5e7eb);margin:0 2px;';
      toolbar.appendChild(sep2);

      // Size presets
      toolbar.appendChild(createBtn('S', 'Small (25%)', () => updateAttrs({ width: 200 })));
      toolbar.appendChild(createBtn('M', 'Medium (50%)', () => updateAttrs({ width: 400 })));
      toolbar.appendChild(createBtn('L', 'Large (75%)', () => updateAttrs({ width: 600 })));
      toolbar.appendChild(createBtn('⛶', 'Full Width', () => updateAttrs({ width: null })));

      const sep3 = document.createElement('div');
      sep3.style.cssText = 'width:1px;height:16px;background:var(--border,#e5e7eb);margin:0 2px;';
      toolbar.appendChild(sep3);

      // Delete
      toolbar.appendChild(createBtn('🗑', 'Delete Image', () => {
        if (typeof getPos === 'function') {
          const pos = getPos();
          if (pos != null) {
            editor.view.dispatch(editor.view.state.tr.delete(pos, pos + node.nodeSize));
          }
        }
      }));

      dom.appendChild(toolbar);

      // Resize handles
      const handles = ['nw', 'ne', 'sw', 'se', 'e', 'w'].map(dir => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-handle-${dir}`;
        handle.style.cssText = 'position:absolute;width:10px;height:10px;background:hsl(var(--primary,220 90% 56%));border:2px solid white;border-radius:50%;display:none;z-index:10;cursor:nwse-resize;box-shadow:0 1px 4px rgba(0,0,0,0.2);';
        
        if (dir === 'nw') { handle.style.top = '-5px'; handle.style.left = '-5px'; handle.style.cursor = 'nwse-resize'; }
        if (dir === 'ne') { handle.style.top = '-5px'; handle.style.right = '-5px'; handle.style.cursor = 'nesw-resize'; }
        if (dir === 'sw') { handle.style.bottom = '-5px'; handle.style.left = '-5px'; handle.style.cursor = 'nesw-resize'; }
        if (dir === 'se') { handle.style.bottom = '-5px'; handle.style.right = '-5px'; handle.style.cursor = 'nwse-resize'; }
        if (dir === 'e') { handle.style.top = '50%'; handle.style.right = '-5px'; handle.style.transform = 'translateY(-50%)'; handle.style.cursor = 'ew-resize'; }
        if (dir === 'w') { handle.style.top = '50%'; handle.style.left = '-5px'; handle.style.transform = 'translateY(-50%)'; handle.style.cursor = 'ew-resize'; }

        // Resize drag
        handle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const startX = e.clientX;
          const startWidth = dom.offsetWidth;

          const onMove = (me: MouseEvent) => {
            let dx = me.clientX - startX;
            if (dir === 'w' || dir === 'nw' || dir === 'sw') dx = -dx;
            const newWidth = Math.max(80, startWidth + dx);
            dom.style.width = `${newWidth}px`;
          };
          const onUp = (me: MouseEvent) => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            let dx = me.clientX - startX;
            if (dir === 'w' || dir === 'nw' || dir === 'sw') dx = -dx;
            const newWidth = Math.max(80, startWidth + dx);
            updateAttrs({ width: Math.round(newWidth) });
          };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        });

        dom.appendChild(handle);
        return handle;
      });

      let selected = false;

      const showSelection = () => {
        selected = true;
        overlay.style.borderColor = 'hsl(var(--primary, 220 90% 56%))';
        toolbar.style.display = 'flex';
        handles.forEach(h => h.style.display = 'block');
      };

      const hideSelection = () => {
        selected = false;
        overlay.style.borderColor = 'transparent';
        toolbar.style.display = 'none';
        handles.forEach(h => h.style.display = 'none');
      };

      dom.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!selected) {
          showSelection();
          // Select this node in the editor
          if (typeof getPos === 'function') {
            const pos = getPos();
            if (pos != null) {
              editor.commands.setNodeSelection(pos);
            }
          }
        }
      });

      // Deselect on click outside
      const onDocClick = (e: MouseEvent) => {
        if (!dom.contains(e.target as unknown as globalThis.Node)) {
          hideSelection();
        }
      };
      document.addEventListener('click', onDocClick);

      // Hover effect
      dom.addEventListener('mouseenter', () => {
        if (!selected) overlay.style.borderColor = 'hsl(var(--primary, 220 90% 56%) / 0.3)';
      });
      dom.addEventListener('mouseleave', () => {
        if (!selected) overlay.style.borderColor = 'transparent';
      });

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) return false;
          node = updatedNode;
          img.src = node.attrs.src;
          img.alt = node.attrs.alt || '';
          applyWrapperStyles();
          return true;
        },
        destroy: () => {
          document.removeEventListener('click', onDocClick);
        },
        selectNode: () => showSelection(),
        deselectNode: () => hideSelection(),
      };
    };
  },
});
