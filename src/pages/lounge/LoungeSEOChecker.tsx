import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sparkles,
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
  Smartphone,
  Users,
  MapPin,
  Activity,
  Bot,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { analyzeSEO, type SEOAnalysisResult, type SEOCheck } from '@/lib/seoAnalyzer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';

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
      toast.error(inputType === 'content' ? 'Please enter content to analyze' : 'Please enter a URL to analyze');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setScrapedMeta(null);

    try {
      if (inputType === 'url') {
        toast.info('Fetching live page data...');
        
        const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('seo-scrape', {
          body: { url: url.trim() },
        });

        if (scrapeError || !scrapeData?.success) {
          toast.error(scrapeData?.error || scrapeError?.message || 'Failed to fetch URL. Please try again.');
          setIsAnalyzing(false);
          return;
        }

        const html = scrapeData.html as string;
        if (!html || html.length < 50) {
          toast.error('Could not retrieve meaningful content from this URL.');
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
        toast.success('Live analysis complete!');
      } else {
        const isHTML = content.includes('<') && (content.includes('</') || content.includes('/>'));
        const analysisResult = analyzeSEO(content, isHTML, targetKeyword || undefined);
        setResult(analysisResult);
      }
    } catch (error) {
      toast.error('Failed to analyze content. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalytics = async () => {
    if (!analyticsUrl.trim()) {
      toast.error('Please enter a URL to analyze');
      return;
    }

    setIsLoadingAnalytics(true);
    setAnalyticsData(null);

    try {
      toast.info('Fetching page analytics...');

      // Fetch scrape + map in parallel
      const [scrapeRes, mapRes] = await Promise.all([
        supabase.functions.invoke('seo-scrape', { body: { url: analyticsUrl.trim() } }),
        supabase.functions.invoke('seo-scrape', { body: { url: analyticsUrl.trim().replace(/\/$/, '') + '/sitemap.xml' } }).catch(() => null),
      ]);

      const scrapeData = scrapeRes.data;
      const scrapeError = scrapeRes.error;

      if (scrapeError || !scrapeData?.success) {
        toast.error(scrapeData?.error || scrapeError?.message || 'Failed to fetch URL.');
        return;
      }

      const html = scrapeData.html as string;
      if (!html || html.length < 50) {
        toast.error('Could not retrieve meaningful content from this URL.');
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
      toast.success('Analytics loaded!');
    } catch (error) {
      toast.error('Failed to fetch analytics.');
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

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreGradient = (percentage: number) => {
    if (percentage >= 80) return 'from-green-500 to-emerald-400';
    if (percentage >= 60) return 'from-yellow-500 to-amber-400';
    return 'from-red-500 to-rose-400';
  };

  const getStatusIcon = (status: SEOCheck['status']) => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: SEOCheck['status']) => {
    switch (status) {
      case 'good':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Good</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Needs Work</Badge>;
      case 'error':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Missing</Badge>;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const StatCard = ({ icon: Icon, label, value, sub, status }: { icon: any; label: string; value: string | number; sub?: string; status?: 'good' | 'warn' | 'bad' }) => (
    <div className="p-4 rounded-lg border bg-card space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn("text-2xl font-bold", status === 'good' && 'text-green-500', status === 'warn' && 'text-yellow-500', status === 'bad' && 'text-red-500')}>
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <LoungePageHeader
          title="SEO Checker"
          description="Analyze your content for search engine optimization"
          icon={Search}
        />

        {/* Main Tabs: SEO / Analytics */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'seo' | 'analytics')}>
          <TabsList className="grid w-full grid-cols-2 max-w-sm">
            <TabsTrigger value="seo" className="gap-2">
              <Search className="w-4 h-4" />
              SEO Audit
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-6 mt-6">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content to Analyze</CardTitle>
                <CardDescription>
                  Paste your page content or HTML to get an SEO score
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={inputType} onValueChange={(v) => setInputType(v as 'content' | 'url')}>
                  <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="content" className="gap-2">
                      <FileText className="w-4 h-4" />
                      Paste Content
                    </TabsTrigger>
                    <TabsTrigger value="url" className="gap-2">
                      <Globe className="w-4 h-4" />
                      Enter URL
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-4 mt-4">
                    <Textarea
                      placeholder="Paste your page content or HTML here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      <Info className="w-3 h-3 inline mr-1" />
                      For best results, paste the full HTML of your page including title and meta tags
                    </p>
                  </TabsContent>

                  <TabsContent value="url" className="space-y-4 mt-4">
                    <Input
                      type="url"
                      placeholder="https://example.com/page"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      <Globe className="w-3 h-3 inline mr-1" />
                      We'll fetch the live page content and analyze the real HTML, meta tags, headings, links & images.
                    </p>
                  </TabsContent>
                </Tabs>

                {/* Target Keyword */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    Target Keyword (optional)
                  </label>
                  <Input
                    placeholder="e.g., web design services"
                    value={targetKeyword}
                    onChange={(e) => setTargetKeyword(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                <Button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing}
                  size="lg"
                  className="gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze SEO
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* SEO Results */}
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {scrapedMeta && (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="py-4 flex items-center gap-3">
                        <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{scrapedMeta.title || 'Untitled Page'}</p>
                          <a href={scrapedMeta.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                            {scrapedMeta.sourceUrl}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 shrink-0">Live Data</Badge>
                      </CardContent>
                    </Card>
                  )}

                  {/* Score Overview */}
                  <Card className="overflow-hidden">
                    <div className={cn("h-2 bg-gradient-to-r", getScoreGradient(result.percentage))} />
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative">
                          <svg className="w-32 h-32 transform -rotate-90">
                            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/20" />
                            <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={`${result.percentage * 3.52} 352`} strokeLinecap="round" className={getScoreColor(result.percentage)} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={cn("text-4xl font-bold", getScoreColor(result.percentage))}>{result.percentage}</span>
                            <span className="text-sm text-muted-foreground">/ 100</span>
                          </div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <h3 className="text-xl font-semibold mb-2">
                            {result.percentage >= 80 ? 'Great SEO Score!' : result.percentage >= 60 ? 'Good, But Can Improve' : 'Needs Significant Work'}
                          </h3>
                          <p className="text-muted-foreground mb-4">
                            {result.percentage >= 80 ? 'Your content is well-optimized for search engines.' : result.percentage >= 60 ? 'Your content has a solid foundation but could use some improvements.' : 'There are several areas that need attention to improve search visibility.'}
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                            <Badge variant="outline" className="gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />{result.checks.filter(c => c.status === 'good').length} Good</Badge>
                            <Badge variant="outline" className="gap-1"><AlertCircle className="w-3 h-3 text-yellow-500" />{result.checks.filter(c => c.status === 'warning').length} Warnings</Badge>
                            <Badge variant="outline" className="gap-1"><XCircle className="w-3 h-3 text-red-500" />{result.checks.filter(c => c.status === 'error').length} Issues</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detailed Checks */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Detailed Analysis</CardTitle>
                      <CardDescription>Click on each item for more details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {result.checks.map((check) => (
                        <Collapsible key={check.name} open={expandedChecks.has(check.name)} onOpenChange={() => toggleCheck(check.name)}>
                          <CollapsibleTrigger asChild>
                            <motion.div
                              whileHover={{ scale: 1.005 }}
                              whileTap={{ scale: 0.995 }}
                              className={cn(
                                "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
                                check.status === 'good' && "border-green-500/20 bg-green-500/5 hover:bg-green-500/10",
                                check.status === 'warning' && "border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10",
                                check.status === 'error' && "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                              )}
                            >
                              {getStatusIcon(check.status)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">{check.name}</span>
                                  {getStatusBadge(check.status)}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{check.message}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium">{check.score}/{check.maxScore}</span>
                                <Progress value={(check.score / check.maxScore) * 100} className="w-16 h-2" />
                                {expandedChecks.has(check.name) ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                              </div>
                            </motion.div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-2 ml-9 p-4 rounded-lg bg-muted/30 border border-border/50">
                              <p className="text-sm">{check.message}</p>
                              {check.details && (
                                <div className="mt-2 p-2 rounded bg-background/50 border border-border/30">
                                  <p className="text-xs text-muted-foreground font-mono break-all">{check.details}</p>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Tips */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2"><Info className="w-5 h-5 text-primary" />SEO Tips</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />Keep your title under 60 characters and include your main keyword</li>
                        <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />Write a compelling meta description between 150-160 characters</li>
                        <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />Use only one H1 tag per page and include your main topic</li>
                        <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />Add descriptive alt text to all images for accessibility and SEO</li>
                        <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />Aim for at least 500 words of quality content per page</li>
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Page Analytics</CardTitle>
                <CardDescription>Enter a URL to get a full breakdown of the page's content, structure, technologies, and metadata.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={analyticsUrl}
                    onChange={(e) => setAnalyticsUrl(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalytics()}
                  />
                  <Button onClick={handleAnalytics} disabled={isLoadingAnalytics} className="gap-2 shrink-0">
                    {isLoadingAnalytics ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                    {isLoadingAnalytics ? 'Loading...' : 'Analyze'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <AnimatePresence mode="wait">
              {analyticsData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Page Info */}
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="py-4 flex items-center gap-3">
                      <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{analyticsData.title || 'Untitled Page'}</p>
                        <a href={analyticsData.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                          {analyticsData.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20 shrink-0">Live Data</Badge>
                    </CardContent>
                  </Card>

                  {/* Overview Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={Type} label="Word Count" value={analyticsData.wordCount.toLocaleString()} sub={`${analyticsData.charCount.toLocaleString()} characters`} status={analyticsData.wordCount >= 500 ? 'good' : analyticsData.wordCount >= 200 ? 'warn' : 'bad'} />
                    <StatCard icon={Link2} label="Total Links" value={analyticsData.links.total} sub={`${analyticsData.links.internal} internal · ${analyticsData.links.external} external`} />
                    <StatCard icon={Image} label="Images" value={analyticsData.images.total} sub={`${analyticsData.images.withAlt} with alt · ${analyticsData.images.withoutAlt} without`} status={analyticsData.images.withoutAlt === 0 ? 'good' : 'warn'} />
                    <StatCard icon={FileCode} label="Page Size" value={formatBytes(analyticsData.htmlSize)} sub={`${analyticsData.scriptCount} scripts · ${analyticsData.stylesheetCount} stylesheets`} status={analyticsData.htmlSize < 200000 ? 'good' : 'warn'} />
                  </div>


                  {/* Technical Checks */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2"><Code2 className="w-5 h-5 text-primary" />Technical Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: 'Viewport Meta', ok: analyticsData.hasViewport },
                          { label: 'Canonical Tag', ok: analyticsData.hasCanonical },
                          { label: 'Favicon', ok: analyticsData.hasFavicon },
                          { label: 'Structured Data', ok: analyticsData.hasStructuredData },
                          { label: 'Language Attribute', ok: !!analyticsData.languageAttr },
                          { label: 'Charset', ok: !!analyticsData.charset },
                          { label: 'Single H1', ok: analyticsData.h1Count === 1 },
                          { label: 'Meta Description', ok: !!analyticsData.description },
                        ].map(item => (
                          <div key={item.label} className={cn("flex items-center gap-2 p-3 rounded-lg border", item.ok ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5")}>
                            {item.ok ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                            <span className="text-sm font-medium">{item.label}</span>
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
                    </CardContent>
                  </Card>

                  {/* Technologies */}
                  {analyticsData.technologies.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Code2 className="w-5 h-5 text-primary" />Technologies Detected</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {analyticsData.technologies.map(tech => (
                            <Badge key={tech} variant="secondary" className="text-sm">{tech}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Social / OG Tags */}
                  {analyticsData.socialTags.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Share2 className="w-5 h-5 text-primary" />Social & Open Graph Tags</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analyticsData.socialTags.map((tag, i) => (
                            <div key={i} className="flex gap-3 p-2 rounded bg-muted/30 text-sm">
                              <span className="font-mono text-xs text-muted-foreground shrink-0 w-40 truncate">{tag.property}</span>
                              <span className="text-foreground break-all">{tag.content}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Headings Structure */}
                  {analyticsData.headings.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Hash className="w-5 h-5 text-primary" />Heading Structure</CardTitle>
                        <CardDescription>{analyticsData.headings.length} headings found</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                          {analyticsData.headings.map((h, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm" style={{ paddingLeft: `${(parseInt(h.tag.replace('h', '')) - 1) * 16}px` }}>
                              <Badge variant="outline" className="text-xs font-mono shrink-0">{h.tag}</Badge>
                              <span className="truncate">{h.text}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Structured Data */}
                  {analyticsData.structuredDataTypes.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><FileCode className="w-5 h-5 text-primary" />Structured Data (JSON-LD)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {analyticsData.structuredDataTypes.map((type, i) => (
                            <Badge key={i} variant="outline">{type}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Meta Tags */}
                  {analyticsData.meta.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Info className="w-5 h-5 text-primary" />Meta Tags</CardTitle>
                        <CardDescription>{analyticsData.meta.length} meta tags found</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {analyticsData.meta.map((m, i) => (
                            <div key={i} className="flex gap-3 p-2 rounded bg-muted/30 text-sm">
                              <span className="font-mono text-xs text-muted-foreground shrink-0 w-40 truncate">{m.name}</span>
                              <span className="text-foreground break-all">{m.content}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Page Composition */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Page Composition</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        {[
                          { label: 'Scripts', value: analyticsData.scriptCount },
                          { label: 'Stylesheets', value: analyticsData.stylesheetCount },
                          { label: 'Inline Styles', value: analyticsData.inlineStyleCount },
                          { label: 'iFrames', value: analyticsData.iframeCount },
                          { label: 'Forms', value: analyticsData.formCount },
                          { label: 'H1 Tags', value: analyticsData.h1Count },
                          { label: 'Images', value: analyticsData.images.total },
                          { label: 'Links', value: analyticsData.links.total },
                        ].map(item => (
                          <div key={item.label} className="p-3 rounded-lg border bg-card">
                            <p className="text-2xl font-bold">{item.value}</p>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
