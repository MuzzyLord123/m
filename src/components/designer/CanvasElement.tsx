import React, { CSSProperties, useRef, useState, useCallback, useEffect, useMemo, memo } from 'react';
import { EditorElement, ElementType } from './types';
import { useEditor, useCanvasState, useIsSelected, useIsHovered } from './EditorContext';
import { getResolvedStyles } from './utils/cssCompiler';
import { createElement } from './utils/elementFactory';
import { InlineTextEditor } from './InlineTextEditor';
import { ResizeHandles } from './ResizeHandles';
import { findParent } from './utils/treeUtils';

interface CanvasElementProps {
  element: EditorElement;
  depth?: number;
  canvasZoom?: number;
  /**
   * Selection arrives as a plain boolean rather than being read from
   * context. That is the whole point: memo() can compare a boolean, so
   * clicking one element re-renders that element and the one that lost the
   * selection - not all 128 on the artboard. Reading selectedIds from
   * context here meant every element re-rendered on every click, which is
   * where ~84ms per selection was going.
   */
}

const EDITABLE_TYPES = ['heading', 'text', 'button', 'badge', 'link', 'quote'];

export const CanvasElement = memo(function CanvasElement({ element, depth = 0, canvasZoom = 1 }: CanvasElementProps) {
  const { dispatch, selectionRef } = useEditor();
  // Each element subscribes to its own answer, so a click re-renders only the
  // two elements whose selection actually changed.
  const isSelected = useIsSelected(element.id);
  const isHovered = useIsHovered(element.id);
  const { breakpoint } = useCanvasState();
  const styles = getResolvedStyles(element, breakpoint);
  const ref = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number }>({});
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; elLeft: number; elTop: number } | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditing || isDraggingElement) return;
    if (e.shiftKey) {
      dispatch({ type: 'MULTI_SELECT', payload: element.id });
    } else {
      dispatch({ type: 'SELECT', payload: element.id });
    }
  };

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (EDITABLE_TYPES.includes(element.type) && !element.locked) {
      setIsEditing(true);
    }
  }, [element.type, element.locked]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'HOVER', payload: element.id });
  };

  const handleMouseLeave = () => {
    dispatch({ type: 'HOVER', payload: null });
  };

  // ── Free-form drag to move ──
  const handleMoveStart = useCallback((e: React.MouseEvent) => {
    if (isEditing || element.locked) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    // Select on drag start
    if (!selectionRef.current.includes(element.id)) {
      dispatch({ type: 'SELECT', payload: element.id });
    }

    const currentLeft = parseInt(styles.left as string) || 0;
    const currentTop = parseInt(styles.top as string) || 0;

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elLeft: currentLeft,
      elTop: currentTop,
    };
    setIsDraggingElement(true);
  }, [isEditing, element.locked, element.id, styles.left, styles.top, selectionRef, dispatch]);

  // Artboard dimensions for center snapping
  const bpWidth = breakpoint === 'desktop' ? 1280 : breakpoint === 'tablet' ? 768 : 375;

  useEffect(() => {
    if (!isDraggingElement) return;

    const onMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const zoom = canvasZoom;
      const dx = (e.clientX - dragStartRef.current.mouseX) / zoom;
      const dy = (e.clientY - dragStartRef.current.mouseY) / zoom;

      let newLeft = dragStartRef.current.elLeft + dx;
      let newTop = dragStartRef.current.elTop + dy;

      // Shift constrains to axis
      if (e.shiftKey) {
        if (Math.abs(dx) > Math.abs(dy)) {
          newTop = dragStartRef.current.elTop;
        } else {
          newLeft = dragStartRef.current.elLeft;
        }
      }

      const GRID = 20;
      const SNAP = 8;
      const newSnap: { x?: number; y?: number } = {};

      if (!e.metaKey && !e.ctrlKey) {
        // Get element dimensions from the DOM
        const elW = ref.current?.offsetWidth || parseInt(styles.width as string) || 0;

        // Snap element center to artboard horizontal center
        const elCenterX = newLeft + elW / 2;
        const artCenterX = bpWidth / 2;
        if (Math.abs(elCenterX - artCenterX) < SNAP) {
          newLeft = artCenterX - elW / 2;
          newSnap.x = artCenterX;
        }

        // Grid snap (only if not already center-snapped)
        if (newSnap.x === undefined && Math.abs(newLeft % GRID) < SNAP) {
          newLeft = Math.round(newLeft / GRID) * GRID;
        }
        if (Math.abs(newTop % GRID) < SNAP) {
          newTop = Math.round(newTop / GRID) * GRID;
        }
      }

      setSnapLines(newSnap);

      const bp = breakpoint;
      const newStyles = { ...element.styles };
      const updates: CSSProperties = {
        position: 'absolute',
        left: `${Math.round(newLeft)}px`,
        top: `${Math.round(newTop)}px`,
      };

      if (bp === 'desktop') {
        newStyles.desktop = { ...newStyles.desktop, ...updates };
      } else {
        newStyles[bp] = { ...(newStyles[bp] ?? {}), ...updates };
      }
      dispatch({ type: 'UPDATE_ELEMENT', payload: { id: element.id, updates: { styles: newStyles } } });
    };

    const onUp = () => {
      setIsDraggingElement(false);
      setSnapLines({});
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDraggingElement, canvasZoom, breakpoint, element.id, element.styles, dispatch, bpWidth, styles.width]);

  const canHaveChildren = ['section', 'container', 'columns', 'grid', 'card', 'form', 'navbar', 'footer', 'accordion', 'tabs', 'tooltip', 'modal', 'dropdown', 'marquee', 'mega-menu', 'carousel', 'lightbox', 'stepper'].includes(element.type);

  // Drop handling for nesting
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | 'inside' | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!ref.current) return;
    if (canHaveChildren) {
      setDropPosition('inside');
    }
  };

  const handleDragLeave = () => setDropPosition(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropPosition(null);

    const newType = e.dataTransfer.getData('component-type');
    if (newType && canHaveChildren) {
      const newEl = createElement(newType as ElementType);
      dispatch({ type: 'ADD_ELEMENT', payload: { element: newEl, parentId: element.id } });
    }
    dispatch({ type: 'SET_DRAG', payload: null });
  };

  if (element.hidden) return null;

  // Build wrapper style - use absolute positioning
  const hasAbsolutePosition = styles.position === 'absolute' || styles.left || styles.top;

  const wrapperStyle: CSSProperties = {
    ...styles,
    position: hasAbsolutePosition ? 'absolute' : (styles.position as any) || 'relative',
    cursor: isEditing ? 'text' : element.locked ? 'not-allowed' : isDraggingElement ? 'grabbing' : 'grab',
    minHeight: element.children.length === 0 && canHaveChildren ? '60px' : undefined,
    minWidth: element.children.length === 0 && canHaveChildren ? '100px' : undefined,
    transition: isDraggingElement ? 'none' : 'box-shadow 0.2s ease, outline-color 0.15s ease',
    userSelect: 'none' as const,
    zIndex: styles.zIndex || (isSelected ? 50 : isDraggingElement ? 100 : undefined),
  };

  // If no explicit position set, give a default
  if (!styles.left && !styles.top && hasAbsolutePosition) {
    wrapperStyle.left = '0px';
    wrapperStyle.top = '0px';
  }

  const dropStyles: CSSProperties = dropPosition === 'inside'
    ? { boxShadow: 'inset 0 0 0 2px hsl(var(--studio-accent) / 0.5)', borderRadius: '4px' }
    : {};

  const outlineStyle: CSSProperties = isSelected
    ? {
        outline: '2px solid hsl(var(--studio-accent))',
        outlineOffset: '0px',
        boxShadow: `0 0 0 4px hsl(var(--studio-accent) / 0.12)${isDraggingElement ? ', 0 12px 40px rgba(0,0,0,0.35)' : ''}`,
      }
    : isHovered
    ? {
        outline: '1.5px solid hsl(var(--studio-accent) / 0.35)',
        outlineOffset: '0px',
        boxShadow: '0 0 0 3px hsl(var(--studio-accent) / 0.06)',
      }
    : {};

  const renderContent = () => {
    // Inline editing mode
    if (isEditing && EDITABLE_TYPES.includes(element.type)) {
      const textStyle: CSSProperties = {
        margin: 0,
        whiteSpace: 'pre-wrap',
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        fontFamily: styles.fontFamily,
        lineHeight: styles.lineHeight,
        letterSpacing: styles.letterSpacing,
        color: styles.color,
        textAlign: styles.textAlign as any,
        textTransform: styles.textTransform as any,
      };
      return (
        <InlineTextEditor
          elementId={element.id}
          initialText={(element.props.text as string) || ''}
          onFinish={() => setIsEditing(false)}
          style={textStyle}
        />
      );
    }

    switch (element.type) {
      case 'heading': {
        const level = (element.props.level as string) || 'h2';
        const HeadingTag = level as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        return React.createElement(HeadingTag, { style: { margin: 0 } }, (element.props.text as string) || 'Heading');
      }
      case 'text':
        return <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{(element.props.text as string) || 'Text block'}</p>;
      case 'button':
        return <span>{(element.props.text as string) || 'Button'}</span>;
      case 'badge':
        return <span>{(element.props.text as string) || 'Badge'}</span>;
      case 'image':
        return <img src={element.props.src as string} alt={element.props.alt as string || ''} style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }} />;
      case 'video':
        return <video src={element.props.src as string} controls style={{ width: '100%', pointerEvents: 'none' }} />;
      case 'link':
        return <span>{(element.props.text as string) || 'Link'}</span>;
      case 'input':
        return (
          <div style={{ width: '100%' }}>
            {element.props.label && <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>{element.props.label as string}</label>}
            <input type={element.props.inputType as string || 'text'} placeholder={element.props.placeholder as string} style={{ ...styles, pointerEvents: 'none' }} readOnly />
          </div>
        );
      case 'textarea':
        return (
          <div style={{ width: '100%' }}>
            {element.props.label && <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>{element.props.label as string}</label>}
            <textarea placeholder={element.props.placeholder as string} style={{ ...styles, pointerEvents: 'none' }} readOnly />
          </div>
        );
      case 'html':
        return <div dangerouslySetInnerHTML={{ __html: (element.props.htmlContent as string) || '' }} />;
      case 'embed':
        return element.props.embedUrl ? <iframe src={element.props.embedUrl as string} style={{ width: '100%', height: '100%', border: 'none' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'hsl(var(--studio-ink-2))' }}>Embed URL</div>;
      case 'spacer':
      case 'divider':
      case 'separator':
        return null;
      case 'quote':
        return (
          <blockquote style={{ margin: 0 }}>
            <p style={{ margin: 0 }}>{(element.props.text as string) || 'Quote'}</p>
            {element.props.author && <footer style={{ marginTop: '8px', fontSize: '14px', opacity: 0.6 }}>— {element.props.author as string}</footer>}
          </blockquote>
        );
      case 'list': {
        const items = (element.props.items as string[]) || ['Item 1', 'Item 2'];
        const Tag = element.props.ordered ? 'ol' : 'ul';
        return <Tag style={{ margin: 0 }}>{items.map((item, i) => <li key={i}>{item}</li>)}</Tag>;
      }
      case 'code':
        return <pre style={{ margin: 0 }}><code>{(element.props.code as string) || '// code'}</code></pre>;
      case 'countdown':
        return <div style={{ textAlign: 'center' }}><div style={{ fontSize: '12px', opacity: 0.5, marginBottom: '8px' }}>{(element.props.label as string) || 'Countdown'}</div><div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>{['Days', 'Hours', 'Min', 'Sec'].map(u => <div key={u}><div style={{ fontSize: '32px', fontWeight: 700 }}>00</div><div style={{ fontSize: '10px', opacity: 0.5 }}>{u}</div></div>)}</div></div>;
      case 'progress':
        return <div style={{ width: '100%' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}><span>{(element.props.label as string) || 'Progress'}</span>{element.props.showValue && <span>{element.props.value as number || 0}%</span>}</div><div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: `${element.props.value || 0}%`, height: '100%', backgroundColor: 'hsl(var(--studio-accent))', borderRadius: '4px' }} /></div></div>;
      case 'table': {
        const headers = (element.props.headers as string[]) || ['Col 1', 'Col 2'];
        const rows = (element.props.rows as string[][]) || [['Data', 'Data']];
        return <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr>{headers.map((h, i) => <th key={i} style={{ padding: '8px 12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>{h}</th>)}</tr></thead><tbody>{rows.map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci} style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '14px' }}>{cell}</td>)}</tr>)}</tbody></table>;
      }
      case 'accordion':
        return <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: '15px' }}>{(element.props.title as string) || 'Accordion'} ▾</div>;
      case 'tabs':
        return <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e2e8f0' }}>{((element.props.tabs as string[]) || ['Tab 1', 'Tab 2']).map((t, i) => <div key={i} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, borderBottom: i === 0 ? '2px solid hsl(var(--studio-accent))' : 'none', color: i === 0 ? 'hsl(var(--studio-accent))' : '#94a3b8' }}>{t}</div>)}</div>;
      case 'map':
        return element.props.embedUrl ? <iframe src={element.props.embedUrl as string} style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'hsl(var(--studio-ink-2))' }}>Map Embed</div>;
      case 'marquee':
        return <div style={{ padding: '12px', fontSize: '13px', color: 'hsl(var(--studio-ink-2))', textAlign: 'center' }}>↔ Marquee</div>;
      case 'select':
        return <div style={{ width: '100%' }}>{element.props.label && <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}>{element.props.label as string}</label>}<select style={{ ...styles, pointerEvents: 'none' as any }} disabled><option>{element.props.placeholder as string || 'Choose…'}</option></select></div>;
      case 'checkbox':
        return <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}><input type="checkbox" disabled />{element.props.label as string || 'Checkbox'}</label>;
      case 'audio':
        return <div style={{ padding: '12px', fontSize: '13px', color: 'hsl(var(--studio-ink-2))', textAlign: 'center' }}>♪ Audio Player</div>;
      case 'product-grid':
        return (
          <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '2px dashed hsl(var(--studio-accent))', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🛍️</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Live Product Grid</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '16px' }}>
              {[1,2,3,4].map(i => <div key={i} style={{ height: '80px', borderRadius: '6px', backgroundColor: '#e2e8f0' }} />)}
            </div>
          </div>
        );
      case 'booking-widget':
        return (
          <div style={{ padding: '24px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '2px dashed hsl(var(--studio-ok))', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📅</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Booking Widget</div>
          </div>
        );
      case 'booking-calendar':
        return (
          <div style={{ padding: '24px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '2px dashed hsl(var(--studio-accent))', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🗓️</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Appointment Calendar</div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--studio-ink-3))', marginTop: '4px' }}>Interactive calendar with available slots</div>
          </div>
        );
      case 'service-list':
        return (
          <div style={{ padding: '24px', backgroundColor: '#fefce8', borderRadius: '8px', border: '2px dashed hsl(var(--studio-warn))', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Service List</div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--studio-ink-3))', marginTop: '4px' }}>Displays available services with pricing</div>
          </div>
        );
      case 'booking-button':
        return (
          <div style={{ textAlign: 'center' }}>
            {String(element.props?.text || 'Book Now')}
          </div>
        );
      case 'visitor-auth':
        return (
          <div style={{ padding: '24px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '2px dashed hsl(var(--studio-accent))', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔐</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Login / Signup</div>
          </div>
        );
      case 'cart-button':
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>🛒</span>
            <span>{(element.props.text as string) || 'Cart'}</span>
            <span style={{ backgroundColor: 'hsl(var(--studio-risk))', color: 'hsl(var(--studio-ink))', borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>0</span>
          </div>
        );
      case 'visitor-dashboard':
        return (
          <div style={{ padding: '24px', backgroundColor: '#faf5ff', borderRadius: '8px', border: '2px dashed hsl(var(--studio-ink-3))', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📊</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Customer Dashboard</div>
          </div>
        );
      // Marketing
      case 'testimonial-card':
        return (
          <div style={{ padding: '32px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '16px', color: '#475569', lineHeight: '1.7', marginBottom: '20px', fontStyle: 'italic' }}>
              "{(element.props.quote as string) || 'This product completely transformed how we work.'}"
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: 'hsl(var(--studio-ink-3))' }}>
                {((element.props.author as string) || 'J')[0]}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{(element.props.author as string) || 'Jane Doe'}</div>
                <div style={{ fontSize: '12px', color: 'hsl(var(--studio-ink-2))' }}>{(element.props.role as string) || 'CEO, Acme Inc'}</div>
              </div>
            </div>
          </div>
        );
      case 'trust-badge':
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <span style={{ fontSize: '16px' }}>✓</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#166534' }}>{(element.props.text as string) || 'Verified'}</span>
          </div>
        );
      case 'pricing-card':
        return (
          <div style={{ padding: '32px', backgroundColor: 'hsl(var(--studio-ink))', borderRadius: '16px', border: '2px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--studio-ink-3))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{(element.props.planName as string) || 'Pro'}</div>
            <div style={{ fontSize: '48px', fontWeight: 800, color: '#0f172a', marginTop: '8px' }}>{(element.props.price as string) || '$29'}<span style={{ fontSize: '16px', fontWeight: 400, color: 'hsl(var(--studio-ink-2))' }}>/mo</span></div>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {((element.props.features as string[]) || ['Feature 1', 'Feature 2', 'Feature 3']).map((f, i) => (
                <div key={i} style={{ fontSize: '14px', color: '#475569' }}>✓ {f}</div>
              ))}
            </div>
          </div>
        );
      case 'cta-banner':
        return (
          <div style={{ padding: '48px 32px', background: 'linear-gradient(135deg, hsl(var(--studio-accent)), hsl(var(--studio-accent)))', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'hsl(var(--studio-ink))', marginBottom: '12px' }}>{(element.props.text as string) || 'Ready to get started?'}</div>
            <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)' }}>{(element.props.subtitle as string) || 'Join thousands of happy customers.'}</div>
          </div>
        );
      case 'feature-card':
        return (
          <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>{(element.props.icon as string) || '⚡'}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{(element.props.title as string) || 'Feature'}</div>
            <div style={{ fontSize: '14px', color: 'hsl(var(--studio-ink-3))', lineHeight: 1.6 }}>{(element.props.description as string) || 'Description of this feature.'}</div>
          </div>
        );
      case 'stat-card':
        return (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', fontWeight: 800, color: 'hsl(var(--studio-accent))' }}>{(element.props.value as string) || '99%'}</div>
            <div style={{ fontSize: '14px', color: 'hsl(var(--studio-ink-3))', marginTop: '4px' }}>{(element.props.label as string) || 'Success Rate'}</div>
          </div>
        );
      case 'social-share':
      case 'social-icons':
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            {['🔗', '𝕏', '📘', '💼'].map((icon, i) => (
              <div key={i} style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{icon}</div>
            ))}
          </div>
        );
      case 'rating-stars':
        return <div style={{ fontSize: '20px', letterSpacing: '2px' }}>{'★'.repeat(Number(element.props.rating) || 5)}{'☆'.repeat(5 - (Number(element.props.rating) || 5))}</div>;
      case 'newsletter-form':
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input placeholder="Enter your email" style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', pointerEvents: 'none' }} readOnly />
            <button style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: 'hsl(var(--studio-accent))', color: 'hsl(var(--studio-ink))', border: 'none', fontSize: '14px', fontWeight: 600 }}>Subscribe</button>
          </div>
        );
      case 'bar-chart':
        return (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px', padding: '8px' }}>
            {[60, 85, 45, 95, 70].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, backgroundColor: 'hsl(var(--studio-accent))', borderRadius: '4px 4px 0 0', opacity: 0.7 + i * 0.06 }} />
            ))}
          </div>
        );
      case 'line-chart':
        return <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--studio-ink-2))', fontSize: '13px' }}>📈 Line Chart</div>;
      case 'pie-chart':
        return <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--studio-ink-2))', fontSize: '13px' }}>🥧 Pie Chart</div>;
      case 'review-widget':
        return <div style={{ padding: '16px', fontSize: '13px', color: 'hsl(var(--studio-ink-3))' }}>⭐ Review Widget</div>;
      case 'avatar-group':
        return (
          <div style={{ display: 'flex' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: `hsl(${i*60},60%,70%)`, border: '2px solid hsl(var(--studio-ink))', marginLeft: i > 1 ? '-8px' : 0 }} />
            ))}
          </div>
        );
      // New animated/interactive components
      case 'animated-counter':
        return (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '56px', fontWeight: 800, background: 'linear-gradient(135deg, hsl(var(--studio-accent)), #00b4d8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {(element.props.prefix as string) || ''}{(element.props.endValue as number) || 2500}{(element.props.suffix as string) || '+'}
            </div>
            <div style={{ fontSize: '14px', color: 'hsl(var(--studio-ink-3))', marginTop: '4px', fontWeight: 500 }}>{(element.props.label as string) || 'Counter'}</div>
          </div>
        );
      case 'gradient-text': {
        const grad = (element.props.gradient as string) || 'linear-gradient(135deg, #667eea, #764ba2)';
        return React.createElement(
          (element.props.level as string) || 'h2',
          { style: { margin: 0, background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } },
          (element.props.text as string) || 'Gradient Text'
        );
      }
      case 'typing-text':
        return (
          <div style={{ fontFamily: 'monospace' }}>
            <span>{((element.props.texts as string[]) || ['Hello world'])[0]}</span>
            <span style={{ borderRight: '2px solid currentColor', marginLeft: '2px', animation: 'blink 1s step-end infinite' }}>​</span>
          </div>
        );
      case 'before-after':
        return (
          <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex' }}>
            <div style={{ width: '50%', height: '100%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--studio-ink-2))', fontSize: '14px', fontWeight: 600 }}>BEFORE</div>
            <div style={{ width: '2px', backgroundColor: 'hsl(var(--studio-ink))', position: 'relative', cursor: 'col-resize', zIndex: 2 }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'hsl(var(--studio-ink))', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>⇔</div>
            </div>
            <div style={{ width: '50%', height: '100%', backgroundColor: 'hsl(var(--studio-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--studio-ink))', fontSize: '14px', fontWeight: 600 }}>AFTER</div>
          </div>
        );
      case 'scroll-progress':
        return (
          <div style={{ width: '100%', height: `${(element.props.height as number) || 3}px`, backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: '60%', height: '100%', backgroundColor: (element.props.color as string) || 'hsl(var(--studio-accent))', borderRadius: '2px', transition: 'width 0.3s' }} />
          </div>
        );
      case 'video-background':
        return (
          <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '300px' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'hsl(var(--studio-sunken))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '40px' }}>🎬</span>
            </div>
            <div style={{ position: 'absolute', inset: 0, backgroundColor: (element.props.overlay as string) || 'rgba(0,0,0,0.5)' }} />
            {element.children.length === 0 && (
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: 'hsl(var(--studio-ink))', padding: '40px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Video Background Section</div>
                <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>Drop content elements here</div>
              </div>
            )}
          </div>
        );
      case 'parallax-section':
        return (
          <div style={{ position: 'relative', width: '100%', minHeight: '300px', backgroundImage: `url(${(element.props.bgImage as string) || ''})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
            {element.children.length === 0 && (
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: 'hsl(var(--studio-ink))', padding: '60px 40px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>Parallax Section</div>
                <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>Fixed background with parallax effect</div>
              </div>
            )}
          </div>
        );
      case 'icon-box':
        return (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>{(element.props.icon as string) || '🚀'}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{(element.props.title as string) || 'Feature'}</div>
            <div style={{ fontSize: '14px', color: 'hsl(var(--studio-ink-3))', lineHeight: 1.6 }}>{(element.props.description as string) || 'Description here.'}</div>
          </div>
        );
      case 'logo-cloud':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '24px', alignItems: 'center', padding: '20px' }}>
            {((element.props.logos as string[]) || ['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Netflix']).map((name, i) => (
              <div key={i} style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--studio-ink-2))', textAlign: 'center', letterSpacing: '0.04em' }}>{name}</div>
            ))}
          </div>
        );
      case 'comparison-table': {
        const headers = (element.props.headers as string[]) || ['Feature', 'Free', 'Pro'];
        const rows = (element.props.rows as string[][]) || [['Storage', '1GB', '100GB']];
        return (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{headers.map((h, i) => <th key={i} style={{ padding: '12px 16px', borderBottom: '2px solid #e2e8f0', textAlign: i === 0 ? 'left' : 'center', fontSize: '13px', fontWeight: 700, color: '#0f172a', backgroundColor: i > 0 ? '#f8fafc' : 'transparent' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', textAlign: ci === 0 ? 'left' : 'center', fontSize: '14px', color: ci === 0 ? '#334155' : 'hsl(var(--studio-ink-3))' }}>{cell === 'true' ? '✓' : cell === 'false' ? '—' : cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        );
      }
      case 'timeline':
        return (
          <div style={{ position: 'relative', paddingLeft: '24px' }}>
            <div style={{ position: 'absolute', left: '6px', top: 0, bottom: 0, width: '2px', backgroundColor: '#e2e8f0' }} />
            {((element.props.items as any[]) || [{ year: '2024', title: 'Event', desc: 'Description' }]).map((item: any, i: number) => (
              <div key={i} style={{ position: 'relative', paddingBottom: '24px' }}>
                <div style={{ position: 'absolute', left: '-20px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'hsl(var(--studio-accent))', border: '2px solid hsl(var(--studio-ink))', boxShadow: '0 0 0 2px hsl(var(--studio-accent))' }} />
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--studio-accent))', marginBottom: '4px' }}>{item.year}</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>{item.title}</div>
                <div style={{ fontSize: '13px', color: 'hsl(var(--studio-ink-3))' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        );
      case 'masonry-gallery':
        return (
          <div style={{ display: 'columns', columns: `${(element.props.columns as number) || 3}`, gap: '8px' }}>
            {((element.props.images as string[]) || []).slice(0, 6).map((id: string, i: number) => (
              <div key={i} style={{ marginBottom: '8px', breakInside: 'avoid' }}>
                <img src={`https://images.unsplash.com/${id}?w=400&h=${200 + (i % 3) * 100}&fit=crop`} alt="" style={{ width: '100%', borderRadius: '8px', display: 'block' }} />
              </div>
            ))}
          </div>
        );
      case 'floating-card':
      case 'glassmorphism-card':
        return element.children.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '80px', color: 'hsl(var(--studio-ink-2))', fontSize: '12px' }}>
            {element.type === 'glassmorphism-card' ? '🪟 Glass Card — Drop content' : '✨ Floating Card — Drop content'}
          </div>
        ) : null;
      case 'morphing-blob':
        return (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: `${(element.props.size as number) || 200}px`,
              height: `${(element.props.size as number) || 200}px`,
              background: `linear-gradient(135deg, ${(element.props.color1 as string) || '#667eea'}, ${(element.props.color2 as string) || '#764ba2'})`,
              borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
              filter: 'blur(0px)',
              opacity: 0.8,
            }} />
          </div>
        );
      case 'particle-field':
        return (
          <div style={{ width: '100%', height: '100%', minHeight: '200px', backgroundColor: 'hsl(var(--studio-sunken))', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: `${2 + Math.random() * 4}px`,
                height: `${2 + Math.random() * 4}px`,
                backgroundColor: (element.props.color as string) || 'hsl(var(--studio-accent))',
                borderRadius: '50%',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.3 + Math.random() * 0.5,
              }} />
            ))}
            <span style={{ position: 'relative', zIndex: 1, color: 'hsl(var(--studio-ink-3))', fontSize: '12px' }}>✦ Particle Field</span>
          </div>
        );
      case 'text-reveal':
        return (
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <span style={{ display: 'inline-block' }}>{(element.props.text as string) || 'Reveal Text'}</span>
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg, transparent, currentColor)', opacity: 0.15 }} />
          </div>
        );
      default:
        if (canHaveChildren) {
          return element.children.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60px', color: 'hsl(var(--studio-ink-2))', fontSize: '12px', border: '1px dashed #e2e8f0', borderRadius: '6px' }}>
              Drop elements here
            </div>
          ) : null;
        }
        return <div style={{ padding: '8px', color: 'hsl(var(--studio-ink-2))', fontSize: '12px' }}>{element.type}</div>;
    }
  };

  return (
    <>
      {/* Center snap guide line */}
      {isDraggingElement && snapLines.x !== undefined && (
        <div
          style={{
            position: 'absolute',
            left: `${snapLines.x}px`,
            top: 0,
            width: '1px',
            height: '100%',
            minHeight: '4000px',
            backgroundColor: '#E60073',
            zIndex: 200,
            pointerEvents: 'none',
            opacity: 0.7,
          }}
        >
          <div style={{
            position: 'sticky',
            top: '8px',
            transform: 'translateX(-50%)',
            fontSize: '9px',
            fontWeight: 700,
            color: '#E60073',
            backgroundColor: 'rgba(230,0,115,0.1)',
            padding: '1px 6px',
            borderRadius: '3px',
            whiteSpace: 'nowrap',
            width: 'fit-content',
          }}>
            CENTER
          </div>
        </div>
      )}

      <div
        ref={ref}
        data-element-id={element.id}
        style={{ ...wrapperStyle, ...dropStyles, ...outlineStyle }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMoveStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Element type label badge - visible on hover/select */}
        {(isSelected || isHovered) && !isEditing && !isDraggingElement && (
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: '0px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '1px 6px',
              borderRadius: '4px 4px 0 0',
              backgroundColor: isSelected ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-accent) / 0.75)',
              zIndex: 60,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 -2px 6px hsl(var(--studio-accent) / 0.15)',
            }}
          >
            <span style={{
              fontSize: '9px',
              fontWeight: 700,
              color: 'hsl(var(--studio-ink))',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
            }}>
              {element.name || element.type}
            </span>
            {element.locked && (
              <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.6)' }}>🔒</span>
            )}
          </div>
        )}

        {/* Dimension label — visible when selected (not dragging) */}
        {isSelected && !isEditing && !isDraggingElement && (
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              right: '0px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              padding: '1px 5px',
              borderRadius: '4px 4px 0 0',
              backgroundColor: 'rgba(0,0,0,0.85)',
              zIndex: 60,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{
              fontSize: '8px',
              fontWeight: 600,
              color: 'hsl(var(--studio-accent))',
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              letterSpacing: '0.02em',
            }}>
              {ref.current ? `${ref.current.offsetWidth}×${ref.current.offsetHeight}` : '—'}
            </span>
          </div>
        )}

        {/* Spacing visualization — margin/padding indicators on selected containers */}
        {isSelected && !isEditing && !isDraggingElement && canHaveChildren && (
          <>
            {/* Padding indicator — inner dashed box */}
            {(() => {
              const pt = parseInt(styles.paddingTop as string || styles.padding as string) || 0;
              const pr = parseInt(styles.paddingRight as string || styles.padding as string) || 0;
              const pb = parseInt(styles.paddingBottom as string || styles.padding as string) || 0;
              const pl = parseInt(styles.paddingLeft as string || styles.padding as string) || 0;
              const hasPadding = pt > 0 || pr > 0 || pb > 0 || pl > 0;
              if (!hasPadding) return null;
              return (
                <div style={{
                  position: 'absolute',
                  top: `${pt}px`,
                  left: `${pl}px`,
                  right: `${pr}px`,
                  bottom: `${pb}px`,
                  border: '1px dashed rgba(34,197,94,0.35)',
                  borderRadius: '2px',
                  pointerEvents: 'none',
                  zIndex: 55,
                }}>
                  {/* Padding value labels */}
                  {pt > 8 && <div style={{ position: 'absolute', top: `-${pt/2 + 4}px`, left: '50%', transform: 'translateX(-50%)', fontSize: '7px', fontFamily: 'monospace', color: 'rgba(34,197,94,0.6)', fontWeight: 700, pointerEvents: 'none' }}>{pt}</div>}
                  {pb > 8 && <div style={{ position: 'absolute', bottom: `-${pb/2 + 4}px`, left: '50%', transform: 'translateX(-50%)', fontSize: '7px', fontFamily: 'monospace', color: 'rgba(34,197,94,0.6)', fontWeight: 700, pointerEvents: 'none' }}>{pb}</div>}
                  {pl > 8 && <div style={{ position: 'absolute', top: '50%', left: `-${pl/2 + 4}px`, transform: 'translateY(-50%)', fontSize: '7px', fontFamily: 'monospace', color: 'rgba(34,197,94,0.6)', fontWeight: 700, pointerEvents: 'none' }}>{pl}</div>}
                  {pr > 8 && <div style={{ position: 'absolute', top: '50%', right: `-${pr/2 + 4}px`, transform: 'translateY(-50%)', fontSize: '7px', fontFamily: 'monospace', color: 'rgba(34,197,94,0.6)', fontWeight: 700, pointerEvents: 'none' }}>{pr}</div>}
                </div>
              );
            })()}
          </>
        )}

        {/* Accessibility hints on selected elements */}
        {isSelected && !isEditing && !isDraggingElement && (() => {
          const warnings: string[] = [];
          if (element.type === 'image' && !element.props.alt) warnings.push('Missing alt text');
          if (element.type === 'button' && !(element.props.text as string)?.trim()) warnings.push('Empty button');
          if (element.type === 'link' && !(element.props.text as string)?.trim()) warnings.push('Empty link');
          if (element.type === 'heading' && !(element.props.text as string)?.trim()) warnings.push('Empty heading');
          const fontSize = parseInt(styles.fontSize as string);
          if (fontSize && fontSize < 12) warnings.push(`Font ${fontSize}px < 12px`);
          if (warnings.length === 0) return null;
          return (
            <div style={{
              position: 'absolute', top: '-20px', right: '0',
              display: 'flex', alignItems: 'center', gap: '3px',
              padding: '1px 6px', borderRadius: '4px',
              backgroundColor: 'rgba(245,158,11,0.9)', color: '#000',
              fontSize: '7px', fontWeight: 700, whiteSpace: 'nowrap',
              zIndex: 60, pointerEvents: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}>
              ⚠ {warnings[0]}
            </div>
          );
        })()}
        {/* Position badge during drag */}
        {isDraggingElement && (
          <div
            style={{
              position: 'absolute',
              bottom: '-24px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(0,0,0,0.9)',
              color: 'hsl(var(--studio-ink))',
              fontSize: '9px',
              fontWeight: 600,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              whiteSpace: 'nowrap',
              zIndex: 100,
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span style={{ color: 'hsl(var(--studio-ink-2))' }}>X</span>
            <span style={{ color: 'hsl(var(--studio-accent))' }}>{parseInt(styles.left as string) || 0}</span>
            <span style={{ color: 'hsl(var(--studio-hover))' }}>·</span>
            <span style={{ color: 'hsl(var(--studio-ink-2))' }}>Y</span>
            <span style={{ color: 'hsl(var(--studio-accent))' }}>{parseInt(styles.top as string) || 0}</span>
            <span style={{ color: 'hsl(var(--studio-hover))' }}>·</span>
            <span style={{ color: 'hsl(var(--studio-ink-3))' }}>{ref.current ? `${ref.current.offsetWidth}×${ref.current.offsetHeight}` : ''}</span>
          </div>
        )}

        {renderContent()}

        {/* Render children */}
        {canHaveChildren && element.children.map(child => (
          <CanvasElement
            key={child.id}
            element={child}
            depth={depth + 1}
            canvasZoom={canvasZoom}
          />
        ))}

        {/* Resize handles */}
        {isSelected && !isEditing && !element.locked && (
          <ResizeHandles elementId={element.id} />
        )}
      </div>
    </>
  );
});
