import { CSSProperties } from 'react';

// ─── Element Types ───────────────────────────────────────────────
export type ElementType =
  | 'section' | 'container' | 'columns' | 'grid'
  | 'heading' | 'text' | 'button' | 'image' | 'video'
  | 'icon' | 'spacer' | 'divider' | 'card'
  | 'navbar' | 'footer' | 'link'
  | 'form' | 'input' | 'textarea' | 'select' | 'checkbox'
  | 'html' | 'embed' | 'slider' | 'badge'
  | 'accordion' | 'tabs' | 'countdown' | 'progress'
  | 'marquee' | 'tooltip' | 'modal' | 'dropdown'
  | 'lottie' | 'map' | 'audio' | 'table'
  | 'list' | 'quote' | 'code' | 'separator'
  | 'product-grid' | 'booking-widget' | 'visitor-auth' | 'cart-button' | 'visitor-dashboard'
  // Marketing
  | 'testimonial-card' | 'trust-badge' | 'social-share' | 'rating-stars' | 'pricing-card'
  | 'cta-banner' | 'newsletter-form' | 'feature-card' | 'stat-card'
  // Advanced Interactive
  | 'mega-menu' | 'breadcrumb' | 'carousel' | 'lightbox' | 'stepper'
  // Charts
  | 'bar-chart' | 'line-chart' | 'pie-chart'
  // Social
  | 'social-icons' | 'review-widget' | 'avatar-group'
  // Animated & Interactive
  | 'animated-counter' | 'gradient-text' | 'typing-text' | 'before-after'
  | 'scroll-progress' | 'video-background' | 'parallax-section'
  | 'icon-box' | 'logo-cloud' | 'comparison-table' | 'timeline'
  | 'masonry-gallery' | 'floating-card' | 'glassmorphism-card'
  | 'morphing-blob' | 'particle-field' | 'text-reveal'
  // Booking
  | 'booking-calendar' | 'service-list' | 'booking-button'
  // New Webflow/WP Components
  | 'hamburger-menu' | 'search-bar' | 'pagination' | 'tag-pill'
  | 'alert-banner' | 'avatar' | 'switch-toggle' | 'range-slider'
  | 'file-upload' | 'date-picker' | 'star-rating' | 'back-to-top'
  | 'popover' | 'sidebar' | 'sticky-bar' | 'cookie-banner';

export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

export type AnimationType =
  | 'none'
  // Fade
  | 'fadeIn' | 'fadeInUp' | 'fadeInDown' | 'fadeInLeft' | 'fadeInRight'
  // Slide
  | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight'
  // Scale
  | 'scaleIn' | 'scaleUp' | 'scaleDown'
  // Rotate
  | 'rotateIn' | 'flipInX' | 'flipInY'
  // Bounce
  | 'bounceIn' | 'bounceInUp' | 'elastic'
  // 3D
  | 'tiltIn' | 'flip3d' | 'zoomRotate'
  // Blur
  | 'blurIn' | 'blurSlide'
  // Scroll
  | 'parallax' | 'reveal' | 'counterScroll'
  // Continuous
  | 'pulse' | 'float' | 'spin' | 'glow' | 'shake' | 'wiggle' | 'breathe'
  // Special
  | 'typewriter' | 'gradientShift'
  // New animated entrances
  | 'morphIn' | 'glitchIn' | 'splitReveal' | 'curtainUp' | 'unfold'
  | 'spiralIn' | 'dropIn' | 'swingIn' | 'rubberBand'
  // New continuous
  | 'aurora' | 'shimmer' | 'orbit' | 'magnetic' | 'ripple'
  // New scroll
  | 'scrollWipe' | 'scrollZoom' | 'scrollRotate3D' | 'horizontalScroll';

export type AnimationTrigger = 'onLoad' | 'onScroll' | 'onHover' | 'onClick' | 'onView' | 'timed';

