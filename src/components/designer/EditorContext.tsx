import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, useMemo, useSyncExternalStore } from 'react';
import { EditorState, EditorAction, EditorElement, Breakpoint, ResponsiveStyles } from './types';
import { removeElement, updateElement, insertElement, moveElement, cloneElement, findElement, findParent } from './utils/treeUtils';
import { supabase } from '@/integrations/supabase/client';

const MAX_HISTORY = 50;

const initialState: EditorState = {
  elements: [],
  selectedIds: [],
  hoveredId: null,
  clipboard: null,
  history: [[]],
  historyIndex: 0,
  breakpoint: 'desktop',
  zoom: 0.5,
  dragState: null,
  isDirty: false,
  saveStatus: 'idle',
  activePage: null,
  leftPanelTab: 'components',
  rightPanelTab: 'style',
  isPreviewOpen: false,
};

// Style clipboard (separate from element clipboard)
let styleClipboard: ResponsiveStyles | null = null;

export function getStyleClipboard() { return styleClipboard; }
export function setStyleClipboard(s: ResponsiveStyles) { styleClipboard = JSON.parse(JSON.stringify(s)); }

function pushHistory(state: EditorState, newElements: EditorElement[]): Partial<EditorState> {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(JSON.parse(JSON.stringify(newElements)));
  if (newHistory.length > MAX_HISTORY) newHistory.shift();
  return { history: newHistory, historyIndex: newHistory.length - 1, isDirty: true };
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_ELEMENTS':
      return { ...state, elements: action.payload, history: [JSON.parse(JSON.stringify(action.payload))], historyIndex: 0, isDirty: false };

    case 'ADD_ELEMENT': {
      const { element, parentId, index } = action.payload;
      const newEls = insertElement(state.elements, element, parentId, index);
      return { ...state, elements: newEls, selectedIds: [element.id], ...pushHistory(state, newEls) };
    }

    case 'DELETE_ELEMENT': {
      const newEls = removeElement(state.elements, action.payload);
      const newSelected = state.selectedIds.filter(id => id !== action.payload);
      return { ...state, elements: newEls, selectedIds: newSelected, ...pushHistory(state, newEls) };
    }

    case 'UPDATE_ELEMENT': {
      const { id, updates } = action.payload;
      const newEls = updateElement(state.elements, id, updates);
      return { ...state, elements: newEls, ...pushHistory(state, newEls) };
    }

    case 'MOVE_ELEMENT': {
      const { elementId, newParentId, newIndex } = action.payload;
      const newEls = moveElement(state.elements, elementId, newParentId, newIndex);
      return { ...state, elements: newEls, ...pushHistory(state, newEls) };
    }

    case 'DUPLICATE_ELEMENT': {
      const original = findElement(state.elements, action.payload);
      if (!original) return state;
      const clone = cloneElement(original);
      // Insert right after the original
      const parent = findParent(state.elements, action.payload);
      const siblings = parent ? parent.children : state.elements;
      const idx = siblings.findIndex(el => el.id === action.payload);
      const newEls = insertElement(state.elements, clone, parent?.id, idx + 1);
      return { ...state, elements: newEls, selectedIds: [clone.id], ...pushHistory(state, newEls) };
    }

    case 'SELECT':
      return { ...state, selectedIds: action.payload ? [action.payload] : [] };

    case 'MULTI_SELECT':
      return {
        ...state,
        selectedIds: state.selectedIds.includes(action.payload)
          ? state.selectedIds.filter(id => id !== action.payload)
          : [...state.selectedIds, action.payload],
      };

    case 'HOVER':
      return { ...state, hoveredId: action.payload };

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return { ...state, elements: JSON.parse(JSON.stringify(state.history[newIndex])), historyIndex: newIndex, isDirty: true };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return { ...state, elements: JSON.parse(JSON.stringify(state.history[newIndex])), historyIndex: newIndex, isDirty: true };
    }

    case 'SET_BREAKPOINT':
      return { ...state, breakpoint: action.payload };

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.25, Math.min(2, action.payload)) };

    case 'SET_DRAG':
      return { ...state, dragState: action.payload };

    case 'COPY': {
      const copied = state.selectedIds.map(id => findElement(state.elements, id)).filter(Boolean) as EditorElement[];
      return { ...state, clipboard: copied.map(e => cloneElement(e)) };
    }

    case 'PASTE': {
      if (!state.clipboard || state.clipboard.length === 0) return state;
      let newEls = state.elements;
      const newIds: string[] = [];
      for (const el of state.clipboard) {
        const fresh = cloneElement(el);
        newIds.push(fresh.id);
        newEls = insertElement(newEls, fresh, action.payload);
      }
      return { ...state, elements: newEls, selectedIds: newIds, ...pushHistory(state, newEls) };
    }

    case 'SET_DIRTY':
      return { ...state, isDirty: action.payload };

    case 'SET_SAVE_STATUS':
      return { ...state, saveStatus: action.payload };

    case 'SET_ACTIVE_PAGE':
      return { ...state, activePage: action.payload, selectedIds: [] };

    case 'SET_LEFT_TAB':
      return { ...state, leftPanelTab: action.payload };

    case 'SET_RIGHT_TAB':
      return { ...state, rightPanelTab: action.payload };

    case 'TOGGLE_PREVIEW':
      return { ...state, isPreviewOpen: !state.isPreviewOpen };

    default:
      return state;
  }
}

