import { useMemo } from 'react';
import { EditorElement } from './types';

/**
 * Renders a miniature visual preview of a section's element tree.
 * Uses inline styles from the element definitions, scaled down to fit a thumbnail.
 */
export function SectionPreview({ elements }: { elements: EditorElement[] }) {
  const html = useMemo(() => renderElements(elements), [elements]);

  return (
    <div
      style={{
        width: '100%',
        height: '120px',
        overflow: 'hidden',
        borderRadius: '4px',
        backgroundColor: '#1a1a1a',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '1280px',
          position: 'absolute',
          left: '50%',
          top: '0',
          transform: 'translateX(-50%) scale(0.22)',
          transformOrigin: 'top center',
          pointerEvents: 'none',
          userSelect: 'none',
          overflow: 'hidden',
          maxHeight: '545px',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function renderElements(elements: EditorElement[]): string {
  return elements.map(el => renderElement(el)).join('');
}

function renderElement(el: EditorElement): string {
  const style = cssString((el.styles?.desktop || {}) as Record<string, unknown>);
  const children = el.children?.length ? renderElements(el.children) : '';
  const content = getContent(el);

  const tag = getTag(el.type);
  
  if (el.type === 'image') {
    const src = (el.props?.src as string) || '';
    return `<img src="${escapeHtml(src)}" alt="" style="${style}; display:block;" loading="lazy" />`;
  }

  if (el.type === 'spacer') {
    return `<div style="${style}"></div>`;
  }

  if (el.type === 'divider' || el.type === 'separator') {
    return `<hr style="${style}; border:none; height:1px; background:rgba(255,255,255,0.1);" />`;
  }

  if (el.type === 'icon') {
    return `<span style="${style}; display:inline-flex; align-items:center; justify-content:center;">★</span>`;
  }

  return `<${tag} style="${style}">${content}${children}</${tag}>`;
}

function getTag(type: EditorElement['type']): string {
  switch (type) {
    case 'heading': return 'div';
    case 'text': return 'p';
    case 'button': return 'div';
    case 'link': return 'span';
    case 'badge': return 'span';
    case 'navbar': return 'nav';
    case 'footer': return 'footer';
    case 'section': return 'section';
    case 'list': return 'div';
    case 'quote': return 'blockquote';
    case 'form': return 'div';
    case 'input': return 'div';
    case 'textarea': return 'div';
    default: return 'div';
  }
}

function getContent(el: EditorElement): string {
  const text = el.props?.text as string;
  if (!text) return '';
  return escapeHtml(text).replace(/\n/g, '<br/>');
}

function cssString(styles: Record<string, unknown>): string {
  return Object.entries(styles)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${camelToKebab(k)}:${v}`)
    .join(';');
}

function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