export interface ElementAnimation {
  type: AnimationType;
  duration: number;
  delay: number;
  trigger: AnimationTrigger;
  easing?: string;
  stagger?: number;
  loop?: boolean;
  loopDelay?: number;
  intensity?: number;
  // Scroll-linked
  scrollParallax?: string;
  scrollRotate?: string;
  scrollScale?: string;
  scrollOpacity?: string;
  scrollBlur?: string;
  scrollX?: string;
  // 3D Transform
  perspective?: string;
  rotateX?: string;
  rotateY?: string;
  rotateZ?: string;
  translateZ?: string;
  backfaceVisibility?: string;
  transformStyle?: string;
  // Transitions
  transitionProperty?: string;
  transitionDuration?: string;
  transitionTiming?: string;
  transitionDelay?: string;
}

export interface ResponsiveStyles {
  desktop: CSSProperties;
  tablet?: CSSProperties;
  mobile?: CSSProperties;
}

export interface EditorElement {
  id: string;
  type: ElementType;
  name?: string;
  props: Record<string, unknown>;
  styles: ResponsiveStyles;
  hoverStyles?: CSSProperties;
  animations?: ElementAnimation;
  children: EditorElement[];
  locked?: boolean;
  hidden?: boolean;
}

// ─── Component Registry ──────────────────────────────────────────
export type ComponentCategory = 'Layout' | 'Content' | 'Media' | 'Forms' | 'Navigation' | 'Advanced' | 'Interactive' | 'Data' | 'Marketing' | 'Social' | 'Charts';

export interface ComponentDefinition {
  type: ElementType;
  label: string;
  icon: string; // lucide icon name
  category: ComponentCategory;
  defaultProps: Record<string, unknown>;
  defaultStyles: ResponsiveStyles;
  defaultChildren?: EditorElement[];
  canHaveChildren: boolean;
}

// ─── Editor State ────────────────────────────────────────────────
export interface DragState {
  elementType?: ElementType;
  elementId?: string;
  sourceIndex?: number;
  targetId?: string;
  targetIndex?: number;
  position?: 'before' | 'after' | 'inside';
}

export interface EditorState {
  elements: EditorElement[];
  selectedIds: string[];
  hoveredId: string | null;
  clipboard: EditorElement[] | null;
  history: EditorElement[][];
  historyIndex: number;
  breakpoint: Breakpoint;
  zoom: number;
  dragState: DragState | null;
  isDirty: boolean;
  saveStatus: 'saved' | 'saving' | 'error' | 'idle';
  activePage: string | null;
  leftPanelTab: 'components' | 'layers' | 'templates' | 'sections' | 'design' | 'pages' | 'history' | 'embed' | 'cms' | 'products' | 'gradient' | 'seo' | 'interactions' | 'styles' | 'forms';
  rightPanelTab: 'style' | 'settings' | 'animation';
  isPreviewOpen: boolean;
}

export type EditorAction =
  | { type: 'SET_ELEMENTS'; payload: EditorElement[] }
  | { type: 'ADD_ELEMENT'; payload: { element: EditorElement; parentId?: string; index?: number } }
  | { type: 'DELETE_ELEMENT'; payload: string }
  | { type: 'UPDATE_ELEMENT'; payload: { id: string; updates: Partial<EditorElement> } }
  | { type: 'MOVE_ELEMENT'; payload: { elementId: string; newParentId?: string; newIndex: number } }
  | { type: 'DUPLICATE_ELEMENT'; payload: string }
  | { type: 'SELECT'; payload: string | null }
  | { type: 'MULTI_SELECT'; payload: string }
  | { type: 'HOVER'; payload: string | null }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_BREAKPOINT'; payload: Breakpoint }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_DRAG'; payload: DragState | null }
  | { type: 'COPY' }
  | { type: 'PASTE'; payload?: string }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'SET_SAVE_STATUS'; payload: EditorState['saveStatus'] }
  | { type: 'SET_ACTIVE_PAGE'; payload: string | null }
  | { type: 'SET_LEFT_TAB'; payload: EditorState['leftPanelTab'] }
  | { type: 'SET_RIGHT_TAB'; payload: EditorState['rightPanelTab'] }
  | { type: 'TOGGLE_PREVIEW' };

// ─── Template ────────────────────────────────────────────────────
export interface TemplatePage {
  name: string;
  slug: string;
  elements: EditorElement[];
}

export interface DesignerTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  elements: EditorElement[];
  /** Multi-page support – if present, each entry is a separate page */
  pages?: TemplatePage[];
}
