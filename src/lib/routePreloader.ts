// Route chunk preloader — maps paths to their lazy import functions
// Call preload(path) on mouseEnter/focus to warm the chunk cache

const routeImportMap: Record<string, () => Promise<unknown>> = {
  // Public website pages
  '/packages': () => import('@/pages/Packages'),
  '/starter': () => import('@/pages/Starter'),
  '/growth': () => import('@/pages/Growth'),
  '/professional': () => import('@/pages/Professional'),
  '/enterprise': () => import('@/pages/Enterprise'),
  '/custom-elite': () => import('@/pages/CustomElite'),
  '/social-media': () => import('@/pages/SocialMedia'),
  '/ad-management': () => import('@/pages/AdManagement'),
  '/account-management': () => import('@/pages/AccountManagement'),
  '/content-creation': () => import('@/pages/ContentCreation'),
  '/seo-strategy': () => import('@/pages/SeoStrategy'),
  '/get-started': () => import('@/pages/GetStarted'),
  '/portfolio': () => import('@/pages/Portfolio'),
  '/comparison': () => import('@/pages/Comparison'),
  '/success-stories': () => import('@/pages/SuccessStories'),
  '/timelines': () => import('@/pages/Timelines'),
  '/features': () => import('@/pages/Features'),
  '/ownership': () => import('@/pages/Ownership'),
  '/add-ons': () => import('@/pages/AddOns'),
  '/client-portal': () => import('@/pages/ClientPortal'),
  '/apps-dashboards': () => import('@/pages/AppsDashboards'),
  '/handover': () => import('@/pages/Handover'),
  '/workshop': () => import('@/pages/workshop/WorkshopLanding'),
  '/workshop/features': () => import('@/pages/workshop/WorkshopFeatures'),
  '/workshop/guide': () => import('@/pages/workshop/WorkshopGuide'),
  '/preview-portfolio': () => import('@/pages/PreviewPortfolio'),
  '/preview-process': () => import('@/pages/PreviewProcess'),
  '/preview-pricing': () => import('@/pages/PreviewPricing'),
  '/preview-faq': () => import('@/pages/PreviewFAQ'),
  '/support': () => import('@/pages/Support'),
  '/website-management': () => import('@/pages/WebsiteManagement'),
  '/sla': () => import('@/pages/ServiceLevelAgreement'),
  '/business-startup': () => import('@/pages/BusinessStartup'),
  '/subscription-websites': () => import('@/pages/SubscriptionWebsites'),
  '/ecommerce': () => import('@/pages/Ecommerce'),
  '/asset-storage': () => import('@/pages/AssetStorage'),
  '/sign-in': () => import('@/pages/SignInSelect'),
  '/privacy-policy': () => import('@/pages/PrivacyPolicy'),
  '/cookie-policy': () => import('@/pages/CookiePolicy'),
  '/trust-center': () => import('@/pages/TrustCenter'),
  '/terms-of-service': () => import('@/pages/TermsOfService'),
  '/pricing': () => import('@/pages/Pricing'),
  // Lounge pages
  '/lounge': () => import('@/pages/lounge/LoungeOverview'),
  '/lounge/ai': () => import('@/pages/lounge/LoungeAI'),
  '/lounge/tickets': () => import('@/pages/lounge/LoungeTickets'),
  '/lounge/team': () => import('@/pages/lounge/LoungeTeam'),
  '/lounge/website': () => import('@/pages/lounge/LoungeWebsiteManagement'),
  '/lounge/website-designer': () => import('@/pages/lounge/LoungeWebsiteDesigner'),
  '/lounge/apps': () => import('@/pages/lounge/LoungeAppProjects'),
  '/lounge/products': () => import('@/pages/lounge/LoungeProducts'),
  '/lounge/seo-checker': () => import('@/pages/lounge/LoungeSEOChecker'),
  '/lounge/ads': () => import('@/pages/lounge/LoungeAdManagement'),
  '/lounge/social': () => import('@/pages/lounge/LoungeSocialMedia'),
  '/lounge/content': () => import('@/pages/lounge/LoungeContentRequests'),
  '/lounge/calendar': () => import('@/pages/lounge/LoungeCalendar'),
  '/lounge/marketing-calendar': () => import('@/pages/lounge/LoungeMarketingCalendar'),
  '/lounge/uploads': () => import('@/pages/lounge/LoungeUploads'),
  '/lounge/assets': () => import('@/pages/lounge/LoungeAssetStorage'),
  '/lounge/vault': () => import('@/pages/lounge/LoungeVault'),
  '/lounge/mail': () => import('@/pages/lounge/LoungeMail'),
  '/lounge/messages': () => import('@/pages/lounge/LoungeMessages'),
  '/lounge/settings': () => import('@/pages/lounge/LoungeSettings'),
  '/lounge/billing': () => import('@/pages/lounge/LoungeBilling'),
  '/lounge/team-comms': () => import('@/pages/lounge/LoungeTeamComms'),
  '/lounge/workflows': () => import('@/pages/lounge/LoungeWorkflows'),
  '/lounge/notifications': () => import('@/pages/lounge/LoungeNotifications'),
  '/lounge/inventory': () => import('@/pages/lounge/LoungeInventory'),
  '/lounge/office': () => import('@/pages/lounge/LoungeOffice'),
  '/lounge/crm': () => import('@/pages/lounge/crm/CRMShell'),
  '/lounge/ai-builder': () => import('@/pages/lounge/LoungeAIBuilder'),
};

const preloaded = new Set<string>();

export function preloadRoute(path: string) {
  if (preloaded.has(path)) return;
  const loader = routeImportMap[path];
  if (loader) {
    preloaded.add(path);
    loader();
  }
}
