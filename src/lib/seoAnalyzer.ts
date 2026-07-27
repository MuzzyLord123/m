// SEO Analysis Types
export interface SEOCheck {
  name: string;
  score: number;
  maxScore: number;
  status: 'good' | 'warning' | 'error';
  message: string;
  details?: string;
}

export interface SEOAnalysisResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  checks: SEOCheck[];
}

// Flesch Reading Ease calculation
function calculateFleschReadingEase(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease formula
  const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, score));
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

// Extract content from HTML
function extractFromHTML(html: string): {
  title: string;
  metaDescription: string;
  h1Tags: string[];
  h2Tags: string[];
  bodyText: string;
  internalLinks: number;
  externalLinks: number;
  imagesWithAlt: number;
  imagesWithoutAlt: number;
  totalImages: number;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Get title
  const titleEl = doc.querySelector('title');
  const title = titleEl?.textContent?.trim() || '';

  // Get meta description
  const metaDesc = doc.querySelector('meta[name="description"]');
  const metaDescription = metaDesc?.getAttribute('content')?.trim() || '';

  // Get headings
  const h1Tags = Array.from(doc.querySelectorAll('h1')).map(h => h.textContent?.trim() || '');
  const h2Tags = Array.from(doc.querySelectorAll('h2')).map(h => h.textContent?.trim() || '');

  // Get body text
  const bodyEl = doc.body;
  const bodyText = bodyEl?.textContent?.trim() || '';

  // Count links
  const links = Array.from(doc.querySelectorAll('a[href]'));
  let internalLinks = 0;
  let externalLinks = 0;
  
  links.forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('http://') || href.startsWith('https://')) {
      externalLinks++;
    } else if (href.startsWith('/') || href.startsWith('#') || !href.includes('://')) {
      internalLinks++;
    }
  });

  // Count images
  const images = Array.from(doc.querySelectorAll('img'));
  let imagesWithAlt = 0;
  let imagesWithoutAlt = 0;
  
  images.forEach(img => {
    const alt = img.getAttribute('alt');
    if (alt && alt.trim().length > 0) {
      imagesWithAlt++;
    } else {
      imagesWithoutAlt++;
    }
  });

  return {
    title,
    metaDescription,
    h1Tags,
    h2Tags,
    bodyText,
    internalLinks,
    externalLinks,
    imagesWithAlt,
    imagesWithoutAlt,
    totalImages: images.length,
  };
}

