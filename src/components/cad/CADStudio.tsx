import { useEffect, useState } from 'react';
import { CADProvider } from './CADContext';
import { CADViewport3D } from './CADViewport3D';
import { CADFloatingToolbar } from './CADFloatingToolbar';
import { CADFloatingTools } from './CADFloatingTools';
import { CADPropertiesSlideout } from './CADPropertiesSlideout';
import { CADCommandOverlay } from './CADCommandOverlay';
import { CADStatusBar } from './CADStatusBar';
import { CADViewCube } from './CADViewCube';
import { CADMaterialEditor } from './CADMaterialEditor';
import { CADLayerManager } from './CADLayerManager';
import { CADBlockLibrary } from './CADBlockLibrary';
import { CADAIPanel } from './CADAIPanel';
import { CADSceneManager, CADScene } from './CADSceneManager';
import { CADCommandPalette } from './CADCommandPalette';
import { CADCrosshair } from './CADCrosshair';
import { CADMinimap } from './CADMinimap';
import { CADSnapIndicator } from './CADSnapIndicator';
import { CADCoordinateInput } from './CADCoordinateInput';
import { CADValueControlBox } from './CADValueControlBox';
import { CADQuickProperties } from './CADQuickProperties';
import { CADSmartSnap } from './CADSmartSnap';
import { CADSelectionInfo } from './CADSelectionInfo';
import { CADFloorPlanGenerator } from './CADFloorPlanGenerator';
import { CADPrintPrep } from './CADPrintPrep';
import { CADGenerativeDesign } from './CADGenerativeDesign';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useCADAutosave } from './CADProjectManager';
import { SketchUpComponentBrowser } from './sketchup/SketchUpComponentBrowser';
import { SketchUpInferenceOverlay } from './sketchup/SketchUpInferenceOverlay';
import { SketchUpSectionPlanePanel } from './sketchup/SketchUpSectionPlane';
import { SketchUpStylePanel } from './sketchup/SketchUpStylePanel';
import { SketchUpOutliner } from './sketchup/SketchUpOutliner';
import { SketchUpEntityInfo } from './sketchup/SketchUpEntityInfo';
import { SectionPlane } from './sketchup/SketchUpEngine';
import { RenderStyle } from './sketchup/SketchUpEngine';

