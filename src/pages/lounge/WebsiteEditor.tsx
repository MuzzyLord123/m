import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { usePortalHome } from '@/hooks/usePortalHome';
import { supabase } from '@/integrations/supabase/client';
import { EditorProvider } from '@/components/designer/EditorContext';
import { EditorTopBar } from '@/components/designer/EditorTopBar';
import { EditorLeftPanel } from '@/components/designer/EditorLeftPanel';
import { EditorRightPanel } from '@/components/designer/EditorRightPanel';
import { EditorCanvas } from '@/components/designer/EditorCanvas';
import { EditorStatusBar } from '@/components/designer/EditorStatusBar';
import { KeyboardShortcutsModal } from '@/components/designer/KeyboardShortcutsModal';
import { PreviewModal } from '@/components/designer/PreviewModal';
import { ContextMenu } from '@/components/designer/ContextMenu';
import { ExportCodeDialog } from '@/components/designer/ExportCodeDialog';
import { CSSPreviewDialog } from '@/components/designer/CSSPreviewDialog';

import { AICopilot } from '@/components/designer/AICopilot';
import { CommandPalette } from '@/components/designer/CommandPalette';
import { PublishDashboard } from '@/components/designer/PublishDashboard';
import { useExportWrapper } from '@/components/designer/useExportWrapper';
import { useSitePublish } from '@/hooks/useSitePublish';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

import { useMediaQuery } from '@/hooks/use-mobile';
import { DesktopOnlyMessage } from '@/components/DesktopOnlyMessage';
import { ExitSplash } from '@/components/splash/ExitSplash';
import { SaveToFilesDialog } from '@/components/files/SaveToFilesDialog';
import { useSaveToFiles } from '@/components/files/useSaveToFiles';
import { PlannerMode } from '@/components/designer/planner/PlannerModeSwitcher';
import { SitemapPlanner } from '@/components/designer/planner/SitemapPlanner';
import { WireframeViewer } from '@/components/designer/planner/WireframeViewer';
import { StyleGuideEditor } from '@/components/designer/planner/StyleGuideEditor';
import { DesignOverview } from '@/components/designer/planner/DesignOverview';

