import { useState } from 'react';
import {
  Search,
  FileText,
  Globe,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp,
  Target,
  ExternalLink,
  BarChart3,
  Link2,
  Image,
  Share2,
  Code2,
  Clock,
  FileCode,
  Hash,
  Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { analyzeSEO, type SEOAnalysisResult, type SEOCheck } from '@/lib/seoAnalyzer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  PageHeader,
  Panel,
  PanelHeader,
  StatusBadge,
  FIELD,
  FIELD_LABEL,
  FIELD_HELP,
} from '@/components/platform';

interface PopularitySignals {
  totalPages: number;
  externalBacklinks: number;
  socialProfiles: string[];
  hasSitemap: boolean;
  hasRobotsTxt: boolean;
  trackingTools: string[];
  thirdPartyIntegrations: string[];
}

interface AnalyticsData {
  url: string;
  title: string;
  description: string;
  wordCount: number;
  charCount: number;
  headings: { tag: string; text: string }[];
  images: { total: number; withAlt: number; withoutAlt: number };
  links: { total: number; internal: number; external: number; urls: string[] };
  meta: { name: string; content: string }[];
  socialTags: { property: string; content: string }[];
  technologies: string[];
  hasViewport: boolean;
  hasCanonical: boolean;
  canonicalUrl: string;
  hasFavicon: boolean;
  hasStructuredData: boolean;
  structuredDataTypes: string[];
  htmlSize: number;
  scriptCount: number;
  stylesheetCount: number;
  inlineStyleCount: number;
  iframeCount: number;
  formCount: number;
  h1Count: number;
  languageAttr: string;
  charset: string;
  robotsMeta: string;
  popularity?: PopularitySignals;
}

