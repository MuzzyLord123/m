import { useState } from 'react';
import { useEditor } from './EditorContext';
import { ComponentLibrary } from './ComponentLibrary';
import { LayersPanel } from './LayersPanel';
import { TemplateMarketplace } from './TemplateMarketplace';
import { SectionsLibrary } from './SectionsLibrary';
import { DesignPanel } from './DesignPanel';
import { PagesPanel } from './PagesPanel';
import { VersionHistoryPanel } from './VersionHistoryPanel';
import { EmbedPanel } from './EmbedPanel';
import { CMSPanel } from './CMSPanel';
import { ProductsPanel } from './ProductsPanel';
import { GradientEditor } from './GradientEditor';
import { SEOAudit } from './SEOAudit';
import { InteractionsPanel } from './InteractionsPanel';
import { AdvancedStylePanel } from './AdvancedStylePanel';
import { FormsBuilder } from './FormsBuilder';
import { 
  Layers, LayoutGrid, Store, Blocks, Palette, FileText, History, 
  Code2, Database, ShoppingBag, Sparkles, Search, Zap, PaintBucket, FormInput,
  ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

type LeftTab = 'components' | 'layers' | 'templates' | 'sections' | 'design' | 'pages' | 'history' | 'embed' | 'cms' | 'products' | 'gradient' | 'seo' | 'interactions' | 'styles' | 'forms';

interface EditorLeftPanelProps {
  siteId?: string;
}

const TAB_GROUPS = [
  {
    label: 'Build',
    tabs: [
      { key: 'components', label: 'Add', icon: LayoutGrid, color: 'hsl(var(--studio-accent))', desc: 'Drag elements onto canvas' },
      { key: 'sections', label: 'Sections', icon: Blocks, color: 'hsl(var(--studio-ink-3))', desc: 'Pre-built page sections' },
      { key: 'pages', label: 'Pages', icon: FileText, color: 'hsl(var(--studio-ok))', desc: 'Manage site pages' },
      { key: 'layers', label: 'Layers', icon: Layers, color: 'hsl(var(--studio-warn))', desc: 'Element tree & hierarchy' },
    ],
  },
  {
    label: 'Design',
    tabs: [
      { key: 'interactions', label: 'Interactions', icon: Zap, color: 'hsl(var(--studio-ink-3))', desc: 'Animations & triggers' },
      { key: 'styles', label: 'Styles', icon: PaintBucket, color: 'hsl(var(--studio-ink-3))', desc: 'Advanced CSS properties' },
      { key: 'forms', label: 'Forms', icon: FormInput, color: 'hsl(var(--studio-ink-3))', desc: 'Form builder & logic' },
      { key: 'design', label: 'Design', icon: Palette, color: 'hsl(var(--studio-ink-3))', desc: 'Design tokens & theme' },
      { key: 'gradient', label: 'Gradient', icon: Sparkles, color: 'hsl(var(--studio-ink-3))', desc: 'Visual gradient editor' },
    ],
  },
  {
    label: 'Content',
    tabs: [
      { key: 'cms', label: 'CMS', icon: Database, color: 'hsl(var(--studio-accent))', desc: 'Collections & entries' },
      { key: 'products', label: 'Products', icon: ShoppingBag, color: 'hsl(var(--studio-ok))', desc: 'E-commerce catalogue' },
      { key: 'templates', label: 'Sites', icon: Store, color: 'hsl(var(--studio-warn))', desc: 'Templates & marketplace' },
    ],
  },
  {
    label: 'Tools',
    tabs: [
      { key: 'seo', label: 'SEO', icon: Search, color: 'hsl(var(--studio-accent))', desc: 'SEO audit & metadata' },
      { key: 'history', label: 'History', icon: History, color: 'hsl(var(--studio-ink-3))', desc: 'Version history' },
      { key: 'embed', label: 'Embed', icon: Code2, color: 'hsl(var(--studio-ink-2))', desc: 'Custom code & embeds' },
    ],
  },
];

export function EditorLeftPanel({ siteId }: EditorLeftPanelProps) {
  const { state, dispatch } = useEditor();
  const activeTab = (state.leftPanelTab as LeftTab) || 'components';
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [recentTabs, setRecentTabs] = useState<string[]>([]);

  const handleTabChange = (key: string) => {
    dispatch({ type: 'SET_LEFT_TAB', payload: key as any });
    if (panelCollapsed) setPanelCollapsed(false);
    setRecentTabs(prev => {
      const filtered = prev.filter(t => t !== key);
      return [key, ...filtered].slice(0, 5);
    });
  };

  return (
    <div className="h-full flex flex-row" style={{ backgroundColor: 'hsl(var(--studio-panel))' }}>
      {/* Vertical icon rail with grouped sections */}
      <div className="flex flex-col shrink-0 py-1 overflow-y-auto scrollbar-none justify-between" style={{ borderRight: '1px solid hsl(var(--studio-line))', backgroundColor: 'hsl(var(--studio-panel))', width: '44px' }}>
        <div>
          {/* Recently used tabs */}
          {recentTabs.length > 0 && (
            <div>
              <div className="px-1 py-1">
                <span className="block text-center" style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--studio-raised))' }}>
                  Recent
                </span>
              </div>
              {recentTabs.slice(0, 3).map(tabKey => {
                const allTabs = TAB_GROUPS.flatMap(g => g.tabs);
                const tab = allTabs.find(t => t.key === tabKey);
                if (!tab || activeTab === tab.key) return null;
                const Icon = tab.icon;
                return (
                  <Tooltip key={`recent-${tab.key}`}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleTabChange(tab.key)}
                        className="relative flex items-center justify-center w-full h-8 transition-all duration-200"
                        style={{ color: 'hsl(var(--studio-hover))', opacity: 0.7 }}
                        onMouseEnter={e => { e.currentTarget.style.color = tab.color; e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'hsl(var(--studio-line-strong))'; e.currentTarget.style.opacity = '0.7'; }}
                      >
                        <Icon className="h-[13px] w-[13px] shrink-0" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8} className="text-[10px] font-medium" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))', padding: '6px 10px' }}>
                      {tab.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
              <div className="mx-2 my-1 h-px" style={{ backgroundColor: 'hsl(var(--studio-raised))' }} />
            </div>
          )}

          {TAB_GROUPS.map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && (
                <div className="mx-2 my-1 h-px" style={{ backgroundColor: 'hsl(var(--studio-raised))' }} />
              )}
              {/* Group label */}
              <div className="px-1 py-1">
                <span className="block text-center" style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsl(var(--studio-hover))' }}>
                  {group.label}
                </span>
              </div>
              {group.tabs.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                const isRecent = recentTabs.includes(tab.key) && !active;
                return (
                  <Tooltip key={tab.key}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleTabChange(tab.key)}
                        className="relative flex items-center justify-center w-full h-9 transition-all duration-200"
                        style={{
                          color: active ? tab.color : isRecent ? 'hsl(var(--studio-ink-3))' : 'hsl(var(--studio-ink-3))',
                          backgroundColor: active ? `${tab.color}0a` : 'transparent',
                        }}
                        onMouseEnter={e => { if (!active) { e.currentTarget.style.color = tab.color; e.currentTarget.style.backgroundColor = `${tab.color}08`; } }}
                        onMouseLeave={e => { if (!active) { e.currentTarget.style.color = isRecent ? 'hsl(var(--studio-ink-3))' : 'hsl(var(--studio-ink-3))'; e.currentTarget.style.backgroundColor = 'transparent'; } }}
                      >
                        {/* Active indicator bar */}
                        {active && (
                          <motion.div
                            layoutId="left-tab-indicator"
                            className="absolute left-0 top-1 bottom-1 w-[2px] rounded-r-full"
                            style={{ backgroundColor: tab.color }}
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          />
                        )}
                        {/* Recent dot */}
                        {isRecent && (
                          <div className="absolute top-1 right-1 w-1 h-1 rounded-full" style={{ backgroundColor: tab.color, opacity: 0.4 }} />
                        )}
                        <Icon className="h-[15px] w-[15px] shrink-0" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8} className="text-[10px] font-medium" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))', padding: '6px 10px' }}>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tab.color }} />
                          <span className="font-semibold">{tab.label}</span>
                        </div>
                        <span style={{ fontSize: '9px', color: 'hsl(var(--studio-ink-3))' }}>{tab.desc}</span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Collapse toggle at bottom */}
        <div className="mt-auto pt-1">
          <div className="mx-2 mb-1 h-px" style={{ backgroundColor: 'hsl(var(--studio-raised))' }} />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setPanelCollapsed(c => !c)}
                className="flex items-center justify-center w-full h-8 transition-all duration-200"
                style={{ color: 'hsl(var(--studio-hover))' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'hsl(var(--studio-ink-2))'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'hsl(var(--studio-line-strong))'; }}
              >
                {panelCollapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8} className="text-[10px]" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}>
              {panelCollapsed ? 'Expand panel' : 'Collapse panel'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Panel content with animated collapse */}
      <AnimatePresence initial={false}>
        {!panelCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden"
            style={{ backgroundColor: '#212121' }}
          >
              {activeTab === 'components' && <ComponentLibrary />}
              {activeTab === 'sections' && <SectionsLibrary />}
              {activeTab === 'pages' && siteId && <PagesPanel siteId={siteId} />}
              {activeTab === 'pages' && !siteId && (
                <div className="flex items-center justify-center h-full text-[11px] text-[hsl(var(--studio-ink-3))]">No site loaded</div>
              )}
              {activeTab === 'layers' && <LayersPanel />}
              {activeTab === 'interactions' && <InteractionsPanel />}
              {activeTab === 'styles' && <AdvancedStylePanel />}
              {activeTab === 'forms' && <FormsBuilder />}
              {activeTab === 'cms' && <CMSPanel siteId={siteId} />}
              {activeTab === 'products' && <ProductsPanel siteId={siteId} />}
              {activeTab === 'templates' && <TemplateMarketplace siteId={siteId} />}
              {activeTab === 'design' && <DesignPanel />}
              {activeTab === 'gradient' && <GradientEditor />}
              {activeTab === 'seo' && <SEOAudit />}
              {activeTab === 'history' && <VersionHistoryPanel />}
              {activeTab === 'embed' && <EmbedPanel siteId={siteId} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
