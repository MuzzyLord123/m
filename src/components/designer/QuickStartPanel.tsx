import { useState } from 'react';
import { motion } from 'framer-motion';
import { useEditor } from './EditorContext';
import { ALL_SECTION_BLOCKS } from './constants/sectionBlocks';
import { EditorElement } from './types';
import { Sparkles, Layout, FileText, Phone, ShoppingBag, Briefcase, Zap, GraduationCap, Utensils, Heart, Calendar, Command, ArrowRight, Wand2 } from 'lucide-react';

interface PageStarter {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  sectionIds: string[];
}

const PAGE_STARTERS: PageStarter[] = [
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'Hero, features, testimonials, CTA & footer',
    icon: Layout,
    color: '#0073E6',
    sectionIds: ['nav-logo-left', 'hero-bold-centered', 'feat-3col-icons', 'testimonial-cards', 'cta-centered-gradient', 'footer-4col-links'],
  },
  {
    id: 'about',
    name: 'About Page',
    description: 'Story, team, stats & values',
    icon: FileText,
    color: '#8b5cf6',
    sectionIds: ['nav-logo-left', 'hero-split', 'stats-4col-simple', 'team-grid-4', 'cta-split-image', 'footer-4col-links'],
  },
  {
    id: 'contact',
    name: 'Contact Page',
    description: 'Contact form, map & info',
    icon: Phone,
    color: '#10b981',
    sectionIds: ['nav-logo-left', 'contact-split-form', 'faq-accordion-minimal', 'footer-4col-links'],
  },
  {
    id: 'services',
    name: 'Services Page',
    description: 'Service list, pricing & CTA',
    icon: Briefcase,
    color: '#f59e0b',
    sectionIds: ['nav-logo-left', 'hero-bold-centered', 'feat-3col-icons', 'pricing-3-tier', 'cta-centered-gradient', 'footer-4col-links'],
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    description: 'Gallery showcase with projects',
    icon: ShoppingBag,
    color: '#ec4899',
    sectionIds: ['nav-logo-left', 'hero-split', 'gallery-masonry-3col', 'testimonial-cards', 'cta-split-image', 'footer-4col-links'],
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    description: 'Menu, reservation & gallery',
    icon: Utensils,
    color: '#ef4444',
    sectionIds: ['nav-logo-left', 'hero-bold-centered', 'feat-3col-icons', 'gallery-masonry-3col', 'testimonial-cards', 'cta-centered-gradient', 'footer-4col-links'],
  },
  {
    id: 'education',
    name: 'Education',
    description: 'Courses, instructors & enrollment',
    icon: GraduationCap,
    color: '#06b6d4',
    sectionIds: ['nav-logo-left', 'hero-split', 'feat-3col-icons', 'stats-4col-simple', 'pricing-3-tier', 'cta-split-image', 'footer-4col-links'],
  },
  {
    id: 'nonprofit',
    name: 'Non-Profit',
    description: 'Mission, impact & donations',
    icon: Heart,
    color: '#f97316',
    sectionIds: ['nav-logo-left', 'hero-bold-centered', 'stats-4col-simple', 'testimonial-cards', 'cta-centered-gradient', 'footer-4col-links'],
  },
  {
    id: 'event',
    name: 'Event Page',
    description: 'Schedule, speakers & registration',
    icon: Calendar,
    color: '#a855f7',
    sectionIds: ['nav-logo-left', 'hero-bold-centered', 'feat-3col-icons', 'team-grid-4', 'cta-split-image', 'footer-4col-links'],
  },
];

function insertSectionsFromIds(sectionIds: string[], dispatch: any) {
  for (const sId of sectionIds) {
    const block = ALL_SECTION_BLOCKS.find(b => b.id === sId);
    if (!block) continue;
    const freshElements = JSON.parse(JSON.stringify(block.elements)) as EditorElement[];
    const assignIds = (els: EditorElement[]) => {
      for (const el of els) {
        el.id = crypto.randomUUID();
        if (el.children) assignIds(el.children);
      }
    };
    assignIds(freshElements);
    freshElements.forEach(el => {
      dispatch({ type: 'ADD_ELEMENT', payload: { element: el } });
    });
  }
}

