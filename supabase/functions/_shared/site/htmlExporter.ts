import { EditorElement } from './types.ts';
import { generateClassName, buildCSS } from './cssCompiler.ts';
import { generateJS } from './jsGenerator.ts';

/** A stable form field name derived from its visible label. */
function fieldName(label: string): string {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
  return slug || 'field';
}

/** Map element type to semantic HTML tag */
function getTag(el: EditorElement): string {
  switch (el.type) {
    case 'section': return 'section';
    case 'container': return 'div';
    case 'columns': case 'grid': return 'div';
    case 'heading': {
      const level = ((el.props || {}).level as string) || 'h2';
      return ['h1','h2','h3','h4','h5','h6'].includes(level) ? level : 'h2';
    }
    case 'text': return 'p';
    case 'button': return (el.props || {}).href ? 'a' : 'button';
    case 'image': return 'img';
    case 'video': return 'video';
    case 'navbar': return 'nav';
    case 'footer': return 'footer';
    case 'link': return 'a';
    case 'form': return 'form';
    case 'input': return 'input';
    case 'textarea': return 'textarea';
    case 'card': return 'article';
    case 'spacer': return 'div';
    case 'divider': return 'hr';
    case 'html': return 'div';
    case 'embed': return 'iframe';
    case 'accordion': return 'details';
    case 'tabs': return 'div';
    case 'modal': return 'dialog';
    case 'dropdown': return 'div';
    case 'countdown': return 'div';
    case 'marquee': return 'div';
    case 'tooltip': return 'div';
    case 'quote': return 'blockquote';
    case 'list': return ((el.props || {}).ordered ? 'ol' : 'ul');
    case 'code': return 'pre';
    case 'progress': return 'div';
    case 'table': return 'table';
    case 'select': return 'select';
    case 'checkbox': return 'label';
    default: return 'div';
  }
}

/** Build data attributes for JS interactivity */
function getDataAttrs(el: EditorElement): string {
  const attrs: string[] = [];
  // Custom data attributes from settings
  if ((el.props || {}).customAttributes && typeof (el.props || {}).customAttributes === 'object') {
    for (const [k, v] of Object.entries((el.props || {}).customAttributes as Record<string, string>)) {
      if (k.startsWith('data-')) attrs.push(`${k}="${escapeAttr(v)}"`);
    }
  }
  switch (el.type) {
    case 'accordion': attrs.push('data-accordion'); break;
    case 'tabs': attrs.push('data-tabs'); break;
    case 'modal': attrs.push(`data-modal="${el.id.slice(0, 8)}"`); break;
    case 'dropdown': attrs.push('data-dropdown'); break;
    case 'countdown': attrs.push(`data-countdown="${((el.props || {}).targetDate as string) || ''}"`); break;
    case 'marquee': attrs.push(`data-marquee data-marquee-speed="${((el.props || {}).speed as number) || 30}"`); break;
    case 'tooltip': attrs.push(`data-tooltip="${((el.props || {}).tooltipText as string) || ''}"`); break;
  }
  if (el.animations && el.animations.type !== 'none' &&
      (el.animations.trigger === 'onScroll' || el.animations.trigger === 'onView')) {
    attrs.push('data-animate');
  }
  return attrs.length ? ' ' + attrs.join(' ') : '';
}

/** Resolve page link slugs to proper filenames */
function resolveHref(href: string, keepHashLinks: boolean = false): string {
  if (!href) return '#';
  if (href.startsWith('#') && href.length > 1 && !href.includes(' ')) {
    if (keepHashLinks) return href;
    const slug = href.slice(1).replace(/^\/+/, '');
    if (!slug || slug === '/' || slug === 'index') return 'index.html';
    return `${slug}.html`;
  }
  return href;
}

/** Generate body-only HTML for preview */
export function generateBodyHTML(elements: EditorElement[]): string {
  _keepHashLinks = true;
  const html = elements.map(el => elementToHTML(el, 2)).join('\n\n');
  _keepHashLinks = false;
  return html;
}

let _keepHashLinks = false;