interface EditorContextValue {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  saveToDatabase: () => Promise<void>;
  selectedElement: EditorElement | null;
  wrapInContainer: () => void;
  moveSelectedUp: () => void;
  moveSelectedDown: () => void;
  copyStyles: () => void;
  pasteStyles: () => void;
  /** The live selection, readable inside callbacks without subscribing to
   *  it - so a drag handler can check it without re-rendering on it. */
  selectionRef: React.MutableRefObject<string[]>;
}

const EditorContext = createContext<EditorContextValue | null>(null);

/**
 * Per-element selection, as an external store.
 *
 * Context is all-or-nothing: when selectedIds changes every consumer
 * re-renders, so clicking one element re-rendered all 128 on the artboard,
 * costing ~84ms a click. useSyncExternalStore lets each element subscribe to
 * its own boolean, and React re-renders only the ones whose answer actually
 * changed - the element gaining selection and the one losing it.
 */
const selectionListeners = new Set<() => void>();
const selectionState = { ids: [] as string[], hovered: null as string | null };

function notifySelection() { selectionListeners.forEach(l => l()); }

function subscribeSelection(cb: () => void) {
  selectionListeners.add(cb);
  return () => { selectionListeners.delete(cb); };
}

export function useIsSelected(id: string): boolean {
  return useSyncExternalStore(
    subscribeSelection,
    () => selectionState.ids.includes(id),
    () => false,
  );
}

export function useIsHovered(id: string): boolean {
  return useSyncExternalStore(
    subscribeSelection,
    () => selectionState.hovered === id,
    () => false,
  );
}