// Main analysis function
export function analyzeSEO(content: string, isHTML: boolean = false, targetKeyword?: string): SEOAnalysisResult {
  const checks: SEOCheck[] = [];

  let title = '';
  let metaDescription = '';
  let h1Tags: string[] = [];
  let h2Tags: string[] = [];
  let bodyText = content;
  let internalLinks = 0;
  let externalLinks = 0;
  let imagesWithAlt = 0;
  let imagesWithoutAlt = 0;
  let totalImages = 0;

  if (isHTML) {
    const extracted = extractFromHTML(content);
    title = extracted.title;
    metaDescription = extracted.metaDescription;
    h1Tags = extracted.h1Tags;
    h2Tags = extracted.h2Tags;
    bodyText = extracted.bodyText;
    internalLinks = extracted.internalLinks;
    externalLinks = extracted.externalLinks;
    imagesWithAlt = extracted.imagesWithAlt;
    imagesWithoutAlt = extracted.imagesWithoutAlt;
    totalImages = extracted.totalImages;
  }

  // 1. Title Tag Check (15 points)
  const titleLength = title.length;
  let titleScore = 0;
  let titleStatus: 'good' | 'warning' | 'error' = 'error';
  let titleMessage = '';

  if (!isHTML) {
    titleScore = 15;
    titleStatus = 'good';
    titleMessage = 'Title analysis requires HTML input';
  } else if (titleLength === 0) {
    titleMessage = 'Missing title tag';
    titleStatus = 'error';
  } else if (titleLength < 30) {
    titleScore = 5;
    titleStatus = 'warning';
    titleMessage = `Title too short (${titleLength} chars). Aim for 50-60 characters.`;
  } else if (titleLength <= 60) {
    titleScore = 15;
    titleStatus = 'good';
    titleMessage = `Title length is optimal (${titleLength} chars)`;
  } else if (titleLength <= 70) {
    titleScore = 10;
    titleStatus = 'warning';
    titleMessage = `Title slightly long (${titleLength} chars). May be truncated.`;
  } else {
    titleScore = 5;
    titleStatus = 'warning';
    titleMessage = `Title too long (${titleLength} chars). Will be truncated in search results.`;
  }

  checks.push({
    name: 'Title Tag',
    score: titleScore,
    maxScore: 15,
    status: titleStatus,
    message: titleMessage,
    details: title || undefined,
  });

  // 2. Meta Description Check (15 points)
  const metaLength = metaDescription.length;
  let metaScore = 0;
  let metaStatus: 'good' | 'warning' | 'error' = 'error';
  let metaMessage = '';

  if (!isHTML) {
    metaScore = 15;
    metaStatus = 'good';
    metaMessage = 'Meta description analysis requires HTML input';
  } else if (metaLength === 0) {
    metaMessage = 'Missing meta description';
    metaStatus = 'error';
  } else if (metaLength < 70) {
    metaScore = 5;
    metaStatus = 'warning';
    metaMessage = `Meta description too short (${metaLength} chars). Aim for 150-160 characters.`;
  } else if (metaLength <= 160) {
    metaScore = 15;
    metaStatus = 'good';
    metaMessage = `Meta description length is optimal (${metaLength} chars)`;
  } else if (metaLength <= 180) {
    metaScore = 10;
    metaStatus = 'warning';
    metaMessage = `Meta description slightly long (${metaLength} chars). May be truncated.`;
  } else {
    metaScore = 5;
    metaStatus = 'warning';
    metaMessage = `Meta description too long (${metaLength} chars). Will be truncated.`;
  }

  checks.push({
    name: 'Meta Description',
    score: metaScore,
    maxScore: 15,
    status: metaStatus,
    message: metaMessage,
    details: metaDescription || undefined,
  });

  // 3. H1 Tag Check (10 points)
  let h1Score = 0;
  let h1Status: 'good' | 'warning' | 'error' = 'error';
  let h1Message = '';

  if (!isHTML) {
    h1Score = 10;
    h1Status = 'good';
    h1Message = 'H1 analysis requires HTML input';
  } else if (h1Tags.length === 0) {
    h1Message = 'Missing H1 tag';
    h1Status = 'error';
  } else if (h1Tags.length === 1) {
    h1Score = 10;
    h1Status = 'good';
    h1Message = 'Page has exactly one H1 tag';
  } else {
    h1Score = 5;
    h1Status = 'warning';
    h1Message = `Multiple H1 tags found (${h1Tags.length}). Use only one H1 per page.`;
  }

  checks.push({
    name: 'H1 Heading',
    score: h1Score,
    maxScore: 10,
    status: h1Status,
    message: h1Message,
    details: h1Tags.length > 0 ? h1Tags.join(', ') : undefined,
  });

  // 4. H2 Tags Check (10 points)
  let h2Score = 0;
  let h2Status: 'good' | 'warning' | 'error' = 'error';
  let h2Message = '';

  if (!isHTML) {
    h2Score = 10;
    h2Status = 'good';
    h2Message = 'H2 analysis requires HTML input';
  } else if (h2Tags.length === 0) {
    h2Message = 'No H2 subheadings found. Add structure with H2 tags.';
    h2Status = 'error';
  } else if (h2Tags.length >= 2 && h2Tags.length <= 8) {
    h2Score = 10;
    h2Status = 'good';
    h2Message = `Good use of H2 subheadings (${h2Tags.length} found)`;
  } else if (h2Tags.length === 1) {
    h2Score = 5;
    h2Status = 'warning';
    h2Message = 'Only 1 H2 found. Consider adding more subheadings.';
  } else {
    h2Score = 7;
    h2Status = 'warning';
    h2Message = `Many H2 tags found (${h2Tags.length}). Consider restructuring.`;
  }

  checks.push({
    name: 'H2 Subheadings',
    score: h2Score,
    maxScore: 10,
    status: h2Status,
    message: h2Message,
  });

  // 5. Content Length Check (15 points)
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;
  let contentScore = 0;
  let contentStatus: 'good' | 'warning' | 'error' = 'error';
  let contentMessage = '';

  if (wordCount < 100) {
    contentMessage = `Very thin content (${wordCount} words). Aim for at least 300 words.`;
    contentStatus = 'error';
  } else if (wordCount < 300) {
    contentScore = 5;
    contentStatus = 'warning';
    contentMessage = `Content is short (${wordCount} words). Consider expanding to 500+ words.`;
  } else if (wordCount < 500) {
    contentScore = 10;
    contentStatus = 'warning';
    contentMessage = `Acceptable content length (${wordCount} words). 1000+ words recommended for ranking.`;
  } else if (wordCount <= 2500) {
    contentScore = 15;
    contentStatus = 'good';
    contentMessage = `Good content length (${wordCount} words)`;
  } else {
    contentScore = 15;
    contentStatus = 'good';
    contentMessage = `Comprehensive content (${wordCount} words). Ensure quality over quantity.`;
  }

  checks.push({
    name: 'Content Length',
    score: contentScore,
    maxScore: 15,
    status: contentStatus,
    message: contentMessage,
  });

  // 6. Keyword Density Check (10 points) - only if keyword provided
  let keywordScore = 10; // Default full score if no keyword provided
  let keywordStatus: 'good' | 'warning' | 'error' = 'good';
  let keywordMessage = 'No target keyword specified';

  if (targetKeyword && targetKeyword.trim()) {
    const keyword = targetKeyword.toLowerCase().trim();
    const textLower = bodyText.toLowerCase();
    const keywordMatches = (textLower.match(new RegExp(keyword, 'g')) || []).length;
    const density = wordCount > 0 ? (keywordMatches / wordCount) * 100 : 0;

    if (keywordMatches === 0) {
      keywordScore = 0;
      keywordStatus = 'error';
      keywordMessage = `Keyword "${targetKeyword}" not found in content`;
    } else if (density < 0.5) {
      keywordScore = 5;
      keywordStatus = 'warning';
      keywordMessage = `Low keyword density (${density.toFixed(2)}%). Aim for 1-2%.`;
    } else if (density <= 3) {
      keywordScore = 10;
      keywordStatus = 'good';
      keywordMessage = `Good keyword density (${density.toFixed(2)}%)`;
    } else {
      keywordScore = 5;
      keywordStatus = 'warning';
      keywordMessage = `High keyword density (${density.toFixed(2)}%). May appear as keyword stuffing.`;
    }
  }

  checks.push({
    name: 'Keyword Density',
    score: keywordScore,
    maxScore: 10,
    status: keywordStatus,
    message: keywordMessage,
  });

  // 7. Readability Check (10 points)
  const fleschScore = calculateFleschReadingEase(bodyText);
  let readabilityScore = 0;
  let readabilityStatus: 'good' | 'warning' | 'error' = 'error';
  let readabilityMessage = '';

  if (wordCount < 50) {
    readabilityScore = 5;
    readabilityStatus = 'warning';
    readabilityMessage = 'Not enough content to accurately measure readability';
  } else if (fleschScore >= 60) {
    readabilityScore = 10;
    readabilityStatus = 'good';
    readabilityMessage = `Easy to read (Flesch score: ${fleschScore.toFixed(0)})`;
  } else if (fleschScore >= 40) {
    readabilityScore = 7;
    readabilityStatus = 'warning';
    readabilityMessage = `Moderately difficult (Flesch score: ${fleschScore.toFixed(0)}). Simplify sentences.`;
  } else if (fleschScore >= 20) {
    readabilityScore = 4;
    readabilityStatus = 'warning';
    readabilityMessage = `Difficult to read (Flesch score: ${fleschScore.toFixed(0)}). Use simpler language.`;
  } else {
    readabilityScore = 2;
    readabilityStatus = 'error';
    readabilityMessage = `Very difficult to read (Flesch score: ${fleschScore.toFixed(0)}). Needs simplification.`;
  }

  checks.push({
    name: 'Readability',
    score: readabilityScore,
    maxScore: 10,
    status: readabilityStatus,
    message: readabilityMessage,
  });

  // 8. Internal Links Check (5 points)
  let linksScore = 0;
  let linksStatus: 'good' | 'warning' | 'error' = 'error';
  let linksMessage = '';

  if (!isHTML) {
    linksScore = 5;
    linksStatus = 'good';
    linksMessage = 'Link analysis requires HTML input';
  } else if (internalLinks === 0) {
    linksMessage = 'No internal links found. Add links to other pages on your site.';
    linksStatus = 'error';
  } else if (internalLinks >= 3) {
    linksScore = 5;
    linksStatus = 'good';
    linksMessage = `Good internal linking (${internalLinks} internal links)`;
  } else {
    linksScore = 3;
    linksStatus = 'warning';
    linksMessage = `Few internal links (${internalLinks}). Consider adding more.`;
  }

  checks.push({
    name: 'Internal Links',
    score: linksScore,
    maxScore: 5,
    status: linksStatus,
    message: linksMessage,
  });

  // 9. Image Alt Tags Check (5 points)
  let imageScore = 0;
  let imageStatus: 'good' | 'warning' | 'error' = 'error';
  let imageMessage = '';

  if (!isHTML) {
    imageScore = 5;
    imageStatus = 'good';
    imageMessage = 'Image analysis requires HTML input';
  } else if (totalImages === 0) {
    imageScore = 3;
    imageStatus = 'warning';
    imageMessage = 'No images found. Consider adding relevant images.';
  } else if (imagesWithoutAlt === 0) {
    imageScore = 5;
    imageStatus = 'good';
    imageMessage = `All ${totalImages} images have alt text`;
  } else if (imagesWithoutAlt < totalImages / 2) {
    imageScore = 3;
    imageStatus = 'warning';
    imageMessage = `${imagesWithoutAlt} of ${totalImages} images missing alt text`;
  } else {
    imageScore = 1;
    imageStatus = 'error';
    imageMessage = `${imagesWithoutAlt} of ${totalImages} images missing alt text. Add descriptive alt attributes.`;
  }

  checks.push({
    name: 'Image Alt Tags',
    score: imageScore,
    maxScore: 5,
    status: imageStatus,
    message: imageMessage,
  });

  // 10. External Links Check (5 points)
  let extLinksScore = 0;
  let extLinksStatus: 'good' | 'warning' | 'error' = 'warning';
  let extLinksMessage = '';

  if (!isHTML) {
    extLinksScore = 5;
    extLinksStatus = 'good';
    extLinksMessage = 'External link analysis requires HTML input';
  } else if (externalLinks === 0) {
    extLinksScore = 3;
    extLinksStatus = 'warning';
    extLinksMessage = 'No external links. Consider linking to authoritative sources.';
  } else if (externalLinks >= 1 && externalLinks <= 5) {
    extLinksScore = 5;
    extLinksStatus = 'good';
    extLinksMessage = `Good use of external links (${externalLinks} found)`;
  } else {
    extLinksScore = 4;
    extLinksStatus = 'warning';
    extLinksMessage = `Many external links (${externalLinks}). Ensure they add value.`;
  }

  checks.push({
    name: 'External Links',
    score: extLinksScore,
    maxScore: 5,
    status: extLinksStatus,
    message: extLinksMessage,
  });

  // Calculate totals
  const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
  const maxScore = checks.reduce((sum, check) => sum + check.maxScore, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  return {
    totalScore,
    maxScore,
    percentage,
    checks,
  };
}

// Fetch URL and analyze
export async function fetchAndAnalyze(url: string, targetKeyword?: string): Promise<SEOAnalysisResult> {
  // Use a CORS proxy or direct fetch
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }
  const html = await response.text();
  return analyzeSEO(html, true, targetKeyword);
}