function extractAnalytics(html: string, sourceUrl: string, metadata: any, links: string[], popularityOverrides?: Partial<PopularitySignals>): AnalyticsData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const title = doc.querySelector('title')?.textContent || metadata?.title || '';
  const descriptionEl = doc.querySelector('meta[name="description"]');
  const description = descriptionEl?.getAttribute('content') || metadata?.description || '';

  const bodyText = doc.body?.textContent || '';
  const wordCount = bodyText.trim().split(/\s+/).filter(Boolean).length;
  const charCount = bodyText.trim().length;

  // Headings
  const headings: { tag: string; text: string }[] = [];
  doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
    headings.push({ tag: h.tagName.toLowerCase(), text: (h.textContent || '').trim().slice(0, 100) });
  });

  // Images
  const allImages = doc.querySelectorAll('img');
  const withAlt = Array.from(allImages).filter(img => img.getAttribute('alt')?.trim()).length;

  // Links
  let domain = '';
  try { domain = new URL(sourceUrl).hostname; } catch {}
  const allLinks = doc.querySelectorAll('a[href]');
  let internalCount = 0;
  let externalCount = 0;
  const linkUrls: string[] = [];
  allLinks.forEach(a => {
    const href = a.getAttribute('href') || '';
    linkUrls.push(href);
    if (href.startsWith('/') || href.startsWith('#') || href.includes(domain)) {
      internalCount++;
    } else if (href.startsWith('http')) {
      externalCount++;
    }
  });

  // Meta tags
  const metaTags: { name: string; content: string }[] = [];
  doc.querySelectorAll('meta[name]').forEach(m => {
    const name = m.getAttribute('name') || '';
    const content = m.getAttribute('content') || '';
    if (name && content) metaTags.push({ name, content: content.slice(0, 200) });
  });

  // Social / OG tags
  const socialTags: { property: string; content: string }[] = [];
  doc.querySelectorAll('meta[property^="og:"], meta[property^="twitter:"], meta[name^="twitter:"]').forEach(m => {
    const prop = m.getAttribute('property') || m.getAttribute('name') || '';
    const content = m.getAttribute('content') || '';
    if (prop && content) socialTags.push({ property: prop, content: content.slice(0, 200) });
  });

  // Technology detection
  const technologies: string[] = [];
  const htmlStr = html.toLowerCase();
  if (htmlStr.includes('react') || htmlStr.includes('__next') || htmlStr.includes('_next/static')) technologies.push('React');
  if (htmlStr.includes('__next') || htmlStr.includes('_next/')) technologies.push('Next.js');
  if (htmlStr.includes('vue') || htmlStr.includes('__vue')) technologies.push('Vue.js');
  if (htmlStr.includes('angular') || htmlStr.includes('ng-')) technologies.push('Angular');
  if (htmlStr.includes('wordpress') || htmlStr.includes('wp-content')) technologies.push('WordPress');
  if (htmlStr.includes('shopify') || htmlStr.includes('cdn.shopify')) technologies.push('Shopify');
  if (htmlStr.includes('wix.com')) technologies.push('Wix');
  if (htmlStr.includes('squarespace')) technologies.push('Squarespace');
  if (htmlStr.includes('bootstrap')) technologies.push('Bootstrap');
  if (htmlStr.includes('tailwind') || htmlStr.includes('tailwindcss')) technologies.push('Tailwind CSS');
  if (htmlStr.includes('jquery') || htmlStr.includes('jquery.min')) technologies.push('jQuery');
  if (htmlStr.includes('google-analytics') || htmlStr.includes('gtag') || htmlStr.includes('ga(')) technologies.push('Google Analytics');
  if (htmlStr.includes('googletagmanager')) technologies.push('Google Tag Manager');
  if (htmlStr.includes('fbq(') || htmlStr.includes('facebook.net')) technologies.push('Facebook Pixel');
  if (htmlStr.includes('hotjar')) technologies.push('Hotjar');
  if (htmlStr.includes('intercom')) technologies.push('Intercom');
  if (htmlStr.includes('crisp') || htmlStr.includes('crisp.chat')) technologies.push('Crisp');
  if (htmlStr.includes('cloudflare')) technologies.push('Cloudflare');
  if (htmlStr.includes('stripe')) technologies.push('Stripe');

  // Viewport
  const hasViewport = !!doc.querySelector('meta[name="viewport"]');

  // Canonical
  const canonicalEl = doc.querySelector('link[rel="canonical"]');
  const hasCanonical = !!canonicalEl;
  const canonicalUrl = canonicalEl?.getAttribute('href') || '';

  // Favicon
  const hasFavicon = !!doc.querySelector('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');

  // Structured data
  const structuredDataScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const structuredDataTypes: string[] = [];
  structuredDataScripts.forEach(s => {
    try {
      const data = JSON.parse(s.textContent || '');
      if (data['@type']) structuredDataTypes.push(data['@type']);
      if (Array.isArray(data['@graph'])) {
        data['@graph'].forEach((item: any) => { if (item['@type']) structuredDataTypes.push(item['@type']); });
      }
    } catch {}
  });

  // Counts
  const scriptCount = doc.querySelectorAll('script').length;
  const stylesheetCount = doc.querySelectorAll('link[rel="stylesheet"]').length;
  const inlineStyleCount = doc.querySelectorAll('[style]').length;
  const iframeCount = doc.querySelectorAll('iframe').length;
  const formCount = doc.querySelectorAll('form').length;
  const h1Count = doc.querySelectorAll('h1').length;

  // Language
  const languageAttr = doc.documentElement?.getAttribute('lang') || '';
  const charsetEl = doc.querySelector('meta[charset]');
  const charset = charsetEl?.getAttribute('charset') || '';

  // Robots
  const robotsEl = doc.querySelector('meta[name="robots"]');
  const robotsMeta = robotsEl?.getAttribute('content') || '';

  // Popularity signals from HTML
  const socialPlatforms = ['facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'tiktok.com', 'pinterest.com', 'github.com'];
  const socialProfiles: string[] = [];
  const allHrefs = Array.from(allLinks).map(a => a.getAttribute('href') || '');
  socialPlatforms.forEach(platform => {
    const found = allHrefs.find(href => href.includes(platform));
    if (found) socialProfiles.push(platform.replace('.com', '').replace('x', 'X/Twitter'));
  });

  const trackingTools: string[] = [];
  if (htmlStr.includes('google-analytics') || htmlStr.includes('gtag')) trackingTools.push('Google Analytics');
  if (htmlStr.includes('googletagmanager')) trackingTools.push('Google Tag Manager');
  if (htmlStr.includes('fbq(')) trackingTools.push('Facebook Pixel');
  if (htmlStr.includes('hotjar')) trackingTools.push('Hotjar');
  if (htmlStr.includes('clarity.ms')) trackingTools.push('Microsoft Clarity');
  if (htmlStr.includes('plausible')) trackingTools.push('Plausible');
  if (htmlStr.includes('matomo') || htmlStr.includes('piwik')) trackingTools.push('Matomo');
  if (htmlStr.includes('mixpanel')) trackingTools.push('Mixpanel');
  if (htmlStr.includes('segment.com') || htmlStr.includes('analytics.js')) trackingTools.push('Segment');
  if (htmlStr.includes('hubspot')) trackingTools.push('HubSpot');

  const thirdPartyIntegrations: string[] = [];
  if (htmlStr.includes('stripe')) thirdPartyIntegrations.push('Stripe');
  if (htmlStr.includes('intercom')) thirdPartyIntegrations.push('Intercom');
  if (htmlStr.includes('crisp')) thirdPartyIntegrations.push('Crisp');
  if (htmlStr.includes('zendesk')) thirdPartyIntegrations.push('Zendesk');
  if (htmlStr.includes('drift')) thirdPartyIntegrations.push('Drift');
  if (htmlStr.includes('mailchimp')) thirdPartyIntegrations.push('Mailchimp');
  if (htmlStr.includes('recaptcha')) thirdPartyIntegrations.push('reCAPTCHA');
  if (htmlStr.includes('cloudflare')) thirdPartyIntegrations.push('Cloudflare');

  return {
    url: sourceUrl,
    title,
    description,
    wordCount,
    charCount,
    headings,
    images: { total: allImages.length, withAlt, withoutAlt: allImages.length - withAlt },
    links: { total: allLinks.length, internal: internalCount, external: externalCount, urls: (links || []).slice(0, 50) },
    meta: metaTags,
    socialTags,
    technologies: [...new Set(technologies)],
    hasViewport,
    hasCanonical,
    canonicalUrl,
    hasFavicon,
    hasStructuredData: structuredDataScripts.length > 0,
    structuredDataTypes: [...new Set(structuredDataTypes)],
    htmlSize: new Blob([html]).size,
    scriptCount,
    stylesheetCount,
    inlineStyleCount,
    iframeCount,
    formCount,
    h1Count,
    languageAttr,
    charset,
    robotsMeta,
    popularity: {
      totalPages: popularityOverrides?.totalPages || 0,
      externalBacklinks: externalCount,
      socialProfiles: [...new Set(socialProfiles)],
      hasSitemap: popularityOverrides?.hasSitemap || false,
      hasRobotsTxt: popularityOverrides?.hasRobotsTxt || false,
      trackingTools: [...new Set(trackingTools)],
      thirdPartyIntegrations: [...new Set(thirdPartyIntegrations)],
    },
  };
}