function CADStudioInner({ onExit }: { onExit?: () => void } = {}) {
  useCADAutosave();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [floorPlanOpen, setFloorPlanOpen] = useState(false);
  const [printPrepOpen, setPrintPrepOpen] = useState(false);
  const [genDesignOpen, setGenDesignOpen] = useState(false);
  const [componentBrowserOpen, setComponentBrowserOpen] = useState(false);
  const [sectionPanelOpen, setSectionPanelOpen] = useState(false);
  const [stylePanelOpen, setStylePanelOpen] = useState(false);
  const [outlinerOpen, setOutlinerOpen] = useState(false);
  const [entityInfoOpen, setEntityInfoOpen] = useState(false);
  const [sectionPlanes, setSectionPlanes] = useState<SectionPlane[]>([]);
  const [renderStyle, setRenderStyle] = useState<RenderStyle>('shaded');
  const [shadowsEnabled, setShadowsEnabled] = useState(true);
  const [sceneManagerOpen, setSceneManagerOpen] = useState(false);
  const [scenes, setScenes] = useState<CADScene[]>([]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        document.documentElement.requestFullscreen?.();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    (window as any).__cadToggleAI = () => setAiPanelOpen(v => !v);
    (window as any).__cadAIPanelOpen = aiPanelOpen;
    (window as any).__cadOpenCommandPalette = () => setCommandPaletteOpen(true);
    (window as any).__cadOpenFloorPlan = () => setFloorPlanOpen(true);
    (window as any).__cadOpenPrintPrep = () => setPrintPrepOpen(true);
    (window as any).__cadOpenGenDesign = () => setGenDesignOpen(true);
    (window as any).__cadOpenComponentBrowser = () => setComponentBrowserOpen(v => !v);
    (window as any).__cadOpenSectionPlanes = () => setSectionPanelOpen(v => !v);
    (window as any).__cadOpenStyles = () => setStylePanelOpen(v => !v);
    (window as any).__cadOpenOutliner = () => setOutlinerOpen(v => !v);
    (window as any).__cadOpenEntityInfo = () => setEntityInfoOpen(v => !v);
    (window as any).__cadOpenMaterialEditor = () => {
      // Toggle material editor visibility - dispatched via global
      document.dispatchEvent(new CustomEvent('cad-toggle-material-editor'));
    };
    (window as any).__cadOpenSceneManager = () => setSceneManagerOpen(v => !v);
    return () => {
      delete (window as any).__cadToggleAI; delete (window as any).__cadAIPanelOpen;
      delete (window as any).__cadOpenCommandPalette; delete (window as any).__cadOpenFloorPlan;
      delete (window as any).__cadOpenPrintPrep; delete (window as any).__cadOpenGenDesign;
      delete (window as any).__cadOpenComponentBrowser; delete (window as any).__cadOpenSectionPlanes;
      delete (window as any).__cadOpenStyles; delete (window as any).__cadOpenOutliner;
      delete (window as any).__cadOpenEntityInfo; delete (window as any).__cadOpenMaterialEditor;
      delete (window as any).__cadOpenSceneManager;
    };
  }, [aiPanelOpen]);

  const rightPanelWidth = aiPanelOpen ? '400px' : componentBrowserOpen || outlinerOpen || entityInfoOpen || sceneManagerOpen ? '280px' : '0px';

  return (
    <div className="fixed inset-0 z-50 bg-[#1a1a1a] overflow-hidden">
      <div className="absolute" style={{ top: '68px', left: '48px', right: rightPanelWidth, bottom: '28px', transition: 'right 0.3s ease' }}>
        <CADViewport3D />
        <CADCrosshair />
        <CADSnapIndicator />
        <CADSmartSnap />
        <SketchUpInferenceOverlay />
      </div>
      <CADFloatingToolbar onExit={onExit} />
      <CADFloatingTools />
      <CADPropertiesSlideout />
      <CADQuickProperties />
      <CADSelectionInfo />
      <CADViewCube />
      <CADMinimap />
      <CADMaterialEditor />
      <CADLayerManager />
      <CADBlockLibrary />
      <CADAIPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
      <CADCommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <CADFloorPlanGenerator open={floorPlanOpen} onClose={() => setFloorPlanOpen(false)} />
      <CADPrintPrep open={printPrepOpen} onClose={() => setPrintPrepOpen(false)} />
      <CADGenerativeDesign open={genDesignOpen} onClose={() => setGenDesignOpen(false)} />
      {/* SketchUp panels */}
      <SketchUpComponentBrowser open={componentBrowserOpen} onClose={() => setComponentBrowserOpen(false)} />
      <SketchUpSectionPlanePanel open={sectionPanelOpen} onClose={() => setSectionPanelOpen(false)} sectionPlanes={sectionPlanes} onUpdate={setSectionPlanes} />
      <SketchUpStylePanel open={stylePanelOpen} onClose={() => setStylePanelOpen(false)} currentStyle={renderStyle} onStyleChange={setRenderStyle} shadowsEnabled={shadowsEnabled} onToggleShadows={() => setShadowsEnabled(v => !v)} />
      <SketchUpOutliner open={outlinerOpen} onClose={() => setOutlinerOpen(false)} />
      <SketchUpEntityInfo open={entityInfoOpen} onClose={() => setEntityInfoOpen(false)} />
      <CADSceneManager
        open={sceneManagerOpen}
        onClose={() => setSceneManagerOpen(false)}
        scenes={scenes}
        onScenesChange={setScenes}
        onActivateScene={(scene) => {
          (window as any).__cadSetCamera?.({
            radius: scene.cameraRadius,
            phi: scene.cameraPhi,
            theta: scene.cameraTheta,
            target: scene.cameraTarget,
          });
        }}
        currentCamera={() => (window as any).__cadGetCamera?.() || { radius: 100, phi: Math.PI / 3.5, theta: Math.PI / 4, target: { x: 0, y: 0, z: 0 } }}
      />
      <CADCoordinateInput />
      <CADValueControlBox />
      <CADCommandOverlay />
      <CADStatusBar />
    </div>
  );
}

export function CADStudio({ onExit }: { onExit?: () => void } = {}) {
  return (
    <CADProvider>
      <TooltipProvider>
        <CADStudioInner onExit={onExit} />
      </TooltipProvider>
    </CADProvider>
  );
}