export function QuickStartPanel() {
  const { state, dispatch } = useEditor();
  const [aiPrompt, setAiPrompt] = useState('');

  if (state.elements.length > 0) return null;

  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) return;
    // Open AI copilot with the prompt
    window.dispatchEvent(new CustomEvent('ai-copilot-prompt', { detail: aiPrompt }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', metaKey: true, bubbles: true }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="flex flex-col items-center justify-center"
      style={{ minHeight: '100%', padding: '40px 24px' }}
      data-canvas="true"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-6"
      >
        <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0073E6, #005bb5)', boxShadow: '0 8px 32px rgba(0,115,230,0.3)' }}>
          <Zap className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-xl font-bold text-[#e0e0e0] mb-2">What are you building?</h2>
        <p className="text-[13px] text-[#777] max-w-md">
          Describe your site or pick a template below to get started instantly.
        </p>
      </motion.div>

      {/* AI Prompt Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="w-full max-w-lg mb-8"
      >
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 transition-all"
          style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(0,115,230,0.2)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        >
          <Wand2 className="h-4 w-4 shrink-0" style={{ color: '#0073E6' }} />
          <input
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAiGenerate(); }}
            placeholder="Describe your website… e.g. 'A modern SaaS landing page for a project management tool'"
            className="flex-1 bg-transparent text-[13px] text-[#ccc] placeholder:text-[#555] outline-none"
          />
          <button
            onClick={handleAiGenerate}
            disabled={!aiPrompt.trim()}
            className="h-7 px-3 flex items-center gap-1.5 rounded-lg text-[11px] font-semibold text-white transition-all disabled:opacity-30"
            style={{ background: 'linear-gradient(135deg, #0073E6, #005bb5)' }}
          >
            Generate <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <Sparkles className="h-2.5 w-2.5" style={{ color: '#555' }} />
          <span className="text-[9px]" style={{ color: '#555' }}>Powered by AI • or press ⌘J anytime</span>
        </div>
      </motion.div>

      {/* Page starters grid */}
      <div className="grid grid-cols-3 gap-3 max-w-3xl w-full mb-8">
        {PAGE_STARTERS.map((starter, i) => {
          const Icon = starter.icon;
          return (
            <motion.button
              key={starter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              onClick={() => insertSectionsFromIds(starter.sectionIds, dispatch)}
              className="flex flex-col items-center gap-3 p-5 rounded-xl text-left transition-all group"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              whileHover={{
                backgroundColor: `${starter.color}10`,
                borderColor: `${starter.color}40`,
                scale: 1.02,
                y: -2,
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${starter.color}15`, border: `1px solid ${starter.color}25` }}>
                <div style={{ color: starter.color }}><Icon className="h-5 w-5" /></div>
              </div>
              <div className="text-center">
                <div className="text-[12px] font-semibold text-[#ccc] mb-1">{starter.name}</div>
                <div className="text-[10px] text-[#666] leading-snug">{starter.description}</div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full max-w-md mb-6">
        <div className="flex-1 h-px bg-[#333]" />
        <span className="text-[10px] text-[#555] uppercase tracking-widest font-semibold">or start from scratch</span>
        <div className="flex-1 h-px bg-[#333]" />
      </div>

      {/* Bottom hints */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => dispatch({ type: 'SET_LEFT_TAB', payload: 'sections' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-medium text-[#999] transition-all"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Sparkles className="h-3.5 w-3.5" style={{ color: '#666' }} />
          Browse sections
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => dispatch({ type: 'SET_LEFT_TAB', payload: 'templates' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-medium text-[#999] transition-all"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Layout className="h-3.5 w-3.5" style={{ color: '#666' }} />
          Browse templates
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }); window.dispatchEvent(e); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-medium text-[#999] transition-all"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Command className="h-3.5 w-3.5" style={{ color: '#666' }} />
          Command palette
          <kbd className="text-[8px] px-1 py-0.5 rounded font-mono" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#666' }}>⌘K</kbd>
        </motion.button>
      </div>
    </motion.div>
  );
}