export default function LoungeSEOChecker() {
  const [mainTab, setMainTab] = useState<'seo' | 'analytics'>('seo');
  const [inputType, setInputType] = useState<'content' | 'url'>('content');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SEOAnalysisResult | null>(null);
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());
  const [scrapedMeta, setScrapedMeta] = useState<{ title?: string; description?: string; sourceUrl?: string } | null>(null);

  // Analytics state
  const [analyticsUrl, setAnalyticsUrl] = useState('');
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const handleAnalyze = async () => {
    const inputValue = inputType === 'content' ? content : url;

    if (!inputValue.trim()) {
      toast.error(inputType === 'content' ? 'Enter some content to analyse first' : 'Enter a URL to analyse first');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setScrapedMeta(null);

    try {
      if (inputType === 'url') {
        toast.info('Fetching live page data');

        const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('seo-scrape', {
          body: { url: url.trim() },
        });

        if (scrapeError || !scrapeData?.success) {
          toast.error(scrapeData?.error || scrapeError?.message || 'That URL could not be fetched. Check the address and try again.');
          setIsAnalyzing(false);
          return;
        }

        const html = scrapeData.html as string;
        if (!html || html.length < 50) {
          toast.error('No meaningful content came back from this URL.');
          setIsAnalyzing(false);
          return;
        }

        setScrapedMeta({
          title: scrapeData.metadata?.title,
          description: scrapeData.metadata?.description,
          sourceUrl: scrapeData.sourceUrl,
        });

        const analysisResult = analyzeSEO(html, true, targetKeyword || undefined);
        setResult(analysisResult);
        toast.success('Live analysis complete');
      } else {
        const isHTML = content.includes('<') && (content.includes('</') || content.includes('/>'));
        const analysisResult = analyzeSEO(content, isHTML, targetKeyword || undefined);
        setResult(analysisResult);
      }
    } catch (error) {
      toast.error('The analysis did not finish. Try again in a moment.');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalytics = async () => {
    if (!analyticsUrl.trim()) {
      toast.error('Enter a URL to analyse first');
      return;
    }

    setIsLoadingAnalytics(true);
    setAnalyticsData(null);

    try {
      toast.info('Fetching page analytics');

      // Fetch scrape + map in parallel
      const [scrapeRes, mapRes] = await Promise.all([
        supabase.functions.invoke('seo-scrape', { body: { url: analyticsUrl.trim() } }),
        supabase.functions.invoke('seo-scrape', { body: { url: analyticsUrl.trim().replace(/\/$/, '') + '/sitemap.xml' } }).catch(() => null),
      ]);

      const scrapeData = scrapeRes.data;
      const scrapeError = scrapeRes.error;

      if (scrapeError || !scrapeData?.success) {
        toast.error(scrapeData?.error || scrapeError?.message || 'That URL could not be fetched.');
        return;
      }

      const html = scrapeData.html as string;
      if (!html || html.length < 50) {
        toast.error('No meaningful content came back from this URL.');
        return;
      }

      // Try to detect total pages from links array
      const allLinks: string[] = scrapeData.links || [];
      let baseHost = '';
      try { baseHost = new URL(scrapeData.sourceUrl).hostname; } catch {}
      const internalPages = allLinks.filter(l => {
        try { return new URL(l).hostname === baseHost; } catch { return false; }
      });
      const totalPages = Math.max(internalPages.length, 1);

      // Check if sitemap exists
      const hasSitemap = !!(mapRes?.data?.success && mapRes?.data?.html && mapRes.data.html.includes('<urlset'));

      // Check robots.txt
      let hasRobotsTxt = false;
      try {
        const robotsRes = await supabase.functions.invoke('seo-scrape', { body: { url: analyticsUrl.trim().replace(/\/$/, '') + '/robots.txt' } });
        hasRobotsTxt = !!(robotsRes.data?.success && robotsRes.data?.html && (robotsRes.data.html.includes('User-agent') || robotsRes.data.html.includes('user-agent')));
      } catch {}

      const data = extractAnalytics(html, scrapeData.sourceUrl, scrapeData.metadata, scrapeData.links, {
        totalPages,
        hasSitemap,
        hasRobotsTxt,
      });
      setAnalyticsData(data);
      toast.success('Analytics loaded');
    } catch (error) {
      toast.error('The analytics fetch did not finish. Try again in a moment.');
      console.error('Analytics error:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const toggleCheck = (checkName: string) => {
    const newExpanded = new Set(expandedChecks);
    if (newExpanded.has(checkName)) {
      newExpanded.delete(checkName);
    } else {
      newExpanded.add(checkName);
    }
    setExpandedChecks(newExpanded);
  };

  const getScoreTone = (percentage: number) => {
    if (percentage >= 80) return 'text-ok';
    if (percentage >= 60) return 'text-attend';
    return 'text-risk';
  };

  const getScoreBar = (percentage: number) => {
    if (percentage >= 80) return 'bg-ok';
    if (percentage >= 60) return 'bg-attend';
    return 'bg-risk';
  };

  const getStatusIcon = (status: SEOCheck['status']) => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="w-4 h-4 text-ok" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-attend" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-risk" />;
    }
  };

  const getStatusBadge = (status: SEOCheck['status']) => {
    switch (status) {
      case 'good':
        return <StatusBadge tone="ok" label="Good" />;
      case 'warning':
        return <StatusBadge tone="attend" label="Needs work" />;
      case 'error':
        return <StatusBadge tone="risk" label="Missing" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const StatCard = ({ icon: Icon, label, value, sub, status }: { icon: any; label: string; value: string | number; sub?: string; status?: 'good' | 'warn' | 'bad' }) => (
    <div className="space-y-1 rounded-[10px] border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.13em]">{label}</span>
      </div>
      <p className={cn('text-xl font-semibold tabular-nums', status === 'good' && 'text-ok', status === 'warn' && 'text-attend', status === 'bad' && 'text-risk')}>
        {value}
      </p>
      {sub && <p className="text-xs tabular-nums text-muted-foreground">{sub}</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
      <PageHeader
        kicker="Tools"
        title="SEO checker"
        description="Analyse your content for search engine optimisation."
      />

      {/* Main tabs: SEO / Analytics */}
      <div className="mt-6">
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'seo' | 'analytics')}>
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="seo" className="gap-2">
              <Search className="w-4 h-4" />
              SEO audit
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* SEO tab */}
          <TabsContent value="seo" className="space-y-5 mt-6">
            {/* Input */}
            <Panel>
              <PanelHeader label="Content to analyse" />
              <div className="space-y-4 p-4">
                <Tabs value={inputType} onValueChange={(v) => setInputType(v as 'content' | 'url')}>
                  <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="content" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Paste content
                    </TabsTrigger>
                    <TabsTrigger value="url" className="gap-2">
                      <Globe className="w-4 h-4" />
                      Enter URL
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-2 mt-4">
                    <span className={cn(FIELD_LABEL, 'block')}>Page content</span>
                    <Textarea
                      placeholder="Paste your page content or HTML here"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[200px] rounded-xl border-border/60 bg-foreground/[0.03] font-mono text-sm shadow-none transition-all duration-200 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-foreground/[0.05]"
                    />
                    <p className={FIELD_HELP}>
                      For best results, paste the full HTML of your page including the title and meta tags.
                    </p>
                  </TabsContent>

                  <TabsContent value="url" className="space-y-2 mt-4">
                    <span className={cn(FIELD_LABEL, 'block')}>Page URL</span>
                    <Input
                      type="url"
                      placeholder="https://example.com/page"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className={FIELD}
                    />
                    <p className={FIELD_HELP}>
                      We fetch the live page and analyse the real HTML, meta tags, headings, links and images.
                    </p>
                  </TabsContent>
                </Tabs>

                {/* Target keyword */}
                <div className="space-y-2">
                  <span className={cn(FIELD_LABEL, 'flex items-center gap-1.5')}>
                    <Target className="h-3 w-3" />
                    Target keyword (optional)
                  </span>
                  <Input
                    placeholder="e.g. web design services"
                    value={targetKeyword}
                    onChange={(e) => setTargetKeyword(e.target.value)}
                    className={cn(FIELD, 'max-w-md')}
                  />
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analysing
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Analyse SEO
                    </>
                  )}
                </Button>
              </div>
            </Panel>

            {/* SEO results */}
            {result && (
              <div className="space-y-5">
                  {scrapedMeta && (
                    <Panel>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{scrapedMeta.title || 'Untitled page'}</p>
                          <a href={scrapedMeta.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 flex items-center gap-1">
                            {scrapedMeta.sourceUrl}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <StatusBadge tone="ok" label="Live data" className="shrink-0" />
                      </div>
                    </Panel>
                  )}

                  {/* Score overview */}
                  <Panel className="overflow-hidden">
                    <div className={cn('h-0.5', getScoreBar(result.percentage))} />
                    <div className="p-5">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative">
                          <svg className="w-32 h-32 transform -rotate-90">
                            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="6" fill="none" className="text-border/60" />
                            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="6" fill="none" strokeDasharray={`${result.percentage * 3.52} 352`} strokeLinecap="round" className={getScoreTone(result.percentage)} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={cn('text-3xl font-semibold tabular-nums', getScoreTone(result.percentage))}>{result.percentage}</span>
                            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">/ 100</span>
                          </div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <h3 className="text-[15px] font-semibold mb-1.5">
                            {result.percentage >= 80 ? 'A strong SEO score' : result.percentage >= 60 ? 'Good, with room to improve' : 'Needs significant work'}
                          </h3>
                          <p className="text-[13px] text-muted-foreground mb-4">
                            {result.percentage >= 80 ? 'Your content is well optimised for search engines.' : result.percentage >= 60 ? 'Your content has a solid foundation but could use some improvements.' : 'Several areas need attention to improve search visibility.'}
                          </p>
                          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <StatusBadge tone="ok" label={`${result.checks.filter(c => c.status === 'good').length} good`} />
                            <StatusBadge tone="attend" label={`${result.checks.filter(c => c.status === 'warning').length} warnings`} />
                            <StatusBadge tone="risk" label={`${result.checks.filter(c => c.status === 'error').length} issues`} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Panel>

                  {/* Detailed checks */}
                  <Panel>
                    <PanelHeader label="Detailed analysis">
                      <span className="text-[11px] text-muted-foreground">Select an item for detail</span>
                    </PanelHeader>
                    <div>
                      {result.checks.map((check) => (
                        <Collapsible key={check.name} open={expandedChecks.has(check.name)} onOpenChange={() => toggleCheck(check.name)}>
                          <CollapsibleTrigger asChild>
                            <div className="flex cursor-pointer items-center gap-3 border-t border-border/60 px-4 py-3 transition-colors duration-150 first:border-t-0 hover:bg-foreground/[0.025]">
                              {getStatusIcon(check.status)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <span className="text-[13px] font-medium">{check.name}</span>
                                  {getStatusBadge(check.status)}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{check.message}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-xs tabular-nums">{check.score}/{check.maxScore}</span>
                                <Progress value={(check.score / check.maxScore) * 100} className="w-16 h-2" />
                                {expandedChecks.has(check.name) ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="border-t border-border/60 bg-sunken px-4 py-3 pl-11">
                              <p className="text-[13px]">{check.message}</p>
                              {check.details && (
                                <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{check.details}</p>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </Panel>

                  {/* Tips */}
                  <Panel>
                    <PanelHeader label="SEO tips" />
                    <ul className="space-y-2.5 p-4 text-[13px] text-muted-foreground">
                      <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-ok mt-0.5 flex-shrink-0" />Keep your title under 60 characters and include your main keyword</li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-ok mt-0.5 flex-shrink-0" />Write a compelling meta description between 150 and 160 characters</li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-ok mt-0.5 flex-shrink-0" />Use only one H1 tag per page and include your main topic</li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-ok mt-0.5 flex-shrink-0" />Add descriptive alt text to all images for accessibility and SEO</li>
                      <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-ok mt-0.5 flex-shrink-0" />Aim for at least 500 words of quality content per page</li>
                    </ul>
                  </Panel>
              </div>
            )}
          </TabsContent>

          {/* Analytics tab */}
          <TabsContent value="analytics" className="space-y-5 mt-6">
            <Panel>
              <PanelHeader label="Page analytics" />
              <div className="space-y-3 p-4">
                <p className="text-[13px] text-muted-foreground">
                  Enter a URL for a full breakdown of the page's content, structure, technologies and metadata.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={analyticsUrl}
                    onChange={(e) => setAnalyticsUrl(e.target.value)}
                    className={cn(FIELD, 'flex-1')}
                    aria-label="Page URL"
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalytics()}
                  />
                  <Button onClick={handleAnalytics} disabled={isLoadingAnalytics} className="gap-2 shrink-0">
                    {isLoadingAnalytics ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                    {isLoadingAnalytics ? 'Loading' : 'Analyse'}
                  </Button>
                </div>
              </div>
            </Panel>

            {analyticsData && (
              <div className="space-y-5">
                  {/* Page info */}
                  <Panel>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{analyticsData.title || 'Untitled page'}</p>
                        <a href={analyticsData.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 flex items-center gap-1">
                          {analyticsData.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <StatusBadge tone="ok" label="Live data" className="shrink-0" />
                    </div>
                  </Panel>

                  {/* Overview stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={Type} label="Word Count" value={analyticsData.wordCount.toLocaleString()} sub={`${analyticsData.charCount.toLocaleString()} characters`} status={analyticsData.wordCount >= 500 ? 'good' : analyticsData.wordCount >= 200 ? 'warn' : 'bad'} />
                    <StatCard icon={Link2} label="Total Links" value={analyticsData.links.total} sub={`${analyticsData.links.internal} internal · ${analyticsData.links.external} external`} />
                    <StatCard icon={Image} label="Images" value={analyticsData.images.total} sub={`${analyticsData.images.withAlt} with alt · ${analyticsData.images.withoutAlt} without`} status={analyticsData.images.withoutAlt === 0 ? 'good' : 'warn'} />
                    <StatCard icon={FileCode} label="Page Size" value={formatBytes(analyticsData.htmlSize)} sub={`${analyticsData.scriptCount} scripts · ${analyticsData.stylesheetCount} stylesheets`} status={analyticsData.htmlSize < 200000 ? 'good' : 'warn'} />
                  </div>


                  {/* Technical checks */}
                  <Panel>
                    <PanelHeader label="Technical overview" />
                    <div className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { label: 'Viewport meta', ok: analyticsData.hasViewport },
                          { label: 'Canonical tag', ok: analyticsData.hasCanonical },
                          { label: 'Favicon', ok: analyticsData.hasFavicon },
                          { label: 'Structured data', ok: analyticsData.hasStructuredData },
                          { label: 'Language attribute', ok: !!analyticsData.languageAttr },
                          { label: 'Charset', ok: !!analyticsData.charset },
                          { label: 'Single H1', ok: analyticsData.h1Count === 1 },
                          { label: 'Meta description', ok: !!analyticsData.description },
                        ].map(item => (
                          <div key={item.label} className="flex items-center gap-2 rounded-lg border border-border/60 p-2.5">
                            {item.ok ? <CheckCircle2 className="w-4 h-4 text-ok" /> : <XCircle className="w-4 h-4 text-risk" />}
                            <span className="text-[13px] font-medium">{item.label}</span>
                          </div>
                        ))}
                      </div>
                      {analyticsData.canonicalUrl && (
                        <p className="mt-3 text-xs text-muted-foreground"><span className="font-medium">Canonical:</span> {analyticsData.canonicalUrl}</p>
                      )}
                      {analyticsData.robotsMeta && (
                        <p className="mt-1 text-xs text-muted-foreground"><span className="font-medium">Robots:</span> {analyticsData.robotsMeta}</p>
                      )}
                      {analyticsData.languageAttr && (
                        <p className="mt-1 text-xs text-muted-foreground"><span className="font-medium">Language:</span> {analyticsData.languageAttr}</p>
                      )}
                    </div>
                  </Panel>

                  {/* Technologies */}
                  {analyticsData.technologies.length > 0 && (
                    <Panel>
                      <PanelHeader label="Technologies detected" />
                      <div className="flex flex-wrap gap-2 p-4">
                        {analyticsData.technologies.map(tech => (
                          <span key={tech} className="rounded-md border border-border/60 bg-foreground/[0.03] px-2 py-0.5 text-xs text-foreground">{tech}</span>
                        ))}
                      </div>
                    </Panel>
                  )}

                  {/* Social / OG tags */}
                  {analyticsData.socialTags.length > 0 && (
                    <Panel>
                      <PanelHeader label="Social and Open Graph tags" />
                      <div className="space-y-1.5 p-4">
                        {analyticsData.socialTags.map((tag, i) => (
                          <div key={i} className="flex gap-3 rounded-md bg-sunken p-2 text-sm">
                            <span className="w-40 shrink-0 truncate font-mono text-xs text-muted-foreground">{tag.property}</span>
                            <span className="break-all text-[13px] text-foreground">{tag.content}</span>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  )}

                  {/* Heading structure */}
                  {analyticsData.headings.length > 0 && (
                    <Panel>
                      <PanelHeader label="Heading structure">
                        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                          {analyticsData.headings.length} found
                        </span>
                      </PanelHeader>
                      <div className="max-h-64 space-y-1 overflow-y-auto p-4">
                        {analyticsData.headings.map((h, i) => (
                          <div key={i} className="flex items-center gap-2 text-[13px]" style={{ paddingLeft: `${(parseInt(h.tag.replace('h', '')) - 1) * 16}px` }}>
                            <span className="shrink-0 rounded border border-border/60 px-1 font-mono text-[10px] text-muted-foreground">{h.tag}</span>
                            <span className="truncate">{h.text}</span>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  )}

                  {/* Structured data */}
                  {analyticsData.structuredDataTypes.length > 0 && (
                    <Panel>
                      <PanelHeader label="Structured data (JSON-LD)" />
                      <div className="flex flex-wrap gap-2 p-4">
                        {analyticsData.structuredDataTypes.map((type, i) => (
                          <span key={i} className="rounded-md border border-border/60 px-2 py-0.5 text-xs text-foreground">{type}</span>
                        ))}
                      </div>
                    </Panel>
                  )}

                  {/* Meta tags */}
                  {analyticsData.meta.length > 0 && (
                    <Panel>
                      <PanelHeader label="Meta tags">
                        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                          {analyticsData.meta.length} found
                        </span>
                      </PanelHeader>
                      <div className="max-h-64 space-y-1.5 overflow-y-auto p-4">
                        {analyticsData.meta.map((m, i) => (
                          <div key={i} className="flex gap-3 rounded-md bg-sunken p-2 text-sm">
                            <span className="w-40 shrink-0 truncate font-mono text-xs text-muted-foreground">{m.name}</span>
                            <span className="break-all text-[13px] text-foreground">{m.content}</span>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  )}

                  {/* Page composition */}
                  <Panel>
                    <PanelHeader label="Page composition" />
                    <div className="grid grid-cols-2 gap-2 p-4 text-center sm:grid-cols-4">
                      {[
                        { label: 'Scripts', value: analyticsData.scriptCount },
                        { label: 'Stylesheets', value: analyticsData.stylesheetCount },
                        { label: 'Inline styles', value: analyticsData.inlineStyleCount },
                        { label: 'iFrames', value: analyticsData.iframeCount },
                        { label: 'Forms', value: analyticsData.formCount },
                        { label: 'H1 tags', value: analyticsData.h1Count },
                        { label: 'Images', value: analyticsData.images.total },
                        { label: 'Links', value: analyticsData.links.total },
                      ].map(item => (
                        <div key={item.label} className="rounded-lg border border-border/60 p-3">
                          <p className="text-lg font-semibold tabular-nums">{item.value}</p>
                          <p className="font-mono text-[9.5px] uppercase tracking-[0.13em] text-muted-foreground">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </Panel>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
