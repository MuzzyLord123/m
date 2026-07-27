import { EditorElement } from '../types';
import { generateClassName, buildCSS } from './cssCompiler';
import { generateJS } from './jsGenerator';

/** Map element type to semantic HTML tag */
function getTag(el: EditorElement): string {
  switch (el.type) {
    case 'section': return 'section';
    case 'container': return 'div';
    case 'columns': case 'grid': return 'div';
    case 'heading': {
      const level = (el.props.level as string) || 'h2';
      return ['h1','h2','h3','h4','h5','h6'].includes(level) ? level : 'h2';
    }
    case 'text': return 'p';
    case 'button': return el.props.href ? 'a' : 'button';
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
    case 'list': return (el.props.ordered ? 'ol' : 'ul');
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
  if (el.props.customAttributes && typeof el.props.customAttributes === 'object') {
    for (const [k, v] of Object.entries(el.props.customAttributes as Record<string, string>)) {
      if (k.startsWith('data-')) attrs.push(`${k}="${escapeAttr(v)}"`);
    }
  }
  switch (el.type) {
    case 'accordion': attrs.push('data-accordion'); break;
    case 'tabs': attrs.push('data-tabs'); break;
    case 'modal': attrs.push(`data-modal="${el.id.slice(0, 8)}"`); break;
    case 'dropdown': attrs.push('data-dropdown'); break;
    case 'countdown': attrs.push(`data-countdown="${(el.props.targetDate as string) || ''}"`); break;
    case 'marquee': attrs.push(`data-marquee data-marquee-speed="${(el.props.speed as number) || 30}"`); break;
    case 'tooltip': attrs.push(`data-tooltip="${(el.props.tooltipText as string) || ''}"`); break;
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
  return str.replace(/"/g, '&quot;').replace(/&/g, '&amp;');
}

/** Build attributes string */
function getAttrs(el: EditorElement): string {
  const attrs: string[] = [];
  // Element ID / anchor
  if (el.props.anchorId) attrs.push(`id="${escapeAttr(el.props.anchorId as string)}"`);
  // ARIA
  if (el.props.ariaLabel) attrs.push(`aria-label="${escapeAttr(el.props.ariaLabel as string)}"`);
  if (el.props.ariaDescribedBy) attrs.push(`aria-describedby="${escapeAttr(el.props.ariaDescribedBy as string)}"`);
  if (el.props.role) attrs.push(`role="${escapeAttr(el.props.role as string)}"`);

  if (el.type === 'image') {
    attrs.push(`src="${el.props.src || ''}"`);
    attrs.push(`alt="${escapeAttr((el.props.alt as string) || el.name || 'Image')}"`);
    attrs.push('loading="lazy"');
    if (el.props.width) attrs.push(`width="${el.props.width}"`);
    if (el.props.height) attrs.push(`height="${el.props.height}"`);
  }
  if (el.type === 'video') {
    attrs.push(`src="${el.props.src || ''}"`);
    if (el.props.poster) attrs.push(`poster="${el.props.poster}"`);
    attrs.push('controls playsinline preload="metadata"');
    if (el.props.autoplay) attrs.push('autoplay');
    if (el.props.loop) attrs.push('loop');
    if (el.props.muted) attrs.push('muted');
  }
  if (el.type === 'button' || el.type === 'link') {
    const href = resolveHref((el.props.href as string) || '#', _keepHashLinks);
    if (el.type === 'button' && !el.props.href) {
      attrs.push('type="button"');
    } else {
      attrs.push(`href="${href}"`);
    }
    if (el.props.target) attrs.push(`target="${el.props.target}"`);
    if (el.props.openInNewTab) attrs.push('target="_blank" rel="noopener noreferrer"');
    if (el.props.rel) attrs.push(`rel="${el.props.rel}"`);
    if (el.props.download) attrs.push('download');
  }
  if (el.type === 'input') {
    attrs.push(`type="${el.props.inputType || 'text'}"`);
    if (el.props.placeholder) attrs.push(`placeholder="${escapeAttr(el.props.placeholder as string)}"`);
    if (el.props.name) attrs.push(`name="${el.props.name}"`);
    if (el.props.required) attrs.push('required');
  }
  if (el.type === 'textarea') {
    if (el.props.placeholder) attrs.push(`placeholder="${escapeAttr(el.props.placeholder as string)}"`);
    if (el.props.name) attrs.push(`name="${el.props.name}"`);
    if (el.props.required) attrs.push('required');
  }
  if (el.type === 'embed') {
    attrs.push(`src="${el.props.embedUrl || ''}"`);
    attrs.push('frameborder="0" loading="lazy" allowfullscreen');
  }
  if (el.type === 'form') {
    attrs.push('novalidate');
    if (el.props.action) attrs.push(`action="${el.props.action}"`);
    if (el.props.method) attrs.push(`method="${el.props.method}"`);
  }
  if (el.type === 'select') {
    if (el.props.name) attrs.push(`name="${el.props.name}"`);
    if (el.props.required) attrs.push('required');
  }
  return attrs.length ? ' ' + attrs.join(' ') : '';
}

/** Generate inner content */
function getContent(el: EditorElement): string {
  if (el.type === 'heading' || el.type === 'text' || el.type === 'button' || el.type === 'link' || el.type === 'badge') {
    return escapeHTML((el.props.text as string) || '');
  }
  if (el.type === 'html') return (el.props.htmlContent as string) || '';
  if (el.type === 'divider') return '';
  if (el.type === 'quote') {
    let html = `<p>${escapeHTML((el.props.text as string) || '')}</p>`;
    if (el.props.author) html += `\n    <footer>— ${escapeHTML(el.props.author as string)}</footer>`;
    return html;
  }
  if (el.type === 'list') {
    const items = (el.props.items as string[]) || ['Item 1', 'Item 2'];
    return items.map(item => `<li>${escapeHTML(item)}</li>`).join('\n    ');
  }
  if (el.type === 'code') return `<code>${escapeHTML((el.props.code as string) || '// code')}</code>`;
  if (el.type === 'countdown') {
    return ['Days', 'Hours', 'Min', 'Sec'].map(u =>
      `<div class="countdown-unit" data-unit>\n      <span class="countdown-value" data-value>00</span>\n      <span class="countdown-label">${u}</span>\n    </div>`
    ).join('\n    ');
  }
  if (el.type === 'progress') {
    const val = (el.props.value as number) || 0;
    const label = (el.props.label as string) || 'Progress';
    return `<div class="progress-header">\n      <span>${escapeHTML(label)}</span>\n      <span>${val}%</span>\n    </div>\n    <div class="progress-track">\n      <div class="progress-fill" style="width: ${val}%"></div>\n    </div>`;
  }
  if (el.type === 'table') {
    const headers = (el.props.headers as string[]) || ['Col 1', 'Col 2'];
    const rows = (el.props.rows as string[][]) || [['Data', 'Data']];
    let html = '  <thead>\n      <tr>' + headers.map(h => `\n        <th>${escapeHTML(h)}</th>`).join('') + '\n      </tr>\n    </thead>';
    html += '\n    <tbody>' + rows.map(row => '\n      <tr>' + row.map(cell => `\n        <td>${escapeHTML(cell)}</td>`).join('') + '\n      </tr>').join('') + '\n    </tbody>';
    return html;
  }
  if (el.type === 'checkbox') return `<input type="checkbox" name="${el.props.name || ''}" />\n    <span>${escapeHTML((el.props.label as string) || 'Checkbox')}</span>`;
  if (el.type === 'select') {
    const options = (el.props.options as string[]) || ['Option 1', 'Option 2'];
    let html = `<option value="" disabled selected>${escapeHTML((el.props.placeholder as string) || 'Choose…')}</option>`;
    html += options.map(o => `\n    <option value="${escapeHTML(o)}">${escapeHTML(o)}</option>`).join('');
    return html;
  }
  if (el.type === 'accordion') return `<summary>${escapeHTML((el.props.title as string) || 'Accordion')}</summary>\n    <div class="accordion-content">`;
  if (el.type === 'tabs') {
    const tabs = (el.props.tabs as string[]) || ['Tab 1', 'Tab 2'];
    return `<div class="tab-nav" role="tablist">\n` +
      tabs.map((t, i) => `      <button class="tab-trigger${i === 0 ? ' is-active' : ''}" role="tab" data-tab-trigger>${escapeHTML(t)}</button>`).join('\n') +
      `\n    </div>`;
  }
  // Storefront widgets
  if (el.type === 'product-grid') return `<div data-widget="product-grid"></div>`;
  if (el.type === 'booking-widget') return `<div data-widget="booking"></div>`;
  if (el.type === 'visitor-auth') return `<div data-widget="auth"></div>`;
  if (el.type === 'cart-button') return `<span data-widget="cart-button">${escapeHTML((el.props.text as string) || 'Cart')}</span>`;
  if (el.type === 'visitor-dashboard') return `<div data-widget="dashboard"></div>`;
  return '';
}

/** Recursively build HTML string */
function elementToHTML(el: EditorElement, indent: number = 0): string {
  if (el.hidden) return ''; // Skip hidden elements
  const pad = '  '.repeat(indent);
  const tag = getTag(el);
  const cls = generateClassName(el);
  const attrs = getAttrs(el);
  const dataAttrs = getDataAttrs(el);
  const selfClosing = ['img', 'input', 'hr'].includes(tag);
  const content = getContent(el);

  // Semantic roles
  let roleAttr = '';
  if (el.type === 'navbar') roleAttr = ' role="navigation"';
  if (el.type === 'footer') roleAttr = ' role="contentinfo"';

  // Non-link elements with href
  const isNativeLink = ['button', 'link'].includes(el.type) && el.props.href;
  const hasPageLink = !isNativeLink && el.props.href && typeof el.props.href === 'string' && el.props.href.length > 0;
  const resolvedLink = hasPageLink ? resolveHref(el.props.href as string, _keepHashLinks) : '';
  const linkTarget = el.props.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : (el.props.target ? ` target="${el.props.target}"` : '');

  let elementHTML: string;

  if (selfClosing) {
    elementHTML = `${pad}<${tag} class="${cls}"${attrs}${dataAttrs}${roleAttr} />`;
  } else {
    const accordionClose = el.type === 'accordion' ? `\n${pad}    </div>` : '';
    const visibleChildren = el.children.filter(c => !c.hidden);

    if (visibleChildren.length === 0) {
      if (!content) {
        elementHTML = `${pad}<${tag} class="${cls}"${attrs}${dataAttrs}${roleAttr}></${tag}>`;
      } else {
        elementHTML = `${pad}<${tag} class="${cls}"${attrs}${dataAttrs}${roleAttr}>\n${pad}  ${content}${accordionClose}\n${pad}</${tag}>`;
      }
    } else {
      const childHTML = visibleChildren.map(c => elementToHTML(c, indent + 1)).filter(Boolean).join('\n');
      const contentLine = content ? `\n${pad}  ${content}` : '';
      elementHTML = `${pad}<${tag} class="${cls}"${attrs}${dataAttrs}${roleAttr}>${contentLine}\n${childHTML}${accordionClose}\n${pad}</${tag}>`;
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