export default function WebsiteEditor() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const portalHome = usePortalHome();
  const isSmallScreen = useMediaQuery('(max-width: 1024px)');
  const [siteName, setSiteName] = useState('Untitled Site');
  const [pageId, setPageId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportCodeOpen, setExportCodeOpen] = useState(false);
  const [cssPreviewOpen, setCSSPreviewOpen] = useState(false);
  
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showExitSplash, setShowExitSplash] = useState(false);
  const [plannerMode, setPlannerMode] = useState<PlannerMode>('editor');
  const [publishDashboardOpen, setPublishDashboardOpen] = useState(false);
  const { publish: deploySite, publishing } = useSitePublish(siteId);
  const { openSaveDialog, saveDialogProps } = useSaveToFiles();

  useEffect(() => {
    if (!siteId) { navigate('/lounge/website-designer'); return; }

    const load = async () => {
      const { data: site } = await supabase
        .from('designer_sites')
        .select('site_name')
        .eq('id', siteId)
        .single();
      if (site) setSiteName(site.site_name);

      const { data: pages } = await supabase
        .from('designer_pages')
        .select('id')
        .eq('site_id', siteId)
        .order('sort_order', { ascending: true })
        .limit(1);

      if (pages && pages.length > 0) {
        setPageId(pages[0].id);
      }
      setLoading(false);
    };

    load();
  }, [siteId, navigate]);

  if (loading) {
    return (
      <div className="studio h-screen w-screen flex flex-col overflow-hidden">
        {/* Skeleton top bar */}
        <div className="h-12 flex items-center px-3 gap-3 shrink-0" style={{ backgroundColor: 'hsl(var(--studio-panel))', borderBottom: '1px solid hsl(var(--studio-line))' }}>
          <div className="w-6 h-6 rounded-md animate-pulse" style={{ backgroundColor: 'hsl(var(--studio-raised))' }} />
          <div className="w-px h-4" style={{ backgroundColor: 'hsl(var(--studio-raised))' }} />
          <div className="w-24 h-4 rounded animate-pulse" style={{ backgroundColor: 'hsl(var(--studio-raised))' }} />
          <div className="flex-1" />
          <div className="flex gap-1.5">
            {[56, 56, 56].map((w, i) => (
              <div key={i} className="h-7 rounded-md animate-pulse" style={{ width: w, backgroundColor: 'hsl(var(--studio-raised))', animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
          <div className="flex-1" />
          <div className="w-20 h-7 rounded-lg animate-pulse" style={{ backgroundColor: '#1a3a5c' }} />
        </div>
        {/* Skeleton body */}
        <div className="flex flex-1">
          {/* Left panel skeleton */}
          <div className="w-[220px] shrink-0 p-3 space-y-3" style={{ backgroundColor: '#161616', borderRight: '1px solid hsl(var(--studio-line))' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 rounded-lg animate-pulse" style={{ backgroundColor: 'hsl(var(--studio-panel))', animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
          {/* Canvas skeleton */}
          <div className="flex-1 flex items-start justify-center pt-16" style={{ backgroundColor: 'hsl(var(--studio-panel))' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-[600px] rounded-xl overflow-hidden" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))' }}>
                <div className="h-10 animate-pulse" style={{ backgroundColor: '#282828' }} />
                <div className="p-6 space-y-4">
                  <div className="h-6 w-3/4 rounded animate-pulse" style={{ backgroundColor: 'hsl(var(--studio-raised))' }} />
                  <div className="h-4 w-1/2 rounded animate-pulse" style={{ backgroundColor: 'hsl(var(--studio-raised))', animationDelay: '100ms' }} />
                  <div className="h-32 rounded-lg animate-pulse" style={{ backgroundColor: 'hsl(var(--studio-raised))', animationDelay: '200ms' }} />
                  <div className="flex gap-3">
                    <div className="h-8 w-24 rounded-lg animate-pulse" style={{ backgroundColor: '#1a3a5c', animationDelay: '300ms' }} />
                    <div className="h-8 w-20 rounded-lg animate-pulse" style={{ backgroundColor: 'hsl(var(--studio-raised))', animationDelay: '350ms' }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-5 h-5 border-2 border-[hsl(var(--studio-line))] border-t-[hsl(var(--studio-accent))] rounded-full animate-spin" />
                <span className="text-[hsl(var(--studio-ink-3))] text-[11px] font-medium tracking-wide">Preparing canvas…</span>
              </div>
            </div>
          </div>
          {/* Right panel skeleton */}
          <div className="w-[280px] shrink-0 p-3 space-y-3" style={{ backgroundColor: '#161616', borderLeft: '1px solid hsl(var(--studio-line))' }}>
            <div className="h-5 w-16 rounded animate-pulse" style={{ backgroundColor: 'hsl(var(--studio-raised))' }} />
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-7 rounded-lg animate-pulse" style={{ backgroundColor: 'hsl(var(--studio-panel))', animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        </div>
        {/* Skeleton status bar */}
        <div className="h-7 flex items-center px-3 gap-2" style={{ backgroundColor: '#0c0c0c', borderTop: '1px solid hsl(var(--studio-line))' }}>
          <div className="w-32 h-3 rounded animate-pulse" style={{ backgroundColor: 'hsl(var(--studio-panel))' }} />
          <div className="flex-1" />
          <div className="w-16 h-3 rounded animate-pulse" style={{ backgroundColor: 'hsl(var(--studio-panel))' }} />
        </div>
      </div>
    );
  }

  if (isSmallScreen) {
    return <DesktopOnlyMessage feature="Workshop Editor" backPath="/lounge/website-designer" />;
  }

  if (showExitSplash) {
    return <ExitSplash moduleName="Workshop" onComplete={() => navigate(portalHome, { state: { skipSplash: true } })} />;
  }


  const handleSaveToFiles = () => {
    openSaveDialog({
      fileName: siteName,
      fileType: 'website',
      appSource: 'workshop',
      sourceId: siteId,
      sourceRoute: `/lounge/website-editor/${siteId}`,
      description: `Website project: ${siteName}`,
      metadata: { pageId },
    });
  };

  return (
    <EditorProvider pageId={pageId}>
      <motion.div
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="studio h-screen w-screen flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'hsl(var(--studio-panel))',
          color: 'hsl(var(--studio-ink))',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: '12px',
        }}
      >
        <EditorTopBarWrapper
          siteName={siteName}
          siteId={siteId}
          onPreview={() => setPreviewOpen(true)}
          onExportCode={() => setExportCodeOpen(true)}
          onCSSPreview={() => setCSSPreviewOpen(true)}
          onShortcuts={() => setShortcutsOpen(true)}
          onExit={() => setShowExitSplash(true)}
          onSaveToFiles={handleSaveToFiles}
          onPublish={() => setPublishDashboardOpen(true)}
          plannerMode={plannerMode}
          onPlannerModeChange={setPlannerMode}
        />

        {/* Planner views */}
        {plannerMode === 'sitemap' && <SitemapPlanner siteId={siteId} />}
        {plannerMode === 'wireframe' && <WireframeViewer siteId={siteId} />}
        {plannerMode === 'style-guide' && <StyleGuideEditor siteId={siteId} />}
        {plannerMode === 'design' && <DesignOverview siteId={siteId} />}

        {/* Editor view */}
        {plannerMode === 'editor' && (
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={28} minSize={24} maxSize={34}>
            <EditorLeftPanel siteId={siteId} />
          </ResizablePanel>
          <ResizableHandle className="w-[1px] bg-[hsl(var(--studio-raised))] hover:bg-[hsl(var(--studio-accent))] transition-colors" />
          <ResizablePanel defaultSize={58}>
            <div className="flex flex-col h-full relative">
              <EditorCanvas />
              {/* A second floating toolbar used to sit at the bottom of the
                  canvas duplicating the contextual one attached to the
                  selection - two bars competing over the same work, each
                  hiding part of it. The selection's own toolbar is the one
                  that belongs, because it is anchored to what you clicked. */}
              <CommandPalette />
              <EditorStatusBar />
            </div>
          </ResizablePanel>
          <ResizableHandle className="w-[1px] bg-[hsl(var(--studio-raised))] hover:bg-[hsl(var(--studio-accent))] transition-colors" />
          <ResizablePanel defaultSize={26} minSize={18} maxSize={35}>
            <EditorRightPanel siteId={siteId} />
          </ResizablePanel>
        </ResizablePanelGroup>
        )}
        <PreviewModal open={previewOpen} onOpenChange={setPreviewOpen} siteName={siteName} siteId={siteId} />
        <ContextMenu />
        <ExportCodeDialog open={exportCodeOpen} onClose={() => setExportCodeOpen(false)} siteName={siteName} siteId={siteId} />
        <CSSPreviewDialog open={cssPreviewOpen} onClose={() => setCSSPreviewOpen(false)} />
        <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
        <AICopilot siteId={siteId} siteName={siteName} />
        <SaveToFilesDialog {...saveDialogProps} />
        {siteId && (
          <PublishDashboard
            siteId={siteId}
            siteName={siteName}
            isOpen={publishDashboardOpen}
            onClose={() => setPublishDashboardOpen(false)}
            onPublish={async () => {
              // Fetch all pages for this site
              const { data: pages } = await supabase
                .from('designer_pages')
                .select('page_name, slug, is_homepage, elements, seo_title, seo_description, page_settings')
                .eq('site_id', siteId)
                .order('sort_order');
              if (pages && pages.length > 0) {
                await deploySite(siteName, pages as any);
              }
            }}
          />
        )}
      </motion.div>
    </EditorProvider>
  );
}

function EditorTopBarWrapper({ siteName, siteId, onPreview, onExportCode, onCSSPreview, onShortcuts, onExit, onSaveToFiles, onPublish, plannerMode, onPlannerModeChange }: {
  siteName: string; siteId?: string; onPreview: () => void; onExportCode: () => void; onCSSPreview: () => void; onShortcuts: () => void; onExit?: () => void; onSaveToFiles?: () => void; onPublish?: () => void; plannerMode?: PlannerMode; onPlannerModeChange?: (mode: PlannerMode) => void;
}) {
  const { downloadExport } = useExportWrapper(siteName);
  return (
    <EditorTopBar
      siteName={siteName}
      siteId={siteId}
      onExport={downloadExport}
      onPreview={onPreview}
      onExportCode={onExportCode}
      onCSSPreview={onCSSPreview}
      onShortcuts={onShortcuts}
      onExit={onExit}
      onSaveToFiles={onSaveToFiles}
      onSaveToDevice={downloadExport}
      onPublish={onPublish}
      plannerMode={plannerMode}
      onPlannerModeChange={onPlannerModeChange}
    />
  );
}
