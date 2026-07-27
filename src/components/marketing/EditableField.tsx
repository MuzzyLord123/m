import { useEffect, useRef, useState, type ReactNode } from "react";
import { isInVisualEditor, postToParent } from "@/lib/visualEditorBridge";

interface Props {
  sectionKey: string;
  field: string;
  value: string;
  label?: string;
  kind?: "text" | "textarea";
  /** Render-prop pattern so we can wrap arbitrary inline/block content without forcing a span. */
  children: ReactNode;
  /** Optional element tag; defaults to span (inline). Use "div" for block-level wraps. */
  as?: "span" | "div";
  className?: string;
}

/**
 * Marks a text node as visually editable. In normal app rendering this is a
 * transparent pass-through. When the marketing site is loaded inside the
 * admin Visual Editor (window.parent !== window && ?__edit=1), it adds a
 * dashed hover outline and forwards click/hover events to the parent
 * inspector via postMessage.
 */
export function EditableField({
  sectionKey,
  field,
  value,
  label,
  kind = "text",
  children,
  as = "span",
  className = "",
}: Props) {
  const [editing, setEditing] = useState(false);
  const [hover, setHover] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    setEditing(isInVisualEditor());
  }, []);

  if (!editing) {
    const Tag = as as any;
    return <Tag className={className}>{children}</Tag>;
  }

  const rect = () => {
    const r = ref.current?.getBoundingClientRect();
    return r
      ? { x: r.left, y: r.top, width: r.width, height: r.height }
      : { x: 0, y: 0, width: 0, height: 0 };
  };

  const overlayStyle: React.CSSProperties = {
    outline: hover ? "2px dashed hsl(217 91% 60%)" : "1px dashed hsl(217 91% 60% / 0.45)",
    outlineOffset: 2,
    borderRadius: 4,
    cursor: "pointer",
    transition: "outline 120ms ease",
    position: "relative",
  };

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    postToParent({
      type: "ve:select",
      sectionKey,
      field,
      value,
      kind,
      label,
      rect: rect(),
    });
  };

  const onEnter = () => {
    setHover(true);
    postToParent({ type: "ve:hover", sectionKey, field, rect: rect() });
  };
  const onLeave = () => {
    setHover(false);
    postToParent({ type: "ve:hover:end" });
  };

  const Tag = as as any;
  return (
    <Tag
      ref={ref as any}
      className={className}
      style={overlayStyle}
      onClick={onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      data-ve-section={sectionKey}
      data-ve-field={field}
    >
      {children}
    </Tag>
  );
}
