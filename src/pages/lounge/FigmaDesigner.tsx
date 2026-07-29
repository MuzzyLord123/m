import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, MousePointer2, Square, Circle, Type, Minus, Pen, 
  Hand, Image, Frame, Layers, ZoomIn, ZoomOut, RotateCcw,
  AlignLeft, AlignCenter, AlignRight, AlignStartVertical, AlignCenterVertical, AlignEndVertical,
  Copy, Trash2, Lock, Unlock, Eye, EyeOff, ChevronDown, ChevronRight,
  Download, Grid3X3, Magnet, Undo2, Redo2,
  FlipHorizontal, FlipVertical, Triangle, Star, Hexagon,
  ArrowUp, ArrowDown, Bold, Italic, Underline,
  AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal,
  Plus, Search, Clock, FileText, MoreHorizontal, Trash, FolderOpen,
  LayoutGrid, List, Settings, MessageSquare, Component, Play,
  Pipette, Scissors, Group, Ungroup, MoveHorizontal, ArrowUpRight,
  Blend, PaintBucket, Maximize2, Minimize2, SquareDashedBottom,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { STUDIO_COMPONENTS, STUDIO_CATEGORIES, type StudioComponentCategory } from '@/components/studio/studioComponentLibrary';

// ══════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════
interface Vec2 { x: number; y: number; }

interface DesignElement {
  id: string;
  type: 'rectangle' | 'ellipse' | 'text' | 'line' | 'frame' | 'image' | 'path' | 'star' | 'triangle' | 'polygon' | 'section' | 'arrow' | 'group';
  name: string;
  x: number; y: number;
  width: number; height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  borderRadius: number;
  text?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  textAlign?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: string;
  fontStyle?: string;
  shadowX?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowColor?: string;
  blur?: number;
  gradientType?: 'none' | 'linear' | 'radial';
  gradientStart?: string;
  gradientEnd?: string;
  gradientAngle?: number;
  starPoints?: number;
  starInnerRadius?: number;
  polygonSides?: number;
  locked: boolean;
  visible: boolean;
  grouped?: string;
  flipX?: boolean;
  flipY?: boolean;
  blendMode?: string;
  imageUrl?: string;
  children?: string[];
  parentId?: string;
  constraintH?: 'left' | 'right' | 'center' | 'scale';
  constraintV?: 'top' | 'bottom' | 'center' | 'scale';
  // Auto Layout (like Figma)
  autoLayout?: boolean;
  layoutDirection?: 'horizontal' | 'vertical';
  layoutGap?: number;
  layoutPaddingH?: number;
  layoutPaddingV?: number;
  layoutAlign?: 'start' | 'center' | 'end' | 'stretch';
  layoutWrap?: boolean;
}

interface StudioProject {
  id: string;
  name: string;
  updatedAt: string;
  elements: DesignElement[];
  thumbnail?: string;
}

type Tool = 'select' | 'hand' | 'rectangle' | 'ellipse' | 'text' | 'line' | 'pen' | 'frame' | 'image' | 'eyedropper' | 'star' | 'triangle' | 'polygon' | 'section' | 'arrow' | 'scale' | 'slice';
type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null;
type View = 'home' | 'editor';
type RightTab = 'design' | 'prototype' | 'export';
type LeftTab = 'pages' | 'file' | 'assets';

interface DesignPage {
  id: string;
  name: string;
  elements: DesignElement[];
}

const BLEND_MODES = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];
const EXPORT_SCALES = [{ label: '1x', scale: 1 }, { label: '2x', scale: 2 }, { label: '4x', scale: 4 }];
const STROKE_STYLES = ['solid', 'dashed', 'dotted'] as const;

const FRAME_PRESETS = [
  { label: 'iPhone 15 Pro', w: 393, h: 852 },
  { label: 'iPhone 15', w: 390, h: 844 },
  { label: 'iPhone SE', w: 375, h: 667 },
  { label: 'iPad Pro 12.9"', w: 1024, h: 1366 },
  { label: 'iPad Mini', w: 744, h: 1133 },
  { label: 'MacBook Pro 14"', w: 1512, h: 982 },
  { label: 'Desktop HD', w: 1440, h: 900 },
  { label: 'Desktop', w: 1280, h: 800 },
  { label: 'Android Small', w: 360, h: 640 },
  { label: 'Android Large', w: 412, h: 915 },
  { label: 'Twitter Post', w: 1200, h: 675 },
  { label: 'Instagram Post', w: 1080, h: 1080 },
  { label: 'Instagram Story', w: 1080, h: 1920 },
  { label: 'Presentation 16:9', w: 1920, h: 1080 },
  { label: 'A4', w: 595, h: 842 },
];

const ZOOM_PRESETS = [
  { label: 'Fit', value: -1 },
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1 },
  { label: '150%', value: 1.5 },
  { label: '200%', value: 2 },
  { label: '400%', value: 4 },
];

interface CommandItem {
  label: string;
  shortcut?: string;
  action: () => void;
  category: string;
}

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════
const uid = () => crypto.randomUUID();
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const COLORS = ['#6366f1', '#ec4899', '#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4'];
const FONT_FAMILIES = ['Inter', 'Georgia', 'Helvetica', 'Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS'];

function createEl(type: DesignElement['type'], x: number, y: number, w: number, h: number, extra: Partial<DesignElement> = {}): DesignElement {
  return {
    id: uid(), type, name: type.charAt(0).toUpperCase() + type.slice(1),
    x, y, width: Math.max(w, 1), height: Math.max(h, 1), rotation: 0,
    fill: type === 'line' ? 'transparent' : '#6366f1',
    stroke: type === 'line' ? '#6366f1' : 'transparent',
    strokeWidth: type === 'line' ? 2 : 0,
    opacity: 1, borderRadius: 0, locked: false, visible: true,
    starPoints: 5, starInnerRadius: 0.4, polygonSides: 6,
    ...extra,
  };
}

function getStoredProjects(): StudioProject[] {
  try {
    return JSON.parse(localStorage.getItem('workshop-studio-projects') || '[]');
  } catch { return []; }
}

