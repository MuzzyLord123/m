import { useState, useRef, useEffect, useCallback } from 'react';
import { useCAD } from './CADContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateId } from './cadGeometry';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ReactMarkdown from 'react-markdown';
import {
  X, Send, Sparkles, Wand2, AlertTriangle, Ruler, Package, FileText,
  Brain, MessageSquare, Loader2, CheckCircle2, XCircle, Info, Lightbulb,
  Mic, MicOff, Zap, Boxes, ShieldCheck, ChevronRight, RotateCcw,
  Wrench, Play, Cpu, Target, TrendingUp, ArrowRight, Volume2,
  Eye, Layers, RefreshCw, Download, Copy, Check, Cog, FlaskConical,
  BarChart3, Award, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnyCADEntity, Point2D, Point3D } from './cadTypes';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  action?: string;
  parsedData?: any;
  isStreaming?: boolean;
}

interface ErrorItem {
  type: string;
  severity: 'error' | 'warning' | 'info';
  description: string;
  entityIds?: string[];
  suggestion: string;
  autoFix?: { action: string; params: any };
}

interface ContextualTip {
  analysis: string;
  tip: string;
  nextSteps: { action: string; command: string; priority: string }[];
  shortcuts: { key: string; action: string }[];
  warnings: string[];
  suggestion_commands?: { tool: string; params: any; reason: string }[];
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function CADAIPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useCAD();
  const [activeTab, setActiveTab] = useState('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '0', role: 'assistant', content: "**CAD AI Assistant** — I can draw geometry, inspect your design, estimate costs, and generate optimized structures.\n\nTry:\n- *\"Draw a 100×50 rectangle at origin\"*\n- *\"Create a house floor plan 10m × 8m\"*\n- *\"Draw a gear with 16 teeth\"*\n- *\"Add 4 circles in a grid pattern\"*", timestamp: Date.now()
  }]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [errorScore, setErrorScore] = useState<number | null>(null);
  const [materialData, setMaterialData] = useState<any>(null);
  const [bomData, setBomData] = useState<any>(null);
  const [contextTip, setContextTip] = useState<ContextualTip | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [genDesignForm, setGenDesignForm] = useState({ load: '500', material: 'steel', method: '3d_print', maxDim: '200', costTarget: '50' });
  const [genDesigns, setGenDesigns] = useState<any[]>([]);
  const [expandedDesign, setExpandedDesign] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Contextual tip on tool/entity change
  useEffect(() => {
    if (!open || activeTab !== 'chat') return;
    const timeout = setTimeout(() => {
      runContextualHelp();
    }, 2000);
    return () => clearTimeout(timeout);
  }, [state.activeTool, state.entities.length, open]);

  const getDrawingContext = useCallback(() => {
    const types = [...new Set(state.entities.map(e => e.type))];
    const entityCount = state.entities.length;
    const selectedCount = state.selectedIds.length;
    const layers = state.layers.filter(l => l.visible).map(l => l.name);
    const has3D = state.entities.some(e => ['box3d', 'wall', 'column', 'slab', 'window', 'door'].includes(e.type));
    
    let context = `Drawing: ${entityCount} entities`;
    if (types.length > 0) context += ` (${types.join(', ')})`;
    context += `. Units: ${state.units}. Tool: ${state.activeTool}. View: ${state.currentView}. Plane: ${state.drawingPlane}.`;
    if (selectedCount > 0) context += ` ${selectedCount} selected.`;
    if (has3D) context += ` Has 3D geometry.`;
    context += ` Layers: ${layers.join(', ')}.`;
    
    // Include selected entity details for better context
    if (selectedCount > 0 && selectedCount <= 10) {
      const selected = state.entities.filter(e => state.selectedIds.includes(e.id));
      context += ` Selected: ${JSON.stringify(selected.map(e => ({ type: e.type, data: e.data })))}`;
    }
    
    return context;
  }, [state]);

  const callAI = useCallback(async (action: string, data: any) => {
    const { data: result, error } = await supabase.functions.invoke('cad-ai', {
      body: { action, data }
    });
    if (error) throw error;
    if (result?.error) throw new Error(result.error);
    return result.content;
  }, []);

  const streamAI = useCallback(async (action: string, data: any, onDelta: (text: string) => void, onDone: () => void) => {
    abortRef.current = new AbortController();
    
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/cad-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ action, data, stream: true }),
      signal: abortRef.current.signal,
    });

    if (!resp.ok || !resp.body) {
      if (resp.status === 429) throw new Error('Rate limited — try again shortly.');
      if (resp.status === 402) throw new Error('AI credits exhausted.');
      throw new Error('AI request failed');
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (!line.startsWith('data: ')) continue;
        const json = line.slice(6).trim();
        if (json === '[DONE]') { onDone(); return; }
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch { /* partial */ }
      }
    }
    onDone();
  }, []);

  const parseJSON = (text: string) => {
    try {
      const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
      return match ? JSON.parse(match[1]) : JSON.parse(text);
    } catch { return null; }
  };

  const applyCommands = (commands: any[]) => {
    let count = 0;
    const entities: AnyCADEntity[] = [];
    
    commands.forEach((cmd: any) => {
      const layerId = state.activeLayerId;
      let entity: AnyCADEntity | null = null;

      switch (cmd.tool) {
        case 'line':
          entity = { id: generateId(), type: 'line', layerId, data: { start: cmd.params.start, end: cmd.params.end } } as AnyCADEntity;
          break;
        case 'circle':
          entity = { id: generateId(), type: 'circle', layerId, data: { center: cmd.params.center, radius: cmd.params.radius } } as AnyCADEntity;
          break;
        case 'rectangle':
          entity = { id: generateId(), type: 'rectangle', layerId, data: { origin: cmd.params.origin, width: cmd.params.width, height: cmd.params.height } } as AnyCADEntity;
          break;
        case 'arc':
          entity = { id: generateId(), type: 'arc', layerId, data: cmd.params } as AnyCADEntity;
          break;
        case 'polygon':
          entity = { id: generateId(), type: 'polygon', layerId, data: { center: cmd.params.center, radius: cmd.params.radius, sides: cmd.params.sides, inscribed: true } } as AnyCADEntity;
          break;
        case 'ellipse':
          entity = { id: generateId(), type: 'ellipse', layerId, data: { center: cmd.params.center, radiusX: cmd.params.radiusX, radiusY: cmd.params.radiusY } } as AnyCADEntity;
          break;
        case 'polyline':
          entity = { id: generateId(), type: 'polyline', layerId, data: { points: cmd.params.points, closed: cmd.params.closed ?? false } } as AnyCADEntity;
          break;
        case 'box3d':
          entity = { id: generateId(), type: 'box3d', layerId, data: { origin: cmd.params.origin, width: cmd.params.width, depth: cmd.params.depth, height: cmd.params.height } } as AnyCADEntity;
          break;
        case 'wall':
          entity = { id: generateId(), type: 'wall', layerId, data: cmd.params } as AnyCADEntity;
          break;
        case 'column':
          entity = { id: generateId(), type: 'column', layerId, data: cmd.params } as AnyCADEntity;
          break;
        case 'window':
          entity = { id: generateId(), type: 'window', layerId, data: cmd.params } as AnyCADEntity;
          break;
        case 'door':
          entity = { id: generateId(), type: 'door', layerId, data: cmd.params } as AnyCADEntity;
          break;
        case 'slab':
          entity = { id: generateId(), type: 'slab', layerId, data: cmd.params } as AnyCADEntity;
          break;
        case 'sphere':
          entity = { id: generateId(), type: 'sphere', layerId, data: { center: cmd.params.center || { x: 0, y: 0, z: 0 }, radius: cmd.params.radius || 5 } } as AnyCADEntity;
          break;
        case 'cone':
          entity = { id: generateId(), type: 'cone', layerId, data: { base: cmd.params.base || { x: 0, y: 0, z: 0 }, radius: cmd.params.radius || 5, height: cmd.params.height || 10, topRadius: cmd.params.topRadius || 0 } } as AnyCADEntity;
          break;
        case 'torus':
          entity = { id: generateId(), type: 'torus', layerId, data: { center: cmd.params.center || { x: 0, y: 0, z: 0 }, majorRadius: cmd.params.majorRadius || 10, minorRadius: cmd.params.minorRadius || 2 } } as AnyCADEntity;
          break;
        case 'cylinder':
          entity = { id: generateId(), type: 'cylinder', layerId, data: { base: cmd.params.base || { x: 0, y: 0, z: 0 }, radius: cmd.params.radius || 5, height: cmd.params.height || 15 } } as AnyCADEntity;
          break;
        case 'pyramid':
          entity = { id: generateId(), type: 'pyramid', layerId, data: { base: cmd.params.base || { x: 0, y: 0, z: 0 }, baseSize: cmd.params.baseSize || 10, height: cmd.params.height || 12, sides: cmd.params.sides || 4 } } as AnyCADEntity;
          break;
        case 'stairs':
          entity = { id: generateId(), type: 'stairs', layerId, data: { base: cmd.params.base || { x: 0, y: 0, z: 0 }, width: cmd.params.width || 12, stepCount: cmd.params.stepCount || 10, stepHeight: cmd.params.stepHeight || 1.7, stepDepth: cmd.params.stepDepth || 2.8 } } as AnyCADEntity;
          break;
        case 'text':
          entity = { id: generateId(), type: 'text', layerId, data: { position: cmd.params.position, content: cmd.params.content, fontSize: cmd.params.fontSize || 5, fontFamily: 'monospace' } } as AnyCADEntity;
          break;
        case 'dim-linear':
        case 'dimension':
          entity = { id: generateId(), type: 'dimension', layerId: 'layer-dims', data: { start: cmd.params.start, end: cmd.params.end, offset: cmd.params.offset || 10, text: cmd.params.text, dimType: cmd.params.type || 'linear' } } as AnyCADEntity;
          break;
      }

      if (entity) {
        entities.push(entity);
        count++;
      }
    });
    
    if (entities.length > 0) {
      dispatch({ type: 'ADD_ENTITIES', payload: entities });
    }
    return count;
  };

  const handleSend = async (overrideInput?: string) => {
    const text = overrideInput || input.trim();
    if (!text || loading) return;
    const userMsg: ChatMessage = { id: generateId(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setVoiceTranscript('');
    setLoading(true);

    const assistantId = generateId();
    let fullContent = '';

    try {
      const context = getDrawingContext();

      // Build conversation history (last 10 messages)
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));

      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true }]);

      await streamAI('natural-language', {
        messages: [
          ...history,
          { role: 'user', content: `Context: ${context}\n\nUser request: ${text}` }
        ]
      }, (delta) => {
        fullContent += delta;
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m));
      }, () => {
        // Done streaming — try to parse commands
        const parsed = parseJSON(fullContent);
        let finalContent = fullContent;

        if (parsed?.commands?.length > 0) {
          const count = applyCommands(parsed.commands);
          finalContent = `✅ **Created ${count} entit${count === 1 ? 'y' : 'ies'}**\n\n${parsed.explanation || ''}`;
          toast.success(`AI created ${count} entities`, { icon: <Sparkles className="h-4 w-4" /> });
        } else if (parsed?.explanation) {
          finalContent = parsed.explanation;
        }

        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: finalContent, isStreaming: false, parsedData: parsed } : m));
      });
    } catch (e: any) {
      setMessages(prev => prev.map(m => m.id === assistantId 
        ? { ...m, content: `⚠️ ${e.message || 'Something went wrong.'}`, isStreaming: false } 
        : m));
      toast.error(e.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  const runErrorCheck = async () => {
    setLoading(true);
    try {
      const entitiesSlice = state.entities.slice(0, 150).map(e => ({
        id: e.id, type: e.type, data: e.data, layerId: e.layerId
      }));
      const raw = await callAI('error-detection', {
        messages: [{ role: 'user', content: `Analyze these ${state.entities.length} CAD entities (units: ${state.units}) for errors. Be thorough:\n${JSON.stringify(entitiesSlice)}` }]
      });
      const parsed = parseJSON(raw);
      if (parsed?.errors) {
        setErrors(parsed.errors);
        setErrorScore(parsed.score ?? null);
        const errorCount = parsed.errors.filter((e: ErrorItem) => e.severity === 'error').length;
        const warnCount = parsed.errors.filter((e: ErrorItem) => e.severity === 'warning').length;
        toast.success(`${errorCount} errors, ${warnCount} warnings found`);
      } else {
        setErrors([]);
        setErrorScore(100);
        toast.success('Drawing is clean — no issues detected');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error check failed');
    } finally {
      setLoading(false);
    }
  };

  const runAutoFix = async (error: ErrorItem) => {
    if (!error.autoFix) return;
    const { action: fixAction, params } = error.autoFix;
    
    if (fixAction === 'delete' && error.entityIds?.length) {
      const newEntities = state.entities.filter(e => !error.entityIds!.includes(e.id));
      dispatch({ type: 'REPLACE_ENTITIES', payload: newEntities });
      setErrors(prev => prev.filter(e => e !== error));
      toast.success('Auto-fixed: removed problematic entities');
    } else if (fixAction === 'close' && error.entityIds?.length) {
      // Close open polylines
      error.entityIds.forEach(eid => {
        const entity = state.entities.find(e => e.id === eid);
        if (entity?.type === 'polyline') {
          dispatch({ type: 'UPDATE_ENTITY', payload: { id: eid, changes: { data: { ...entity.data, closed: true } } } });
        }
      });
      setErrors(prev => prev.filter(e => e !== error));
      toast.success('Auto-fixed: closed open contours');
    }
  };

  const runSmartDimension = async () => {
    if (state.selectedIds.length === 0) { toast.error('Select entities to dimension'); return; }
    setLoading(true);
    try {
      const selected = state.entities.filter(e => state.selectedIds.includes(e.id)).map(e => ({
        id: e.id, type: e.type, data: e.data
      }));
      const raw = await callAI('smart-dimension', {
        messages: [{ role: 'user', content: `Auto-dimension these ${selected.length} entities (units: ${state.units}). Place dimensions optimally:\n${JSON.stringify(selected)}` }]
      });
      const parsed = parseJSON(raw);
      if (parsed?.dimensions?.length > 0) {
        const dimEntities: AnyCADEntity[] = parsed.dimensions.map((d: any) => ({
          id: generateId(), type: 'dimension', layerId: 'layer-dims',
          data: { start: d.start, end: d.end, offset: d.offset || 10, text: d.text, dimType: d.type || 'linear' }
        }));
        dispatch({ type: 'ADD_ENTITIES', payload: dimEntities });
        toast.success(`Added ${dimEntities.length} smart dimensions`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Dimensioning failed');
    } finally {
      setLoading(false);
    }
  };

  const runMaterialEstimation = async () => {
    setLoading(true);
    try {
      const solids = state.entities.filter(e => ['box3d', 'wall', 'column', 'slab', 'rectangle', 'circle', 'window', 'door'].includes(e.type));
      if (solids.length === 0) { toast.error('No geometry found for estimation'); setLoading(false); return; }
      const raw = await callAI('material-estimation', {
        messages: [{ role: 'user', content: `Estimate materials for these ${solids.length} entities (units: ${state.units}). Calculate precise volumes:\n${JSON.stringify(solids.map(e => ({ type: e.type, data: e.data })))}` }]
      });
      const parsed = parseJSON(raw);
      if (parsed) setMaterialData(parsed);
    } catch (e: any) {
      toast.error(e.message || 'Estimation failed');
    } finally {
      setLoading(false);
    }
  };

  const runBOM = async () => {
    setLoading(true);
    try {
      const raw = await callAI('bom-generation', {
        messages: [{ role: 'user', content: `Generate comprehensive BOM for ${state.entities.length} entities (units: ${state.units}):\n${JSON.stringify(state.entities.slice(0, 100).map(e => ({ type: e.type, data: e.data, layerId: e.layerId })))}` }]
      });
      const parsed = parseJSON(raw);
      if (parsed) setBomData(parsed);
    } catch (e: any) {
      toast.error(e.message || 'BOM generation failed');
    } finally {
      setLoading(false);
    }
  };

  const runContextualHelp = async () => {
    if (state.entities.length === 0) return;
    try {
      const context = getDrawingContext();
      const raw = await callAI('contextual-help', {
        messages: [{ role: 'user', content: `Current state: ${context}. Analyze what I'm building and suggest next steps.` }]
      });
      const parsed = parseJSON(raw);
      if (parsed) setContextTip(parsed);
    } catch { /* silent */ }
  };

  const runGenerativeDesign = async () => {
    setLoading(true);
    setGenDesigns([]);
    try {
      const raw = await callAI('generative-design', {
        messages: [{
          role: 'user',
          content: `Generate structural designs with these constraints:
- Load: ${genDesignForm.load}N
- Material: ${genDesignForm.material}
- Manufacturing: ${genDesignForm.method.replace('_', ' ')}
- Max dimensions: ${genDesignForm.maxDim}mm
- Cost target: $${genDesignForm.costTarget}
- Units: ${state.units}

Generate 3-5 optimal design variants as CAD geometry.`
        }]
      });
      const parsed = parseJSON(raw);
      if (parsed?.designs?.length > 0) {
        setGenDesigns(parsed.designs);
        toast.success(`Generated ${parsed.designs.length} design variants`);
      } else {
        toast.error('No designs generated');
      }
    } catch (e: any) {
      toast.error(e.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const applyDesign = (design: any) => {
    if (design.commands?.length > 0) {
      const count = applyCommands(design.commands);
      toast.success(`Applied "${design.name}" — ${count} entities created`);
    }
  };

  // Voice recognition
  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setVoiceTranscript(transcript);
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (voiceTranscript) {
        handleSend(voiceTranscript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Voice recognition failed');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    toast.info('Listening...', { icon: <Mic className="h-4 w-4" /> });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!open) return null;

  const severityIcon = (s: string) => s === 'error' ? <XCircle className="h-3.5 w-3.5 text-red-400" /> : s === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> : <Info className="h-3.5 w-3.5 text-blue-400" />;
  const severityColor = (s: string) => s === 'error' ? 'border-red-500/20 bg-red-500/5' : s === 'warning' ? 'border-amber-500/20 bg-amber-500/5' : 'border-blue-500/20 bg-blue-500/5';

  return (
    <div className="fixed top-[68px] right-0 bottom-[28px] w-[400px] z-[999] bg-[#0a0a0a]/98 backdrop-blur-2xl border-l border-white/[0.06] flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-purple-950/30 to-indigo-950/20">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Brain className="h-4.5 w-4.5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-[13px] font-semibold text-white tracking-tight">AI Design Engine</h3>
          <p className="text-[10px] text-purple-300/50">Gemini 3 Flash · Real-time assist</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={toggleVoice}
            className={cn("h-7 w-7 rounded-lg flex items-center justify-center transition-all",
              isListening ? "bg-red-500/20 text-red-400 animate-pulse" : "text-white/30 hover:text-white hover:bg-white/10"
            )}>
            {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </button>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="bg-transparent border-b border-white/[0.06] rounded-none h-auto p-0 justify-start gap-0">
          {[
            { value: 'chat', icon: MessageSquare, label: 'Chat' },
            { value: 'generate', icon: FlaskConical, label: 'Design' },
            { value: 'inspect', icon: ShieldCheck, label: 'Inspect' },
            { value: 'estimate', icon: Package, label: 'Cost' },
            { value: 'bom', icon: FileText, label: 'BOM' },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value}
              className={cn(
                "rounded-none border-b-2 border-transparent px-3 py-2.5 text-[10px] font-medium text-white/40 data-[state=active]:text-purple-400 data-[state=active]:border-purple-500 data-[state=active]:bg-transparent transition-all",
              )}>
              <t.icon className="h-3 w-3 mr-1" />{t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ═══ CHAT TAB ═══ */}
        <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 m-0 p-0">
          {/* Quick actions bar */}
          <div className="px-3 py-2 border-b border-white/[0.04] flex flex-wrap gap-1.5">
            {[
              { label: 'Smart Dim', icon: Ruler, action: runSmartDimension, color: 'text-blue-400' },
              { label: 'Inspect', icon: ShieldCheck, action: () => { setActiveTab('inspect'); runErrorCheck(); }, color: 'text-green-400' },
              { label: 'Costs', icon: TrendingUp, action: () => { setActiveTab('estimate'); runMaterialEstimation(); }, color: 'text-amber-400' },
              { label: 'BOM', icon: Boxes, action: () => { setActiveTab('bom'); runBOM(); }, color: 'text-cyan-400' },
            ].map(a => (
              <button key={a.label} onClick={a.action} disabled={loading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-white/40 bg-white/[0.03] hover:bg-white/[0.07] hover:text-white/70 transition-all disabled:opacity-30 border border-white/[0.04] hover:border-white/[0.08]">
                <a.icon className={cn("h-3 w-3", a.color)} />{a.label}
              </button>
            ))}
          </div>

          {/* Contextual tip */}
          {contextTip && state.entities.length > 0 && (
            <div className="mx-3 mt-2 p-2.5 rounded-lg bg-gradient-to-r from-purple-500/8 to-indigo-500/8 border border-purple-500/15">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-purple-300/80 font-medium mb-0.5">{contextTip.analysis}</p>
                  <p className="text-[10px] text-white/50">{contextTip.tip}</p>
                  {contextTip.nextSteps?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {contextTip.nextSteps.slice(0, 3).map((step, i) => (
                        <button key={i} onClick={() => { setInput(step.command); handleSend(step.command); }}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300/70 hover:text-purple-200 hover:bg-purple-500/25 transition-all">
                          {step.action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setContextTip(null)} className="text-white/20 hover:text-white/50">
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={cn("flex group", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed relative",
                  msg.role === 'user'
                    ? 'bg-purple-600/25 text-white/90 rounded-br-sm border border-purple-500/15'
                    : 'bg-white/[0.04] text-white/80 rounded-bl-sm border border-white/[0.05]'
                )}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>p]:text-[12px] [&>ul]:text-[11px] [&>ol]:text-[11px] [&>h1]:text-[14px] [&>h2]:text-[13px] [&>h3]:text-[12px] [&>code]:text-[10px] [&>code]:bg-white/10 [&>code]:px-1 [&>code]:rounded [&>pre]:bg-black/30 [&>pre]:rounded-lg [&>pre]:text-[10px]">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {msg.isStreaming && <span className="inline-block w-1.5 h-3.5 bg-purple-400 animate-pulse ml-0.5 rounded-sm" />}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                  
                  {/* Copy button */}
                  {msg.role === 'assistant' && msg.content && !msg.isStreaming && (
                    <button onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white/50 hover:bg-white/10 transition-all">
                      {copiedId === msg.id ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && !messages.some(m => m.isStreaming) && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] rounded-2xl px-3.5 py-2.5 flex items-center gap-2 text-[12px] text-white/40 border border-white/[0.05]">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Voice indicator */}
          {isListening && (
            <div className="px-3 py-2 border-t border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <p className="text-[11px] text-red-300/80 flex-1">
                  {voiceTranscript || 'Listening... speak your command'}
                </p>
                <button onClick={toggleVoice} className="text-[10px] text-red-400 hover:text-red-300">
                  Stop
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/[0.06] bg-[#0d0d0d]/80">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Draw a gear with 12 teeth..."
                className="flex-1 min-h-[38px] max-h-[100px] resize-none bg-white/[0.04] border-white/[0.08] text-[12px] text-white placeholder:text-white/25 rounded-xl focus:border-purple-500/30 focus:ring-purple-500/10"
                rows={1}
              />
              <div className="flex flex-col gap-1">
                <Button size="sm" onClick={() => handleSend()} disabled={loading || !input.trim()}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 h-9 w-9 p-0 rounded-xl shadow-lg shadow-purple-500/10">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[9px] text-white/20">Natural language · Voice · Compound commands</p>
              <p className="text-[9px] text-white/15">{state.entities.length} entities</p>
            </div>
          </div>
        </TabsContent>

        {/* ═══ INSPECT TAB ═══ */}
        <TabsContent value="inspect" className="flex-1 flex flex-col min-h-0 m-0 p-0">
          <div className="px-3 py-3 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[12px] text-white/70 font-medium">Drawing Health</span>
              {errorScore !== null && (
                <div className="flex items-center gap-2">
                  <Progress value={errorScore} className="w-16 h-1.5" />
                  <Badge variant="outline" className={cn(
                    "text-[10px] border-none font-mono",
                    errorScore >= 80 ? 'bg-green-500/20 text-green-400' : errorScore >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                  )}>
                    {errorScore}/100
                  </Badge>
                </div>
              )}
            </div>
            <Button onClick={runErrorCheck} disabled={loading} size="sm"
              className="w-full bg-white/[0.05] hover:bg-white/[0.08] text-white/70 text-[11px] h-9 rounded-xl border border-white/[0.06]">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <ShieldCheck className="h-3.5 w-3.5 mr-2" />}
              Run Full Inspection
            </Button>
          </div>
          <ScrollArea className="flex-1 px-3 py-2">
            {errors.length === 0 && errorScore !== null && (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="h-14 w-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-7 w-7 text-green-400/70" />
                </div>
                <p className="text-[13px] text-white/60 font-medium">All checks passed</p>
                <p className="text-[10px] text-white/30 mt-1">Your drawing meets quality standards</p>
              </div>
            )}
            {errors.map((err, i) => (
              <div key={i} className={cn("mb-2 p-3 rounded-xl border transition-all hover:border-white/15", severityColor(err.severity))}>
                <div className="flex items-start gap-2.5">
                  {severityIcon(err.severity)}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/80 font-medium leading-tight">{err.description}</p>
                    <p className="text-[10px] text-white/40 mt-1">{err.suggestion}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {err.entityIds?.length ? (
                        <button
                          onClick={() => dispatch({ type: 'SELECT', payload: err.entityIds })}
                          className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
                        >
                          <Eye className="h-3 w-3" /> Select
                        </button>
                      ) : null}
                      {err.autoFix && (
                        <button
                          onClick={() => runAutoFix(err)}
                          className="text-[10px] text-green-400 hover:text-green-300 flex items-center gap-0.5"
                        >
                          <Wrench className="h-3 w-3" /> Auto-fix
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {errors.length === 0 && errorScore === null && (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="h-14 w-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-3">
                  <ShieldCheck className="h-7 w-7 text-white/10" />
                </div>
                <p className="text-[12px] text-white/40">Run inspection to check drawing quality</p>
                <p className="text-[10px] text-white/20 mt-1">Checks for overlaps, gaps, compliance issues</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* ═══ GENERATIVE DESIGN TAB ═══ */}
        <TabsContent value="generate" className="flex-1 flex flex-col min-h-0 m-0 p-0">
          <ScrollArea className="flex-1 px-3 py-3">
            <div className="space-y-3">
              <p className="text-[11px] text-white/50 leading-relaxed">Define constraints and let AI generate optimized structural designs as CAD geometry.</p>

              {/* Constraint form */}
              <div className="space-y-2.5">
                {[
                  { label: 'Load (N)', key: 'load' as const, placeholder: '500' },
                  { label: 'Max Dimension (mm)', key: 'maxDim' as const, placeholder: '200' },
                  { label: 'Cost Target ($)', key: 'costTarget' as const, placeholder: '50' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">{f.label}</label>
                    <input
                      type="number"
                      value={genDesignForm[f.key]}
                      onChange={e => setGenDesignForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] px-2.5 text-[11px] text-white placeholder:text-white/20 focus:border-purple-500/30 focus:outline-none"
                    />
                  </div>
                ))}

                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Material</label>
                  <select
                    value={genDesignForm.material}
                    onChange={e => setGenDesignForm(prev => ({ ...prev, material: e.target.value }))}
                    className="w-full h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] px-2.5 text-[11px] text-white focus:border-purple-500/30 focus:outline-none appearance-none"
                  >
                    {['steel', 'aluminum', 'titanium', 'pla', 'abs', 'nylon', 'wood', 'copper', 'brass', 'acrylic', 'polycarbonate'].map(m => (
                      <option key={m} value={m} className="bg-[#1a1a1a] text-white">{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-white/40 uppercase tracking-wider mb-1 block">Manufacturing</label>
                  <select
                    value={genDesignForm.method}
                    onChange={e => setGenDesignForm(prev => ({ ...prev, method: e.target.value }))}
                    className="w-full h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] px-2.5 text-[11px] text-white focus:border-purple-500/30 focus:outline-none appearance-none"
                  >
                    {[['3d_print', '3D Print (FDM/SLA)'], ['cnc', 'CNC Milling'], ['laser_cut', 'Laser Cut'], ['injection_mold', 'Injection Mold'], ['casting', 'Casting']].map(([v, l]) => (
                      <option key={v} value={v} className="bg-[#1a1a1a] text-white">{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button onClick={runGenerativeDesign} disabled={loading} size="sm"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] h-9 rounded-xl shadow-lg shadow-purple-500/10">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Cpu className="h-3.5 w-3.5 mr-2" />}
                Generate Design Variants
              </Button>

              {/* Results */}
              {genDesigns.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">{genDesigns.length} Variants Generated</p>
                  {genDesigns.map((design, i) => (
                    <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                      <button
                        onClick={() => setExpandedDesign(expandedDesign === i ? null : i)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.03] transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-white/80 font-medium truncate">{design.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[8px] border-white/10 text-white/35">{design.approach}</Badge>
                            {design.metrics?.safety_factor && (
                              <span className="text-[9px] text-white/30">SF: {design.metrics.safety_factor.toFixed(1)}</span>
                            )}
                            {design.metrics?.estimated_cost != null && (
                              <span className="text-[9px] text-green-400/70">${design.metrics.estimated_cost.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                        {expandedDesign === i ? <ChevronUp className="h-3.5 w-3.5 text-white/20" /> : <ChevronDown className="h-3.5 w-3.5 text-white/20" />}
                      </button>

                      {expandedDesign === i && (
                        <div className="px-3 pb-3 space-y-2 border-t border-white/[0.04]">
                          <p className="text-[10px] text-white/50 leading-relaxed pt-2">{design.description}</p>

                          {design.metrics && (
                            <div className="grid grid-cols-2 gap-1.5">
                              {[
                                { label: 'Weight', value: `${design.metrics.weight_kg?.toFixed(3)} kg` },
                                { label: 'Max Stress', value: `${design.metrics.max_stress_mpa?.toFixed(1)} MPa` },
                                { label: 'Deflection', value: `${design.metrics.max_deflection_mm?.toFixed(2)} mm` },
                                { label: 'Utilization', value: `${design.metrics.material_utilization_percent?.toFixed(0)}%` },
                              ].map(m => (
                                <div key={m.label} className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                                  <p className="text-[8px] text-white/25 uppercase">{m.label}</p>
                                  <p className="text-[11px] text-white/70 font-mono">{m.value}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {design.pros?.length > 0 && (
                            <div className="space-y-0.5">
                              {design.pros.map((p: string, j: number) => (
                                <p key={j} className="text-[10px] text-green-400/60 flex items-start gap-1"><CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" />{p}</p>
                              ))}
                            </div>
                          )}
                          {design.cons?.length > 0 && (
                            <div className="space-y-0.5">
                              {design.cons.map((c: string, j: number) => (
                                <p key={j} className="text-[10px] text-amber-400/60 flex items-start gap-1"><AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />{c}</p>
                              ))}
                            </div>
                          )}

                          <Button size="sm" onClick={() => applyDesign(design)}
                            className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-[10px] h-8 rounded-lg border border-purple-500/20">
                            <Play className="h-3 w-3 mr-1.5" /> Apply to Canvas
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ═══ COST TAB ═══ */}
        <TabsContent value="estimate" className="flex-1 flex flex-col min-h-0 m-0 p-0">
          <div className="px-3 py-3 border-b border-white/[0.06]">
            <Button onClick={runMaterialEstimation} disabled={loading} size="sm"
              className="w-full bg-white/[0.05] hover:bg-white/[0.08] text-white/70 text-[11px] h-9 rounded-xl border border-white/[0.06]">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <TrendingUp className="h-3.5 w-3.5 mr-2" />}
              Estimate Materials & Cost
            </Button>
          </div>
          <ScrollArea className="flex-1 px-3 py-2">
            {materialData ? (
              <div className="space-y-3">
                {materialData.volume_mm3 && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <p className="text-[9px] text-white/30 uppercase tracking-wider">Volume</p>
                      <p className="text-[13px] text-white/80 font-mono mt-0.5">{(materialData.volume_mm3 / 1000).toFixed(1)}<span className="text-[9px] text-white/30 ml-0.5">cm³</span></p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <p className="text-[9px] text-white/30 uppercase tracking-wider">Surface</p>
                      <p className="text-[13px] text-white/80 font-mono mt-0.5">{(materialData.surface_area_mm2 / 100).toFixed(1)}<span className="text-[9px] text-white/30 ml-0.5">cm²</span></p>
                    </div>
                    {materialData.bounding_box && (
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                        <p className="text-[9px] text-white/30 uppercase tracking-wider">Bounds</p>
                        <p className="text-[10px] text-white/60 font-mono mt-0.5">{materialData.bounding_box.w}×{materialData.bounding_box.d}×{materialData.bounding_box.h}</p>
                      </div>
                    )}
                  </div>
                )}
                {materialData.estimates?.map((est: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-white/80 font-medium">{est.material}</span>
                        {est.strength_rating && (
                          <Badge variant="outline" className="text-[8px] border-white/10 text-white/30">
                            {est.strength_rating} strength
                          </Badge>
                        )}
                      </div>
                      <span className="text-[13px] text-green-400 font-mono font-medium">${est.total_cost?.toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-white/40">
                      <span>Weight: <span className="text-white/60">{est.weight_kg?.toFixed(3)} kg</span></span>
                      <span>Waste: <span className="text-white/60">{est.waste_percent}%</span></span>
                      <span>Material: <span className="text-white/60">${est.material_cost?.toFixed(2)}</span></span>
                      {est.manufacturing_cost && <span>Mfg: <span className="text-white/60">${est.manufacturing_cost?.toFixed(2)}</span></span>}
                      {est.print_time_hours && <span>Print: <span className="text-white/60">{est.print_time_hours}h</span></span>}
                      {est.cnc_time_hours && <span>CNC: <span className="text-white/60">{est.cnc_time_hours}h</span></span>}
                    </div>
                  </div>
                ))}
                {materialData.recommendation && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/8 to-indigo-500/8 border border-purple-500/15">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-3.5 w-3.5 text-purple-400 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-white/60 leading-relaxed">{materialData.recommendation}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="h-14 w-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-3">
                  <Package className="h-7 w-7 text-white/10" />
                </div>
                <p className="text-[12px] text-white/40">Estimate manufacturing costs</p>
                <p className="text-[10px] text-white/20 mt-1">Supports FDM, SLA, CNC, and casting</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* ═══ BOM TAB ═══ */}
        <TabsContent value="bom" className="flex-1 flex flex-col min-h-0 m-0 p-0">
          <div className="px-3 py-3 border-b border-white/[0.06]">
            <Button onClick={runBOM} disabled={loading} size="sm"
              className="w-full bg-white/[0.05] hover:bg-white/[0.08] text-white/70 text-[11px] h-9 rounded-xl border border-white/[0.06]">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <FileText className="h-3.5 w-3.5 mr-2" />}
              Generate Bill of Materials
            </Button>
          </div>
          <ScrollArea className="flex-1 px-3 py-2">
            {bomData ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-white/50">{bomData.totalParts} parts</span>
                    {bomData.totalWeight && <span className="text-[11px] text-white/30">{bomData.totalWeight?.toFixed(2)} kg</span>}
                  </div>
                  <span className="text-[13px] text-green-400 font-mono font-medium">${bomData.totalCost?.toFixed(2)}</span>
                </div>
                
                {bomData.items?.map((item: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/[0.1] transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] text-white/80 font-medium">{item.name}</span>
                      <Badge variant="outline" className="text-[9px] text-white/35 border-white/10 font-mono">{item.partNumber}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 text-[10px] text-white/40">
                      <span>Qty: <span className="text-white/60">{item.quantity}</span></span>
                      <span>{item.material}</span>
                      <span className="text-right text-white/60">${item.estimatedCost?.toFixed(2)}</span>
                    </div>
                    {item.dimensions && <p className="text-[9px] text-white/25 mt-1">{item.dimensions}</p>}
                  </div>
                ))}

                {bomData.assemblies?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2 px-1">Assemblies</p>
                    {bomData.assemblies.map((asm: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/10 mb-1.5">
                        <p className="text-[11px] text-white/70 font-medium">{asm.name}</p>
                        <p className="text-[9px] text-white/30 mt-0.5">{asm.partNumbers?.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                )}

                <Button size="sm" variant="outline"
                  onClick={() => {
                    const csv = ['Part Number,Name,Qty,Material,Dimensions,Weight (kg),Cost (USD)', ...(bomData.items || []).map((i: any) =>
                      `${i.partNumber},"${i.name}",${i.quantity},"${i.material}","${i.dimensions || ''}",${i.weight_kg || ''},${i.estimatedCost}`
                    )].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'bom-export.csv'; a.click();
                    URL.revokeObjectURL(url);
                    toast.success('BOM exported to CSV');
                  }}
                  className="w-full mt-3 text-[11px] h-9 bg-transparent border-white/[0.06] text-white/50 hover:text-white rounded-xl">
                  <Download className="h-3.5 w-3.5 mr-2" /> Export CSV
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="h-14 w-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-3">
                  <Boxes className="h-7 w-7 text-white/10" />
                </div>
                <p className="text-[12px] text-white/40">Generate a detailed parts list</p>
                <p className="text-[10px] text-white/20 mt-1">Includes assemblies, suppliers & costs</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