function escapeHTML(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str: string): string {
  // Ampersand first. Escaping the quote before the ampersand turned every
  // &quot; into &amp;quot;, so a quote in alt text rendered as visible
  // rubbish on the published page.
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Only URL schemes safe to put behind a link or an image. Without this a
 * javascript: URL typed into an image source went straight into the
 * exported and published page.
 */
function safeURL(value: unknown, allowData = false): string {
  const url = String(value ?? '').trim();
  if (!url) return '';
  const scheme = url.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  if (!scheme) return url;
  if (['http', 'https', 'mailto', 'tel'].includes(scheme)) return url;
  if (allowData && scheme === 'data' && /^data:image\//i.test(url)) return url;
  return '';
}

/** Build attributes string */
function getAttrs(el: EditorElement, inForm = false): string {
  const attrs: string[] = [];
  // Element ID / anchor
  if ((el.props || {}).anchorId) attrs.push(`id="${escapeAttr((el.props || {}).anchorId as string)}"`);
  // ARIA
  if ((el.props || {}).ariaLabel) attrs.push(`aria-label="${escapeAttr((el.props || {}).ariaLabel as string)}"`);
  if ((el.props || {}).ariaDescribedBy) attrs.push(`aria-describedby="${escapeAttr((el.props || {}).ariaDescribedBy as string)}"`);
  if ((el.props || {}).role) attrs.push(`role="${escapeAttr((el.props || {}).role as string)}"`);

  if (el.type === 'image') {
    attrs.push(`src="${escapeAttr(safeURL((el.props || {}).src, true))}"`);
    attrs.push(`alt="${escapeAttr(((el.props || {}).alt as string) || el.name || 'Image')}"`);
    attrs.push('decoding="async"');
    attrs.push('loading="lazy"');
    if ((el.props || {}).width) attrs.push(`width="${(el.props || {}).width}"`);
    if ((el.props || {}).height) attrs.push(`height="${(el.props || {}).height}"`);
  }
  if (el.type === 'video') {
    attrs.push(`src="${escapeAttr(safeURL((el.props || {}).src))}"`);
    if ((el.props || {}).poster) attrs.push(`poster="${(el.props || {}).poster}"`);
    attrs.push('controls playsinline preload="metadata"');
    if ((el.props || {}).autoplay) attrs.push('autoplay');
    if ((el.props || {}).loop) attrs.push('loop');
    if ((el.props || {}).muted) attrs.push('muted');
  }
  if (el.type === 'button' || el.type === 'link') {
    const href = resolveHref(((el.props || {}).href as string) || '#', _keepHashLinks);
    if (el.type === 'button' && !(el.props || {}).href) {
      attrs.push(`type="${inForm ? 'submit' : 'button'}"`);
    } else {
      attrs.push(`href="${href}"`);
    }
    if ((el.props || {}).target) attrs.push(`target="${(el.props || {}).target}"`);
    if ((el.props || {}).openInNewTab || (el.props || {}).newTab) attrs.push('target="_blank" rel="noopener noreferrer"');
    if ((el.props || {}).rel) attrs.push(`rel="${(el.props || {}).rel}"`);
    if ((el.props || {}).download) attrs.push('download');
  }
  if (el.type === 'input' || el.type === 'textarea' || el.type === 'select') {
    const label = String((el.props || {}).label || (el.props || {}).placeholder || el.name || 'Field');
    if (el.type === 'input') attrs.push(`type="${(el.props || {}).inputType || 'text'}"`);
    if ((el.props || {}).placeholder) attrs.push(`placeholder="${escapeAttr((el.props || {}).placeholder as string)}"`);
    attrs.push(`name="${escapeAttr(((el.props || {}).name as string) || fieldName(label))}"`);
    if (!(el.props || {}).ariaLabel) attrs.push(`aria-label="${escapeAttr(label)}"`);
    attrs.push(`data-field-label="${escapeAttr(label)}"`);
    if ((el.props || {}).required) attrs.push('required');
  }
  if (el.type === 'embed') {
    attrs.push(`src="${escapeAttr(safeURL((el.props || {}).embedUrl))}"`);
    attrs.push('frameborder="0" loading="lazy" allowfullscreen');
  }
  if (el.type === 'form') {
    // Marks the form for the runtime handler, which posts it to Quooro and
    // reports back in place. Without this a form is decoration.
    attrs.push('novalidate');
    attrs.push('data-quooro-form');
    attrs.push(`data-form-id="${escapeAttr(el.id)}"`);
    attrs.push(`data-form-name="${escapeAttr(((el.props || {}).name as string) || el.name || 'Form')}"`);
    if ((el.props || {}).successMessage) attrs.push(`data-success="${escapeAttr((el.props || {}).successMessage as string)}"`);
    if ((el.props || {}).redirectUrl) attrs.push(`data-redirect="${escapeAttr((el.props || {}).redirectUrl as string)}"`);
    attrs.push('method="post"');
    if ((el.props || {}).action) attrs.push(`action="${(el.props || {}).action}"`);
  }
  if (el.type === 'select') {
    if ((el.props || {}).name) attrs.push(`name="${(el.props || {}).name}"`);
    if ((el.props || {}).required) attrs.push('required');
  }
  return attrs.length ? ' ' + attrs.join(' ') : '';
}

/** Generate inner content */
function getContent(el: EditorElement): string {
  if (el.type === 'heading' || el.type === 'text' || el.type === 'button' || el.type === 'link' || el.type === 'badge') {
    return escapeHTML(((el.props || {}).text as string) || '');
  }
  if (el.type === 'html') return ((el.props || {}).htmlContent as string) || '';
  if (el.type === 'divider') return '';
  if (el.type === 'quote') {
    let html = `<p>${escapeHTML(((el.props || {}).text as string) || '')}</p>`;
    if ((el.props || {}).author) html += `\n    <footer>— ${escapeHTML((el.props || {}).author as string)}</footer>`;
    return html;
  }
  if (el.type === 'list') {
    const items = ((el.props || {}).items as string[]) || ['Item 1', 'Item 2'];
    return items.map(item => `<li>${escapeHTML(item)}</li>`).join('\n    ');
  }
  if (el.type === 'code') return `<code>${escapeHTML(((el.props || {}).code as string) || '// code')}</code>`;
  if (el.type === 'countdown') {
    return ['Days', 'Hours', 'Min', 'Sec'].map(u =>
      `<div class="countdown-unit" data-unit>\n      <span class="countdown-value" data-value>00</span>\n      <span class="countdown-label">${u}</span>\n    </div>`
    ).join('\n    ');
  }
  if (el.type === 'progress') {
    const val = ((el.props || {}).value as number) || 0;
    const label = ((el.props || {}).label as string) || 'Progress';
    return `<div class="progress-header">\n      <span>${escapeHTML(label)}</span>\n      <span>${val}%</span>\n    </div>\n    <div class="progress-track">\n      <div class="progress-fill" style="width: ${val}%"></div>\n    </div>`;
  }
  if (el.type === 'table') {
    const headers = ((el.props || {}).headers as string[]) || ['Col 1', 'Col 2'];
    const rows = ((el.props || {}).rows as string[][]) || [['Data', 'Data']];
    let html = '  <thead>\n      <tr>' + headers.map(h => `\n        <th>${escapeHTML(h)}</th>`).join('') + '\n      </tr>\n    </thead>';
    html += '\n    <tbody>' + rows.map(row => '\n      <tr>' + row.map(cell => `\n        <td>${escapeHTML(cell)}</td>`).join('') + '\n      </tr>').join('') + '\n    </tbody>';
    return html;
  }
  if (el.type === 'checkbox') return `<input type="checkbox" name="${(el.props || {}).name || ''}" />\n    <span>${escapeHTML(((el.props || {}).label as string) || 'Checkbox')}</span>`;
  if (el.type === 'select') {
    const options = ((el.props || {}).options as string[]) || ['Option 1', 'Option 2'];
    let html = `<option value="" disabled selected>${escapeHTML(((el.props || {}).placeholder as string) || 'Choose…')}</option>`;
    html += options.map(o => `\n    <option value="${escapeHTML(o)}">${escapeHTML(o)}</option>`).join('');
    return html;
  }
  if (el.type === 'accordion') return `<summary>${escapeHTML(((el.props || {}).title as string) || 'Accordion')}</summary>\n    <div class="accordion-content">`;
  if (el.type === 'tabs') {
    const tabs = ((el.props || {}).tabs as string[]) || ['Tab 1', 'Tab 2'];
    return `<div class="tab-nav" role="tablist">\n` +
      tabs.map((t, i) => `      <button class="tab-trigger${i === 0 ? ' is-active' : ''}" role="tab" data-tab-trigger>${escapeHTML(t)}</button>`).join('\n') +
      `\n    </div>`;
  }
  // Storefront widgets
  if (el.type === 'product-grid') return `<div data-widget="product-grid"></div>`;
  if (el.type === 'booking-widget') return `<div data-widget="booking"></div>`;
  if (el.type === 'visitor-auth') return `<div data-widget="auth"></div>`;
  if (el.type === 'cart-button') return `<span data-widget="cart-button">${escapeHTML(((el.props || {}).text as string) || 'Cart')}</span>`;
  if (el.type === 'visitor-dashboard') return `<div data-widget="dashboard"></div>`;
  return '';
}

/** Recursively build HTML string */
/**
 * Choices - dropdowns, tick boxes, radio groups. These need markup a tag map
 * cannot express: options inside a select, an input wrapped in its own label,
 * a group inside a fieldset with a legend. Without it a tick box exported as
 * an empty <label> and its answer was simply lost on submission.
 *
 * data-field-label carries the group's own wording onto every control, so a
 * submission reads "Which days suit you: Monday, Tuesday" rather than a slug.
 */
function renderChoice(el: EditorElement, pad: string, cls: string): string | null {
  const props = el.props || {};
  const label = String(props.label || props.placeholder || props.text || el.name || 'Choice');
  const name = escapeAttr((props.name as string) || fieldName(label));
  const required = props.required ? ' required' : '';
  const options = (Array.isArray(props.options) ? props.options : [])
    .map(o => (typeof o === 'string' ? o : String((o as Record<string, unknown>)?.label ?? (o as Record<string, unknown>)?.value ?? '')))
    .filter(Boolean);

  if (el.type === 'select') {
    const placeholder = String(props.placeholder || 'Choose…');
    const opts = [
      `${pad}  <option value="">${escapeHTML(placeholder)}</option>`,
      ...options.map(o => `${pad}  <option value="${escapeAttr(o)}">${escapeHTML(o)}</option>`),
    ].join('\n');
    return `${pad}<select class="${cls}" name="${name}" aria-label="${escapeAttr(label)}"` +
      ` data-field-label="${escapeAttr(label)}"${required}>\n${opts}\n${pad}</select>`;
  }

  if (el.type === 'checkbox' || el.type === 'radio') {
    const type = el.type === 'radio' ? 'radio' : 'checkbox';
    if (options.length === 0) {
      const text = String(props.text || label);
      return `${pad}<label class="${cls} quooro-choice">` +
        `<input type="${type}" name="${escapeAttr((props.name as string) || fieldName(text))}"` +
        ` value="${escapeAttr(text)}" data-field-label="${escapeAttr(text)}"${required}> ` +
        `<span>${escapeHTML(text)}</span></label>`;
    }
    const items = options.map(o =>
      `${pad}  <label class="quooro-choice">` +
      `<input type="${type}" name="${name}" value="${escapeAttr(o)}"` +
      ` data-field-label="${escapeAttr(label)}"> ` +
      `<span>${escapeHTML(o)}</span></label>`).join('\n');
    return `${pad}<fieldset class="${cls} quooro-choice-group">\n` +
      `${pad}  <legend>${escapeHTML(label)}</legend>\n${items}\n${pad}</fieldset>`;
  }
  return null;
}

/**
 * Charts, drawn as inline SVG.
 *
 * They used to publish as an empty styled box - the editor showed a chart,
 * the live site showed nothing. Inline SVG is the right answer for a static
 * export: no library to load, no runtime to fail, it scales, it prints, and
 * a screen reader gets the figures from the accompanying table.
 */
function renderChart(el: EditorElement, pad: string, cls: string): string | null {
  if (!['bar-chart', 'line-chart', 'pie-chart'].includes(el.type)) return null;
  const props = el.props || {};
  const data = (Array.isArray(props.data) ? props.data : []).map(Number).filter(n => !isNaN(n));
  const labels = (Array.isArray(props.labels) ? props.labels : []).map(String);
  const colour = safeColour(props.color) || 'currentColor';
  const title = String(props.title || el.name || 'Chart');

  if (data.length === 0) {
    return `${pad}<figure class="${cls}"><figcaption>${escapeHTML(title)}</figcaption></figure>`;
  }

  const W = 600, H = 300, PADX = 36, PADY = 24;
  const max = Math.max(...data, 1);
  let svg = '';

  if (el.type === 'bar-chart') {
    const slot = (W - PADX * 2) / data.length;
    const bw = Math.max(4, slot * 0.62);
    svg = data.map((v, i) => {
      const h = ((H - PADY * 2) * v) / max;
      const x = PADX + i * slot + (slot - bw) / 2;
      const y = H - PADY - h;
      const label = labels[i] ? `<title>${escapeHTML(labels[i])}: ${v}</title>` : '';
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${colour}">${label}</rect>`;
    }).join('');
  } else if (el.type === 'line-chart') {
    const step = data.length > 1 ? (W - PADX * 2) / (data.length - 1) : 0;
    const pts = data.map((v, i) => {
      const x = PADX + i * step;
      const y = H - PADY - ((H - PADY * 2) * v) / max;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    svg = `<polyline points="${pts.join(' ')}" fill="none" stroke="${colour}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>` +
      data.map((v, i) => {
        const [x, y] = pts[i].split(',');
        return `<circle cx="${x}" cy="${y}" r="3.5" fill="${colour}"><title>${escapeHTML(labels[i] || String(i + 1))}: ${v}</title></circle>`;
      }).join('');
  } else {
    const total = data.reduce((a, b) => a + b, 0) || 1;
    const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - PADY;
    let angle = -Math.PI / 2;
    svg = data.map((v, i) => {
      const sweep = (v / total) * Math.PI * 2;
      const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
      angle += sweep;
      const x2 = cx + r * Math.cos(angle), y2 = cy + r * Math.sin(angle);
      const large = sweep > Math.PI ? 1 : 0;
      // Slices share one hue at descending opacity: readable in print and
      // to most colour-blind readers, unlike an arbitrary rainbow.
      const op = (1 - (i / Math.max(data.length, 1)) * 0.62).toFixed(2);
      return `<path d="M${cx} ${cy} L${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${colour}" fill-opacity="${op}">` +
        `<title>${escapeHTML(labels[i] || String(i + 1))}: ${v}</title></path>`;
    }).join('');
  }

  // The figures in text as well as in the drawing, so the chart is readable
  // without sight of it and survives with images off.
  const table = labels.length
    ? `\n${pad}  <table class="chart-data"><caption>${escapeHTML(title)}</caption><tbody>` +
      data.map((v, i) => `<tr><th scope="row">${escapeHTML(labels[i] || String(i + 1))}</th><td>${v}</td></tr>`).join('') +
      `</tbody></table>`
    : '';

  return `${pad}<figure class="${cls}" role="group" aria-label="${escapeAttr(title)}">\n` +
    `${pad}  <svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${svg}</svg>` +
    `${table}\n${pad}</figure>`;
}

/** A colour value safe to drop into an SVG attribute. */
function safeColour(value: unknown): string {
  const v = String(value ?? '').trim();
  return /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%/]+\)|hsla?\([\d\s.,%/]+\)|[a-z]+)$/i.test(v) ? v : '';
}

function elementToHTML(el: EditorElement, indent: number = 0, inForm = false): string {
  if (el.hidden) return ''; // Skip hidden elements
  const pad = '  '.repeat(indent);
  const cls = generateClassName(el);
  const choice = renderChoice(el, pad, cls);
  if (choice) return choice;
  const chart = renderChart(el, pad, cls);
  if (chart) return chart;

  const tag = getTag(el);
  const attrs = getAttrs(el, inForm);
  const dataAttrs = getDataAttrs(el);
  const selfClosing = ['img', 'input', 'hr'].includes(tag);
  const content = getContent(el);

  // Semantic roles
  let roleAttr = '';
  if (el.type === 'navbar') roleAttr = ' role="navigation"';
  if (el.type === 'footer') roleAttr = ' role="contentinfo"';

  // Non-link elements with href
  const isNativeLink = ['button', 'link'].includes(el.type) && (el.props || {}).href;
  const hasPageLink = !isNativeLink && (el.props || {}).href && typeof (el.props || {}).href === 'string' && (el.props || {}).href.length > 0;
  const resolvedLink = hasPageLink ? resolveHref((el.props || {}).href as string, _keepHashLinks) : '';
  const linkTarget = ((el.props || {}).openInNewTab || (el.props || {}).newTab) ? ' target="_blank" rel="noopener noreferrer"' : ((el.props || {}).target ? ` target="${(el.props || {}).target}"` : '');

  let elementHTML: string;

  if (selfClosing) {
    elementHTML = `${pad}<${tag} class="${cls}"${attrs}${dataAttrs}${roleAttr} />`;
  } else {
    const accordionClose = el.type === 'accordion' ? `\n${pad}    </div>` : '';
    const formExtras = el.type === 'form'
      ? `\n${pad}  <div class="quooro-hp" aria-hidden="true"><label>Company website` +
        `<input type="text" name="company_website" tabindex="-1" autocomplete="off"></label></div>` +
        `\n${pad}  <p class="quooro-form-status" role="status" aria-live="polite"></p>`
      : '';
    const visibleChildren = (el.children || []).filter(c => !c.hidden);

    if (visibleChildren.length === 0) {
      if (!content) {
        elementHTML = `${pad}<${tag} class="${cls}"${attrs}${dataAttrs}${roleAttr}>${formExtras}</${tag}>`;
      } else {
        elementHTML = `${pad}<${tag} class="${cls}"${attrs}${dataAttrs}${roleAttr}>\n${pad}  ${content}${accordionClose}${formExtras}\n${pad}</${tag}>`;
      }
    } else {
      const childHTML = visibleChildren.map(c => elementToHTML(c, indent + 1, inForm || el.type === 'form')).filter(Boolean).join('\n');
      const contentLine = content ? `\n${pad}  ${content}` : '';
      elementHTML = `${pad}<${tag} class="${cls}"${attrs}${dataAttrs}${roleAttr}>${contentLine}\n${childHTML}${accordionClose}${formExtras}\n${pad}</${tag}>`;
    }
  }

  // Wrap non-link elements in <a> tag if they have a page link
  if (hasPageLink) {
    return `${pad}<a href="${resolvedLink}" style="text-decoration:none;color:inherit;display:block"${linkTarget}>\n${elementHTML}\n${pad}</a>`;
  }

  return elementHTML;
}

/** Generate full HTML page */
export function exportToHTML(elements: EditorElement[], title: string = 'My Website'): { html: string; css: string; js: string } {
  const css = buildCSS(elements);
  const js = generateJS(elements);
  const bodyContent = elements.map(el => elementToHTML(el, 2)).join('\n\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapeHTML(title)}">
    <title>${escapeHTML(title)}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>

${bodyContent}

    <script src="script.js" defer></script>
</body>
</html>`;

  return { html, css, js };
}

/** Multi-page export */
export function exportMultiPageSite(
  pages: { page_name: string; slug: string; is_homepage: boolean; elements: EditorElement[]; seo_title?: string | null; seo_description?: string | null; page_settings?: any }[],
  siteName: string
): { sharedCSS: string; sharedJS: string; pageFiles: { filename: string; html: string }[] } {
  const allElements = pages.flatMap(p => p.elements);
  const sharedCSS = buildCSS(allElements);
  const sharedJS = generateJS(allElements);

  const pageFiles = pages.map(page => {
    const cleanSlug = page.slug.replace(/^\/+/, '');
    const filename = page.is_homepage || cleanSlug === '' || cleanSlug === '/' ? 'index.html' : `${cleanSlug}.html`;
    const bodyContent = page.elements.map(el => elementToHTML(el, 2)).join('\n\n');
    const ps = page.page_settings || {};
    const title = page.seo_title || page.page_name;
    const desc = page.seo_description || `${page.page_name} — ${siteName}`;

    let metaTags = `    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapeHTML(desc)}">
    <title>${escapeHTML(title)} — ${escapeHTML(siteName)}</title>`;

    if (ps.favicon_url) metaTags += `\n    <link rel="icon" href="${escapeHTML(ps.favicon_url)}">`;
    if (ps.canonical_url) metaTags += `\n    <link rel="canonical" href="${escapeHTML(ps.canonical_url)}">`;
    if (ps.no_index || ps.no_follow) {
      const robots = [ps.no_index ? 'noindex' : '', ps.no_follow ? 'nofollow' : ''].filter(Boolean).join(', ');
      metaTags += `\n    <meta name="robots" content="${robots}">`;
    }
    if (ps.og_title || ps.og_description || ps.og_image) {
      metaTags += `\n    <meta property="og:type" content="website">`;
      if (ps.og_title) metaTags += `\n    <meta property="og:title" content="${escapeHTML(ps.og_title)}">`;
      if (ps.og_description) metaTags += `\n    <meta property="og:description" content="${escapeHTML(ps.og_description)}">`;
      if (ps.og_image) metaTags += `\n    <meta property="og:image" content="${escapeHTML(ps.og_image)}">`;
    }
    if (ps.twitter_handle) {
      metaTags += `\n    <meta name="twitter:card" content="summary_large_image">`;
      metaTags += `\n    <meta name="twitter:site" content="${escapeHTML(ps.twitter_handle)}">`;
    }
    metaTags += `\n    <link rel="stylesheet" href="styles.css">`;

    const headCode = ps.head_code ? `\n    ${ps.head_code}` : '';
    const bodyCode = ps.body_code ? `\n    ${ps.body_code}` : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
${metaTags}${headCode}
</head>
<body>

${bodyContent}

    <script src="script.js" defer></script>${bodyCode}
</body>
</html>`;

    return { filename, html };
  });

  return { sharedCSS, sharedJS, pageFiles };
}
