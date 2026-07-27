import { useMemo, useRef, useState, useEffect } from 'react';
import { DesignerTemplate } from './types';
import { exportToHTML } from './utils/htmlExporter';

interface TemplateThumbnailProps {
  template: DesignerTemplate;
  className?: string;
}

export function TemplateThumbnail({ template, className = '' }: TemplateThumbnailProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.disconnect(); } },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const srcDoc = useMemo(() => {
    if (!isVisible) return '';
    const elements = template.pages && template.pages.length > 0
      ? template.pages[0].elements
      : template.elements;

    const { html, css, js } = exportToHTML(elements, template.name);

    return html
      .replace('<link rel="stylesheet" href="styles.css">', `<style>${css}\n* { cursor: default !important; } body { overflow: hidden !important; pointer-events: none !important; } ::-webkit-scrollbar { display: none; }</style>`)
      .replace('<script src="script.js" defer></script>', `<script>${js}</script>`);
  }, [template, isVisible]);

  return (
    <div ref={ref} className={`relative w-full h-full overflow-hidden ${className}`}>
      {isVisible && (
        <iframe
          srcDoc={srcDoc}
          title={template.name}
          sandbox="allow-scripts"
          loading="lazy"
          tabIndex={-1}
          className="border-none pointer-events-none"
          style={{
            width: '1280px',
            height: '900px',
            transform: 'scale(0.25)',
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      )}
    </div>
  );
}