export function EditorProvider({ children, pageId }: { children: React.ReactNode; pageId: string | null }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedElement = state.selectedIds.length === 1
    ? findElement(state.elements, state.selectedIds[0])
    : null;

  // Load page elements
  useEffect(() => {
    if (!pageId) return;
    dispatch({ type: 'SET_ACTIVE_PAGE', payload: pageId });

    const loadPage = async () => {
      const { data } = await supabase
        .from('designer_pages')
        .select('elements')
        .eq('id', pageId)
        .single();
      if (data?.elements) {
        dispatch({ type: 'SET_ELEMENTS', payload: data.elements as unknown as EditorElement[] });
      } else {
        dispatch({ type: 'SET_ELEMENTS', payload: [] });
      }
    };
    loadPage();
  }, [pageId]);

  const saveToDatabase = useCallback(async () => {
    const targetPage = state.activePage || pageId;
    if (!targetPage) return;
    dispatch({ type: 'SET_SAVE_STATUS', payload: 'saving' });
    try {
      const { error } = await supabase
        .from('designer_pages')
        .update({ elements: JSON.parse(JSON.stringify(state.elements)), updated_at: new Date().toISOString() })
        .eq('id', targetPage);
      if (error) throw error;
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'saved' });
      dispatch({ type: 'SET_DIRTY', payload: false });
    } catch {
      dispatch({ type: 'SET_SAVE_STATUS', payload: 'error' });
    }
  }, [pageId, state.activePage, state.elements]);

  // Autosave debounce
  useEffect(() => {
    if (!state.isDirty) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => { saveToDatabase(); }, 2000);
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [state.isDirty, state.elements, saveToDatabase]);

  // ── Helper actions ────────────────────────────────
  const wrapInContainer = useCallback(() => {
    if (state.selectedIds.length === 0) return;
    const id = state.selectedIds[0];
    const el = findElement(state.elements, id);
    if (!el) return;
    const parent = findParent(state.elements, id);
    const siblings = parent ? parent.children : state.elements;
    const idx = siblings.findIndex(s => s.id === id);

    const container: EditorElement = {
      id: crypto.randomUUID(),
      type: 'container',
      name: 'Container',
      props: {},
      styles: { desktop: { padding: '24px', width: '100%' } },
      children: [cloneElement(el, el.id)], // keep same ID for the child
    };

    // Remove original, insert container at same position
    let newEls = removeElement(state.elements, id);
    newEls = insertElement(newEls, container, parent?.id, idx);
    dispatch({ type: 'SET_ELEMENTS', payload: newEls });
    dispatch({ type: 'SELECT', payload: container.id });
  }, [state.selectedIds, state.elements, dispatch]);

  const moveSelectedUp = useCallback(() => {
    if (!selectedElement) return;
    const parent = findParent(state.elements, selectedElement.id);
    const siblings = parent ? parent.children : state.elements;
    const idx = siblings.findIndex(s => s.id === selectedElement.id);
    if (idx > 0) {
      dispatch({ type: 'MOVE_ELEMENT', payload: { elementId: selectedElement.id, newParentId: parent?.id, newIndex: idx - 1 } });
    }
  }, [selectedElement, state.elements, dispatch]);

  const moveSelectedDown = useCallback(() => {
    if (!selectedElement) return;
    const parent = findParent(state.elements, selectedElement.id);
    const siblings = parent ? parent.children : state.elements;
    const idx = siblings.findIndex(s => s.id === selectedElement.id);
    if (idx < siblings.length - 1) {
      dispatch({ type: 'MOVE_ELEMENT', payload: { elementId: selectedElement.id, newParentId: parent?.id, newIndex: idx + 1 } });
    }
  }, [selectedElement, state.elements, dispatch]);

  const copyStyles = useCallback(() => {
    if (!selectedElement) return;
    setStyleClipboard(selectedElement.styles);
  }, [selectedElement]);

  const pasteStyles = useCallback(() => {
    if (!selectedElement || !styleClipboard) return;
    dispatch({
      type: 'UPDATE_ELEMENT',
      payload: { id: selectedElement.id, updates: { styles: JSON.parse(JSON.stringify(styleClipboard)) } },
    });
  }, [selectedElement, dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        state.selectedIds.forEach(id => dispatch({ type: 'DELETE_ELEMENT', payload: id }));
      }
      if (e.key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey) { e.preventDefault(); dispatch({ type: 'UNDO' }); }
      if ((e.key === 'z' && (e.metaKey || e.ctrlKey) && e.shiftKey) || (e.key === 'y' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); dispatch({ type: 'REDO' }); }
      if (e.key === 'c' && (e.metaKey || e.ctrlKey) && !e.altKey) { dispatch({ type: 'COPY' }); }
      if (e.key === 'v' && (e.metaKey || e.ctrlKey) && !e.altKey) { dispatch({ type: 'PASTE' }); }
      if (e.key === 'c' && (e.metaKey || e.ctrlKey) && e.altKey) { e.preventDefault(); copyStyles(); }
      if (e.key === 'v' && (e.metaKey || e.ctrlKey) && e.altKey) { e.preventDefault(); pasteStyles(); }
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveToDatabase(); }
      // Escape handled below with parent selection logic
      if (e.key === 'd' && (e.metaKey || e.ctrlKey) && state.selectedIds.length === 1) {
        e.preventDefault();
        dispatch({ type: 'DUPLICATE_ELEMENT', payload: state.selectedIds[0] });
      }
      // Arrow keys: nudge position 1px (shift=10px), alt+arrow = reorder
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedElement && !e.metaKey && !e.ctrlKey) {
        if (e.altKey) {
          // Alt+Arrow = reorder in tree
          e.preventDefault();
          if (e.key === 'ArrowUp') moveSelectedUp();
          if (e.key === 'ArrowDown') moveSelectedDown();
        } else {
          // Arrow = nudge position
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const bp = state.breakpoint;
          const el = selectedElement;
          const currentLeft = parseInt(el.styles.desktop?.left as string || el.styles[bp]?.left as string || '0') || 0;
          const currentTop = parseInt(el.styles.desktop?.top as string || el.styles[bp]?.top as string || '0') || 0;
          let newLeft = currentLeft;
          let newTop = currentTop;
          if (e.key === 'ArrowLeft') newLeft -= step;
          if (e.key === 'ArrowRight') newLeft += step;
          if (e.key === 'ArrowUp') newTop -= step;
          if (e.key === 'ArrowDown') newTop += step;
          const newStyles = { ...el.styles };
          const updates = { position: 'absolute' as const, left: `${newLeft}px`, top: `${newTop}px` };
          if (bp === 'desktop') {
            newStyles.desktop = { ...newStyles.desktop, ...updates };
          } else {
            newStyles[bp] = { ...(newStyles[bp] ?? {}), ...updates };
          }
          dispatch({ type: 'UPDATE_ELEMENT', payload: { id: el.id, updates: { styles: newStyles } } });
        }
      }
      if (e.key === 'g' && (e.metaKey || e.ctrlKey) && state.selectedIds.length > 0) { e.preventDefault(); wrapInContainer(); }
      // Breakpoint shortcuts: 1, 2, 3
      if (e.key === '1' && !e.metaKey && !e.ctrlKey) dispatch({ type: 'SET_BREAKPOINT', payload: 'desktop' });
      if (e.key === '2' && !e.metaKey && !e.ctrlKey) dispatch({ type: 'SET_BREAKPOINT', payload: 'tablet' });
      if (e.key === '3' && !e.metaKey && !e.ctrlKey) dispatch({ type: 'SET_BREAKPOINT', payload: 'mobile' });
      // Zoom shortcuts
      if ((e.key === '=' || e.key === '+') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); dispatch({ type: 'SET_ZOOM', payload: state.zoom + 0.1 }); }
      if (e.key === '-' && (e.metaKey || e.ctrlKey) && !e.altKey) { e.preventDefault(); dispatch({ type: 'SET_ZOOM', payload: state.zoom - 0.1 }); }
      if (e.key === '0' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); dispatch({ type: 'SET_ZOOM', payload: 1 }); }
      // Select all
      if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        state.elements.forEach(el => dispatch({ type: 'MULTI_SELECT', payload: el.id }));
      }
      // Tab = cycle through sibling elements
      if (e.key === 'Tab' && selectedElement) {
        e.preventDefault();
        const parent = findParent(state.elements, selectedElement.id);
        const siblings = parent ? parent.children : state.elements;
        const idx = siblings.findIndex(s => s.id === selectedElement.id);
        const next = e.shiftKey
          ? siblings[(idx - 1 + siblings.length) % siblings.length]
          : siblings[(idx + 1) % siblings.length];
        if (next) dispatch({ type: 'SELECT', payload: next.id });
      }
      // Enter = select first child of container
      if (e.key === 'Enter' && selectedElement && !e.metaKey && !e.ctrlKey) {
        if (selectedElement.children?.length > 0) {
          e.preventDefault();
          dispatch({ type: 'SELECT', payload: selectedElement.children[0].id });
        }
      }
      // Escape = select parent
      if (e.key === 'Escape' && selectedElement) {
        const parent = findParent(state.elements, selectedElement.id);
        if (parent) {
          dispatch({ type: 'SELECT', payload: parent.id });
        } else {
          dispatch({ type: 'SELECT', payload: null });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.selectedIds, saveToDatabase, copyStyles, pasteStyles, moveSelectedUp, moveSelectedDown, wrapInContainer, selectedElement]);

  /**
   * The provider value was a fresh object literal on every render, so every
   * consumer re-rendered on every state change - and the canvas has one
   * consumer per element. Clicking a single element re-rendered all of them,
   * which is why selection took ~143ms on a page of 128 elements and the
   * whole editor sat at 43fps.
   */
  const selectionRef = useRef<string[]>(state.selectedIds);
  selectionRef.current = state.selectedIds;

  const value = useMemo(
    () => ({ state, dispatch, saveToDatabase, selectedElement, wrapInContainer,
             moveSelectedUp, moveSelectedDown, copyStyles, pasteStyles,
             selectionRef }),
    [state, saveToDatabase, selectedElement, wrapInContainer,
     moveSelectedUp, moveSelectedDown, copyStyles, pasteStyles],
  );

  /**
   * The canvas reads exactly three things - which breakpoint, what is
   * selected, what is hovered - and nothing else. Giving it its own context
   * means editing a style or typing in a panel no longer re-renders every
   * element on the artboard.
   */
  // The store mirrors the reducer; this is the only place it is written.
  if (selectionState.ids !== state.selectedIds || selectionState.hovered !== state.hoveredId) {
    selectionState.ids = state.selectedIds;
    selectionState.hovered = state.hoveredId;
    queueMicrotask(notifySelection);
  }

  const canvasValue = useMemo(
    () => ({ breakpoint: state.breakpoint, selectedIds: state.selectedIds, hoveredId: state.hoveredId }),
    [state.breakpoint, state.selectedIds, state.hoveredId],
  );

  return (
    <EditorContext.Provider value={value}>
      <CanvasStateContext.Provider value={canvasValue}>
        {children}
      </CanvasStateContext.Provider>
    </EditorContext.Provider>
  );
}

/** Just the three values the artboard cares about. */
interface CanvasState {
  breakpoint: Breakpoint;
  selectedIds: string[];
  hoveredId: string | null;
}
const CanvasStateContext = createContext<CanvasState | null>(null);

export function useCanvasState(): CanvasState {
  const ctx = useContext(CanvasStateContext);
  if (!ctx) throw new Error('useCanvasState must be used within EditorProvider');
  return ctx;
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
}
