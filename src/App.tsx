import { lazy, Suspense, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TeamGuard } from "@/components/guards/TeamGuard";
import { CustomerGuard } from "@/components/guards/CustomerGuard";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CookieConsent } from "@/components/CookieConsent";
import { GuidedTour } from "@/components/GuidedTour";
import { PageTransition } from "@/components/PageTransition";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/PageLoader";
import { GlobalCursorProvider } from "@/components/GlobalCursorProvider";
import { SplashScreen } from "@/components/SplashScreen";
import { RemindersProvider } from "@/hooks/useReminders";

// Eagerly load the landing page for best FCP
import Index from "./pages/Index";

// Lazy load all other pages
const Packages = lazy(() => import("./pages/Packages"));
const Starter = lazy(() => import("./pages/Starter"));
const Growth = lazy(() => import("./pages/Growth"));
const StoreCheckout = lazy(() => import("./pages/StoreCheckout"));
const Professional = lazy(() => import("./pages/Professional"));
const Enterprise = lazy(() => import("./pages/Enterprise"));
const CustomElite = lazy(() => import("./pages/CustomElite"));
const SocialMedia = lazy(() => import("./pages/SocialMedia"));
const AdManagement = lazy(() => import("./pages/AdManagement"));
const AccountManagement = lazy(() => import("./pages/AccountManagement"));
const ContentCreation = lazy(() => import("./pages/ContentCreation"));
const SeoStrategy = lazy(() => import("./pages/SeoStrategy"));
const QuooroOffice = lazy(() => import("./pages/QuooroOffice"));
const GetStarted = lazy(() => import("./pages/GetStarted"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const LocalCafeLanding = lazy(() => import("./pages/portfolio/LocalCafeLanding"));
const ConsultingFirm = lazy(() => import("./pages/portfolio/ConsultingFirm"));
const FashionEcommerce = lazy(() => import("./pages/portfolio/FashionEcommerce"));
const SaaSPlatform = lazy(() => import("./pages/portfolio/SaaSPlatform"));
const HealthcarePortal = lazy(() => import("./pages/portfolio/HealthcarePortal"));
const FreelancerPortfolio = lazy(() => import("./pages/portfolio/FreelancerPortfolio"));
const Comparison = lazy(() => import("./pages/Comparison"));
const SuccessStories = lazy(() => import("./pages/SuccessStories"));
const Timelines = lazy(() => import("./pages/Timelines"));
const Features = lazy(() => import("./pages/Features"));
const Ownership = lazy(() => import("./pages/Ownership"));
const AddOns = lazy(() => import("./pages/AddOns"));
const PreviewPortfolio = lazy(() => import("./pages/PreviewPortfolio"));
const PreviewProcess = lazy(() => import("./pages/PreviewProcess"));
const PreviewPricing = lazy(() => import("./pages/PreviewPricing"));
const PreviewGuarantee = lazy(() => import("./pages/PreviewGuarantee"));
const PreviewStories = lazy(() => import("./pages/PreviewStories"));
const PreviewFAQ = lazy(() => import("./pages/PreviewFAQ"));
const Support = lazy(() => import("./pages/Support"));
const Login = lazy(() => import("./pages/Login"));
const SignInSelect = lazy(() => import("./pages/SignInSelect"));
const CustomerLogin = lazy(() => import("./pages/CustomerLogin"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const TrustCenter = lazy(() => import("./pages/TrustCenter"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const WebsiteManagement = lazy(() => import("./pages/WebsiteManagement"));
const ServiceLevelAgreement = lazy(() => import("./pages/ServiceLevelAgreement"));
const BusinessStartup = lazy(() => import("./pages/BusinessStartup"));
const SubscriptionWebsites = lazy(() => import("./pages/SubscriptionWebsites"));
const SubscriptionWebsitesPage = lazy(() => import("./pages/SubscriptionWebsitesPage"));
const HostedWebsitesPage = lazy(() => import("./pages/HostedWebsitesPage"));
const Ecommerce = lazy(() => import("./pages/Ecommerce"));
const AppsDashboards = lazy(() => import("./pages/AppsDashboards"));
const Handover = lazy(() => import("./pages/Handover"));
const AssetStorage = lazy(() => import("./pages/AssetStorage"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const Verify2FA = lazy(() => import("./pages/Verify2FA"));
const VerifyNewIP = lazy(() => import("./pages/VerifyNewIP"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const CheckEmail = lazy(() => import("./pages/CheckEmail"));
const Pricing = lazy(() => import("./pages/Pricing"));
const WorkshopLanding = lazy(() => import("./pages/workshop/WorkshopLanding"));
const WorkshopFeatures = lazy(() => import("./pages/workshop/WorkshopFeatures"));
const WorkshopGuide = lazy(() => import("./pages/workshop/WorkshopGuide"));

// Lounge pages - lazy loaded
const LoungeLayout = lazy(() => import("./components/lounge/LoungeLayout"));
const LoungeOverview = lazy(() => import("./pages/lounge/LoungeOverview"));
const LoungeSEOChecker = lazy(() => import("./pages/lounge/LoungeSEOChecker"));
const LoungeAdManagement = lazy(() => import("./pages/lounge/LoungeAdManagement"));
const LoungeSocialMedia = lazy(() => import("./pages/lounge/LoungeSocialMedia"));
const LoungeContentRequests = lazy(() => import("./pages/lounge/LoungeContentRequests"));
const LoungeInvoices = lazy(() => import("./pages/lounge/LoungeInvoices"));
const CallCompanion = lazy(() => import("./pages/CallCompanion"));
const LoungeMarketingCalendar = lazy(() => import("./pages/lounge/LoungeMarketingCalendar"));
const LoungeWebsiteManagement = lazy(() => import("./pages/lounge/LoungeWebsiteManagement"));
const LoungeWebsiteDesigner = lazy(() => import("./pages/lounge/LoungeWebsiteDesigner"));
const LoungeUploads = lazy(() => import("./pages/lounge/LoungeUploads"));
const LoungeAssetStorage = lazy(() => import("./pages/lounge/LoungeAssetStorage"));
const LoungeMessages = lazy(() => import("./pages/lounge/LoungeMessages"));
const LoungeSettings = lazy(() => import("./pages/lounge/LoungeSettings"));
const LoungeBilling = lazy(() => import("./pages/lounge/LoungeBilling"));
const LoungeTeam = lazy(() => import("./pages/lounge/LoungeTeam"));
const LoungeTeamComms = lazy(() => import("./pages/lounge/LoungeTeamComms"));
const LoungeAppProjects = lazy(() => import("./pages/lounge/LoungeAppProjects"));
const LoungeAI = lazy(() => import("./pages/lounge/LoungeAI"));
const LoungeTickets = lazy(() => import("./pages/lounge/LoungeTickets"));
const WebsiteEditor = lazy(() => import("./pages/lounge/WebsiteEditor"));
const SiteSettingsPage = lazy(() => import("./pages/lounge/SiteSettingsPage"));
const AdminMarketingSiteIndex = lazy(() => import("./pages/admin/AdminMarketingSiteIndex"));
const AdminMarketingHero = lazy(() => import("./pages/admin/AdminMarketingHero"));
const AdminMarketingProcess = lazy(() => import("./pages/admin/AdminMarketingProcess"));
const AdminMarketingWhy = lazy(() => import("./pages/admin/AdminMarketingWhy"));
const AdminMarketingHeaders = lazy(() => import("./pages/admin/AdminMarketingHeaders"));
const AdminMarketingBuilder = lazy(() => import("./pages/admin/AdminMarketingBuilder"));
const AdminMarketingVisualEditor = lazy(() => import("./pages/admin/AdminMarketingVisualEditor"));
const AdminMarketingWorkshop = lazy(() => import("./pages/admin/AdminMarketingWorkshop"));
const LoungeWorkshop = lazy(() => import("./pages/lounge/LoungeWorkshop"));
const LoungeProducts = lazy(() => import("./pages/lounge/LoungeProducts"));
const LoungeCRM = lazy(() => import("./pages/lounge/LoungeCRM"));
const CRMShell = lazy(() => import("./pages/lounge/crm/CRMShell"));
const AdminManagement = lazy(() => import("./pages/admin/AdminManagement"));
const LoungeAIBuilder = lazy(() => import("./pages/lounge/LoungeAIBuilder"));
const LoungeWorkflows = lazy(() => import("./pages/lounge/LoungeWorkflows"));
const LoungeCalendar = lazy(() => import("./pages/lounge/LoungeCalendar"));
const GoogleCalendarCallback = lazy(() => import("./pages/lounge/GoogleCalendarCallback"));
const LoungeNotifications = lazy(() => import("./pages/lounge/LoungeNotifications"));
const LoungeCADStudio = lazy(() => import("./pages/lounge/LoungeCADStudio"));
const LoungeCADEditor = lazy(() => import("./pages/lounge/LoungeCADEditor"));
const LoungeInventory = lazy(() => import("./pages/lounge/LoungeInventory"));
const LoungeOffice = lazy(() => import("./pages/lounge/LoungeOffice"));
const LoungeWordEditor = lazy(() => import("./pages/lounge/LoungeWordEditor"));
const OfficeWordHome = lazy(() => import("./pages/lounge/OfficeWordHome"));
const OfficeExcelHome = lazy(() => import("./pages/lounge/OfficeExcelHome"));
const SheetsHomeDash = lazy(() => import("./pages/lounge/SheetsHomeDash"));
const OfficePowerPointHome = lazy(() => import("./pages/lounge/OfficePowerPointHome"));
const SlidesHome = lazy(() => import("./pages/lounge/SlidesHome"));
const OfficeOneNoteHome = lazy(() => import("./pages/lounge/OfficeOneNoteHome"));
const OfficeOneDrive = lazy(() => import("./pages/lounge/OfficeOneDrive"));
const DesignStudioHome = lazy(() => import("./pages/lounge/DesignStudioHome"));
const DesignStudioEditor = lazy(() => import("./pages/lounge/DesignStudioEditor"));
const DesignStudioProjects = lazy(() => import("./pages/lounge/DesignStudioProjects"));
const DesignStudioTemplates = lazy(() => import("./pages/lounge/DesignStudioTemplates"));
const DesignStudioBrand = lazy(() => import("./pages/lounge/DesignStudioBrand"));
const DesignStudioAI = lazy(() => import("./pages/lounge/DesignStudioAI"));
const CreativePhotoStudio = lazy(() => import("./pages/lounge/CreativePhotoStudio"));
const OfficeWhiteboard = lazy(() => import("./pages/lounge/OfficeWhiteboard"));
const OfficeWhiteboardHome = lazy(() => import("./pages/lounge/OfficeWhiteboardHome"));
const OfficeForms = lazy(() => import("./pages/lounge/OfficeForms"));
const OfficePDF = lazy(() => import("./pages/lounge/OfficePDF"));
const OfficePDFHome = lazy(() => import("./pages/lounge/OfficePDFHome"));
const OfficePDFCreator = lazy(() => import("./pages/lounge/OfficePDFCreator"));
const OfficeTasks = lazy(() => import("./pages/lounge/OfficeTasks"));
const OfficeCalculator = lazy(() => import("./pages/lounge/OfficeCalculator"));
const OfficePomodoro = lazy(() => import("./pages/lounge/OfficePomodoro"));
const OfficePolls = lazy(() => import("./pages/lounge/OfficePolls"));
const OfficeBookmarks = lazy(() => import("./pages/lounge/OfficeBookmarks"));
const OfficeStickyWall = lazy(() => import("./pages/lounge/OfficeStickyWall"));
const OfficeOperations = lazy(() => import("./pages/lounge/OfficeOperations"));
const OfficeAccounting = lazy(() => import("./pages/lounge/OfficeAccounting"));
const OfficeEcommerce = lazy(() => import("./pages/lounge/OfficeEcommerce"));

const AccountantLogin = lazy(() => import("./pages/accountant/AccountantLogin"));
const AccountantAccept = lazy(() => import("./pages/accountant/AccountantAccept"));
const AccountantDashboard = lazy(() => import("./pages/accountant/AccountantDashboard"));
const AccountantOrgView = lazy(() => import("./pages/accountant/AccountantOrgView"));
const OfficeInvoices = lazy(() => import("./pages/lounge/OfficeInvoices"));
const OfficeHR = lazy(() => import("./pages/lounge/OfficeHR"));
const OfficeWiki = lazy(() => import("./pages/lounge/OfficeWiki"));
const OfficePollsHome = lazy(() => import("./pages/lounge/OfficePollsHome"));
const OfficeStickyWallHome = lazy(() => import("./pages/lounge/OfficeStickyWallHome"));
const OfficeFormsHome = lazy(() => import("./pages/lounge/OfficeFormsHome"));
const OfficeAnalyticsStudio = lazy(() => import("./pages/lounge/OfficeAnalyticsStudio"));
const OfficeExpenseManager = lazy(() => import("./pages/lounge/OfficeExpenseManager"));
const OfficeTimeTracker = lazy(() => import("./pages/lounge/OfficeTimeTracker"));
const OfficeContractManager = lazy(() => import("./pages/lounge/OfficeContractManager"));
const OfficePasswordVault = lazy(() => import("./pages/lounge/OfficePasswordVault"));
const LoungeVault = lazy(() => import("./pages/lounge/LoungeVault"));
const LoungeMail = lazy(() => import("./pages/lounge/LoungeMail"));
const WorkshopStudio = lazy(() => import("./pages/lounge/FigmaDesigner"));

const LoungeWhiteLabel = lazy(() => import("./pages/lounge/LoungeWhiteLabel"));
const LoungeAutomationsPro = lazy(() => import("./pages/lounge/LoungeAutomationsPro"));
const LoungePlanner = lazy(() => import("./pages/lounge/LoungePlanner"));
const LoungeBookings = lazy(() => import("./pages/lounge/LoungeBookings"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const DashboardPlanner = lazy(() => import("./pages/DashboardPlanner"));
const ExecutiveDashboard = lazy(() => import("./pages/ExecutiveDashboard"));
const ExecutiveGuard = lazy(() => import("./components/guards/ExecutiveGuard").then(m => ({ default: m.ExecutiveGuard })));

// Optimized QueryClient with caching, dedup, and retry
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

function AnimatedRoutes() {
  const location = useLocation();
  const isLoungeRoute = location.pathname.startsWith('/lounge');
  const isEditorRoute = location.pathname.startsWith('/lounge/editor') || location.pathname.startsWith('/lounge/site-settings') || location.pathname === '/lounge/crm' || location.pathname === '/lounge/ai-builder' || location.pathname.startsWith('/lounge/cad-studio/edit') || location.pathname.startsWith('/lounge/office') || location.pathname.startsWith('/lounge/creative/');
  const routeKey = isEditorRoute ? 'editor' : isLoungeRoute ? 'lounge' : location.pathname;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex flex-col items-center justify-center">
            <div className="relative flex flex-col items-center justify-center">
              <div className="absolute -inset-8 rounded-full bg-primary/25 blur-3xl pulse" />
              <h1
                className="relative z-10 text-5xl sm:text-6xl font-display font-semibold tracking-tight text-foreground"
                style={{ textShadow: "0 0 24px hsl(var(--primary) / 0.45)" }}
              >
                Quooro
              </h1>
            </div>
            <div className="mt-8 w-60 sm:w-72 h-1.5 bg-muted border border-border rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-gradient-primary rounded-full animate-pulse" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Loading Quooro...</p>
          </div>
        }
      >
        <Routes location={location} key={routeKey}>
          <Route path="/" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/checkout" element={<PageTransition><StoreCheckout /></PageTransition>} />
          <Route path="/packages" element={<PageTransition><Packages /></PageTransition>} />
          {/* Additive: Pricing.tsx was imported but never routed; the admin
              visual editor already links to /pricing. */}
          <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
          <Route path="/starter" element={<PageTransition><Starter /></PageTransition>} />
          <Route path="/growth" element={<PageTransition><Growth /></PageTransition>} />
          <Route path="/professional" element={<PageTransition><Professional /></PageTransition>} />
          <Route path="/enterprise" element={<PageTransition><Enterprise /></PageTransition>} />
          <Route path="/custom-elite" element={<PageTransition><CustomElite /></PageTransition>} />
          <Route path="/social-media" element={<PageTransition><SocialMedia /></PageTransition>} />
          <Route path="/ad-management" element={<PageTransition><AdManagement /></PageTransition>} />
          <Route path="/account-management" element={<PageTransition><AccountManagement /></PageTransition>} />
          <Route path="/content-creation" element={<PageTransition><ContentCreation /></PageTransition>} />
          <Route path="/seo-strategy" element={<PageTransition><SeoStrategy /></PageTransition>} />
          <Route path="/quooro-office" element={<PageTransition><QuooroOffice /></PageTransition>} />
          <Route path="/get-started" element={<PageTransition><GetStarted /></PageTransition>} />
          <Route path="/portfolio" element={<PageTransition><Portfolio /></PageTransition>} />
          <Route path="/portfolio/local-cafe-landing" element={<PageTransition><LocalCafeLanding /></PageTransition>} />
          <Route path="/portfolio/consulting-firm" element={<PageTransition><ConsultingFirm /></PageTransition>} />
          <Route path="/portfolio/fashion-ecommerce" element={<PageTransition><FashionEcommerce /></PageTransition>} />
          <Route path="/portfolio/saas-platform" element={<PageTransition><SaaSPlatform /></PageTransition>} />
          <Route path="/portfolio/healthcare-portal" element={<PageTransition><HealthcarePortal /></PageTransition>} />
          <Route path="/portfolio/freelancer-portfolio" element={<PageTransition><FreelancerPortfolio /></PageTransition>} />
          <Route path="/comparison" element={<PageTransition><Comparison /></PageTransition>} />
          <Route path="/success-stories" element={<PageTransition><SuccessStories /></PageTransition>} />
          <Route path="/timelines" element={<PageTransition><Timelines /></PageTransition>} />
          <Route path="/features" element={<PageTransition><Features /></PageTransition>} />
          <Route path="/ownership" element={<PageTransition><Ownership /></PageTransition>} />
          <Route path="/add-ons" element={<PageTransition><AddOns /></PageTransition>} />
          <Route path="/client-portal" element={<PageTransition><ClientPortal /></PageTransition>} />
          <Route path="/apps-dashboards" element={<PageTransition><AppsDashboards /></PageTransition>} />
          <Route path="/asset-storage" element={<PageTransition><AssetStorage /></PageTransition>} />
          <Route path="/handover" element={<PageTransition><Handover /></PageTransition>} />
          <Route path="/workshop" element={<PageTransition><WorkshopLanding /></PageTransition>} />
          <Route path="/workshop/features" element={<PageTransition><WorkshopFeatures /></PageTransition>} />
          <Route path="/workshop/guide" element={<PageTransition><WorkshopGuide /></PageTransition>} />
          <Route path="/preview-portfolio" element={<PageTransition><PreviewPortfolio /></PageTransition>} />
          <Route path="/preview-process" element={<PageTransition><PreviewProcess /></PageTransition>} />
          <Route path="/preview-pricing" element={<PageTransition><PreviewPricing /></PageTransition>} />
          <Route path="/preview-guarantee" element={<PageTransition><PreviewGuarantee /></PageTransition>} />
          <Route path="/preview-stories" element={<PageTransition><PreviewStories /></PageTransition>} />
          <Route path="/preview-faq" element={<PageTransition><PreviewFAQ /></PageTransition>} />
          <Route path="/support" element={<PageTransition><Support /></PageTransition>} />
          <Route path="/sign-in" element={<PageTransition><SignInSelect /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/customer-login" element={<PageTransition><CustomerLogin /></PageTransition>} />
          <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
          <Route path="/verify-email" element={<PageTransition><VerifyEmail /></PageTransition>} />
          <Route path="/check-email" element={<ProtectedRoute><PageTransition><CheckEmail /></PageTransition></ProtectedRoute>} />
          <Route path="/verify-2fa" element={<ProtectedRoute><PageTransition><Verify2FA /></PageTransition></ProtectedRoute>} />
          <Route path="/verify-new-ip" element={<ProtectedRoute><PageTransition><VerifyNewIP /></PageTransition></ProtectedRoute>} />
          <Route path="/unauthorized" element={<PageTransition><Unauthorized /></PageTransition>} />
          
          <Route path="/lounge/editor/:siteId" element={<ProtectedRoute><CustomerGuard><WebsiteEditor /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/site-settings/:siteId" element={<ProtectedRoute><CustomerGuard><SiteSettingsPage /></CustomerGuard></ProtectedRoute>} />
          <Route path="/admin/marketing-site" element={<ProtectedRoute><AdminMarketingSiteIndex /></ProtectedRoute>} />
          <Route path="/admin/marketing-site/hero" element={<ProtectedRoute><AdminMarketingHero /></ProtectedRoute>} />
          <Route path="/admin/marketing-site/process" element={<ProtectedRoute><AdminMarketingProcess /></ProtectedRoute>} />
          <Route path="/admin/marketing-site/why" element={<ProtectedRoute><AdminMarketingWhy /></ProtectedRoute>} />
          <Route path="/admin/marketing-site/headers" element={<ProtectedRoute><AdminMarketingHeaders /></ProtectedRoute>} />
          <Route path="/admin/marketing-site/builder" element={<ProtectedRoute><AdminMarketingBuilder /></ProtectedRoute>} />
          <Route path="/admin/marketing-site/visual-editor" element={<ProtectedRoute><AdminMarketingVisualEditor /></ProtectedRoute>} />
          <Route path="/admin/marketing-site/workshop" element={<ProtectedRoute><AdminMarketingWorkshop /></ProtectedRoute>} />
          <Route path="/admin/marketing-site/workshop/:siteId" element={<ProtectedRoute><AdminMarketingWorkshop /></ProtectedRoute>} />
          <Route path="/lounge/crm" element={<ProtectedRoute><CustomerGuard><CRMShell /></CustomerGuard></ProtectedRoute>} />
          <Route path="/admin/team" element={<Navigate to="/dashboard?tab=account-creation" replace />} />
          <Route path="/call-companion" element={<CallCompanion />} />
          <Route path="/lounge/crm-legacy" element={<ProtectedRoute><CustomerGuard><LoungeCRM /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/ai-builder" element={<ProtectedRoute><CustomerGuard><LoungeAIBuilder /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/cad-studio/edit" element={<ProtectedRoute><CustomerGuard><LoungeCADEditor /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office" element={<ProtectedRoute><CustomerGuard><LoungeOffice /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/word/:docId" element={<ProtectedRoute><CustomerGuard><LoungeWordEditor /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/word-home" element={<ProtectedRoute><CustomerGuard><OfficeWordHome /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/excel-home" element={<ProtectedRoute><CustomerGuard><OfficeExcelHome /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/sheets-home" element={<ProtectedRoute><CustomerGuard><SheetsHomeDash /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/powerpoint-home" element={<ProtectedRoute><CustomerGuard><SlidesHome /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/slides/edit" element={<ProtectedRoute><CustomerGuard><OfficePowerPointHome /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/onenote-home" element={<ProtectedRoute><CustomerGuard><OfficeOneNoteHome /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/onedrive" element={<ProtectedRoute><CustomerGuard><OfficeOneDrive /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/design-studio" element={<ProtectedRoute><CustomerGuard><DesignStudioHome /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/design-studio/editor" element={<ProtectedRoute><CustomerGuard><DesignStudioEditor /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/design-studio/projects" element={<ProtectedRoute><CustomerGuard><DesignStudioProjects /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/design-studio/templates" element={<ProtectedRoute><CustomerGuard><DesignStudioTemplates /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/design-studio/brand" element={<ProtectedRoute><CustomerGuard><DesignStudioBrand /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/design-studio/ai" element={<ProtectedRoute><CustomerGuard><DesignStudioAI /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/whiteboard" element={<ProtectedRoute><CustomerGuard><OfficeWhiteboard /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/whiteboard-home" element={<ProtectedRoute><CustomerGuard><OfficeWhiteboardHome /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/forms" element={<ProtectedRoute><CustomerGuard><OfficeForms /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/pdf" element={<ProtectedRoute><CustomerGuard><OfficePDF /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/pdf-home" element={<ProtectedRoute><CustomerGuard><OfficePDFHome /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/pdf-creator" element={<ProtectedRoute><CustomerGuard><OfficePDFCreator /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/tasks" element={<ProtectedRoute><CustomerGuard><OfficeTasks /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/calculator" element={<ProtectedRoute><CustomerGuard><OfficeCalculator /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/pomodoro" element={<ProtectedRoute><CustomerGuard><OfficePomodoro /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/polls" element={<ProtectedRoute><CustomerGuard><OfficePolls /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/polls-create" element={<ProtectedRoute><CustomerGuard><OfficePolls /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/polls-home" element={<ProtectedRoute><CustomerGuard><OfficePollsHome /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/bookmarks" element={<ProtectedRoute><CustomerGuard><OfficeBookmarks /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/sticky-wall" element={<ProtectedRoute><CustomerGuard><OfficeStickyWall /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/sticky-wall-home" element={<ProtectedRoute><CustomerGuard><OfficeStickyWallHome /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/operations" element={<ProtectedRoute><CustomerGuard><OfficeOperations /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/accounting" element={<ProtectedRoute><CustomerGuard><OfficeAccounting /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/ecommerce" element={<ProtectedRoute><CustomerGuard><OfficeEcommerce /></CustomerGuard></ProtectedRoute>} />

          {/* Accountant portal — separate auth surface, no CustomerGuard, no team layout */}
          <Route path="/accountant" element={<AccountantLogin />} />
          <Route path="/accountant/accept/:token" element={<AccountantAccept />} />
          <Route path="/accountant/dashboard" element={<AccountantDashboard />} />
          <Route path="/accountant/org/:orgId" element={<AccountantOrgView />} />
          <Route path="/lounge/office/invoices" element={<ProtectedRoute><CustomerGuard><OfficeInvoices /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/hr" element={<ProtectedRoute><CustomerGuard><OfficeHR /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/wiki" element={<ProtectedRoute><CustomerGuard><OfficeWiki /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/forms-home" element={<ProtectedRoute><CustomerGuard><OfficeFormsHome /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/analytics" element={<ProtectedRoute><CustomerGuard><OfficeAnalyticsStudio /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/expenses" element={<ProtectedRoute><CustomerGuard><OfficeExpenseManager /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/time-tracker" element={<ProtectedRoute><CustomerGuard><OfficeTimeTracker /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/contracts" element={<ProtectedRoute><CustomerGuard><OfficeContractManager /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/office/passwords" element={<ProtectedRoute><CustomerGuard><OfficePasswordVault /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/creative/photo-studio" element={<ProtectedRoute><CustomerGuard><CreativePhotoStudio /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/workshop-studio" element={<ProtectedRoute><CustomerGuard><WorkshopStudio /></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge/figma-studio" element={<ProtectedRoute><CustomerGuard><WorkshopStudio /></CustomerGuard></ProtectedRoute>} />
          
          <Route path="/customer-dashboard" element={<ProtectedRoute><CustomerGuard><PageTransition><CustomerDashboard /></PageTransition></CustomerGuard></ProtectedRoute>} />
          <Route path="/lounge" element={<ProtectedRoute><CustomerGuard><LoungeLayout /></CustomerGuard></ProtectedRoute>}>
            <Route index element={<LoungeOverview />} />
            <Route path="ai" element={<LoungeAI />} />
            <Route path="tickets" element={<LoungeTickets />} />
            <Route path="team" element={<LoungeTeam />} />
            <Route path="website" element={<LoungeWebsiteManagement />} />
            <Route path="website-designer" element={<LoungeWebsiteDesigner />} />
            <Route path="apps" element={<LoungeAppProjects />} />
            <Route path="products" element={<LoungeProducts />} />
            <Route path="seo-checker" element={<LoungeSEOChecker />} />
            <Route path="ads" element={<LoungeAdManagement />} />
            <Route path="social" element={<LoungeSocialMedia />} />
            <Route path="content" element={<LoungeContentRequests />} />
            <Route path="invoices" element={<LoungeInvoices />} />
            <Route path="calendar" element={<LoungeCalendar />} />
            <Route path="google-calendar-callback" element={<GoogleCalendarCallback />} />
            <Route path="marketing-calendar" element={<LoungeMarketingCalendar />} />
            <Route path="uploads" element={<LoungeUploads />} />
            <Route path="assets" element={<LoungeAssetStorage />} />
            <Route path="vault" element={<LoungeVault />} />
            <Route path="mail" element={<LoungeMail />} />
            <Route path="messages" element={<LoungeMessages />} />
            <Route path="team-comms" element={<LoungeTeamComms />} />
            <Route path="billing" element={<LoungeBilling />} />
            <Route path="settings" element={<LoungeSettings />} />
            <Route path="workflows" element={<LoungeWorkflows />} />
            <Route path="notifications" element={<LoungeNotifications />} />
            <Route path="cad-studio" element={<LoungeCADStudio />} />
            <Route path="inventory" element={<LoungeInventory />} />
            
            <Route path="white-label" element={<LoungeWhiteLabel />} />
            <Route path="automations-pro" element={<LoungeAutomationsPro />} />
            <Route path="planner" element={<LoungePlanner />} />
            <Route path="bookings" element={<LoungeBookings />} />
            
          </Route>

          <Route path="/book/:slug" element={<PageTransition><BookingPage /></PageTransition>} />
          
          <Route path="/dashboard/planner" element={<ProtectedRoute><TeamGuard><PageTransition><DashboardPlanner /></PageTransition></TeamGuard></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><TeamGuard><PageTransition><Dashboard /></PageTransition></TeamGuard></ProtectedRoute>} />
          <Route path="/executive" element={<ProtectedRoute><Suspense fallback={<div className="min-h-screen bg-background" />}><ExecutiveGuard><PageTransition><ExecutiveDashboard /></PageTransition></ExecutiveGuard></Suspense></ProtectedRoute>} />
          <Route path="/team/subscription-websites" element={<ProtectedRoute><TeamGuard><PageTransition><SubscriptionWebsitesPage /></PageTransition></TeamGuard></ProtectedRoute>} />
          <Route path="/team/hosted-websites" element={<ProtectedRoute><TeamGuard><PageTransition><HostedWebsitesPage /></PageTransition></TeamGuard></ProtectedRoute>} />
          
          <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
          <Route path="/cookie-policy" element={<PageTransition><CookiePolicy /></PageTransition>} />
          <Route path="/trust-center" element={<PageTransition><TrustCenter /></PageTransition>} />
          <Route path="/terms-of-service" element={<PageTransition><TermsOfService /></PageTransition>} />
          <Route path="/website-management" element={<PageTransition><WebsiteManagement /></PageTransition>} />
          <Route path="/sla" element={<PageTransition><ServiceLevelAgreement /></PageTransition>} />
          <Route path="/business-startup" element={<PageTransition><BusinessStartup /></PageTransition>} />
          <Route path="/subscription-websites" element={<PageTransition><SubscriptionWebsites /></PageTransition>} />
          <Route path="/ecommerce" element={<PageTransition><Ecommerce /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

const App = () => {
  // Suppress splash when running inside the Visual Editor iframe (?__edit=1)
  const isVisualEditorFrame = typeof window !== "undefined" &&
    window.parent !== window &&
    new URLSearchParams(window.location.search).get("__edit") === "1";
  const [showInitialSplash, setShowInitialSplash] = useState(!isVisualEditorFrame);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrandingProvider>
            <RemindersProvider>
              <TooltipProvider>
                <ErrorBoundary>
                  <GlobalCursorProvider />
                  <Toaster />
                  <Sonner />
                  {showInitialSplash && (
                    <SplashScreen onComplete={() => setShowInitialSplash(false)} />
                  )}
                  <BrowserRouter>
                    <ScrollToTop />
                    <AnimatedRoutes />
                    <CookieConsent />
                    <GuidedTour />
                  </BrowserRouter>
                </ErrorBoundary>
              </TooltipProvider>
            </RemindersProvider>
          </BrandingProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
