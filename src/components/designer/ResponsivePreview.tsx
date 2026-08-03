import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor } from './EditorContext';
import { exportToHTML } from './utils/htmlExporter';
import { Monitor, Tablet, Smartphone, X, RotateCw } from 'lucide-react';

const DEVICES = [
  { id: 'desktop', label: 'Desktop', width: 1440, height: 900, icon: Monitor },
  { id: 'laptop', label: 'Laptop', width: 1280, height: 800, icon: Monitor },
  { id: 'tablet', label: 'iPad', width: 768, height: 1024, icon: Tablet },
  { id: 'tablet-land', label: 'iPad Landscape', width: 1024, height: 768, icon: Tablet },
  { id: 'mobile', label: 'iPhone', width: 375, height: 812, icon: Smartphone },
  { id: 'mobile-lg', label: 'iPhone Plus', width: 428, height: 926, icon: Smartphone },
] as const;

export function ResponsivePreview({ siteName, onClose }: { siteName: string; onClose: () => void }) {
  const { state } = useEditor();
  const [activeDevice, setActiveDevice] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);

  const device = DEVICES[activeDevice];
  const w = isLandscape ? device.height : device.width;
  const h = isLandscape ? device.width : device.height;

  const { html, css, js } = exportToHTML(state.elements, siteName);
  const srcDoc = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${html}<script>${js}</script></body></html>`;

  // Calculate scale to fit in viewport
  const maxW = window.innerWidth - 200;
  const maxH = window.innerHeight - 140;
  const scale = Math.min(1, maxW / w, maxH / h);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ backgroundColor: '#0e0e0e' }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-6 shrink-0"
        style={{ height: '56px', borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'hsl(var(--studio-panel))' }}
      >
        <div className="flex items-center gap-1">
          {DEVICES.map((d, i) => {
            const Icon = d.icon;
            return (
              <button
                key={d.id}
                onClick={() => setActiveDevice(i)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-[11px] font-medium"
                style={{
                  backgroundColor: activeDevice === i ? 'hsl(var(--studio-accent) / 0.15)' : 'transparent',
                  color: activeDevice === i ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-ink-3))',
                  border: activeDevice === i ? '1px solid hsl(var(--studio-accent) / 0.3)' : '1px solid transparent',
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {d.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLandscape(!isLandscape)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: 'hsl(var(--studio-ink-2))' }}
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <span className="text-[11px] font-mono" style={{ color: 'hsl(var(--studio-ink-3))' }}>
            {w} × {h}
          </span>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'hsl(var(--studio-ink-2))' }}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Device frame */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeDevice}-${isLandscape}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            style={{
              width: w * scale,
              height: h * scale,
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 24px 80px rgba(0,0,0,0.5)',
              position: 'relative',
            }}
          >
            <iframe
              srcDoc={srcDoc}
              sandbox="allow-scripts"
              style={{
                width: w,
                height: h,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                border: 'none',
                backgroundColor: 'hsl(var(--studio-ink))',
              }}
              title="Responsive Preview"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