function saveStoredProjects(projects: StudioProject[]) {
  localStorage.setItem('workshop-studio-projects', JSON.stringify(projects));
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ══════════════════════════════════════════════
// HOME DASHBOARD (Figma-style)
// ══════════════════════════════════════════════
function HomeDashboard({ onOpenProject, onNewProject, onBack }: {
  onOpenProject: (project: StudioProject) => void;
  onNewProject: () => void;
  onBack: () => void;
}) {
  const [projects, setProjects] = useState<StudioProject[]>(getStoredProjects());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'recent' | 'drafts' | 'shared'>('recent');

  const filtered = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const deleteProject = (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    saveStoredProjects(updated);
  };

  const duplicateProject = (project: StudioProject) => {
    const dup: StudioProject = { ...project, id: uid(), name: `${project.name} (Copy)`, updatedAt: new Date().toISOString() };
    const updated = [dup, ...projects];
    setProjects(updated);
    saveStoredProjects(updated);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* ═══ TOP NAV ═══ */}
      <div className="h-12 flex items-center justify-between px-4 shrink-0 bg-card border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-foreground/[0.05] transition-colors" title="Back">
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={() => window.history.forward()} className="p-1.5 rounded-lg hover:bg-foreground/[0.05] transition-colors" title="Forward">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg border border-border/60 bg-card flex items-center justify-center">
              <Frame className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-[14px] font-semibold text-foreground">Workshop Studio</span>
          </div>
        </div>

        {/* Center tabs like Figma */}
        <div className="flex items-center gap-1 bg-sunken rounded-lg p-0.5">
          {['Design', 'FigJam', 'Slides', 'Dev'].map((tab, i) => (
            <button key={tab} className={`px-3 py-1 text-[12px] font-medium rounded-md transition-colors ${i === 0 ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={onNewProject} size="sm" className="h-8 text-[12px] bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
            <Plus className="h-3.5 w-3.5 mr-1" /> New design
          </Button>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 border-r border-border/60 bg-card p-3 flex flex-col gap-1">
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Search files..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-[12px] bg-sunken border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary"
            />
          </div>

          {[
            { key: 'recent', icon: Clock, label: 'Recents' },
            { key: 'drafts', icon: FileText, label: 'Drafts' },
            { key: 'shared', icon: FolderOpen, label: 'Shared' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key as any)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors ${activeTab === item.key ? 'bg-primary/10 text-primary' : 'text-ink-2 hover:bg-foreground/[0.03]'}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}

          <div className="mt-auto pt-3 border-t border-border/40">
            <div className="px-3 py-2 text-[11px] text-muted-foreground flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border border-border/60 bg-sunken flex items-center justify-center text-muted-foreground text-[8px] font-semibold">WS</div>
              Workshop Studio
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <h2 className="text-[18px] font-semibold text-foreground">
                {activeTab === 'recent' ? 'Recents' : activeTab === 'drafts' ? 'Drafts' : 'Shared files'}
              </h2>
              <div className="flex items-center gap-1 text-[12px]">
                {['Recently viewed', 'Shared files'].map((tab, i) => (
                  <button key={tab} className={`px-3 py-1 rounded-md transition-colors ${i === 0 ? 'bg-sunken text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-sunken' : 'hover:bg-foreground/[0.03]'}`}>
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-sunken' : 'hover:bg-foreground/[0.03]'}`}>
                <List className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Empty state or projects grid */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 rounded-xl bg-sunken flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <h3 className="text-[15px] font-semibold text-foreground mb-1">No designs yet</h3>
              <p className="text-[13px] text-muted-foreground mb-5">Create your first design to get started</p>
              <Button onClick={onNewProject} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg h-9 text-[13px]">
                <Plus className="h-4 w-4 mr-1.5" /> New design file
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {/* New file card */}
              <button onClick={onNewProject} className="aspect-[4/3] rounded-xl border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center gap-2 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-sunken group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                  <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="text-[12px] font-medium text-muted-foreground group-hover:text-primary">New file</span>
              </button>

              {filtered.map(project => (
                <div key={project.id} className="group relative">
                  <button
                    onClick={() => onOpenProject(project)}
                    className="w-full aspect-[4/3] rounded-xl border border-border/60 bg-card hover:border-primary/50 overflow-hidden transition-all"
                  >
                    {/* Thumbnail - checkered pattern like Figma */}
                    <div className="w-full h-full" style={{
                      backgroundImage: 'repeating-conic-gradient(#e5e5e5 0% 25%, #f5f5f5 0% 50%)',
                      backgroundSize: '16px 16px',
                    }}>
                      {/* Show element previews */}
                      <div className="w-full h-full flex items-center justify-center">
                        {project.elements.length > 0 ? (
                          <div className="relative" style={{ width: '60%', height: '60%' }}>
                            {project.elements.slice(0, 5).map((el, i) => (
                              <div key={el.id} className="absolute rounded" style={{
                                left: `${(el.x / 600) * 100}%`,
                                top: `${(el.y / 400) * 100}%`,
                                width: `${Math.min(el.width / 6, 60)}px`,
                                height: `${Math.min(el.height / 4, 40)}px`,
                                backgroundColor: el.fill !== 'transparent' ? el.fill : '#ddd',
                                borderRadius: el.type === 'ellipse' ? '50%' : `${el.borderRadius}px`,
                                opacity: el.opacity,
                              }} />
                            ))}
                          </div>
                        ) : (
                          <div className="w-16 h-20 rounded bg-foreground/10" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* File info */}
                  <div className="flex items-center gap-2 mt-2 px-0.5">
                    <div className="w-5 h-5 rounded border border-border/60 bg-sunken flex items-center justify-center shrink-0">
                      <FileText className="h-2.5 w-2.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-medium text-foreground truncate">{project.name}</div>
                      <div className="text-[10px] text-muted-foreground">Edited {formatTimeAgo(project.updatedAt)}</div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                      <button onClick={(e) => { e.stopPropagation(); duplicateProject(project); }} className="p-1 rounded hover:bg-foreground/[0.05]">
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="p-1 rounded hover:bg-risk/10">
                        <Trash className="h-3 w-3 text-muted-foreground hover:text-risk" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map(project => (
                <button
                  key={project.id}
                  onClick={() => onOpenProject(project)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-foreground/[0.03] transition-colors group"
                >
                  <div className="w-10 h-7 rounded border border-border/60 bg-card shrink-0" style={{
                    backgroundImage: 'repeating-conic-gradient(#e5e5e5 0% 25%, #f5f5f5 0% 50%)',
                    backgroundSize: '8px 8px',
                  }} />
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-[13px] font-medium text-foreground truncate">{project.name}</div>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{formatTimeAgo(project.updatedAt)}</span>
                  <span className="text-[11px] text-muted-foreground/60 font-mono">{project.elements.length} layers</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════
export default function WorkshopStudio() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [view, setView] = useState<View>('home');
  const [currentProject, setCurrentProject] = useState<StudioProject | null>(null);
  const [projectName, setProjectName] = useState('Untitled');

  // Always reset to home when component mounts (navigated to)
  useEffect(() => {
    setView('home');
  }, []);

  // ── Core State ──
  const [tool, setTool] = useState<Tool>('select');
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Vec2>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize] = useState(20);

  // Pages
  const [pages, setPages] = useState<DesignPage[]>([{ id: uid(), name: 'Page 1', elements: [] }]);
  const [activePageId, setActivePageId] = useState(pages[0].id);

  // Panels
  const [leftTab, setLeftTab] = useState<LeftTab>('file');
  const [rightTab, setRightTab] = useState<RightTab>('design');
  const [showLeftPanel, setShowLeftPanel] = useState(true);

  // Components (local)
  const [localComponents, setLocalComponents] = useState<{ id: string; name: string; elements: DesignElement[] }[]>([]);

  // Export
  const [exportScale, setExportScale] = useState(1);
  const [exportFormat, setExportFormat] = useState<'png' | 'svg' | 'jpg'>('png');

  // Switch page
  const switchPage = useCallback((pageId: string) => {
    // Save current page elements
    setPages(prev => prev.map(p => p.id === activePageId ? { ...p, elements } : p));
    // Load new page
    const page = pages.find(p => p.id === pageId);
    if (page) { setElements(page.elements); setActivePageId(pageId); setSelectedIds([]); }
  }, [activePageId, elements, pages]);

  const addPage = useCallback(() => {
    const newPage: DesignPage = { id: uid(), name: `Page ${pages.length + 1}`, elements: [] };
    setPages(prev => {
      const updated = prev.map(p => p.id === activePageId ? { ...p, elements } : p);
      return [...updated, newPage];
    });
    setElements([]);
    setActivePageId(newPage.id);
    setSelectedIds([]);
  }, [pages, activePageId, elements]);

  const deletePage = useCallback((pageId: string) => {
    if (pages.length <= 1) return;
    const remaining = pages.filter(p => p.id !== pageId);
    setPages(remaining);
    if (pageId === activePageId) { setActivePageId(remaining[0].id); setElements(remaining[0].elements); setSelectedIds([]); }
  }, [pages, activePageId]);

  const renamePage = useCallback((pageId: string, name: string) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, name } : p));
  }, []);

  // (deferred functions defined below after pushHistory/selectedEl)

  // Inline text editing
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Clipboard (actual element copy/paste)
  const [clipboard, setClipboard] = useState<DesignElement[]>([]);

  // Command palette
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const commandInputRef = useRef<HTMLInputElement>(null);

  // Frame presets dropdown
  const [showFramePresets, setShowFramePresets] = useState(false);

  // Zoom presets dropdown
  const [showZoomPresets, setShowZoomPresets] = useState(false);

  // Measurement mode
  const [showMeasurements, setShowMeasurements] = useState(false);

  // History
  const [history, setHistory] = useState<DesignElement[][]>([[]]);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Interaction state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Vec2 | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<Vec2 | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Vec2 | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Vec2>({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [resizeStart, setResizeStart] = useState<{ el: DesignElement; world: Vec2 } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ start: Vec2; end: Vec2 } | null>(null);
  const [guides, setGuides] = useState<{ x?: number; y?: number }[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    position: true, size: true, fill: true, stroke: false, text: true, shadow: false, effects: false
  });
  const [assetSearch, setAssetSearch] = useState('');
  const [expandedAssetCat, setExpandedAssetCat] = useState<StudioComponentCategory | null>(null);

  const selectedEl = elements.find(e => selectedIds.includes(e.id));
  const multiSelected = selectedIds.length > 1;

  // ── Project management ──
  const openProject = (project: StudioProject) => {
    setCurrentProject(project);
    setProjectName(project.name);
    setElements(project.elements || []);
    setHistory([project.elements || []]);
    setHistoryIdx(0);
    setSelectedIds([]);
    setView('editor');
  };

  const newProject = () => {
    const project: StudioProject = { id: uid(), name: 'Untitled', updatedAt: new Date().toISOString(), elements: [] };
    setCurrentProject(project);
    setProjectName('Untitled');
    setElements([]);
    setHistory([[]]);
    setHistoryIdx(0);
    setSelectedIds([]);
    setView('editor');
  };

  const saveProject = useCallback(() => {
    if (!currentProject) return;
    const updated: StudioProject = { ...currentProject, name: projectName, updatedAt: new Date().toISOString(), elements };
    const projects = getStoredProjects();
    const idx = projects.findIndex(p => p.id === updated.id);
    if (idx >= 0) projects[idx] = updated;
    else projects.unshift(updated);
    saveStoredProjects(projects);
    setCurrentProject(updated);
    toast.success('Saved');
  }, [currentProject, projectName, elements]);

  const goHome = useCallback(() => {
    saveProject();
    setView('home');
  }, [saveProject]);

  // ── History helpers ──
  const pushHistory = useCallback((newElements: DesignElement[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIdx + 1);
      return [...trimmed, JSON.parse(JSON.stringify(newElements))];
    });
    setHistoryIdx(prev => prev + 1);
  }, [historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx <= 0) return;
    const newIdx = historyIdx - 1;
    setHistoryIdx(newIdx);
    setElements(JSON.parse(JSON.stringify(history[newIdx])));
    setSelectedIds([]);
  }, [historyIdx, history]);

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    const newIdx = historyIdx + 1;
    setHistoryIdx(newIdx);
    setElements(JSON.parse(JSON.stringify(history[newIdx])));
    setSelectedIds([]);
  }, [historyIdx, history]);

  // ── Coord transforms ──
  const screenToWorld = useCallback((sx: number, sy: number): Vec2 => {
    return { x: (sx - pan.x) / zoom, y: (sy - pan.y) / zoom };
  }, [pan, zoom]);

  const snap = useCallback((v: number) => snapToGrid ? Math.round(v / gridSize) * gridSize : v, [snapToGrid, gridSize]);

  const computeGuides = useCallback((movingEl: DesignElement, wx: number, wy: number) => {
    const newGuides: { x?: number; y?: number }[] = [];
    const threshold = 5;
    const cx = wx + movingEl.width / 2;
    const cy = wy + movingEl.height / 2;
    const rx = wx + movingEl.width;
    const by = wy + movingEl.height;
    for (const other of elements) {
      if (selectedIds.includes(other.id)) continue;
      const ocx = other.x + other.width / 2;
      const ocy = other.y + other.height / 2;
      if (Math.abs(cx - ocx) < threshold) newGuides.push({ x: ocx });
      if (Math.abs(wx - other.x) < threshold) newGuides.push({ x: other.x });
      if (Math.abs(rx - (other.x + other.width)) < threshold) newGuides.push({ x: other.x + other.width });
      if (Math.abs(cy - ocy) < threshold) newGuides.push({ y: ocy });
      if (Math.abs(wy - other.y) < threshold) newGuides.push({ y: other.y });
      if (Math.abs(by - (other.y + other.height)) < threshold) newGuides.push({ y: other.y + other.height });
    }
    setGuides(newGuides);
  }, [elements, selectedIds]);

  // ══════════════════════════════════════════════
  // RENDERING
  // ══════════════════════════════════════════════
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    if (showGrid) {
      const startX = Math.floor(-pan.x / zoom / gridSize) * gridSize;
      const startY = Math.floor(-pan.y / zoom / gridSize) * gridSize;
      const endX = startX + width / zoom + gridSize * 2;
      const endY = startY + height / zoom + gridSize * 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.04)';
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      for (let x = startX; x < endX; x += gridSize) { ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
      for (let y = startY; y < endY; y += gridSize) { ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
      ctx.stroke();
    }

    // Render elements
    for (const el of elements) {
      if (!el.visible) continue;
      ctx.save();
      ctx.globalAlpha = el.opacity;
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;
      ctx.translate(cx, cy);
      if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
      if (el.flipX) ctx.scale(-1, 1);
      if (el.flipY) ctx.scale(1, -1);
      ctx.translate(-el.width / 2, -el.height / 2);

      if (el.shadowBlur && el.shadowBlur > 0) {
        ctx.shadowOffsetX = el.shadowX || 0;
        ctx.shadowOffsetY = el.shadowY || 0;
        ctx.shadowBlur = el.shadowBlur;
        ctx.shadowColor = el.shadowColor || 'rgba(0,0,0,0.3)';
      }
      if (el.blur && el.blur > 0) ctx.filter = `blur(${el.blur}px)`;

      let fillStyle: string | CanvasGradient = el.fill;
      if (el.gradientType === 'linear' && el.gradientStart && el.gradientEnd) {
        const angle = (el.gradientAngle || 0) * Math.PI / 180;
        const grad = ctx.createLinearGradient(
          el.width / 2 - Math.cos(angle) * el.width / 2, el.height / 2 - Math.sin(angle) * el.height / 2,
          el.width / 2 + Math.cos(angle) * el.width / 2, el.height / 2 + Math.sin(angle) * el.height / 2
        );
        grad.addColorStop(0, el.gradientStart); grad.addColorStop(1, el.gradientEnd);
        fillStyle = grad;
      } else if (el.gradientType === 'radial' && el.gradientStart && el.gradientEnd) {
        const grad = ctx.createRadialGradient(el.width / 2, el.height / 2, 0, el.width / 2, el.height / 2, Math.max(el.width, el.height) / 2);
        grad.addColorStop(0, el.gradientStart); grad.addColorStop(1, el.gradientEnd);
        fillStyle = grad;
      }

      if (fillStyle !== 'transparent') ctx.fillStyle = fillStyle;
      if (el.stroke !== 'transparent' && el.strokeWidth > 0) { ctx.strokeStyle = el.stroke; ctx.lineWidth = el.strokeWidth; }

      switch (el.type) {
        case 'rectangle': case 'frame': {
          const r = Math.min(el.borderRadius, Math.min(el.width, el.height) / 2);
          if (r > 0) { roundRect(ctx, 0, 0, el.width, el.height, r); if (fillStyle !== 'transparent') ctx.fill(); if (el.stroke !== 'transparent' && el.strokeWidth > 0) ctx.stroke(); }
          else { if (fillStyle !== 'transparent') ctx.fillRect(0, 0, el.width, el.height); if (el.stroke !== 'transparent' && el.strokeWidth > 0) ctx.strokeRect(0, 0, el.width, el.height); }
          if (el.type === 'frame') { ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.font = `500 ${11 / zoom}px Inter, sans-serif`; ctx.fillText(el.name, 2, -4 / zoom); ctx.restore(); }
          break;
        }
        case 'ellipse': ctx.beginPath(); ctx.ellipse(el.width / 2, el.height / 2, el.width / 2, el.height / 2, 0, 0, Math.PI * 2); if (fillStyle !== 'transparent') ctx.fill(); if (el.stroke !== 'transparent' && el.strokeWidth > 0) ctx.stroke(); break;
        case 'line': ctx.beginPath(); ctx.moveTo(0, el.height / 2); ctx.lineTo(el.width, el.height / 2); if (el.stroke !== 'transparent') ctx.stroke(); break;
        case 'triangle': ctx.beginPath(); ctx.moveTo(el.width / 2, 0); ctx.lineTo(el.width, el.height); ctx.lineTo(0, el.height); ctx.closePath(); if (fillStyle !== 'transparent') ctx.fill(); if (el.stroke !== 'transparent' && el.strokeWidth > 0) ctx.stroke(); break;
        case 'star': {
          const pts = el.starPoints || 5; const inner = (el.starInnerRadius || 0.4) * Math.min(el.width, el.height) / 2; const outer = Math.min(el.width, el.height) / 2;
          ctx.beginPath();
          for (let i = 0; i < pts * 2; i++) { const r = i % 2 === 0 ? outer : inner; const angle = (i * Math.PI) / pts - Math.PI / 2; const px = el.width / 2 + r * Math.cos(angle); const py = el.height / 2 + r * Math.sin(angle); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
          ctx.closePath(); if (fillStyle !== 'transparent') ctx.fill(); if (el.stroke !== 'transparent' && el.strokeWidth > 0) ctx.stroke(); break;
        }
        case 'polygon': {
          const sides = el.polygonSides || 6; const pr = Math.min(el.width, el.height) / 2;
          ctx.beginPath();
          for (let i = 0; i < sides; i++) { const angle = (i * 2 * Math.PI) / sides - Math.PI / 2; const px = el.width / 2 + pr * Math.cos(angle); const py = el.height / 2 + pr * Math.sin(angle); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
          ctx.closePath(); if (fillStyle !== 'transparent') ctx.fill(); if (el.stroke !== 'transparent' && el.strokeWidth > 0) ctx.stroke(); break;
        }
        case 'section': {
          ctx.setLineDash([6 / zoom, 3 / zoom]);
          ctx.strokeStyle = '#9747FF'; ctx.lineWidth = 2 / zoom;
          ctx.strokeRect(0, 0, el.width, el.height);
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(151,71,255,0.04)'; ctx.fillRect(0, 0, el.width, el.height);
          ctx.fillStyle = '#9747FF'; ctx.font = `600 ${12 / zoom}px Inter, sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
          ctx.fillText(el.name, 2, -4 / zoom);
          break;
        }
        case 'arrow': {
          ctx.beginPath(); ctx.moveTo(0, el.height / 2); ctx.lineTo(el.width, el.height / 2);
          ctx.strokeStyle = el.stroke !== 'transparent' ? el.stroke : el.fill; ctx.lineWidth = el.strokeWidth || 2; ctx.stroke();
          const aSize = 8; ctx.beginPath(); ctx.moveTo(el.width, el.height / 2); ctx.lineTo(el.width - aSize, el.height / 2 - aSize / 2); ctx.lineTo(el.width - aSize, el.height / 2 + aSize / 2); ctx.closePath(); ctx.fillStyle = el.stroke !== 'transparent' ? el.stroke : el.fill; ctx.fill();
          break;
        }
        case 'group': {
          // Groups are transparent containers - just render dashed outline when selected
          if (selectedIds.includes(el.id)) { ctx.setLineDash([4 / zoom, 4 / zoom]); ctx.strokeStyle = '#0D99FF'; ctx.lineWidth = 1 / zoom; ctx.strokeRect(0, 0, el.width, el.height); ctx.setLineDash([]); }
          break;
        }
        case 'image': {
          // Render placeholder with checkerboard
          ctx.fillStyle = '#e5e5e5'; ctx.fillRect(0, 0, el.width, el.height);
          ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.strokeRect(0, 0, el.width, el.height);
          ctx.fillStyle = '#999'; ctx.font = `400 ${12}px Inter, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('Image', el.width / 2, el.height / 2);
          break;
        }
        case 'text': {
          ctx.fillStyle = typeof fillStyle === 'string' ? fillStyle : el.fill;
          const fs = el.fontSize || 16;
          ctx.font = `${el.fontStyle || 'normal'} ${el.fontWeight || '400'} ${fs}px ${el.fontFamily || 'Inter'}, sans-serif`;
          ctx.textAlign = (el.textAlign as CanvasTextAlign) || 'left'; ctx.textBaseline = 'top';
          const lh = (el.lineHeight || 1.4) * fs;
          const textLines = (el.text || 'Type here').split('\n');
          textLines.forEach((line, i) => {
            const tx = el.textAlign === 'center' ? el.width / 2 : el.textAlign === 'right' ? el.width : 0;
            ctx.fillText(line, tx, i * lh);
          });
          break;
        }
      }
      ctx.restore();

      // Selection
      if (selectedIds.includes(el.id)) {
        ctx.save();
        ctx.strokeStyle = '#0D99FF';
        ctx.lineWidth = 1.5 / zoom;
        ctx.strokeRect(el.x, el.y, el.width, el.height);
        const hs = 6 / zoom;
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#0D99FF'; ctx.lineWidth = 1.5 / zoom;
        const handles: [number, number][] = [
          [el.x, el.y], [el.x + el.width / 2, el.y], [el.x + el.width, el.y],
          [el.x + el.width, el.y + el.height / 2],
          [el.x + el.width, el.y + el.height], [el.x + el.width / 2, el.y + el.height],
          [el.x, el.y + el.height], [el.x, el.y + el.height / 2],
        ];
        for (const [hx, hy] of handles) { ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs); ctx.strokeRect(hx - hs / 2, hy - hs / 2, hs, hs); }
        ctx.restore();
      }
    }

    // Smart guides
    ctx.save();
    ctx.strokeStyle = '#FF3366';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([4 / zoom, 4 / zoom]);
    for (const g of guides) {
      if (g.x !== undefined) { ctx.beginPath(); ctx.moveTo(g.x, -10000); ctx.lineTo(g.x, 10000); ctx.stroke(); }
      if (g.y !== undefined) { ctx.beginPath(); ctx.moveTo(-10000, g.y); ctx.lineTo(10000, g.y); ctx.stroke(); }
    }
    ctx.setLineDash([]);
    ctx.restore();

    // Drawing preview — render actual shape outline
    if (isDrawing && drawStart && drawCurrent) {
      ctx.save();
      ctx.strokeStyle = '#0D99FF'; ctx.lineWidth = 1.5 / zoom;
      ctx.fillStyle = 'rgba(13,153,255,0.08)';
      const dx = Math.min(drawStart.x, drawCurrent.x); const dy = Math.min(drawStart.y, drawCurrent.y);
      const dw = Math.abs(drawCurrent.x - drawStart.x); const dh = Math.abs(drawCurrent.y - drawStart.y);

      switch (tool) {
        case 'ellipse': {
          ctx.beginPath();
          ctx.ellipse(dx + dw / 2, dy + dh / 2, dw / 2, dh / 2, 0, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
          break;
        }
        case 'triangle': {
          ctx.beginPath();
          ctx.moveTo(dx + dw / 2, dy); ctx.lineTo(dx + dw, dy + dh); ctx.lineTo(dx, dy + dh);
          ctx.closePath(); ctx.fill(); ctx.stroke();
          break;
        }
        case 'star': {
          const pts = 5; const innerR = 0.4;
          const outerRx = dw / 2; const outerRy = dh / 2;
          const cx2 = dx + dw / 2; const cy2 = dy + dh / 2;
          ctx.beginPath();
          for (let i = 0; i < pts * 2; i++) {
            const r = i % 2 === 0 ? Math.min(outerRx, outerRy) : Math.min(outerRx, outerRy) * innerR;
            const angle = (i * Math.PI) / pts - Math.PI / 2;
            const px = cx2 + r * Math.cos(angle); const py = cy2 + r * Math.sin(angle);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.fill(); ctx.stroke();
          break;
        }
        case 'polygon': {
          const sides = 6;
          const pr = Math.min(dw, dh) / 2;
          const cx3 = dx + dw / 2; const cy3 = dy + dh / 2;
          ctx.beginPath();
          for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
            const px = cx3 + pr * Math.cos(angle); const py = cy3 + pr * Math.sin(angle);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath(); ctx.fill(); ctx.stroke();
          break;
        }
        case 'line': {
          ctx.beginPath();
          ctx.moveTo(drawStart.x, drawStart.y); ctx.lineTo(drawCurrent.x, drawCurrent.y);
          ctx.stroke();
          break;
        }
        case 'text': {
          ctx.setLineDash([4 / zoom, 4 / zoom]);
          ctx.strokeRect(dx, dy, Math.max(dw, 200), Math.max(dh, 40));
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.font = `400 ${18 / zoom > 8 ? 18 : 8 * zoom}px Inter, sans-serif`;
          ctx.textAlign = 'left'; ctx.textBaseline = 'top';
          ctx.fillText('Type here', dx + 4 / zoom, dy + 4 / zoom);
          break;
        }
        case 'frame': {
          ctx.setLineDash([6 / zoom, 3 / zoom]);
          ctx.strokeRect(dx, dy, dw, dh);
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(13,153,255,0.04)';
          ctx.fillRect(dx, dy, dw, dh);
          // Frame label
          ctx.fillStyle = '#0D99FF'; ctx.font = `500 ${11 / zoom}px Inter, sans-serif`;
          ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
          ctx.fillText('Frame', dx, dy - 4 / zoom);
          break;
        }
        default: {
          // Rectangle and fallback
          ctx.fillRect(dx, dy, dw, dh); ctx.strokeRect(dx, dy, dw, dh);
          break;
        }
      }

      // Dimension label
      ctx.fillStyle = '#0D99FF'; ctx.font = `500 ${10 / zoom}px Inter`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(`${Math.round(dw)} × ${Math.round(dh)}`, dx + dw / 2, dy + dh + 6 / zoom);
      ctx.restore();
    }

    // Selection box
    if (selectionBox) {
      ctx.save();
      ctx.strokeStyle = '#0D99FF'; ctx.fillStyle = 'rgba(13,153,255,0.06)'; ctx.lineWidth = 1 / zoom;
      const sx = Math.min(selectionBox.start.x, selectionBox.end.x); const sy = Math.min(selectionBox.start.y, selectionBox.end.y);
      const sw = Math.abs(selectionBox.end.x - selectionBox.start.x); const sh = Math.abs(selectionBox.end.y - selectionBox.start.y);
      ctx.fillRect(sx, sy, sw, sh); ctx.strokeRect(sx, sy, sw, sh);
      ctx.restore();
    }

    ctx.restore();
    drawRulers(ctx, width, height, zoom, pan);
  }, [elements, selectedIds, zoom, pan, showGrid, gridSize, isDrawing, drawStart, drawCurrent, guides, selectionBox]);

  useEffect(() => {
    if (view !== 'editor') return;
    const canvas = canvasRef.current; const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr; canvas.height = container.clientHeight * dpr;
      canvas.style.width = `${container.clientWidth}px`; canvas.style.height = `${container.clientHeight}px`;
      const ctx = canvas.getContext('2d'); if (ctx) ctx.scale(dpr, dpr);
      render();
    };
    resize();
    const observer = new ResizeObserver(resize); observer.observe(container);
    return () => observer.disconnect();
  }, [render, view]);

  useEffect(() => { if (view === 'editor') render(); }, [render, view]);

  // ══════════════════════════════════════════════
  // HIT TESTING
  // ══════════════════════════════════════════════
  const hitTestHandle = useCallback((world: Vec2, el: DesignElement): ResizeHandle => {
    const hs = 8 / zoom;
    const handles: [number, number, ResizeHandle][] = [
      [el.x, el.y, 'nw'], [el.x + el.width / 2, el.y, 'n'], [el.x + el.width, el.y, 'ne'],
      [el.x + el.width, el.y + el.height / 2, 'e'], [el.x + el.width, el.y + el.height, 'se'],
      [el.x + el.width / 2, el.y + el.height, 's'], [el.x, el.y + el.height, 'sw'], [el.x, el.y + el.height / 2, 'w'],
    ];
    for (const [hx, hy, handle] of handles) { if (Math.abs(world.x - hx) < hs && Math.abs(world.y - hy) < hs) return handle; }
    return null;
  }, [zoom]);

  // ══════════════════════════════════════════════
  // MOUSE HANDLERS
  // ══════════════════════════════════════════════
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left; const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);

    if (e.button === 1 || tool === 'hand') { setIsPanning(true); setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); return; }

    if (tool === 'select') {
      if (selectedIds.length === 1) {
        const sel = elements.find(el => el.id === selectedIds[0]);
        if (sel) { const handle = hitTestHandle(world, sel); if (handle) { setResizeHandle(handle); setResizeStart({ el: { ...sel }, world }); return; } }
      }
      let hit: DesignElement | null = null;
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i]; if (!el.visible || el.locked) continue;
        if (world.x >= el.x && world.x <= el.x + el.width && world.y >= el.y && world.y <= el.y + el.height) { hit = el; break; }
      }
      if (hit) {
        if (e.shiftKey) setSelectedIds(prev => prev.includes(hit!.id) ? prev.filter(id => id !== hit!.id) : [...prev, hit!.id]);
        else if (!selectedIds.includes(hit.id)) setSelectedIds([hit.id]);
        setIsDragging(true); setDragOffset({ x: world.x - hit.x, y: world.y - hit.y });
      } else { setSelectedIds([]); setSelectionBox({ start: world, end: world }); }
      return;
    }

    if (['rectangle', 'ellipse', 'line', 'frame', 'text', 'star', 'triangle', 'polygon', 'section', 'arrow'].includes(tool)) {
      setIsDrawing(true); setDrawStart(world); setDrawCurrent(world);
    }
  }, [tool, elements, screenToWorld, pan, selectedIds, hitTestHandle]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);

    if (isPanning && panStart) { setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }); return; }
    if (selectionBox) { setSelectionBox(prev => prev ? { ...prev, end: world } : null); return; }

    if (resizeHandle && resizeStart) {
      const { el: origEl, world: startWorld } = resizeStart;
      const dx = world.x - startWorld.x; const dy = world.y - startWorld.y;
      let newX = origEl.x, newY = origEl.y, newW = origEl.width, newH = origEl.height;
      if (resizeHandle.includes('e')) newW = Math.max(10, origEl.width + dx);
      if (resizeHandle.includes('w')) { newX = origEl.x + dx; newW = Math.max(10, origEl.width - dx); }
      if (resizeHandle.includes('s')) newH = Math.max(10, origEl.height + dy);
      if (resizeHandle.includes('n')) { newY = origEl.y + dy; newH = Math.max(10, origEl.height - dy); }
      if (e.shiftKey) { const ratio = origEl.width / origEl.height; if (['se','ne','sw','nw'].includes(resizeHandle)) newH = newW / ratio; }
      setElements(prev => prev.map(el => el.id === origEl.id ? { ...el, x: snap(newX), y: snap(newY), width: snap(newW), height: snap(newH) } : el));
      return;
    }

    if (isDragging && selectedIds.length >= 1) {
      const firstEl = elements.find(el => el.id === selectedIds[0]); if (!firstEl) return;
      const newX = world.x - dragOffset.x; const newY = world.y - dragOffset.y;
      const deltaX = newX - firstEl.x; const deltaY = newY - firstEl.y;
      computeGuides(firstEl, newX, newY);
      setElements(prev => prev.map(el => selectedIds.includes(el.id) ? { ...el, x: snap(el.x + deltaX), y: snap(el.y + deltaY) } : el));
      setDragOffset({ x: world.x - snap(newX), y: world.y - snap(newY) });
    }
    if (isDrawing && drawStart) setDrawCurrent(world);
  }, [isPanning, panStart, isDragging, selectedIds, screenToWorld, snap, dragOffset, isDrawing, drawStart, resizeHandle, resizeStart, computeGuides, selectionBox, elements]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) { setIsPanning(false); setPanStart(null); return; }
    if (selectionBox) {
      const sx = Math.min(selectionBox.start.x, selectionBox.end.x); const sy = Math.min(selectionBox.start.y, selectionBox.end.y);
      const sw = Math.abs(selectionBox.end.x - selectionBox.start.x); const sh = Math.abs(selectionBox.end.y - selectionBox.start.y);
      if (sw > 3 && sh > 3) { const hits = elements.filter(el => el.visible && !el.locked && el.x < sx + sw && el.x + el.width > sx && el.y < sy + sh && el.y + el.height > sy); setSelectedIds(hits.map(h => h.id)); }
      setSelectionBox(null); return;
    }
    if (resizeHandle) { setResizeHandle(null); setResizeStart(null); pushHistory(elements); return; }
    if (isDragging) { setIsDragging(false); setGuides([]); pushHistory(elements); return; }

    if (isDrawing && drawStart) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      const x = snap(Math.min(drawStart.x, world.x)); const y = snap(Math.min(drawStart.y, world.y));
      const w = snap(Math.max(Math.abs(world.x - drawStart.x), 20)); const h = snap(Math.max(Math.abs(world.y - drawStart.y), 20));
      let newEl: DesignElement;
      switch (tool) {
        case 'text': newEl = createEl('text', x, y, 200, 40, { fill: '#333333', text: 'Type here', fontSize: 18, fontWeight: '400', fontFamily: 'Inter' }); break;
        case 'frame': newEl = createEl('frame', x, y, w || 300, h || 200, { fill: '#ffffff', stroke: '#e0e0e0', strokeWidth: 1 }); break;
        case 'star': newEl = createEl('star', x, y, w, h, { fill: '#f59e0b' }); break;
        case 'triangle': newEl = createEl('triangle', x, y, w, h, { fill: '#22c55e' }); break;
        case 'polygon': newEl = createEl('polygon', x, y, w, h, { fill: '#3b82f6' }); break;
        case 'section': newEl = createEl('section', x, y, w || 400, h || 300, { fill: 'transparent', name: 'Section' }); break;
        case 'arrow': newEl = createEl('arrow', x, y, w, h, { fill: '#333', stroke: '#333', strokeWidth: 2 }); break;
        default: newEl = createEl(tool as DesignElement['type'], x, y, w, h);
      }
      const updated = [...elements, newEl]; setElements(updated); setSelectedIds([newEl.id]); pushHistory(updated);
      setIsDrawing(false); setDrawStart(null); setDrawCurrent(null);
    }
  }, [isDrawing, drawStart, screenToWorld, snap, tool, isPanning, isDragging, elements, pushHistory, resizeHandle, selectionBox]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.08 : 0.92; const newZoom = clamp(zoom * factor, 0.05, 20);
      setPan(prev => ({ x: mx - (mx - prev.x) * (newZoom / zoom), y: my - (my - prev.y) * (newZoom / zoom) }));
      setZoom(newZoom);
    } else { setPan(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY })); }
  }, [zoom]);

  // ══════════════════════════════════════════════
  // ACTIONS
  // ══════════════════════════════════════════════
  const deleteSelected = useCallback(() => { const updated = elements.filter(e => !selectedIds.includes(e.id)); setElements(updated); setSelectedIds([]); pushHistory(updated); }, [selectedIds, elements, pushHistory]);
  const duplicateSelected = useCallback(() => { const dupes = elements.filter(e => selectedIds.includes(e.id)).map(e => ({ ...e, id: uid(), x: e.x + 20, y: e.y + 20, name: `${e.name} copy` })); const updated = [...elements, ...dupes]; setElements(updated); setSelectedIds(dupes.map(d => d.id)); pushHistory(updated); }, [elements, selectedIds, pushHistory]);
  const updateSelected = useCallback((updates: Partial<DesignElement>) => { setElements(prev => prev.map(el => selectedIds.includes(el.id) ? { ...el, ...updates } : el)); }, [selectedIds]);
  const commitUpdate = useCallback(() => { pushHistory(elements); }, [elements, pushHistory]);

  const bringForward = useCallback(() => { if (selectedIds.length !== 1) return; const idx = elements.findIndex(e => e.id === selectedIds[0]); if (idx >= elements.length - 1) return; const updated = [...elements]; [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]]; setElements(updated); pushHistory(updated); }, [selectedIds, elements, pushHistory]);
  const sendBackward = useCallback(() => { if (selectedIds.length !== 1) return; const idx = elements.findIndex(e => e.id === selectedIds[0]); if (idx <= 0) return; const updated = [...elements]; [updated[idx], updated[idx - 1]] = [updated[idx - 1], updated[idx]]; setElements(updated); pushHistory(updated); }, [selectedIds, elements, pushHistory]);
  const bringToFront = useCallback(() => { if (selectedIds.length !== 1) return; const el = elements.find(e => e.id === selectedIds[0]); if (!el) return; const updated = [...elements.filter(e => e.id !== el.id), el]; setElements(updated); pushHistory(updated); }, [selectedIds, elements, pushHistory]);
  const sendToBack = useCallback(() => { if (selectedIds.length !== 1) return; const el = elements.find(e => e.id === selectedIds[0]); if (!el) return; const updated = [el, ...elements.filter(e => e.id !== el.id)]; setElements(updated); pushHistory(updated); }, [selectedIds, elements, pushHistory]);

  const alignSelected = useCallback((align: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom') => {
    if (selectedIds.length < 2) return;
    const selected = elements.filter(e => selectedIds.includes(e.id));
    const bounds = { left: Math.min(...selected.map(e => e.x)), right: Math.max(...selected.map(e => e.x + e.width)), top: Math.min(...selected.map(e => e.y)), bottom: Math.max(...selected.map(e => e.y + e.height)) };
    const updated = elements.map(el => {
      if (!selectedIds.includes(el.id)) return el;
      switch (align) {
        case 'left': return { ...el, x: bounds.left }; case 'right': return { ...el, x: bounds.right - el.width }; case 'centerH': return { ...el, x: (bounds.left + bounds.right) / 2 - el.width / 2 };
        case 'top': return { ...el, y: bounds.top }; case 'bottom': return { ...el, y: bounds.bottom - el.height }; case 'centerV': return { ...el, y: (bounds.top + bounds.bottom) / 2 - el.height / 2 };
        default: return el;
      }
    });
    setElements(updated); pushHistory(updated);
  }, [selectedIds, elements, pushHistory]);

  const distributeSelected = useCallback((axis: 'h' | 'v') => {
    if (selectedIds.length < 3) return;
    const selected = elements.filter(e => selectedIds.includes(e.id)).sort((a, b) => axis === 'h' ? a.x - b.x : a.y - b.y);
    const first = selected[0]; const last = selected[selected.length - 1];
    const totalSpace = axis === 'h' ? (last.x + last.width) - first.x - selected.reduce((s, e) => s + e.width, 0) : (last.y + last.height) - first.y - selected.reduce((s, e) => s + e.height, 0);
    const gap = totalSpace / (selected.length - 1);
    let pos = axis === 'h' ? first.x + first.width + gap : first.y + first.height + gap;
    const posMap: Record<string, number> = {};
    for (let i = 1; i < selected.length - 1; i++) { posMap[selected[i].id] = pos; pos += (axis === 'h' ? selected[i].width : selected[i].height) + gap; }
    const updated = elements.map(el => posMap[el.id] !== undefined ? (axis === 'h' ? { ...el, x: posMap[el.id] } : { ...el, y: posMap[el.id] }) : el);
    setElements(updated); pushHistory(updated);
  }, [selectedIds, elements, pushHistory]);

  // ── Group / Ungroup ──
  const groupSelected = useCallback(() => {
    if (selectedIds.length < 2) return;
    const selected = elements.filter(e => selectedIds.includes(e.id));
    const bounds = {
      x: Math.min(...selected.map(e => e.x)), y: Math.min(...selected.map(e => e.y)),
      w: Math.max(...selected.map(e => e.x + e.width)), h: Math.max(...selected.map(e => e.y + e.height)),
    };
    const groupId = uid();
    const groupEl = createEl('group', bounds.x, bounds.y, bounds.w - bounds.x, bounds.h - bounds.y, {
      name: 'Group', fill: 'transparent', children: selectedIds, id: groupId,
    });
    const updated = [...elements.map(el => selectedIds.includes(el.id) ? { ...el, parentId: groupId } : el), groupEl];
    setElements(updated); setSelectedIds([groupId]); pushHistory(updated);
    toast.success('Grouped');
  }, [selectedIds, elements, pushHistory]);

  const ungroupSelected = useCallback(() => {
    const sel = elements.filter(e => selectedIds.includes(e.id) && e.type === 'group');
    if (sel.length === 0) return;
    const groupIds = sel.map(g => g.id);
    const childIds = elements.filter(e => e.parentId && groupIds.includes(e.parentId)).map(e => e.id);
    const updated = elements.filter(e => !groupIds.includes(e.id)).map(e => groupIds.includes(e.parentId || '') ? { ...e, parentId: undefined } : e);
    setElements(updated); setSelectedIds(childIds); pushHistory(updated);
    toast.success('Ungrouped');
  }, [selectedIds, elements, pushHistory]);

  // ── Copy / Paste Style ──
  const [copiedStyle, setCopiedStyle] = useState<Partial<DesignElement> | null>(null);

  const copyStyle = useCallback(() => {
    if (!selectedEl) return;
    const { fill, stroke, strokeWidth, opacity, borderRadius, shadowX, shadowY, shadowBlur, shadowColor, blur, gradientType, gradientStart, gradientEnd, gradientAngle, blendMode, fontFamily, fontSize, fontWeight, fontStyle, textAlign, lineHeight, letterSpacing, textDecoration } = selectedEl;
    setCopiedStyle({ fill, stroke, strokeWidth, opacity, borderRadius, shadowX, shadowY, shadowBlur, shadowColor, blur, gradientType, gradientStart, gradientEnd, gradientAngle, blendMode, fontFamily, fontSize, fontWeight, fontStyle, textAlign, lineHeight, letterSpacing, textDecoration });
    toast.success('Style copied');
  }, [selectedEl]);

  const pasteStyle = useCallback(() => {
    if (!copiedStyle || selectedIds.length === 0) return;
    const updated = elements.map(el => selectedIds.includes(el.id) ? { ...el, ...copiedStyle } : el);
    setElements(updated); pushHistory(updated);
    toast.success('Style pasted');
  }, [copiedStyle, selectedIds, elements, pushHistory]);

  // ── Deferred functions (need pushHistory/selectedEl) ──
  const createComponent = useCallback(() => {
    if (selectedIds.length === 0) return;
    const selected = elements.filter(e => selectedIds.includes(e.id));
    const comp = { id: uid(), name: `Component ${localComponents.length + 1}`, elements: JSON.parse(JSON.stringify(selected)) };
    setLocalComponents(prev => [...prev, comp]);
    toast.success(`Component created: ${comp.name}`);
  }, [selectedIds, elements, localComponents]);

  const insertComponent = useCallback((comp: { elements: DesignElement[] }) => {
    const centerX = (-pan.x + (containerRef.current?.clientWidth || 800) / 2) / zoom - 100;
    const centerY = (-pan.y + (containerRef.current?.clientHeight || 600) / 2) / zoom - 100;
    const bounds = { x: Math.min(...comp.elements.map(e => e.x)), y: Math.min(...comp.elements.map(e => e.y)) };
    const instances = comp.elements.map(el => ({ ...el, id: uid(), x: el.x - bounds.x + centerX, y: el.y - bounds.y + centerY }));
    const updated = [...elements, ...instances];
    setElements(updated); setSelectedIds(instances.map(e => e.id)); pushHistory(updated);
  }, [elements, pan, zoom, pushHistory]);

  const flattenSelected = useCallback(() => {
    if (selectedIds.length < 2) return;
    const selected = elements.filter(e => selectedIds.includes(e.id));
    const bounds = {
      x: Math.min(...selected.map(e => e.x)), y: Math.min(...selected.map(e => e.y)),
      x2: Math.max(...selected.map(e => e.x + e.width)), y2: Math.max(...selected.map(e => e.y + e.height)),
    };
    const merged = createEl('rectangle', bounds.x, bounds.y, bounds.x2 - bounds.x, bounds.y2 - bounds.y, {
      name: 'Flattened', fill: selected[0].fill, stroke: selected[0].stroke, strokeWidth: selected[0].strokeWidth,
    });
    const updated = [...elements.filter(e => !selectedIds.includes(e.id)), merged];
    setElements(updated); setSelectedIds([merged.id]); pushHistory(updated);
    toast.success('Flattened');
  }, [selectedIds, elements, pushHistory]);

  const exportElementAsPNG = useCallback((scale: number) => {
    if (!selectedEl) return;
    const offscreen = document.createElement('canvas');
    offscreen.width = selectedEl.width * scale;
    offscreen.height = selectedEl.height * scale;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.fillStyle = selectedEl.fill !== 'transparent' ? selectedEl.fill : '#ffffff';
    if (selectedEl.type === 'ellipse') {
      ctx.beginPath(); ctx.ellipse(selectedEl.width / 2, selectedEl.height / 2, selectedEl.width / 2, selectedEl.height / 2, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      const r = Math.min(selectedEl.borderRadius, Math.min(selectedEl.width, selectedEl.height) / 2);
      if (r > 0) { roundRect(ctx, 0, 0, selectedEl.width, selectedEl.height, r); ctx.fill(); }
      else ctx.fillRect(0, 0, selectedEl.width, selectedEl.height);
    }
    offscreen.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${selectedEl.name}-${scale}x.png`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${selectedEl.name} at ${scale}x`);
    });
  }, [selectedEl]);

  // ── Clipboard copy/paste elements ──
  const copyElements = useCallback(() => {
    if (selectedIds.length === 0) return;
    setClipboard(JSON.parse(JSON.stringify(elements.filter(e => selectedIds.includes(e.id)))));
    toast.success('Copied');
  }, [selectedIds, elements]);

  const pasteElements = useCallback(() => {
    if (clipboard.length === 0) return;
    const pasted = clipboard.map(el => ({ ...el, id: uid(), x: el.x + 30, y: el.y + 30, name: `${el.name} copy` }));
    const updated = [...elements, ...pasted];
    setElements(updated); setSelectedIds(pasted.map(e => e.id)); pushHistory(updated);
    toast.success('Pasted');
  }, [clipboard, elements, pushHistory]);

  const cutElements = useCallback(() => {
    copyElements();
    deleteSelected();
  }, [copyElements, deleteSelected]);

  // ── Inline text editing ──
  const startTextEditing = useCallback((elId: string) => {
    const el = elements.find(e => e.id === elId);
    if (!el || el.type !== 'text') return;
    setEditingTextId(elId);
    setEditingTextValue(el.text || '');
    setTimeout(() => textInputRef.current?.focus(), 50);
  }, [elements]);

  const commitTextEdit = useCallback(() => {
    if (!editingTextId) return;
    const updated = elements.map(el => el.id === editingTextId ? { ...el, text: editingTextValue } : el);
    setElements(updated); pushHistory(updated);
    setEditingTextId(null);
  }, [editingTextId, editingTextValue, elements, pushHistory]);

  // ── Frame presets ──
  const insertFramePreset = useCallback((preset: { label: string; w: number; h: number }) => {
    const centerX = (-pan.x + (containerRef.current?.clientWidth || 800) / 2) / zoom - preset.w / 2;
    const centerY = (-pan.y + (containerRef.current?.clientHeight || 600) / 2) / zoom - preset.h / 2;
    const el = createEl('frame', centerX, centerY, preset.w, preset.h, {
      name: preset.label, fill: '#ffffff', stroke: '#e0e0e0', strokeWidth: 1,
    });
    const updated = [...elements, el];
    setElements(updated); setSelectedIds([el.id]); pushHistory(updated);
    setShowFramePresets(false);
    toast.success(`Frame: ${preset.label}`);
  }, [elements, pan, zoom, pushHistory]);

  // ── Zoom to fit ──
  const zoomToFit = useCallback(() => {
    if (elements.length === 0) { setZoom(1); setPan({ x: 0, y: 0 }); return; }
    const bounds = {
      x: Math.min(...elements.map(e => e.x)), y: Math.min(...elements.map(e => e.y)),
      x2: Math.max(...elements.map(e => e.x + e.width)), y2: Math.max(...elements.map(e => e.y + e.height)),
    };
    const cw = containerRef.current?.clientWidth || 800;
    const ch = containerRef.current?.clientHeight || 600;
    const bw = bounds.x2 - bounds.x + 100; const bh = bounds.y2 - bounds.y + 100;
    const newZoom = clamp(Math.min(cw / bw, ch / bh), 0.05, 20);
    setZoom(newZoom);
    setPan({ x: (cw - bw * newZoom) / 2 - bounds.x * newZoom + 50 * newZoom, y: (ch - bh * newZoom) / 2 - bounds.y * newZoom + 50 * newZoom });
  }, [elements]);

  // ── Measurement between elements ──
  const measurementGuides = useMemo(() => {
    if (!showMeasurements || selectedIds.length !== 1) return [];
    const sel = elements.find(e => e.id === selectedIds[0]);
    if (!sel) return [];
    const measurements: { x1: number; y1: number; x2: number; y2: number; dist: number; axis: 'h' | 'v' }[] = [];
    for (const other of elements) {
      if (other.id === sel.id || !other.visible) continue;
      // Horizontal distance
      if (sel.y < other.y + other.height && sel.y + sel.height > other.y) {
        const midY = Math.max(sel.y, other.y) + (Math.min(sel.y + sel.height, other.y + other.height) - Math.max(sel.y, other.y)) / 2;
        if (sel.x + sel.width < other.x) {
          measurements.push({ x1: sel.x + sel.width, y1: midY, x2: other.x, y2: midY, dist: other.x - sel.x - sel.width, axis: 'h' });
        } else if (other.x + other.width < sel.x) {
          measurements.push({ x1: other.x + other.width, y1: midY, x2: sel.x, y2: midY, dist: sel.x - other.x - other.width, axis: 'h' });
        }
      }
      // Vertical distance
      if (sel.x < other.x + other.width && sel.x + sel.width > other.x) {
        const midX = Math.max(sel.x, other.x) + (Math.min(sel.x + sel.width, other.x + other.width) - Math.max(sel.x, other.x)) / 2;
        if (sel.y + sel.height < other.y) {
          measurements.push({ x1: midX, y1: sel.y + sel.height, x2: midX, y2: other.y, dist: other.y - sel.y - sel.height, axis: 'v' });
        } else if (other.y + other.height < sel.y) {
          measurements.push({ x1: midX, y1: other.y + other.height, x2: midX, y2: sel.y, dist: sel.y - other.y - other.height, axis: 'v' });
        }
      }
    }
    return measurements.slice(0, 6); // limit
  }, [showMeasurements, selectedIds, elements]);

  // ── Command Palette items ──
  const commandItems = useMemo((): CommandItem[] => [
    { label: 'Select tool', shortcut: 'V', action: () => setTool('select'), category: 'Tools' },
    { label: 'Hand tool', shortcut: 'H', action: () => setTool('hand'), category: 'Tools' },
    { label: 'Rectangle', shortcut: 'R', action: () => setTool('rectangle'), category: 'Tools' },
    { label: 'Ellipse', shortcut: 'O', action: () => setTool('ellipse'), category: 'Tools' },
    { label: 'Text', shortcut: 'T', action: () => setTool('text'), category: 'Tools' },
    { label: 'Frame', shortcut: 'F', action: () => setTool('frame'), category: 'Tools' },
    { label: 'Line', shortcut: 'L', action: () => setTool('line'), category: 'Tools' },
    { label: 'Pen', shortcut: 'P', action: () => setTool('pen'), category: 'Tools' },
    { label: 'Star', shortcut: 'S', action: () => setTool('star'), category: 'Tools' },
    { label: 'Undo', shortcut: '⌘Z', action: undo, category: 'Edit' },
    { label: 'Redo', shortcut: '⌘Y', action: redo, category: 'Edit' },
    { label: 'Copy', shortcut: '⌘C', action: copyElements, category: 'Edit' },
    { label: 'Paste', shortcut: '⌘V', action: pasteElements, category: 'Edit' },
    { label: 'Cut', shortcut: '⌘X', action: cutElements, category: 'Edit' },
    { label: 'Delete selected', shortcut: '⌫', action: deleteSelected, category: 'Edit' },
    { label: 'Duplicate', shortcut: '⌘D', action: duplicateSelected, category: 'Edit' },
    { label: 'Select all', shortcut: '⌘A', action: () => setSelectedIds(elements.map(e => e.id)), category: 'Edit' },
    { label: 'Group', shortcut: '⌘G', action: groupSelected, category: 'Edit' },
    { label: 'Ungroup', shortcut: '⌘⇧G', action: ungroupSelected, category: 'Edit' },
    { label: 'Bring to front', shortcut: '⌘⇧]', action: bringToFront, category: 'Arrange' },
    { label: 'Send to back', shortcut: '⌘⇧[', action: sendToBack, category: 'Arrange' },
    { label: 'Bring forward', shortcut: '⌘]', action: bringForward, category: 'Arrange' },
    { label: 'Send backward', shortcut: '⌘[', action: sendBackward, category: 'Arrange' },
    { label: 'Zoom to fit', shortcut: '⌘1', action: zoomToFit, category: 'View' },
    { label: 'Zoom to 100%', shortcut: '⌘0', action: () => { setZoom(1); setPan({ x: 0, y: 0 }); }, category: 'View' },
    { label: 'Toggle grid', shortcut: '', action: () => setShowGrid(g => !g), category: 'View' },
    { label: 'Toggle snap', shortcut: '', action: () => setSnapToGrid(s => !s), category: 'View' },
    { label: 'Toggle measurements', shortcut: 'Alt', action: () => setShowMeasurements(m => !m), category: 'View' },
    { label: 'Copy style', shortcut: '⌘⌥C', action: copyStyle, category: 'Style' },
    { label: 'Paste style', shortcut: '⌘⌥V', action: pasteStyle, category: 'Style' },
    { label: 'Create component', shortcut: '⌘⌥K', action: createComponent, category: 'Component' },
    { label: 'Flatten selection', shortcut: '', action: flattenSelected, category: 'Edit' },
    { label: 'Save', shortcut: '⌘S', action: saveProject, category: 'File' },
    { label: 'Go home', shortcut: '', action: goHome, category: 'File' },
  ], [undo, redo, copyElements, pasteElements, cutElements, deleteSelected, duplicateSelected, elements, groupSelected, ungroupSelected, bringToFront, sendToBack, bringForward, sendBackward, zoomToFit, copyStyle, pasteStyle, createComponent, flattenSelected, saveProject, goHome]);

  const filteredCommands = useMemo(() => {
    const q = commandSearch.trim().toLowerCase();
    if (!q) return commandItems;
    return commandItems.filter(c => c.label.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
  }, [commandSearch, commandItems]);


  const handleEyedrop = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const px = (e.clientX - rect.left) * dpr;
    const py = (e.clientY - rect.top) * dpr;
    const pixel = ctx.getImageData(px, py, 1, 1).data;
    const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('');
    if (selectedIds.length > 0) {
      updateSelected({ fill: hex }); commitUpdate();
    }
    navigator.clipboard.writeText(hex);
    toast.success(`Picked ${hex}`);
    setTool('select');
  }, [selectedIds, updateSelected, commitUpdate]);

  // ── Image placement ──
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const placeImage = useCallback(() => {
    if (!imageUrlInput.trim()) return;
    const centerX = (-pan.x + (containerRef.current?.clientWidth || 800) / 2) / zoom - 100;
    const centerY = (-pan.y + (containerRef.current?.clientHeight || 600) / 2) / zoom - 60;
    const el = createEl('image', centerX, centerY, 200, 150, { name: 'Image', fill: '#e5e5e5', imageUrl: imageUrlInput.trim() });
    const updated = [...elements, el];
    setElements(updated); setSelectedIds([el.id]); pushHistory(updated);
    setShowImageDialog(false); setImageUrlInput(''); setTool('select');
    toast.success('Image placed');
  }, [imageUrlInput, elements, pan, zoom, pushHistory]);

  // ── Context menu ──
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (view !== 'editor') return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const meta = e.ctrlKey || e.metaKey;

      // Command palette
      if ((meta && e.key === '/') || (meta && e.key === 'k')) { e.preventDefault(); setShowCommandPalette(p => !p); setCommandSearch(''); return; }

      if (meta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (meta && e.key === 'c' && !e.altKey) { e.preventDefault(); copyElements(); return; }
      if (meta && e.key === 'v' && !e.altKey) { e.preventDefault(); pasteElements(); return; }
      if (meta && e.key === 'x') { e.preventDefault(); cutElements(); return; }
      if (meta && e.key === 'd') { e.preventDefault(); duplicateSelected(); return; }
      if (meta && e.key === 's') { e.preventDefault(); saveProject(); return; }
      if (meta && e.key === 'a') { e.preventDefault(); setSelectedIds(elements.map(e => e.id)); return; }
      if (meta && e.key === 'g' && !e.shiftKey) { e.preventDefault(); groupSelected(); return; }
      if (meta && e.key === 'g' && e.shiftKey) { e.preventDefault(); ungroupSelected(); return; }
      if (meta && e.altKey && e.key === 'c') { e.preventDefault(); copyStyle(); return; }
      if (meta && e.altKey && e.key === 'v') { e.preventDefault(); pasteStyle(); return; }
      if (meta && e.altKey && e.key === 'k') { e.preventDefault(); createComponent(); return; }
      if (meta && e.key === ']') { e.preventDefault(); bringForward(); return; }
      if (meta && e.key === '[') { e.preventDefault(); sendBackward(); return; }
      if (meta && e.shiftKey && e.key === ']') { e.preventDefault(); bringToFront(); return; }
      if (meta && e.shiftKey && e.key === '[') { e.preventDefault(); sendToBack(); return; }
      if (meta && e.key === '1') { e.preventDefault(); zoomToFit(); return; }
      if (meta && e.key === '0') { e.preventDefault(); setZoom(1); setPan({ x: 0, y: 0 }); return; }

      // Alt for measurement mode
      if (e.key === 'Alt') { setShowMeasurements(true); return; }

      // Arrow key nudging
      const nudge = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft' && selectedIds.length > 0) { e.preventDefault(); setElements(prev => prev.map(el => selectedIds.includes(el.id) ? { ...el, x: el.x - nudge } : el)); return; }
      if (e.key === 'ArrowRight' && selectedIds.length > 0) { e.preventDefault(); setElements(prev => prev.map(el => selectedIds.includes(el.id) ? { ...el, x: el.x + nudge } : el)); return; }
      if (e.key === 'ArrowUp' && selectedIds.length > 0) { e.preventDefault(); setElements(prev => prev.map(el => selectedIds.includes(el.id) ? { ...el, y: el.y - nudge } : el)); return; }
      if (e.key === 'ArrowDown' && selectedIds.length > 0) { e.preventDefault(); setElements(prev => prev.map(el => selectedIds.includes(el.id) ? { ...el, y: el.y + nudge } : el)); return; }

      // Enter to start editing text
      if (e.key === 'Enter' && selectedIds.length === 1) {
        const sel = elements.find(el => el.id === selectedIds[0]);
        if (sel?.type === 'text') { e.preventDefault(); startTextEditing(sel.id); return; }
      }

      switch (e.key) {
        case 'v': case 'V': setTool('select'); break;
        case 'h': case 'H': setTool('hand'); break;
        case 'r': case 'R': setTool('rectangle'); break;
        case 'o': case 'O': setTool('ellipse'); break;
        case 't': case 'T': setTool('text'); break;
        case 'l': case 'L': setTool('line'); break;
        case 'f': case 'F': setTool('frame'); break;
        case 's': case 'S': if (!meta) setTool('star'); break;
        case 'p': case 'P': setTool('pen'); break;
        case 'i': case 'I': setTool('eyedropper'); break;
        case 'k': case 'K': setTool('scale'); break;
        case 'Delete': case 'Backspace': deleteSelected(); break;
        case 'Escape':
          if (showCommandPalette) { setShowCommandPalette(false); }
          else if (editingTextId) { commitTextEdit(); }
          else { setSelectedIds([]); setTool('select'); setContextMenu(null); }
          break;
      }
    };
    const keyup = (e: KeyboardEvent) => { if (e.key === 'Alt') setShowMeasurements(false); };
    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', keyup);
    return () => { window.removeEventListener('keydown', handler); window.removeEventListener('keyup', keyup); };
  }, [view, deleteSelected, duplicateSelected, undo, redo, elements, saveProject, groupSelected, ungroupSelected, copyStyle, pasteStyle, bringForward, sendBackward, bringToFront, sendToBack, selectedIds, copyElements, pasteElements, cutElements, zoomToFit, createComponent, showCommandPalette, editingTextId, commitTextEdit, startTextEditing]);

  // Export
  const exportToWorkshop = () => {
    const workshopElements = elements.map(el => ({ id: uid(), type: el.type === 'text' ? 'text' : 'container', name: el.name, props: el.type === 'text' ? { text: el.text || '' } : {}, styles: { desktop: { position: 'absolute' as const, left: `${el.x}px`, top: `${el.y}px`, width: `${el.width}px`, height: `${el.height}px`, backgroundColor: el.fill, borderRadius: el.type === 'ellipse' ? '50%' : `${el.borderRadius}px`, opacity: String(el.opacity) } }, children: [] }));
    localStorage.setItem('figma-export', JSON.stringify(workshopElements));
    toast.success('Design exported to Workshop');
  };

  const insertStudioComponent = useCallback((comp: typeof STUDIO_COMPONENTS[0]) => {
    const centerX = (-pan.x + (containerRef.current?.clientWidth || 800) / 2) / zoom - 100;
    const centerY = (-pan.y + (containerRef.current?.clientHeight || 600) / 2) / zoom - 100;
    const newEls = comp.elements.map(partial => createEl(
      (partial.type || 'rectangle') as DesignElement['type'],
      centerX + (partial.x || 0), centerY + (partial.y || 0),
      partial.width || 100, partial.height || 40,
      { ...partial, name: partial.name || comp.name } as Partial<DesignElement>
    ));
    const updated = [...elements, ...newEls];
    setElements(updated);
    setSelectedIds(newEls.map(e => e.id));
    pushHistory(updated);
    toast.success(`Added ${comp.name}`);
  }, [elements, pan, zoom, pushHistory]);

  const exportAsSVG = () => {
    let svgParts: string[] = [];
    const bounds = elements.reduce((b, el) => ({ x: Math.min(b.x, el.x), y: Math.min(b.y, el.y), w: Math.max(b.w, el.x + el.width), h: Math.max(b.h, el.y + el.height) }), { x: Infinity, y: Infinity, w: 0, h: 0 });
    for (const el of elements) {
      if (!el.visible) continue; const fill = el.fill === 'transparent' ? 'none' : el.fill; const stroke = el.stroke === 'transparent' ? 'none' : el.stroke;
      switch (el.type) {
        case 'rectangle': case 'frame': svgParts.push(`<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${el.borderRadius}" fill="${fill}" stroke="${stroke}" stroke-width="${el.strokeWidth}" opacity="${el.opacity}" />`); break;
        case 'ellipse': svgParts.push(`<ellipse cx="${el.x + el.width / 2}" cy="${el.y + el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${el.strokeWidth}" opacity="${el.opacity}" />`); break;
        case 'text': svgParts.push(`<text x="${el.x}" y="${el.y + (el.fontSize || 16)}" fill="${fill}" font-size="${el.fontSize || 16}" font-weight="${el.fontWeight || '400'}" font-family="${el.fontFamily || 'Inter'}" opacity="${el.opacity}">${el.text || ''}</text>`); break;
      }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.x - 20} ${bounds.y - 20} ${bounds.w - bounds.x + 40} ${bounds.h - bounds.y + 40}">\n${svgParts.join('\n')}\n</svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'workshop-studio-export.svg'; a.click(); URL.revokeObjectURL(url);
    toast.success('SVG exported');
  };

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  const SectionHeader = ({ label, sectionKey }: { label: string; sectionKey: string }) => (
    <button onClick={() => toggleSection(sectionKey)} className="w-full flex items-center justify-between py-1.5 px-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
      {label}
      {expandedSections[sectionKey] ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
    </button>
  );

  const cursorStyle = useMemo(() => {
    if (isPanning) return 'grabbing'; if (tool === 'hand') return 'grab';
    if (tool === 'eyedropper') return 'crosshair';
    if (tool === 'scale') return 'nwse-resize';
    if (tool === 'select') return resizeHandle ? `${resizeHandle}-resize` : 'default';
    return 'crosshair';
  }, [tool, isPanning, resizeHandle]);

  // Tool bar items for bottom toolbar (like Figma)
  const toolItems: { key: Tool; icon: typeof MousePointer2; label: string; shortcut: string; separator?: boolean }[] = [
    { key: 'select', icon: MousePointer2, label: 'Move', shortcut: 'V' },
    { key: 'hand', icon: Hand, label: 'Hand', shortcut: 'H' },
    { key: 'scale', icon: Maximize2, label: 'Scale', shortcut: 'K', separator: true },
    { key: 'frame', icon: Frame, label: 'Frame', shortcut: 'F' },
    { key: 'section', icon: SquareDashedBottom, label: 'Section', shortcut: '' },
    { key: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
    { key: 'ellipse', icon: Circle, label: 'Ellipse', shortcut: 'O' },
    { key: 'triangle', icon: Triangle, label: 'Triangle', shortcut: '' },
    { key: 'star', icon: Star, label: 'Star', shortcut: 'S' },
    { key: 'polygon', icon: Hexagon, label: 'Polygon', shortcut: '', separator: true },
    { key: 'pen', icon: Pen, label: 'Pen', shortcut: 'P' },
    { key: 'text', icon: Type, label: 'Text', shortcut: 'T' },
    { key: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
    { key: 'arrow', icon: ArrowUpRight, label: 'Arrow', shortcut: '', separator: true },
    { key: 'image', icon: Image, label: 'Image', shortcut: '' },
    { key: 'eyedropper', icon: Pipette, label: 'Eyedropper', shortcut: 'I' },
    { key: 'slice', icon: Scissors, label: 'Slice', shortcut: '' },
  ];

  // ═══════════════════════════════════════════════
  // HOME VIEW
  // ═══════════════════════════════════════════════
  if (view === 'home') {
    return <HomeDashboard onOpenProject={openProject} onNewProject={newProject} onBack={() => navigate('/lounge/website-designer')} />;
  }

  // ═══════════════════════════════════════════════
  // EDITOR VIEW (Figma-style layout)
  // ═══════════════════════════════════════════════
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* ═══ MINIMAL TOP BAR (like Figma) ═══ */}
      <div className="h-10 flex items-center justify-between px-3 shrink-0 bg-card border-b border-border/60 overflow-hidden">
        {/* Left: Logo + File name */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <div className="flex items-center gap-0.5">
            <button onClick={goHome} className="p-1.5 rounded-lg hover:bg-foreground/[0.05] transition-colors" title="Back">
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <button onClick={() => window.history.forward()} className="p-1.5 rounded-lg hover:bg-foreground/[0.05] transition-colors" title="Forward">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <button onClick={goHome} className="w-8 h-8 rounded-lg border border-border/60 bg-card flex items-center justify-center hover:bg-foreground/[0.03] transition-colors">
            <Frame className="h-3.5 w-3.5 text-primary" />
          </button>
          <div className="flex items-center gap-1.5">
            <input
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              onBlur={saveProject}
              className="text-[13px] font-medium text-foreground bg-transparent border-none outline-none w-36 hover:bg-foreground/[0.03] rounded px-1.5 py-0.5 focus:bg-sunken"
            />
            <span className="text-[10px] text-muted-foreground/60 font-medium">Drafts</span>
          </div>
        </div>

        {/* Center: minimal controls */}
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip><TooltipTrigger asChild>
            <button onClick={undo} disabled={historyIdx <= 0} className="p-1.5 rounded-md hover:bg-foreground/[0.05] disabled:opacity-20 transition-colors">
              <Undo2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </TooltipTrigger><TooltipContent side="bottom" className="text-[11px]">Undo (⌘Z)</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <button onClick={redo} disabled={historyIdx >= history.length - 1} className="p-1.5 rounded-md hover:bg-foreground/[0.05] disabled:opacity-20 transition-colors">
              <Redo2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </TooltipTrigger><TooltipContent side="bottom" className="text-[11px]">Redo (⌘Y)</TooltipContent></Tooltip>
        </div>

        {/* Right: View + Share + Export */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center gap-0.5 bg-sunken rounded-lg px-2 py-0.5">
            <button onClick={() => setZoom(z => clamp(z * 0.9, 0.05, 20))} className="p-0.5"><ZoomOut className="h-3.5 w-3.5 text-muted-foreground" /></button>
            <button onClick={() => setShowZoomPresets(p => !p)} className="font-mono tabular-nums text-[11px] text-ink-2 w-10 text-center font-medium hover:text-foreground">{Math.round(zoom * 100)}%</button>
            <button onClick={() => setZoom(z => clamp(z * 1.1, 0.05, 20))} className="p-0.5"><ZoomIn className="h-3.5 w-3.5 text-muted-foreground" /></button>
            {showZoomPresets && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowZoomPresets(false)} />
                <div className="absolute top-full right-0 mt-1 z-50 bg-card rounded-xl shadow-lg border border-border/60 py-1 w-36">
                  {ZOOM_PRESETS.map(p => (
                    <button key={p.label} onClick={() => { p.value === -1 ? zoomToFit() : (() => { setZoom(p.value); setPan({ x: 0, y: 0 }); })(); setShowZoomPresets(false); }}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-[12px] text-ink-2 hover:bg-foreground/[0.03]">
                      <span>{p.label}</span>
                      {p.value !== -1 && Math.round(zoom * 100) === Math.round(p.value * 100) && <span className="text-primary">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded-md transition-colors ${showGrid ? 'bg-primary/10 text-primary' : 'hover:bg-foreground/[0.05] text-muted-foreground'}`}>
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setSnapToGrid(!snapToGrid)} className={`p-1.5 rounded-md transition-colors ${snapToGrid ? 'bg-primary/10 text-primary' : 'hover:bg-foreground/[0.05] text-muted-foreground'}`}>
            <Magnet className="h-3.5 w-3.5" />
          </button>

          <div className="h-5 w-px bg-border/60 mx-1" />

          <Button size="sm" onClick={exportAsSVG} variant="outline" className="h-7 text-[11px] border-border/60 text-ink-2 hover:text-foreground bg-card">SVG</Button>
          <Button size="sm" onClick={exportToWorkshop} className="h-7 text-[11px] bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-lg">
            <Download className="h-3 w-3 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* ═══ MAIN AREA ═══ */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ═══ LEFT PANEL (Pages / Layers / Assets - like Figma) ═══ */}
        {showLeftPanel && (
          <div className="w-56 border-r border-border/60 bg-card shrink-0 flex flex-col">
            {/* Tabs */}
            <div className="flex items-center border-b border-border/40 px-1">
              {[
                { key: 'pages' as LeftTab, label: 'Pages' },
                { key: 'file' as LeftTab, label: 'Layers' },
                { key: 'assets' as LeftTab, label: 'Assets' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setLeftTab(tab.key)} className={`flex-1 py-2.5 text-[11px] font-medium text-center transition-colors ${leftTab === tab.key ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {leftTab === 'pages' ? (
                // Pages panel
                <div className="p-2">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Pages</span>
                    <button onClick={addPage} className="p-1 rounded hover:bg-foreground/[0.05]"><Plus className="h-3 w-3 text-muted-foreground" /></button>
                  </div>
                  {pages.map(page => (
                    <div key={page.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group ${activePageId === page.id ? 'bg-primary/10' : 'hover:bg-foreground/[0.03]'}`}
                      onClick={() => switchPage(page.id)}>
                      <FileText className={`h-3.5 w-3.5 shrink-0 ${activePageId === page.id ? 'text-primary' : 'text-muted-foreground/60'}`} />
                      <input
                        value={page.name}
                        onChange={e => renamePage(page.id, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className={`text-[12px] bg-transparent border-none outline-none flex-1 min-w-0 ${activePageId === page.id ? 'text-primary font-medium' : 'text-ink-2'}`}
                      />
                      {pages.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); deletePage(page.id); }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-risk/10">
                          <Trash className="h-3 w-3 text-muted-foreground/60 hover:text-risk" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Local Components */}
                  {localComponents.length > 0 && (
                    <div className="mt-4 border-t border-border/40 pt-2">
                      <div className="flex items-center justify-between px-1 mb-2">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Local components</span>
                      </div>
                      {localComponents.map(comp => (
                        <button key={comp.id} onClick={() => insertComponent(comp)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-foreground/[0.04] text-left">
                          <Component className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-[11px] text-ink-2 truncate">{comp.name}</span>
                          <span className="text-[9px] text-muted-foreground/60 ml-auto">{comp.elements.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : leftTab === 'file' ? (
                // Layers
                <div>
                  {elements.length === 0 ? (
                    <div className="text-center py-16 px-4">
                      <Layers className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-[12px] text-muted-foreground">No layers yet</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">Draw something on the canvas</p>
                    </div>
                  ) : (
                    [...elements].reverse().map(el => {
                      const TypeIcon = el.type === 'rectangle' ? Square : el.type === 'ellipse' ? Circle : el.type === 'text' ? Type : el.type === 'line' ? Minus : el.type === 'frame' ? Frame : el.type === 'star' ? Star : el.type === 'triangle' ? Triangle : el.type === 'polygon' ? Hexagon : el.type === 'group' ? Group : el.type === 'section' ? SquareDashedBottom : el.type === 'arrow' ? ArrowUpRight : el.type === 'image' ? Image : Square;
                      const isSelected = selectedIds.includes(el.id);
                      return (
                        <button
                          key={el.id}
                          onClick={(e) => e.shiftKey ? setSelectedIds(prev => prev.includes(el.id) ? prev.filter(id => id !== el.id) : [...prev, el.id]) : setSelectedIds([el.id])}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors group ${isSelected ? 'bg-primary/10' : 'hover:bg-foreground/[0.03]'}`}
                        >
                          <TypeIcon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground/60'}`} />
                          <span className={`text-[12px] truncate flex-1 ${isSelected ? 'text-primary font-medium' : 'text-ink-2'}`}>{el.name}</span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                            <button onClick={(e) => { e.stopPropagation(); const u = elements.map(x => x.id === el.id ? { ...x, visible: !x.visible } : x); setElements(u); }} className="p-0.5">
                              {el.visible ? <Eye className="h-3 w-3 text-muted-foreground/60" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); const u = elements.map(x => x.id === el.id ? { ...x, locked: !x.locked } : x); setElements(u); }} className="p-0.5">
                              {el.locked ? <Lock className="h-3 w-3 text-muted-foreground" /> : <Unlock className="h-3 w-3 text-muted-foreground/60" />}
                            </button>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              ) : (
                // Assets library with 152 components
                <div className="p-3 flex flex-col h-full">
                  <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <input
                      placeholder="Search 152 components..."
                      value={assetSearch}
                      onChange={e => setAssetSearch(e.target.value)}
                      className="w-full h-7 pl-8 pr-3 text-[11px] bg-sunken border border-border/60 rounded-md text-ink-2 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1">
                    {(() => {
                      const q = assetSearch.trim().toLowerCase();
                      if (q) {
                        const matches = STUDIO_COMPONENTS.filter(c => c.name.toLowerCase().includes(q) || c.tags.some(t => t.includes(q)));
                        if (matches.length === 0) return <div className="text-center py-8 text-[11px] text-muted-foreground">No components found</div>;
                        return matches.map(comp => (
                          <button key={comp.id} onClick={() => insertStudioComponent(comp)}
                            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-foreground/[0.04] cursor-pointer transition-colors text-left">
                            <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: comp.thumbnail + '20', border: `1px solid ${comp.thumbnail}30` }}>
                              <Component className="h-3.5 w-3.5" style={{ color: comp.thumbnail }} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] font-medium text-foreground truncate">{comp.name}</div>
                              <div className="text-[9px] text-muted-foreground">{comp.category}</div>
                            </div>
                          </button>
                        ));
                      }
                      if (!expandedAssetCat) {
                        return STUDIO_CATEGORIES.map(cat => (
                          <button key={cat.key} onClick={() => setExpandedAssetCat(cat.key)}
                            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-foreground/[0.03] cursor-pointer transition-colors">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + '18' }}>
                              <Component className="h-4 w-4" style={{ color: cat.color }} />
                            </div>
                            <div>
                              <div className="text-[12px] font-medium text-foreground">{cat.key}</div>
                              <div className="text-[10px] text-muted-foreground">{cat.count} components</div>
                            </div>
                            <ChevronRight className="h-3 w-3 text-muted-foreground/60 ml-auto" />
                          </button>
                        ));
                      }
                      const catComps = STUDIO_COMPONENTS.filter(c => c.category === expandedAssetCat);
                      return (
                        <>
                          <button onClick={() => setExpandedAssetCat(null)} className="flex items-center gap-1.5 text-[11px] text-primary font-medium mb-1 hover:text-primary/80">
                            <ArrowLeft className="h-3 w-3" /> All categories
                          </button>
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{expandedAssetCat} ({catComps.length})</div>
                          {catComps.map(comp => (
                            <button key={comp.id} onClick={() => insertStudioComponent(comp)}
                              className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-foreground/[0.04] cursor-pointer transition-colors text-left">
                              <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: comp.thumbnail + '20', border: `1px solid ${comp.thumbnail}30` }}>
                                <Component className="h-3.5 w-3.5" style={{ color: comp.thumbnail }} />
                              </div>
                              <div className="min-w-0">
                                <div className="text-[11px] font-medium text-foreground truncate">{comp.name}</div>
                                <div className="text-[9px] text-muted-foreground">{comp.elements.length} elements</div>
                              </div>
                            </button>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ CANVAS ═══ */}
        <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ cursor: cursorStyle, backgroundColor: '#f5f5f5' }}
          onContextMenu={handleContextMenu}
        >
          <canvas ref={canvasRef}
            onMouseDown={(e) => {
              if (tool === 'eyedropper') { handleEyedrop(e); return; }
              if (tool === 'image') { setShowImageDialog(true); return; }
              handleMouseDown(e);
            }}
            onDoubleClick={(e) => {
              // Double-click to edit text inline
              const rect = canvasRef.current!.getBoundingClientRect();
              const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
              for (let i = elements.length - 1; i >= 0; i--) {
                const el = elements[i];
                if (el.type === 'text' && el.visible && !el.locked && world.x >= el.x && world.x <= el.x + el.width && world.y >= el.y && world.y <= el.y + el.height) {
                  startTextEditing(el.id);
                  setSelectedIds([el.id]);
                  break;
                }
              }
            }}
            onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel}
            className="absolute inset-0"
          />

          {/* ═══ INLINE TEXT EDITOR ═══ */}
          {editingTextId && (() => {
            const el = elements.find(e => e.id === editingTextId);
            if (!el) return null;
            const sx = el.x * zoom + pan.x;
            const sy = el.y * zoom + pan.y;
            return (
              <textarea
                ref={textInputRef}
                value={editingTextValue}
                onChange={e => setEditingTextValue(e.target.value)}
                onBlur={commitTextEdit}
                onKeyDown={e => { if (e.key === 'Escape') commitTextEdit(); }}
                className="absolute z-20 border-2 border-primary rounded bg-transparent outline-none resize-none"
                style={{
                  left: sx, top: sy,
                  width: el.width * zoom, height: Math.max(el.height * zoom, 40),
                  fontSize: (el.fontSize || 16) * zoom,
                  fontFamily: el.fontFamily || 'Inter',
                  fontWeight: el.fontWeight || '400',
                  fontStyle: el.fontStyle || 'normal',
                  textAlign: (el.textAlign as any) || 'left',
                  lineHeight: el.lineHeight || 1.4,
                  letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
                  color: el.fill !== 'transparent' ? el.fill : '#333',
                  padding: '2px 4px',
                }}
              />
            );
          })()}

          {/* ═══ MEASUREMENT GUIDES (Alt key) ═══ */}
          {measurementGuides.map((m, i) => {
            const x1 = m.x1 * zoom + pan.x;
            const y1 = m.y1 * zoom + pan.y;
            const x2 = m.x2 * zoom + pan.x;
            const y2 = m.y2 * zoom + pan.y;
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            return (
              <div key={i}>
                <svg className="absolute inset-0 z-10 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FF3366" strokeWidth="1" strokeDasharray="4 2" />
                </svg>
                <div className="absolute z-10 pointer-events-none px-1 py-0.5 rounded bg-risk text-white text-[9px] font-mono font-semibold"
                  style={{ left: midX - 12, top: midY - 8 }}>
                  {Math.round(m.dist)}
                </div>
              </div>
            );
          })}

          {/* ═══ CONTEXT MENU ═══ */}
          {contextMenu && (
            <div
              className="fixed z-50 bg-card rounded-xl shadow-lg border border-border/60 py-1.5 w-52"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={() => setContextMenu(null)}
            >
              {[
                { label: 'Copy', shortcut: '⌘C', action: () => duplicateSelected(), disabled: selectedIds.length === 0 },
                { label: 'Paste style', shortcut: '⌘⌥V', action: pasteStyle, disabled: !copiedStyle },
                { label: 'Copy style', shortcut: '⌘⌥C', action: copyStyle, disabled: selectedIds.length === 0 },
                { divider: true },
                { label: 'Group', shortcut: '⌘G', action: groupSelected, disabled: selectedIds.length < 2 },
                { label: 'Ungroup', shortcut: '⌘⇧G', action: ungroupSelected, disabled: !selectedEl || selectedEl.type !== 'group' },
                { divider: true },
                { label: 'Bring forward', shortcut: '⌘]', action: bringForward, disabled: selectedIds.length !== 1 },
                { label: 'Send backward', shortcut: '⌘[', action: sendBackward, disabled: selectedIds.length !== 1 },
                { label: 'Bring to front', shortcut: '⌘⇧]', action: bringToFront, disabled: selectedIds.length !== 1 },
                { label: 'Send to back', shortcut: '⌘⇧[', action: sendToBack, disabled: selectedIds.length !== 1 },
                { divider: true },
                { label: 'Duplicate', shortcut: '⌘D', action: duplicateSelected, disabled: selectedIds.length === 0 },
                { label: 'Delete', shortcut: '⌫', action: deleteSelected, disabled: selectedIds.length === 0, danger: true },
              ].map((item, i) => {
                if ('divider' in item && item.divider) return <div key={i} className="h-px bg-border/60 my-1" />;
                return (
                  <button key={i} onClick={item.action} disabled={item.disabled}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-[12px] transition-colors disabled:opacity-30 ${(item as any).danger ? 'text-risk hover:bg-risk/10' : 'text-ink-2 hover:bg-foreground/[0.03]'}`}>
                    <span>{item.label}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{item.shortcut}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Close context menu on click outside */}
          {contextMenu && <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />}

          {/* ═══ IMAGE URL DIALOG ═══ */}
          {showImageDialog && (
            <>
              <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setShowImageDialog(false)} />
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card rounded-xl shadow-lg border border-border/60 p-5 w-80">
                <h3 className="text-[14px] font-semibold text-foreground mb-3">Place image</h3>
                <Input
                  value={imageUrlInput}
                  onChange={e => setImageUrlInput(e.target.value)}
                  placeholder="Paste image URL..."
                  className="h-9 text-[12px] mb-3 border-border/60"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && placeImage()}
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 h-8 text-[11px]" onClick={() => setShowImageDialog(false)}>Cancel</Button>
                  <Button size="sm" className="flex-1 h-8 text-[11px] bg-primary hover:bg-primary/90" onClick={placeImage}>Place</Button>
                </div>
              </div>
            </>
          )}

          {/* ═══ COMMAND PALETTE (⌘K / ⌘/) ═══ */}
          {showCommandPalette && (
            <>
              <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setShowCommandPalette(false)} />
              <div className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 bg-card rounded-xl shadow-lg border border-border/60 w-[480px] max-h-[60vh] flex flex-col overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    ref={commandInputRef}
                    autoFocus
                    value={commandSearch}
                    onChange={e => setCommandSearch(e.target.value)}
                    placeholder="Search commands..."
                    className="flex-1 text-[14px] text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground"
                    onKeyDown={e => {
                      if (e.key === 'Escape') setShowCommandPalette(false);
                      if (e.key === 'Enter' && filteredCommands.length > 0) {
                        filteredCommands[0].action();
                        setShowCommandPalette(false);
                      }
                    }}
                  />
                  <kbd className="text-[10px] text-muted-foreground bg-sunken px-1.5 py-0.5 rounded font-mono">ESC</kbd>
                </div>
                <div className="overflow-y-auto max-h-[50vh] py-1">
                  {(() => {
                    const grouped: Record<string, CommandItem[]> = {};
                    filteredCommands.forEach(c => { (grouped[c.category] ||= []).push(c); });
                    return Object.entries(grouped).map(([cat, items]) => (
                      <div key={cat}>
                        <div className="px-4 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{cat}</div>
                        {items.map((item, i) => (
                          <button key={i} onClick={() => { item.action(); setShowCommandPalette(false); }}
                            className="w-full flex items-center justify-between px-4 py-2 text-[13px] text-ink-2 hover:bg-foreground/[0.04] transition-colors">
                            <span>{item.label}</span>
                            {item.shortcut && <kbd className="text-[10px] text-muted-foreground bg-sunken px-1.5 py-0.5 rounded font-mono">{item.shortcut}</kbd>}
                          </button>
                        ))}
                      </div>
                    ));
                  })()}
                  {filteredCommands.length === 0 && (
                    <div className="text-center py-8 text-[13px] text-muted-foreground">No commands found</div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ═══ FRAME PRESETS DROPDOWN ═══ */}
          {showFramePresets && (
            <>
              <div className="fixed inset-0 z-50" onClick={() => setShowFramePresets(false)} />
              <div className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 bg-card rounded-xl shadow-lg border border-border/60 w-72 max-h-[60vh] overflow-y-auto py-1">
                <div className="px-3 py-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Frame presets</div>
                {FRAME_PRESETS.map(preset => (
                  <button key={preset.label} onClick={() => insertFramePreset(preset)}
                    className="w-full flex items-center justify-between px-3 py-2 text-[12px] text-ink-2 hover:bg-foreground/[0.04] transition-colors">
                    <span>{preset.label}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{preset.w}×{preset.h}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-card rounded-xl shadow-lg border border-border/60 p-1 z-10 max-w-[calc(100%-32px)] overflow-x-auto scrollbar-none">
            {toolItems.map((t, i) => {
              const Icon = t.icon;
              const active = tool === t.key;
              return (
                <div key={t.key} className="flex items-center">
                  {t.separator && i > 0 && <div className="w-px h-5 bg-border/60 mx-0.5" />}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => { if (t.key === 'image') { setShowImageDialog(true); } else if (t.key === 'frame') { setTool('frame'); } else { setTool(t.key); } }}
                        onDoubleClick={() => { if (t.key === 'frame') setShowFramePresets(true); }}
                        className={`p-1.5 rounded-lg transition-all ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground'}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[11px]">{t.label}{t.shortcut ? ` (${t.shortcut})` : ''}</TooltipContent>
                  </Tooltip>
                </div>
              );
            })}

            <div className="w-px h-5 bg-border/60 mx-0.5" />

            {/* Group/Ungroup */}
            <Tooltip><TooltipTrigger asChild>
              <button onClick={groupSelected} disabled={selectedIds.length < 2} className="p-1.5 rounded-lg text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground transition-all disabled:opacity-20">
                <Group className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger><TooltipContent side="top" className="text-[11px]">Group (⌘G)</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <button onClick={ungroupSelected} className="p-1.5 rounded-lg text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground transition-all">
                <Ungroup className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger><TooltipContent side="top" className="text-[11px]">Ungroup (⌘⇧G)</TooltipContent></Tooltip>

            <div className="w-px h-5 bg-border/60 mx-0.5" />

            <Tooltip><TooltipTrigger asChild>
              <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1.5 rounded-lg text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground transition-all">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger><TooltipContent side="top" className="text-[11px]">Reset view</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <button onClick={() => setShowLeftPanel(!showLeftPanel)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground transition-all">
                <Layers className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger><TooltipContent side="top" className="text-[11px]">Toggle layers</TooltipContent></Tooltip>
          </div>

          {/* Status bar */}
          <div className="absolute bottom-4 left-4 px-2.5 py-1 rounded-lg font-mono tabular-nums text-[10px] font-medium text-muted-foreground bg-card border border-border/60 z-10">
            {elements.length} layers · {selectedIds.length} selected · {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* ═══ RIGHT PANEL (Design / Prototype / Export - like Figma) ═══ */}
        <div className="w-60 border-l border-border/60 bg-card shrink-0 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
            <div className="flex items-center gap-3">
              {[
                { key: 'design' as RightTab, label: 'Design' },
                { key: 'prototype' as RightTab, label: 'Prototype' },
                { key: 'export' as RightTab, label: 'Export' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setRightTab(tab.key)} className={`text-[11px] font-medium transition-colors ${rightTab === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <span className="font-mono tabular-nums text-[11px] text-muted-foreground font-medium">{Math.round(zoom * 100)}%</span>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {rightTab === 'design' ? (
              selectedEl ? (
                <div className="px-3 py-2 space-y-0">
                  {/* Name */}
                  <Input value={selectedEl.name} onChange={e => updateSelected({ name: e.target.value })} onBlur={commitUpdate} className="h-7 text-[12px] bg-sunken border-border/60 text-foreground font-medium mb-2" />

                  {/* Position */}
                  <SectionHeader label="Position" sectionKey="position" />
                  {expandedSections.position && (
                    <div className="grid grid-cols-2 gap-1.5 pb-2">
                      {[['X', selectedEl.x, 'x'], ['Y', selectedEl.y, 'y']].map(([label, val, key]) => (
                        <div key={key as string}>
                          <span className="text-[9px] text-muted-foreground uppercase">{label as string}</span>
                          <Input type="number" value={Math.round(val as number)} onChange={e => updateSelected({ [key as string]: +e.target.value })} onBlur={commitUpdate} className="h-6 text-[11px] bg-sunken border-border/60 text-ink-2 font-mono" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Size */}
                  <SectionHeader label="Size" sectionKey="size" />
                  {expandedSections.size && (
                    <div className="space-y-1.5 pb-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        {[['W', selectedEl.width, 'width'], ['H', selectedEl.height, 'height']].map(([label, val, key]) => (
                          <div key={key as string}>
                            <span className="text-[9px] text-muted-foreground uppercase">{label as string}</span>
                            <Input type="number" value={Math.round(val as number)} onChange={e => updateSelected({ [key as string]: Math.max(1, +e.target.value) })} onBlur={commitUpdate} className="h-6 text-[11px] bg-sunken border-border/60 text-ink-2 font-mono" />
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase">Rotation</span>
                          <Input type="number" value={selectedEl.rotation} onChange={e => updateSelected({ rotation: +e.target.value })} onBlur={commitUpdate} className="h-6 text-[11px] bg-sunken border-border/60 text-ink-2 font-mono" />
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase">Radius</span>
                          <Input type="number" value={selectedEl.borderRadius} onChange={e => updateSelected({ borderRadius: +e.target.value })} onBlur={commitUpdate} className="h-6 text-[11px] bg-sunken border-border/60 text-ink-2 font-mono" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase">Opacity</span>
                          <input type="range" min="0" max="1" step="0.01" value={selectedEl.opacity} onChange={e => updateSelected({ opacity: +e.target.value })} onMouseUp={commitUpdate} className="w-full h-1 mt-1 accent-primary" />
                        </div>
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase">Blend mode</span>
                          <select value={selectedEl.blendMode || 'normal'} onChange={e => { updateSelected({ blendMode: e.target.value }); commitUpdate(); }} className="w-full h-6 text-[11px] bg-sunken border border-border/60 text-ink-2 rounded px-1 mt-0.5">
                            {BLEND_MODES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1).replace('-', ' ')}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Constraints (like Figma) */}
                  <SectionHeader label="Constraints" sectionKey="constraints" />
                  {expandedSections.constraints && (
                    <div className="grid grid-cols-2 gap-1.5 pb-2">
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase">Horizontal</span>
                        <select value={selectedEl.constraintH || 'left'} onChange={e => { updateSelected({ constraintH: e.target.value as any }); commitUpdate(); }} className="w-full h-6 text-[11px] bg-sunken border border-border/60 text-ink-2 rounded px-1">
                          {['left', 'right', 'center', 'scale'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                        </select>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase">Vertical</span>
                        <select value={selectedEl.constraintV || 'top'} onChange={e => { updateSelected({ constraintV: e.target.value as any }); commitUpdate(); }} className="w-full h-6 text-[11px] bg-sunken border border-border/60 text-ink-2 rounded px-1">
                          {['top', 'bottom', 'center', 'scale'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Auto Layout (like Figma) */}
                  {(selectedEl.type === 'frame' || selectedEl.type === 'group') && (
                    <>
                      <SectionHeader label="Auto layout" sectionKey="autolayout" />
                      {expandedSections.autolayout && (
                        <div className="space-y-1.5 pb-2">
                          <div className="flex items-center justify-between">
                            <button onClick={() => { updateSelected({ autoLayout: !selectedEl.autoLayout, layoutDirection: selectedEl.layoutDirection || 'vertical', layoutGap: selectedEl.layoutGap ?? 8, layoutPaddingH: selectedEl.layoutPaddingH ?? 16, layoutPaddingV: selectedEl.layoutPaddingV ?? 16 }); commitUpdate(); }}
                              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[10px] font-medium ${selectedEl.autoLayout ? 'bg-primary/10 text-primary' : 'bg-sunken text-muted-foreground hover:bg-foreground/[0.05]'}`}>
                              {selectedEl.autoLayout ? '✓ Enabled' : 'Add auto layout'}
                            </button>
                          </div>
                          {selectedEl.autoLayout && (
                            <>
                              <div className="flex gap-1">
                                {(['horizontal', 'vertical'] as const).map(d => (
                                  <button key={d} onClick={() => { updateSelected({ layoutDirection: d }); commitUpdate(); }}
                                    className={`flex-1 py-1 text-[10px] rounded ${selectedEl.layoutDirection === d ? 'bg-primary/10 text-primary font-medium' : 'bg-sunken text-muted-foreground'}`}>
                                    {d === 'horizontal' ? '→ Horizontal' : '↓ Vertical'}
                                  </button>
                                ))}
                              </div>
                              <div className="grid grid-cols-3 gap-1.5">
                                <div><span className="text-[9px] text-muted-foreground">Gap</span><Input type="number" value={selectedEl.layoutGap ?? 8} onChange={e => updateSelected({ layoutGap: +e.target.value })} onBlur={commitUpdate} className="h-6 text-[11px] bg-sunken border-border/60 text-ink-2 font-mono" /></div>
                                <div><span className="text-[9px] text-muted-foreground">Pad H</span><Input type="number" value={selectedEl.layoutPaddingH ?? 16} onChange={e => updateSelected({ layoutPaddingH: +e.target.value })} onBlur={commitUpdate} className="h-6 text-[11px] bg-sunken border-border/60 text-ink-2 font-mono" /></div>
                                <div><span className="text-[9px] text-muted-foreground">Pad V</span><Input type="number" value={selectedEl.layoutPaddingV ?? 16} onChange={e => updateSelected({ layoutPaddingV: +e.target.value })} onBlur={commitUpdate} className="h-6 text-[11px] bg-sunken border-border/60 text-ink-2 font-mono" /></div>
                              </div>
                              <div>
                                <span className="text-[9px] text-muted-foreground uppercase">Align items</span>
                                <div className="flex gap-0.5 mt-0.5">
                                  {(['start', 'center', 'end', 'stretch'] as const).map(a => (
                                    <button key={a} onClick={() => { updateSelected({ layoutAlign: a }); commitUpdate(); }}
                                      className={`flex-1 py-1 text-[9px] rounded ${selectedEl.layoutAlign === a ? 'bg-primary/10 text-primary font-medium' : 'bg-sunken text-muted-foreground'}`}>
                                      {a}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  <SectionHeader label="Fill" sectionKey="fill" />
                  {expandedSections.fill && (
                    <div className="space-y-1.5 pb-2">
                      <div className="flex items-center gap-1.5">
                        <input type="color" value={selectedEl.fill === 'transparent' ? '#000000' : selectedEl.fill} onChange={e => updateSelected({ fill: e.target.value })} onBlur={commitUpdate} className="w-7 h-7 rounded-md border border-border/60 cursor-pointer" />
                        <Input value={selectedEl.fill} onChange={e => updateSelected({ fill: e.target.value })} onBlur={commitUpdate} className="h-6 text-[11px] bg-sunken border-border/60 text-ink-2 flex-1 font-mono" />
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {COLORS.map(c => (
                          <button key={c} onClick={() => { updateSelected({ fill: c }); commitUpdate(); }} className="w-5 h-5 rounded border border-border/60 transition-transform hover:scale-110" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      {/* Gradient controls */}
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase">Gradient</span>
                        <div className="flex gap-1 mt-0.5">
                          {(['none', 'linear', 'radial'] as const).map(t => (
                            <button key={t} onClick={() => { updateSelected({ gradientType: t, gradientStart: selectedEl.gradientStart || selectedEl.fill, gradientEnd: selectedEl.gradientEnd || '#ffffff' }); commitUpdate(); }}
                              className={`flex-1 py-1 text-[10px] rounded ${selectedEl.gradientType === t ? 'bg-primary/10 text-primary font-medium' : 'bg-sunken text-muted-foreground hover:bg-foreground/[0.05]'}`}>
                              {t === 'none' ? 'Solid' : t === 'linear' ? 'Linear' : 'Radial'}
                            </button>
                          ))}
                        </div>
                      </div>
                      {selectedEl.gradientType && selectedEl.gradientType !== 'none' && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <input type="color" value={selectedEl.gradientStart || '#6366f1'} onChange={e => updateSelected({ gradientStart: e.target.value })} onBlur={commitUpdate} className="w-6 h-6 rounded border border-border/60 cursor-pointer" />
                            <span className="text-[9px] text-muted-foreground">→</span>
                            <input type="color" value={selectedEl.gradientEnd || '#ffffff'} onChange={e => updateSelected({ gradientEnd: e.target.value })} onBlur={commitUpdate} className="w-6 h-6 rounded border border-border/60 cursor-pointer" />
                            <Input type="number" value={selectedEl.gradientAngle || 0} onChange={e => updateSelected({ gradientAngle: +e.target.value })} onBlur={commitUpdate} className="h-6 text-[11px] bg-sunken border-border/60 text-ink-2 w-14 font-mono" placeholder="Angle" />
                          </div>
                          {/* Gradient preview */}
                          <div className="h-4 rounded-md border border-border/60" style={{
                            background: selectedEl.gradientType === 'linear'
                              ? `linear-gradient(${selectedEl.gradientAngle || 0}deg, ${selectedEl.gradientStart}, ${selectedEl.gradientEnd})`
                              : `radial-gradient(circle, ${selectedEl.gradientStart}, ${selectedEl.gradientEnd})`
                          }} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stroke */}
                  <SectionHeader label="Stroke" sectionKey="stroke" />
                  {expandedSections.stroke && (
                    <div className="flex items-center gap-1.5 pb-2">
                      <input type="color" value={selectedEl.stroke === 'transparent' ? '#000' : selectedEl.stroke} onChange={e => updateSelected({ stroke: e.target.value })} onBlur={commitUpdate} className="w-7 h-7 rounded-md border border-border/60 cursor-pointer" />
                      <Input type="number" value={selectedEl.strokeWidth} onChange={e => updateSelected({ strokeWidth: +e.target.value })} onBlur={commitUpdate} className="h-6 text-[11px] bg-sunken border-border/60 text-ink-2 w-16 font-mono" placeholder="Width" />
                    </div>
                  )}

                  {/* Text with line-height & letter-spacing */}
                  {selectedEl.type === 'text' && (
                    <>
                      <SectionHeader label="Typography" sectionKey="text" />
                      {expandedSections.text && (
                        <div className="space-y-1.5 pb-2">
                          <textarea value={selectedEl.text || ''} onChange={e => updateSelected({ text: e.target.value })} onBlur={commitUpdate} className="w-full h-16 text-[12px] bg-sunken border border-border/60 text-ink-2 rounded-md p-2 resize-none" />
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <span className="text-[9px] text-muted-foreground uppercase">Font</span>
                              <select value={selectedEl.fontFamily || 'Inter'} onChange={e => { updateSelected({ fontFamily: e.target.value }); commitUpdate(); }} className="w-full h-6 text-[11px] bg-sunken border border-border/60 text-ink-2 rounded px-1">
                                {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                              </select>
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground uppercase">Size</span>
                              <Input type="number" value={selectedEl.fontSize || 16} onChange={e => updateSelected({ fontSize: +e.target.value })} onBlur={commitUpdate} className="h-6 text-[11px] bg-sunken border-border/60 text-ink-2 font-mono" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <span className="text-[9px] text-muted-foreground uppercase">Line height</span>
                              <Input type="number" step="0.1" value={selectedEl.lineHeight || 1.4} onChange={e => updateSelected({ lineHeight: +e.target.value })} onBlur={commitUpdate} className="h-6 text-[11px] bg-sunken border-border/60 text-ink-2 font-mono" />
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground uppercase">Letter spacing</span>
                              <Input type="number" step="0.1" value={selectedEl.letterSpacing || 0} onChange={e => updateSelected({ letterSpacing: +e.target.value })} onBlur={commitUpdate} className="h-6 text-[11px] bg-sunken border-border/60 text-ink-2 font-mono" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <span className="text-[9px] text-muted-foreground uppercase">Weight</span>
                              <select value={selectedEl.fontWeight || '400'} onChange={e => { updateSelected({ fontWeight: e.target.value }); commitUpdate(); }} className="w-full h-6 text-[11px] bg-sunken border border-border/60 text-ink-2 rounded px-1">
                                {['100','200','300','400','500','600','700','800','900'].map(w => <option key={w} value={w}>{w}</option>)}
                              </select>
                            </div>
                            <div>
                              <span className="text-[9px] text-muted-foreground uppercase">Decoration</span>
                              <select value={selectedEl.textDecoration || 'none'} onChange={e => { updateSelected({ textDecoration: e.target.value }); commitUpdate(); }} className="w-full h-6 text-[11px] bg-sunken border border-border/60 text-ink-2 rounded px-1">
                                {['none','underline','line-through','overline'].map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[{ v: 'left', I: AlignLeft }, { v: 'center', I: AlignCenter }, { v: 'right', I: AlignRight }].map(({ v, I }) => (
                              <button key={v} onClick={() => { updateSelected({ textAlign: v }); commitUpdate(); }} className={`p-1.5 rounded-md ${selectedEl.textAlign === v ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-foreground/[0.05]'}`}>
                                <I className="h-3.5 w-3.5" />
                              </button>
                            ))}
                            <div className="w-px bg-border/60 mx-1" />
                            <button onClick={() => { updateSelected({ fontWeight: selectedEl.fontWeight === '700' ? '400' : '700' }); commitUpdate(); }} className={`p-1.5 rounded-md ${selectedEl.fontWeight === '700' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-foreground/[0.05]'}`}>
                              <Bold className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => { updateSelected({ fontStyle: selectedEl.fontStyle === 'italic' ? 'normal' : 'italic' }); commitUpdate(); }} className={`p-1.5 rounded-md ${selectedEl.fontStyle === 'italic' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-foreground/[0.05]'}`}>
                              <Italic className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => { updateSelected({ textDecoration: selectedEl.textDecoration === 'underline' ? 'none' : 'underline' }); commitUpdate(); }} className={`p-1.5 rounded-md ${selectedEl.textDecoration === 'underline' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-foreground/[0.05]'}`}>
                              <Underline className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Shadow */}
                  <SectionHeader label="Shadow" sectionKey="shadow" />
                  {expandedSections.shadow && (
                    <div className="grid grid-cols-3 gap-1.5 pb-2">
                      <div><span className="text-[9px] text-muted-foreground">X</span><Input type="number" value={selectedEl.shadowX || 0} onChange={e => updateSelected({ shadowX: +e.target.value })} onBlur={commitUpdate} className="h-6 text-[11px] bg-sunken border-border/60 text-ink-2 font-mono" /></div>
                      <div><span className="text-[9px] text-muted-foreground">Y</span><Input type="number" value={selectedEl.shadowY || 0} onChange={e => updateSelected({ shadowY: +e.target.value })} onBlur={commitUpdate} className="h-6 text-[11px] bg-sunken border-border/60 text-ink-2 font-mono" /></div>
                      <div><span className="text-[9px] text-muted-foreground">Blur</span><Input type="number" value={selectedEl.shadowBlur || 0} onChange={e => updateSelected({ shadowBlur: +e.target.value })} onBlur={commitUpdate} className="h-6 text-[11px] bg-sunken border-border/60 text-ink-2 font-mono" /></div>
                    </div>
                  )}

                  {/* Effects */}
                  <SectionHeader label="Effects" sectionKey="effects" />
                  {expandedSections.effects && (
                    <div className="space-y-1.5 pb-2">
                      <div>
                        <span className="text-[9px] text-muted-foreground">Blur: {selectedEl.blur || 0}px</span>
                        <input type="range" min="0" max="20" value={selectedEl.blur || 0} onChange={e => updateSelected({ blur: +e.target.value })} onMouseUp={commitUpdate} className="w-full h-1 accent-primary" />
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { updateSelected({ flipX: !selectedEl.flipX }); commitUpdate(); }} className="flex-1 flex items-center justify-center gap-1 p-1.5 rounded-md bg-sunken hover:bg-foreground/[0.05] text-[10px] text-muted-foreground">
                          <FlipHorizontal className="h-3 w-3" /> Flip H
                        </button>
                        <button onClick={() => { updateSelected({ flipY: !selectedEl.flipY }); commitUpdate(); }} className="flex-1 flex items-center justify-center gap-1 p-1.5 rounded-md bg-sunken hover:bg-foreground/[0.05] text-[10px] text-muted-foreground">
                          <FlipVertical className="h-3 w-3" /> Flip V
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-border/40 space-y-1.5">
                    <div className="flex gap-1">
                      <button onClick={duplicateSelected} className="flex-1 flex items-center justify-center gap-1 p-1.5 rounded-md bg-sunken hover:bg-foreground/[0.05] text-[10px] text-muted-foreground">
                        <Copy className="h-3 w-3" /> Duplicate
                      </button>
                      <button onClick={deleteSelected} className="flex-1 flex items-center justify-center gap-1 p-1.5 rounded-md bg-risk/10 hover:bg-risk/15 text-[10px] text-risk">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={bringForward} className="flex-1 flex items-center justify-center gap-1 p-1.5 rounded-md bg-sunken hover:bg-foreground/[0.05] text-[10px] text-muted-foreground">
                        <ArrowUp className="h-3 w-3" /> Forward
                      </button>
                      <button onClick={sendBackward} className="flex-1 flex items-center justify-center gap-1 p-1.5 rounded-md bg-sunken hover:bg-foreground/[0.05] text-[10px] text-muted-foreground">
                        <ArrowDown className="h-3 w-3" /> Back
                      </button>
                    </div>

                    {/* Boolean Operations */}
                    {multiSelected && (
                      <>
                        <span className="text-[9px] text-muted-foreground uppercase block pt-1">Boolean operations</span>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { label: 'Union', icon: '∪' },
                            { label: 'Sub', icon: '−' },
                            { label: 'Inter', icon: '∩' },
                            { label: 'Flat', icon: '⊟' },
                          ].map(op => (
                            <button key={op.label} onClick={flattenSelected} className="flex flex-col items-center gap-0.5 p-1.5 rounded-md bg-sunken hover:bg-foreground/[0.05]">
                              <span className="text-[14px] text-muted-foreground leading-none">{op.icon}</span>
                              <span className="text-[8px] text-muted-foreground">{op.label}</span>
                            </button>
                          ))}
                        </div>

                        <span className="text-[9px] text-muted-foreground uppercase block pt-1">Align</span>
                        <div className="flex gap-0.5">
                          {[
                            { fn: () => alignSelected('left'), I: AlignStartVertical },
                            { fn: () => alignSelected('centerH'), I: AlignCenterVertical },
                            { fn: () => alignSelected('right'), I: AlignEndVertical },
                            { fn: () => alignSelected('top'), I: AlignStartHorizontal },
                            { fn: () => alignSelected('centerV'), I: AlignCenterHorizontal },
                            { fn: () => alignSelected('bottom'), I: AlignEndHorizontal },
                          ].map(({ fn, I }, i) => (
                            <button key={i} onClick={fn} className="p-1.5 rounded-md bg-sunken hover:bg-foreground/[0.05]">
                              <I className="h-3 w-3 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => distributeSelected('h')} className="flex-1 p-1.5 rounded-md bg-sunken hover:bg-foreground/[0.05] text-[10px] text-muted-foreground">Distribute H</button>
                          <button onClick={() => distributeSelected('v')} className="flex-1 p-1.5 rounded-md bg-sunken hover:bg-foreground/[0.05] text-[10px] text-muted-foreground">Distribute V</button>
                        </div>
                      </>
                    )}

                    {/* Create component */}
                    {selectedIds.length > 0 && (
                      <button onClick={createComponent} className="w-full flex items-center justify-center gap-1 p-1.5 rounded-md bg-primary/10 hover:bg-primary/15 text-[10px] text-primary">
                        <Component className="h-3 w-3" /> Create component
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // No selection - show page properties
                <div className="p-3">
                  <div className="mb-3">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Page</span>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="w-6 h-6 rounded border border-border/60" style={{ backgroundColor: '#F5F5F5' }} />
                      <Input value="F5F5F5" className="h-6 text-[11px] bg-sunken border-border/60 text-ink-2 font-mono flex-1" readOnly />
                      <span className="text-[11px] text-muted-foreground font-mono">100 %</span>
                    </div>
                  </div>
                  <div className="border-t border-border/40 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Variables</span>
                      <Settings className="h-3 w-3 text-muted-foreground/60" />
                    </div>
                  </div>
                  <div className="border-t border-border/40 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Styles</span>
                      <Plus className="h-3 w-3 text-muted-foreground/60" />
                    </div>
                  </div>
                </div>
              )
            ) : rightTab === 'export' ? (
              // Export tab
              <div className="p-3 space-y-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Export</span>
                {selectedEl ? (
                  <div className="space-y-2">
                    <div className="text-[12px] text-ink-2 font-medium">{selectedEl.name}</div>
                    <div className="font-mono tabular-nums text-[10px] text-muted-foreground">{Math.round(selectedEl.width)} × {Math.round(selectedEl.height)}</div>
                    <div className="space-y-1.5">
                      {EXPORT_SCALES.map(s => (
                        <button key={s.label} onClick={() => exportElementAsPNG(s.scale)}
                          className="w-full flex items-center justify-between p-2 rounded-lg bg-sunken hover:bg-foreground/[0.04] transition-colors">
                          <div className="flex items-center gap-2">
                            <Download className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-[11px] text-ink-2 font-medium">PNG {s.label}</span>
                          </div>
                          <span className="font-mono tabular-nums text-[10px] text-muted-foreground">{Math.round(selectedEl.width * s.scale)}×{Math.round(selectedEl.height * s.scale)}</span>
                        </button>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-border/40">
                      <button onClick={exportAsSVG} className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg bg-sunken hover:bg-foreground/[0.04] text-[11px] text-ink-2 font-medium">
                        <Download className="h-3.5 w-3.5" /> Export all as SVG
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Download className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-[12px] text-muted-foreground">Select a layer to export</p>
                  </div>
                )}
              </div>
            ) : (
              // Prototype tab
              <div className="p-4 text-center py-16">
                <Play className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-[12px] text-muted-foreground">Prototype</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Select a layer to add interactions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// CANVAS HELPERS
// ══════════════════════════════════════════════
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function drawRulers(ctx: CanvasRenderingContext2D, width: number, height: number, zoom: number, pan: Vec2) {
  const rulerSize = 20;
  const dpr = window.devicePixelRatio || 1;
  const w = width / dpr; const h = height / dpr;

  ctx.save();
  ctx.fillStyle = '#fafafa'; ctx.fillRect(0, 0, w, rulerSize);
  ctx.fillStyle = '#e5e5e5'; ctx.fillRect(0, rulerSize, w, 1);
  ctx.fillStyle = '#fafafa'; ctx.fillRect(0, 0, rulerSize, h);
  ctx.fillStyle = '#e5e5e5'; ctx.fillRect(rulerSize, 0, 1, h);

  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.font = '9px Inter, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const step = zoom < 0.3 ? 200 : zoom < 0.7 ? 100 : zoom < 1.5 ? 50 : zoom < 3 ? 20 : 10;
  const startX = Math.floor(-pan.x / zoom / step) * step;
  for (let worldX = startX; worldX < startX + w / zoom + step; worldX += step) {
    const screenX = worldX * zoom + pan.x;
    if (screenX < rulerSize || screenX > w) continue;
    ctx.fillRect(screenX, rulerSize - 5, 1, 5); ctx.fillText(String(worldX), screenX, 3);
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const startY = Math.floor(-pan.y / zoom / step) * step;
  for (let worldY = startY; worldY < startY + h / zoom + step; worldY += step) {
    const screenY = worldY * zoom + pan.y;
    if (screenY < rulerSize || screenY > h) continue;
    ctx.fillRect(rulerSize - 5, screenY, 5, 1);
    ctx.save(); ctx.translate(8, screenY); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText(String(worldY), 0, 0); ctx.restore();
  }

  ctx.fillStyle = '#fafafa'; ctx.fillRect(0, 0, rulerSize, rulerSize);
  ctx.restore();
}
