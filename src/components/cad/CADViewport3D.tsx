import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useCAD } from './CADContext';
import { Point2D, Point3D, AnyCADEntity, DrawingPlane, MATERIAL_PRESETS } from './cadTypes';
import { generateId } from './cadGeometry';
import { moveEntity, copyEntity, rotateEntity, scaleEntity, mirrorEntity } from './cadTransforms';
import { detectFaceAtRaycast, executePushPull, PushPullState, DetectedFace } from './sketchup/SketchUpEngine';
import { findSnap, getSnapColor, getSnapIcon, SnapResult, SnapType } from './CADSnapEngine';
import { CADContextMenu } from './CADContextMenu';
// infinite grid handled via buildInfiniteGrid helper below

/* ═══════════════════════════════════════════════════════════════
   CADViewport3D — AutoCAD-grade 3D viewport
   ═══════════════════════════════════════════════════════════════ */

export function CADViewport3D() {
  const { state, dispatch, addEntity } = useCAD();
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const perspCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orthoCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const gridGroupRef = useRef<THREE.Group | null>(null);
  const entitiesGroupRef = useRef<THREE.Group | null>(null);
  const previewGroupRef = useRef<THREE.Group | null>(null);
  const helperGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const animFrameRef = useRef<number>(0);
  const lastGridKey = useRef('');
  const clockRef = useRef(new THREE.Clock());

  // Orbit state with damping
  const orbitRef = useRef({
    target: new THREE.Vector3(0, 0, 0),
    spherical: new THREE.Spherical(100, Math.PI / 3.5, Math.PI / 4),
    targetSpherical: new THREE.Spherical(100, Math.PI / 3.5, Math.PI / 4),
    targetTarget: new THREE.Vector3(0, 0, 0),
    isPanning: false,
    isOrbiting: false,
    lastMouse: { x: 0, y: 0 },
    dampingFactor: 0.12,
  });

  const [worldPos, setWorldPos] = useState<Point3D>({ x: 0, y: 0, z: 0 });
  const [isOrtho, setIsOrtho] = useState(false);
  const isOrthoRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const keysRef = useRef<Set<string>>(new Set());
  const [cursorScreenPos, setCursorScreenPos] = useState({ x: 0, y: 0 });
  const selBoxStartRef = useRef<{ x: number; y: number } | null>(null);
  const [selBoxScreen, setSelBoxScreen] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const pushPullRef = useRef<PushPullState | null>(null);
  const lastPushPullDistRef = useRef<number>(0);
  const [pushPullFace, setPushPullFace] = useState<DetectedFace | null>(null);
  const [activeSnap, setActiveSnap] = useState<SnapResult | null>(null);

  // Keep isOrthoRef in sync so animation loop always has current value
  useEffect(() => {
    isOrthoRef.current = isOrtho;
  }, [isOrtho]);

  useEffect(() => {
    dispatch({ type: 'SET_WORLD_POS', payload: worldPos });
  }, [worldPos]);

  // Key tracking for axis constraints
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          dispatch({ type: 'REDO' });
          dispatch({ type: 'ADD_COMMAND', payload: 'Redo' });
        } else {
          dispatch({ type: 'UNDO' });
          dispatch({ type: 'ADD_COMMAND', payload: 'Undo' });
        }
        return;
      }

      // Select all
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        dispatch({ type: 'SELECT_ALL' });
        dispatch({ type: 'ADD_COMMAND', payload: `Selected all (${state.entities.length} objects)` });
        return;
      }

      // Finish/cancel drawing or transform
      if (e.key === 'Enter') {
        if (state.transformOp?.phase === 'awaiting-target' || state.transformOp?.phase === 'awaiting-base') {
          dispatch({ type: 'TRANSFORM_CANCEL' });
          dispatch({ type: 'ADD_COMMAND', payload: 'Transform cancelled' });
        } else if (state.drawingInProgress3D.length > 0 || state.drawingInProgress.length > 0) {
          e.preventDefault();
          // For spline, finish and create entity before clearing
          if (state.activeTool === 'spline' && state.drawingInProgress3D.length >= 2) {
            const pts = [...state.drawingInProgress3D];
            addEntity({ id: generateId(), type: 'polyline', layerId: state.activeLayerId, data: { points: pts.map(p => ({ x: p.x, y: p.z })), closed: false } } as any);
            dispatch({ type: 'ADD_COMMAND', payload: `Spline created: ${pts.length} control points` });
          }
          dispatch({ type: 'CLEAR_DRAWING' });
          dispatch({ type: 'ADD_COMMAND', payload: 'Command completed' });
        }
      }
      if (e.key === 'Escape') {
        if (state.transformOp) {
          dispatch({ type: 'TRANSFORM_CANCEL' });
          dispatch({ type: 'ADD_COMMAND', payload: 'Cancelled' });
        } else if (state.drawingInProgress3D.length > 0 || state.drawingInProgress.length > 0) {
          e.preventDefault();
          dispatch({ type: 'CLEAR_DRAWING' });
          dispatch({ type: 'ADD_COMMAND', payload: 'Cancelled' });
        } else {
          dispatch({ type: 'SET_TOOL', payload: 'select' });
          dispatch({ type: 'DESELECT_ALL' });
        }
      }
      // Delete selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedIds.length > 0 && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        dispatch({ type: 'DELETE_SELECTED' });
        dispatch({ type: 'ADD_COMMAND', payload: `Deleted ${state.selectedIds.length} object(s)` });
      }

      // Drawing plane & mode shortcuts
      if (e.key === 'F5') { e.preventDefault(); dispatch({ type: 'CYCLE_DRAWING_PLANE' }); }
      if (e.key === 'F8') { e.preventDefault(); dispatch({ type: 'TOGGLE_ORTHO' }); }
      if (e.key === 'F9') { e.preventDefault(); dispatch({ type: 'TOGGLE_SNAP' }); }

      if (e.key === 'Tab') { e.preventDefault(); dispatch({ type: 'CYCLE_DRAWING_PLANE' }); }

      // SketchUp-style single-letter shortcuts (only when not drawing/transforming)
      const isIdle = state.drawingInProgress3D.length === 0 && state.drawingInProgress.length === 0 && !state.transformOp;
      const k = e.key.toLowerCase();
      if (isIdle) {
        if (k === ' ') { e.preventDefault(); dispatch({ type: 'SET_TOOL', payload: 'select' }); return; }
        if (k === 'l') { dispatch({ type: 'SET_TOOL', payload: 'line' }); return; }
        if (k === 'r') { dispatch({ type: 'SET_TOOL', payload: 'rectangle' }); return; }
        if (k === 'c') { dispatch({ type: 'SET_TOOL', payload: 'circle' }); return; }
        if (k === 'p') { dispatch({ type: 'SET_TOOL', payload: 'push-pull' }); return; }
        if (k === 'm') { dispatch({ type: 'SET_TOOL', payload: 'move' }); return; }
        if (k === 'e') { dispatch({ type: 'SET_TOOL', payload: 'trim' }); return; } // Eraser
        if (k === 'b') { (window as any).__cadOpenMaterialEditor?.(); return; } // Paint Bucket
        if (k === 'q') { dispatch({ type: 'SET_TOOL', payload: 'rotate' }); return; }
        if (k === 's') { dispatch({ type: 'SET_TOOL', payload: 'scale' }); return; }
        if (k === 't') { dispatch({ type: 'SET_TOOL', payload: 'measure-distance' }); return; } // Tape Measure
        if (k === 'o') { dispatch({ type: 'SET_TOOL', payload: 'offset' }); return; }
        if (k === 'f') { dispatch({ type: 'SET_TOOL', payload: 'sweep' }); return; } // Follow Me
        if (k === 'g') { dispatch({ type: 'SET_TOOL', payload: 'group' }); return; }
        if (k === 'a') { dispatch({ type: 'SET_TOOL', payload: 'arc' }); return; }
        if (k === 'n') { dispatch({ type: 'SET_TOOL', payload: 'spline' }); return; }
      }
      // Axis constraints while drawing
      if (!isIdle) {
        if (k === 'x' && !e.ctrlKey && !e.metaKey) dispatch({ type: 'SET_AXIS_CONSTRAINT', payload: state.axisConstraint === 'x' ? 'none' : 'x' });
        if (k === 'y' && !e.ctrlKey && !e.metaKey) dispatch({ type: 'SET_AXIS_CONSTRAINT', payload: state.axisConstraint === 'y' ? 'none' : 'y' });
        if (k === 'z' && !e.ctrlKey && !e.metaKey) dispatch({ type: 'SET_AXIS_CONSTRAINT', payload: state.axisConstraint === 'z' ? 'none' : 'z' });
      }

      // Ctrl toggles copy mode during move
      if (!isIdle && state.activeTool === 'move' && (e.key === 'Control' || e.key === 'Meta')) {
        dispatch({ type: 'TOGGLE_COPY_MODE' });
      }

      // View presets: Ctrl+1..5
      if (e.ctrlKey && e.key === '1') { e.preventDefault(); setViewPreset('top'); }
      if (e.ctrlKey && e.key === '2') { e.preventDefault(); setViewPreset('front'); }
      if (e.ctrlKey && e.key === '3') { e.preventDefault(); setViewPreset('side'); }
      if (e.ctrlKey && e.key === '4') { e.preventDefault(); setViewPreset('isometric'); }
      if (e.ctrlKey && e.key === '5') { e.preventDefault(); setIsOrtho(o => !o); }
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [state.axisConstraint, state.drawingPlane, state.drawingInProgress3D.length, state.drawingInProgress.length, state.activeTool]);

  /* ── Initialise Three.js ─────────────────────────────────── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      setLoading(false);
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ff4444;font-family:monospace;font-size:14px;">WebGL is not supported on this device.</div>';
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance', logarithmicDepthBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.LinearToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Perspective camera
    const aspect = container.clientWidth / container.clientHeight;
    const perspCamera = new THREE.PerspectiveCamera(35, aspect, 0.01, 100000);
    perspCameraRef.current = perspCamera;

    // Orthographic camera
    const frustum = 60;
    const orthoCamera = new THREE.OrthographicCamera(-frustum * aspect, frustum * aspect, frustum, -frustum, 0.01, 100000);
    orthoCameraRef.current = orthoCamera;

    updateCameraFromSpherical();

    // ── Lighting (studio-quality 3-point setup) ──
    const ambientLight = new THREE.AmbientLight(0xd0d0d0, 0.8);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x3a3a3a, 0.7);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(80, 180, 120);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(4096, 4096);
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 800;
    dirLight.shadow.camera.left = -300;
    dirLight.shadow.camera.right = 300;
    dirLight.shadow.camera.top = 300;
    dirLight.shadow.camera.bottom = -300;
    dirLight.shadow.bias = -0.00015;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x667799, 0.5);
    fillLight.position.set(-80, 60, -100);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x445566, 0.3);
    rimLight.position.set(0, 30, -150);
    scene.add(rimLight);

    // ── Ground shadow receiver (subtle contact shadow) ──
    const groundGeo = new THREE.PlaneGeometry(10000, 10000);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.receiveShadow = true;
    groundMesh.position.y = -0.01;
    groundMesh.renderOrder = -2;
    scene.add(groundMesh);

    // ── Infinite-feel grid (large adaptive GridHelper) ──
    const gridGroup = new THREE.Group();
    gridGroupRef.current = gridGroup;
    scene.add(gridGroup);
    buildInfiniteGrid(gridGroup, state.gridSize, state.floorGridVisible, state.verticalGridVisible);

    // ── Axes (AutoCAD standard: X=Red, Y=Green, Z=Blue) ──
    buildAxes(scene);
    // ── Entity + preview + helper groups ──
    const entGroup = new THREE.Group();
    entitiesGroupRef.current = entGroup;
    scene.add(entGroup);
    const prevGroup = new THREE.Group();
    previewGroupRef.current = prevGroup;
    scene.add(prevGroup);
    const helpGroup = new THREE.Group();
    helperGroupRef.current = helpGroup;
    scene.add(helpGroup);

    // ── Resize ──
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth, h = container.clientHeight;
      renderer.setSize(w, h);
      perspCamera.aspect = w / h;
      perspCamera.updateProjectionMatrix();
      const a = w / h;
      orthoCamera.left = -frustum * a; orthoCamera.right = frustum * a;
      orthoCamera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // ── Animation loop with damping ──
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      // Smooth damping interpolation
      const orbit = orbitRef.current;
      const d = orbit.dampingFactor;
      orbit.spherical.radius += (orbit.targetSpherical.radius - orbit.spherical.radius) * d;
      orbit.spherical.phi += (orbit.targetSpherical.phi - orbit.spherical.phi) * d;
      orbit.spherical.theta += (orbit.targetSpherical.theta - orbit.spherical.theta) * d;
      orbit.target.lerp(orbit.targetTarget, d);

      updateCameraFromSpherical();

      // Make grid follow camera on XZ plane so it appears infinite
      const gridGroup = gridGroupRef.current;
      const activeCamera = isOrthoRef.current ? orthoCamera : perspCamera;
      if (gridGroup) {
        const camTarget = orbit.target;
        const gs = state.gridSize || 1;
        gridGroup.position.x = Math.round(camTarget.x / gs) * gs;
        gridGroup.position.z = Math.round(camTarget.z / gs) * gs;
      }

      renderer.render(scene, activeCamera);
    };
    animate();

    setLoading(false);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  // Background changes are handled by the sky gradient — skip runtime updates
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.background = new THREE.Color(0x1a1a1a);
  }, [state.background]);

  // Rebuild grid only when grid settings change (not on zoom)
  useEffect(() => {
    const group = gridGroupRef.current;
    if (!group) return;
    clearGroup(group);
    group.visible = state.gridVisible;
    if (!state.gridVisible) return;
    buildInfiniteGrid(group, state.gridSize, state.floorGridVisible, state.verticalGridVisible);
  }, [state.gridSize, state.gridVisible, state.floorGridVisible, state.verticalGridVisible]);

  // Rebuild entity meshes + construction guides
  useEffect(() => {
    const group = entitiesGroupRef.current;
    if (!group) return;
    clearGroup(group);
    state.entities.forEach(entity => {
      // Skip hidden entities
      if (state.hiddenEntityIds.includes(entity.id)) return;
      // Skip non-isolated entities when isolation is active
      if (state.isolatedEntityIds && !state.isolatedEntityIds.includes(entity.id)) return;
      const layer = state.layers.find(l => l.id === entity.layerId);
      if (layer && (!layer.visible || layer.frozen)) return;
      const mesh = buildEntityMesh(entity, layer, state.selectedIds.includes(entity.id));
      if (mesh) { mesh.userData.entityId = entity.id; group.add(mesh); }
    });
    // Render construction guides as dashed lines
    state.constructionGuides.forEach(guide => {
      const pts = [
        new THREE.Vector3(guide.start.x, guide.start.y, guide.start.z),
        new THREE.Vector3(guide.end.x, guide.end.y, guide.end.z),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineDashedMaterial({ color: 0x808080, dashSize: 2, gapSize: 1.5, transparent: true, opacity: 0.5 });
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      group.add(line);
      // Guide point markers
      const dotGeo = new THREE.SphereGeometry(0.4, 6, 6);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0x808080, transparent: true, opacity: 0.5 });
      const d1 = new THREE.Mesh(dotGeo, dotMat); d1.position.copy(pts[0]); group.add(d1);
      const d2 = new THREE.Mesh(dotGeo, dotMat.clone()); d2.position.copy(pts[1]); group.add(d2);
      // Label if present
      if (guide.label) {
        const mid = new THREE.Vector3().addVectors(pts[0], pts[1]).multiplyScalar(0.5);
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 64;
        const ctx2d = canvas.getContext('2d');
        if (ctx2d) {
          ctx2d.fillStyle = '#808080';
          ctx2d.font = '28px monospace';
          ctx2d.textAlign = 'center';
          ctx2d.textBaseline = 'middle';
          ctx2d.fillText(guide.label, 128, 32);
          const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthTest: false }));
          sprite.position.copy(mid).add(new THREE.Vector3(0, 2, 0));
          sprite.scale.set(8, 2, 1);
          group.add(sprite);
        }
      }
    });
  }, [state.entities, state.selectedIds, state.layers, state.constructionGuides, state.hiddenEntityIds, state.isolatedEntityIds]);

  // Drawing preview
  useEffect(() => {
    const group = previewGroupRef.current;
    if (!group) return;
    clearGroup(group);
    if (state.drawingInProgress3D.length > 0) {
      buildPreview3D(group, state.activeTool, state.drawingInProgress3D, worldPos);
    } else if (state.drawingInProgress.length > 0) {
      buildPreview(group, state.activeTool, state.drawingInProgress, worldPos);
    }
  }, [state.drawingInProgress, state.drawingInProgress3D, state.activeTool, worldPos]);

  // Helper visuals (height marker, axis constraint)
  useEffect(() => {
    const group = helperGroupRef.current;
    if (!group) return;
    clearGroup(group);

    const isDrawing3D = ['line3d', 'wall', 'column', 'box3d', 'window', 'door', 'slab', 'sphere', 'cone', 'cylinder', 'torus', 'pyramid', 'stairs'].includes(state.activeTool) || state.drawingPlane !== 'xz';

    // Height marker line from cursor to ground
    if (isDrawing3D && Math.abs(worldPos.y) > 0.1) {
      const markerGeom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(worldPos.x, 0, worldPos.z),
        new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z),
      ]);
      const dashedMat = new THREE.LineDashedMaterial({ color: 0x4488ff, dashSize: 1, gapSize: 0.5, transparent: true, opacity: 0.5 });
      const marker = new THREE.Line(markerGeom, dashedMat);
      marker.computeLineDistances();
      group.add(marker);

      // Ground cross
      const cs = 1.5;
      const crossMat = new THREE.LineBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.25 });
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(worldPos.x - cs, 0, worldPos.z), new THREE.Vector3(worldPos.x + cs, 0, worldPos.z),
      ]), crossMat));
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(worldPos.x, 0, worldPos.z - cs), new THREE.Vector3(worldPos.x, 0, worldPos.z + cs),
      ]), crossMat));
    }

    // Axis constraint guide
    if (state.axisConstraint !== 'none' && (state.drawingInProgress3D.length > 0 || state.drawingInProgress.length > 0)) {
      const lastPt = state.drawingInProgress3D.length > 0
        ? state.drawingInProgress3D[state.drawingInProgress3D.length - 1]
        : { x: state.drawingInProgress[state.drawingInProgress.length - 1].x, y: 0, z: state.drawingInProgress[state.drawingInProgress.length - 1].y };
      const constraintColors: Record<string, number> = { x: 0xff0000, y: 0x00ff00, z: 0x0000ff };
      const color = constraintColors[state.axisConstraint] || 0xffffff;
      const len = 500;
      let start: THREE.Vector3, end: THREE.Vector3;
      if (state.axisConstraint === 'x') {
        start = new THREE.Vector3(lastPt.x - len, lastPt.y, lastPt.z);
        end = new THREE.Vector3(lastPt.x + len, lastPt.y, lastPt.z);
      } else if (state.axisConstraint === 'y') {
        start = new THREE.Vector3(lastPt.x, lastPt.y - len, lastPt.z);
        end = new THREE.Vector3(lastPt.x, lastPt.y + len, lastPt.z);
      } else {
        start = new THREE.Vector3(lastPt.x, lastPt.y, lastPt.z - len);
        end = new THREE.Vector3(lastPt.x, lastPt.y, lastPt.z + len);
      }
      const constraintGeom = new THREE.BufferGeometry().setFromPoints([start, end]);
      const constraintMat = new THREE.LineDashedMaterial({ color, dashSize: 3, gapSize: 1.5, transparent: true, opacity: 0.35 });
      const constraintLine = new THREE.Line(constraintGeom, constraintMat);
      constraintLine.computeLineDistances();
      group.add(constraintLine);
    }

    // Snap indicator (yellow crosshair at cursor)
    if (state.snapEnabled) {
      const snapSize = 0.6;
      const snapMat = new THREE.LineBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.7 });
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(worldPos.x - snapSize, worldPos.y, worldPos.z), new THREE.Vector3(worldPos.x + snapSize, worldPos.y, worldPos.z),
      ]), snapMat));
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(worldPos.x, worldPos.y - snapSize, worldPos.z), new THREE.Vector3(worldPos.x, worldPos.y + snapSize, worldPos.z),
      ]), snapMat));
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z - snapSize), new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z + snapSize),
      ]), snapMat));
      // Snap square marker
      const sq = snapSize * 0.8;
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(worldPos.x - sq, worldPos.y, worldPos.z - sq),
        new THREE.Vector3(worldPos.x + sq, worldPos.y, worldPos.z - sq),
        new THREE.Vector3(worldPos.x + sq, worldPos.y, worldPos.z + sq),
        new THREE.Vector3(worldPos.x - sq, worldPos.y, worldPos.z + sq),
        new THREE.Vector3(worldPos.x - sq, worldPos.y, worldPos.z - sq),
      ]), snapMat));
    }

    // Active entity snap point marker (larger, colored by type)
    if (activeSnap) {
      const snapColor = new THREE.Color(getSnapColor(activeSnap.type));
      const snapMarkerMat = new THREE.LineBasicMaterial({ color: snapColor, linewidth: 2 });
      const sp = activeSnap.point;
      const ms = 1.2; // marker size in world units

      if (activeSnap.type === 'endpoint') {
        // Square marker for endpoints
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(sp.x - ms, sp.y, sp.z - ms),
          new THREE.Vector3(sp.x + ms, sp.y, sp.z - ms),
          new THREE.Vector3(sp.x + ms, sp.y, sp.z + ms),
          new THREE.Vector3(sp.x - ms, sp.y, sp.z + ms),
          new THREE.Vector3(sp.x - ms, sp.y, sp.z - ms),
        ]), snapMarkerMat));
        // Also vertical square
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(sp.x - ms, sp.y - ms, sp.z),
          new THREE.Vector3(sp.x + ms, sp.y - ms, sp.z),
          new THREE.Vector3(sp.x + ms, sp.y + ms, sp.z),
          new THREE.Vector3(sp.x - ms, sp.y + ms, sp.z),
          new THREE.Vector3(sp.x - ms, sp.y - ms, sp.z),
        ]), snapMarkerMat));
      } else if (activeSnap.type === 'midpoint') {
        // Triangle marker for midpoints
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(sp.x, sp.y, sp.z - ms),
          new THREE.Vector3(sp.x + ms, sp.y, sp.z + ms * 0.6),
          new THREE.Vector3(sp.x - ms, sp.y, sp.z + ms * 0.6),
          new THREE.Vector3(sp.x, sp.y, sp.z - ms),
        ]), snapMarkerMat));
      } else if (activeSnap.type === 'center') {
        // Circle marker for center
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          pts.push(new THREE.Vector3(sp.x + ms * Math.cos(a), sp.y, sp.z + ms * Math.sin(a)));
        }
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), snapMarkerMat));
        // Cross inside
        const cs = ms * 0.5;
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(sp.x - cs, sp.y, sp.z), new THREE.Vector3(sp.x + cs, sp.y, sp.z),
        ]), snapMarkerMat));
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(sp.x, sp.y, sp.z - cs), new THREE.Vector3(sp.x, sp.y, sp.z + cs),
        ]), snapMarkerMat));
      }

      // Vertical guide line from snap point to ground (if elevated)
      if (Math.abs(sp.y) > 0.5) {
        const guideMat = new THREE.LineDashedMaterial({ color: snapColor.getHex(), dashSize: 0.8, gapSize: 0.4, transparent: true, opacity: 0.4 });
        const guideLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(sp.x, 0, sp.z), new THREE.Vector3(sp.x, sp.y, sp.z),
        ]), guideMat);
        guideLine.computeLineDistances();
        group.add(guideLine);
      }
    }
  }, [worldPos, state.activeTool, state.drawingPlane, state.axisConstraint, state.drawingInProgress3D, state.drawingInProgress, state.snapEnabled, activeSnap]);

  /* ── Camera helpers ──────────────────────────────────────── */
  function updateCameraFromSpherical() {
    const orbit = orbitRef.current;
    const pos = new THREE.Vector3().setFromSpherical(orbit.spherical).add(orbit.target);
    const perspCamera = perspCameraRef.current;
    const orthoCamera = orthoCameraRef.current;
    if (perspCamera) {
      perspCamera.position.copy(pos);
      perspCamera.lookAt(orbit.target);
    }
    if (orthoCamera) {
      orthoCamera.position.copy(pos);
      orthoCamera.lookAt(orbit.target);
      orthoCamera.zoom = 60 / orbit.spherical.radius;
      orthoCamera.updateProjectionMatrix();
    }
  }

  function getDrawingPlaneInfo(): { plane: THREE.Plane; normal: THREE.Vector3 } {
    const lastPt3D = state.drawingInProgress3D.length > 0
      ? state.drawingInProgress3D[state.drawingInProgress3D.length - 1]
      : null;
    switch (state.drawingPlane) {
      case 'xy':
        return { plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), lastPt3D ? -lastPt3D.y : 0), normal: new THREE.Vector3(0, 1, 0) };
      case 'xz':
        return { plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), lastPt3D ? -lastPt3D.z : 0), normal: new THREE.Vector3(0, 0, 1) };
      case 'yz':
        return { plane: new THREE.Plane(new THREE.Vector3(1, 0, 0), lastPt3D ? -lastPt3D.x : 0), normal: new THREE.Vector3(1, 0, 0) };
      case 'free':
      default: {
        const camera = perspCameraRef.current;
        if (camera) {
          const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
          const absX = Math.abs(fwd.x), absY = Math.abs(fwd.y), absZ = Math.abs(fwd.z);
          if (absY > absX && absY > absZ) {
            return { plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), lastPt3D ? -lastPt3D.y : 0), normal: new THREE.Vector3(0, 1, 0) };
          } else if (absZ > absX) {
            return { plane: new THREE.Plane(new THREE.Vector3(0, 0, 1), lastPt3D ? -lastPt3D.z : 0), normal: new THREE.Vector3(0, 0, 1) };
          } else {
            return { plane: new THREE.Plane(new THREE.Vector3(1, 0, 0), lastPt3D ? -lastPt3D.x : 0), normal: new THREE.Vector3(1, 0, 0) };
          }
        }
        return { plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), normal: new THREE.Vector3(0, 1, 0) };
      }
    }
  }

  function raycastToPlane(mx: number, my: number): Point3D | null {
    const camera = isOrtho ? orthoCameraRef.current : perspCameraRef.current;
    if (!camera) return null;
    raycasterRef.current.setFromCamera(new THREE.Vector2(mx, my), camera);

    const wantVertical = keysRef.current.has('shift') && state.drawingInProgress3D.length > 0;
    const wantAxisY = state.axisConstraint === 'y' && state.drawingInProgress3D.length > 0;

    let plane: THREE.Plane;
    if (wantVertical || wantAxisY) {
      // Use a vertical plane facing the camera so the raycaster can pick up Y movement
      const last = state.drawingInProgress3D[state.drawingInProgress3D.length - 1];
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      // Project camera direction onto XZ to get a horizontal-facing normal
      const normal = new THREE.Vector3(camDir.x, 0, camDir.z).normalize();
      if (normal.length() < 0.001) normal.set(0, 0, 1); // fallback if looking straight down
      const anchor = new THREE.Vector3(last.x, last.y, last.z);
      const d = -normal.dot(anchor);
      plane = new THREE.Plane(normal, d);
    } else {
      plane = getDrawingPlaneInfo().plane;
    }

    const intersection = new THREE.Vector3();
    const hit = raycasterRef.current.ray.intersectPlane(plane, intersection);
    if (!hit) return null;

    let wx = intersection.x, wy = intersection.y, wz = intersection.z;

    // Axis constraint
    if (state.axisConstraint !== 'none' && state.drawingInProgress3D.length > 0) {
      const last = state.drawingInProgress3D[state.drawingInProgress3D.length - 1];
      if (state.axisConstraint === 'x') { wy = last.y; wz = last.z; }
      else if (state.axisConstraint === 'y') { wx = last.x; wz = last.z; }
      else if (state.axisConstraint === 'z') { wx = last.x; wy = last.y; }
    }

    // Shift = vertical (Y only), Ctrl = horizontal (XZ only)
    if (wantVertical) {
      const last = state.drawingInProgress3D[state.drawingInProgress3D.length - 1];
      wx = last.x; wz = last.z;
    }
    if ((keysRef.current.has('control') || keysRef.current.has('meta')) && state.drawingInProgress3D.length > 0) {
      const last = state.drawingInProgress3D[state.drawingInProgress3D.length - 1];
      wy = last.y;
    }

    // Grid snap
    if (state.snapEnabled && state.gridVisible) {
      const s = state.gridSize;
      wx = Math.round(wx / s) * s;
      wy = Math.round(wy / s) * s;
      wz = Math.round(wz / s) * s;
    }

    // Entity snap (overrides grid snap when closer)
    if (state.snapEnabled) {
      const snapTolerance = state.gridSize * 1.5;
      const snapModes = ['endpoint', 'midpoint', 'center'];
      const snap = findSnap(
        { x: wx, y: wy, z: wz },
        state.entities,
        snapModes,
        snapTolerance
      );
      if (snap) {
        wx = snap.point.x;
        wy = snap.point.y;
        wz = snap.point.z;
        // Store snap result for visual feedback (set in move handler)
        (window as any).__cadActiveSnap = snap;
      } else {
        (window as any).__cadActiveSnap = null;
      }
    }

    return { x: parseFloat(wx.toFixed(6)), y: parseFloat(wy.toFixed(6)), z: parseFloat(wz.toFixed(6)) };
  }

  /* ── Mouse handlers ──────────────────────────────────────── */
  const isModifyTool = ['move', 'copy', 'rotate', 'scale', 'mirror', 'offset', 'extrude', 'array'].includes(state.activeTool);
  const isPushPull = state.activeTool === 'push-pull';
  const isEraser = state.activeTool === 'trim';
  const eraserDragRef = useRef(false);
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Close context menu on any click
    if (state.contextMenu) {
      dispatch({ type: 'CLOSE_CONTEXT_MENU' });
    }

    const orbit = orbitRef.current;
    orbit.lastMouse = { x: e.clientX, y: e.clientY };
    // SketchUp navigation: Middle=orbit, Shift+Middle=pan, Right=pan
    if (e.button === 1) {
      e.preventDefault();
      if (e.shiftKey) { orbit.isPanning = true; } else { orbit.isOrbiting = true; }
      return;
    }
    if (e.button === 2) { e.preventDefault(); orbit.isPanning = true; return; }

    // Shift+left = orbit (except when drawing) — SketchUp fallback
    if (e.button === 0 && e.shiftKey && !isModifyTool && state.drawingInProgress3D.length === 0 && state.drawingInProgress.length === 0 && !state.transformOp) {
      orbit.isOrbiting = true; return;
    }

    if (e.button === 0) {
      // Eraser tool: click to delete entity under cursor
      if (isEraser) {
        eraserDragRef.current = true;
        const camera = isOrtho ? orthoCameraRef.current : perspCameraRef.current;
        const group = entitiesGroupRef.current;
        if (camera && group) {
          raycasterRef.current.setFromCamera(mouseRef.current, camera);
          const intersects = raycasterRef.current.intersectObjects(group.children, true);
          if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj.parent && obj.parent !== group) obj = obj.parent as THREE.Object3D;
            const entityId = obj.userData.entityId;
            if (entityId) {
              if (e.shiftKey) {
                // Shift+eraser = hide
                dispatch({ type: 'HIDE_SELECTED' });
                dispatch({ type: 'SELECT', payload: [entityId] });
                dispatch({ type: 'HIDE_SELECTED' });
              } else {
                dispatch({ type: 'SELECT', payload: [entityId] });
                dispatch({ type: 'DELETE_SELECTED' });
                dispatch({ type: 'ADD_COMMAND', payload: 'Eraser: deleted entity' });
              }
            }
          }
        }
        return;
      }

      // Transform tool clicks
      if (state.transformOp) {
        handleTransformClick();
        return;
      }

      // Modify tool: if no selection, start selecting first
      if (isModifyTool && state.selectedIds.length === 0) {
        handleSelect(e);
        return;
      }

      // Push-Pull tool
      if (isPushPull) {
        const camera = isOrtho ? orthoCameraRef.current : perspCameraRef.current;
        const group = entitiesGroupRef.current;
        if (!camera || !group) return;
        raycasterRef.current.setFromCamera(mouseRef.current, camera);

        if (!pushPullRef.current) {
          // First click: detect face
          const face = detectFaceAtRaycast(raycasterRef.current, group);
          if (face) {
            const entity = state.entities.find(e => e.id === face.entityId);
            if (entity) {
              pushPullRef.current = {
                face,
                startPoint: face.center.clone(),
                originalEntity: JSON.parse(JSON.stringify(entity)),
                lastDistance: 0,
              };
              setPushPullFace(face);
              dispatch({ type: 'ADD_COMMAND', payload: `Push/Pull: face selected on ${entity.type}` });
            }
          } else {
            dispatch({ type: 'ADD_COMMAND', payload: 'Push/Pull: click on a face to start' });
          }
        } else {
          // Second click: execute push-pull
          const pp = pushPullRef.current;
          const distance = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z)
            .sub(pp.startPoint)
            .dot(pp.face.normal);
          // Also check VCB distance
          const vcbDist = (window as any).__cadVCBPushPullDistance;
          const finalDist = vcbDist ? vcbDist : distance;
          (window as any).__cadVCBPushPullDistance = undefined;

          if (Math.abs(finalDist) > 0.01) {
            const result = executePushPull(pp.originalEntity, pp.face, finalDist);
            if (result) {
              dispatch({ type: 'REPLACE_ENTITIES', payload: [result] });
              dispatch({ type: 'ADD_COMMAND', payload: `Push/Pull: ${finalDist > 0 ? 'pulled' : 'pushed'} ${Math.abs(finalDist).toFixed(2)} units` });
              lastPushPullDistRef.current = finalDist;
            }
          }
          pushPullRef.current = null;
          setPushPullFace(null);
        }
        return;
      }

      // Tape Measure / measure-distance tool: create construction guides
      if (state.activeTool === 'measure-distance') {
        const p: Point3D = { x: worldPos.x, y: worldPos.y, z: worldPos.z };
        if (state.drawingInProgress3D.length === 0) {
          dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
          dispatch({ type: 'ADD_COMMAND', payload: `Tape Measure: first point` });
        } else {
          const start = state.drawingInProgress3D[0];
          const dist = Math.sqrt((p.x - start.x) ** 2 + (p.y - start.y) ** 2 + (p.z - start.z) ** 2);
          // If Ctrl is held, create a construction guide
          if (e.ctrlKey || e.metaKey) {
            dispatch({ type: 'ADD_GUIDE', payload: {
              id: generateId(),
              type: 'line' as const,
              start: { ...start },
              end: { ...p },
              label: dist.toFixed(2),
            }});
            dispatch({ type: 'ADD_COMMAND', payload: `Guide created: ${dist.toFixed(2)} ${state.units}` });
          } else {
            dispatch({ type: 'ADD_COMMAND', payload: `Distance: ${dist.toFixed(2)} ${state.units}` });
          }
          dispatch({ type: 'CLEAR_DRAWING' });
        }
        return;
      }

      const is3DTool = ['line3d', 'wall', 'column', 'box3d', 'window', 'door', 'slab', 'sphere', 'cone', 'cylinder', 'torus', 'pyramid', 'stairs'].includes(state.activeTool);
      const isDrawingOnPlane = state.drawingPlane !== 'xz' || is3DTool;

      if (state.activeTool === 'select') {
        // Start selection box or click-select
        const camera = isOrtho ? orthoCameraRef.current : perspCameraRef.current;
        const group = entitiesGroupRef.current;
        if (!camera || !group) return;
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const intersects = raycasterRef.current.intersectObjects(group.children, true);
        if (intersects.length > 0) {
          handleSelect(e);
        } else {
          // Start selection box
          selBoxStartRef.current = { x: e.clientX, y: e.clientY };
          if (!e.ctrlKey && !e.metaKey) dispatch({ type: 'DESELECT_ALL' });
        }
      } else if (is3DTool || state.activeTool === 'line' || state.activeTool === 'spline' || (isDrawingOnPlane && ['rectangle', 'circle'].includes(state.activeTool))) {
        handleDraw3DClick();
      } else if (['sphere', 'cone', 'cylinder', 'torus', 'pyramid', 'stairs'].includes(state.activeTool)) {
        handle3DPrimitiveClick();
      } else if (['rectangle', 'circle', 'polyline', 'polygon', 'ellipse', 'arc', 'dimension', 'spline', 'hatch', 'text'].includes(state.activeTool)) {
        handleDrawClick();
      } else if (['box'].includes(state.activeTool as string)) {
        handle3DPrimitiveClick();
      }
    }
  }, [state.activeTool, state.drawingInProgress, state.drawingInProgress3D, worldPos, state.drawingPlane, state.transformOp, state.selectedIds, isOrtho]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const orbit = orbitRef.current;
    const dx = e.clientX - orbit.lastMouse.x;
    const dy = e.clientY - orbit.lastMouse.y;

    if (orbit.isOrbiting) {
      orbit.targetSpherical.theta -= dx * 0.004;
      orbit.targetSpherical.phi -= dy * 0.004;
      orbit.targetSpherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, orbit.targetSpherical.phi));
      orbit.lastMouse = { x: e.clientX, y: e.clientY };
      return;
    }
    if (orbit.isPanning) {
      const camera = perspCameraRef.current;
      if (!camera) return;
      const panSpeed = orbit.spherical.radius * 0.0015;
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      orbit.targetTarget.add(right.multiplyScalar(-dx * panSpeed));
      orbit.targetTarget.add(up.multiplyScalar(dy * panSpeed));
      orbit.lastMouse = { x: e.clientX, y: e.clientY };
      return;
    }

    // Eraser drag-delete: delete entities as cursor passes over them
    if (isEraser && eraserDragRef.current) {
      const camera = isOrtho ? orthoCameraRef.current : perspCameraRef.current;
      const group = entitiesGroupRef.current;
      if (camera && group) {
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const intersects = raycasterRef.current.intersectObjects(group.children, true);
        if (intersects.length > 0) {
          let obj = intersects[0].object;
          while (obj.parent && obj.parent !== group) obj = obj.parent as THREE.Object3D;
          const entityId = obj.userData.entityId;
          if (entityId) {
            dispatch({ type: 'SELECT', payload: [entityId] });
            dispatch({ type: 'DELETE_SELECTED' });
          }
        }
      }
    }

    // Selection box drag
    if (selBoxStartRef.current) {
      setSelBoxScreen({ x1: selBoxStartRef.current.x, y1: selBoxStartRef.current.y, x2: e.clientX, y2: e.clientY });
    }

    const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mouseRef.current.set(mx, my);
    const pt = raycastToPlane(mx, my);
    if (pt) setWorldPos(pt);
    // Read snap result from raycast
    const snapResult = (window as any).__cadActiveSnap as SnapResult | null;
    setActiveSnap(snapResult || null);
    setCursorScreenPos({ x: e.clientX, y: e.clientY });
    (window as any).__cadCursorScreen = { x: e.clientX, y: e.clientY };

    // Push-pull face hover highlighting
    if (isPushPull && !pushPullRef.current) {
      const camera = isOrtho ? orthoCameraRef.current : perspCameraRef.current;
      const group = entitiesGroupRef.current;
      if (camera && group) {
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const face = detectFaceAtRaycast(raycasterRef.current, group);
        setPushPullFace(face);
      }
    }
  }, [state.snapEnabled, state.gridVisible, state.gridSize, isOrtho, state.drawingPlane, state.axisConstraint, state.drawingInProgress3D]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    orbitRef.current.isOrbiting = false;
    orbitRef.current.isPanning = false;
    eraserDragRef.current = false;

    // Finish selection box
    if (selBoxStartRef.current && selBoxScreen) {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const camera = isOrtho ? orthoCameraRef.current : perspCameraRef.current;
        const group = entitiesGroupRef.current;
        if (camera && group) {
          const x1 = Math.min(selBoxScreen.x1, selBoxScreen.x2);
          const y1 = Math.min(selBoxScreen.y1, selBoxScreen.y2);
          const x2 = Math.max(selBoxScreen.x1, selBoxScreen.x2);
          const y2 = Math.max(selBoxScreen.y1, selBoxScreen.y2);
          const isWindow = selBoxScreen.x2 >= selBoxScreen.x1; // left-to-right = window

          const selectedIds: string[] = [];
          group.children.forEach(child => {
            const entityId = child.userData.entityId;
            if (!entityId) return;
            // Project bounding box center to screen
            const box = new THREE.Box3().setFromObject(child);
            const center = box.getCenter(new THREE.Vector3());
            const screenPos = center.clone().project(camera);
            const sx = (screenPos.x + 1) / 2 * rect.width + rect.left;
            const sy = (-screenPos.y + 1) / 2 * rect.height + rect.top;

            if (isWindow) {
              // Window: object center must be inside box
              if (sx >= x1 && sx <= x2 && sy >= y1 && sy <= y2) selectedIds.push(entityId);
            } else {
              // Crossing: any overlap — use center or corners
              const corners = [
                new THREE.Vector3(box.min.x, box.min.y, box.min.z),
                new THREE.Vector3(box.max.x, box.max.y, box.max.z),
                new THREE.Vector3(box.min.x, box.max.y, box.max.z),
                new THREE.Vector3(box.max.x, box.min.y, box.min.z),
              ];
              const anyInside = corners.some(c => {
                const sp = c.clone().project(camera);
                const cx = (sp.x + 1) / 2 * rect.width + rect.left;
                const cy = (-sp.y + 1) / 2 * rect.height + rect.top;
                return cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2;
              });
              if (anyInside || (sx >= x1 && sx <= x2 && sy >= y1 && sy <= y2)) selectedIds.push(entityId);
            }
          });
          if (selectedIds.length > 0) {
            dispatch({ type: 'SELECT', payload: selectedIds });
            dispatch({ type: 'ADD_COMMAND', payload: `Selected ${selectedIds.length} object(s) (${isWindow ? 'window' : 'crossing'})` });
          }
        }
      }
      selBoxStartRef.current = null;
      setSelBoxScreen(null);
    }
  }, [selBoxScreen, isOrtho]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const orbit = orbitRef.current;
    const factor = 1 + Math.min(orbit.targetSpherical.radius * 0.001, 0.15);
    const zoomIn = e.deltaY < 0;
    orbit.targetSpherical.radius *= zoomIn ? 1 / factor : factor;
    orbit.targetSpherical.radius = Math.max(0.5, Math.min(5000, orbit.targetSpherical.radius));

    // Zoom toward cursor position (SketchUp-style)
    if (zoomIn) {
      const camera = isOrtho ? orthoCameraRef.current : perspCameraRef.current;
      if (camera) {
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycasterRef.current.setFromCamera(new THREE.Vector2(mx, my), camera);
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const intersection = new THREE.Vector3();
          const hit = raycasterRef.current.ray.intersectPlane(plane, intersection);
          if (hit) {
            // Move target slightly toward cursor
            const lerpAmount = 0.08;
            orbit.targetTarget.lerp(intersection, lerpAmount);
          }
        }
      }
    }
  }, [isOrtho]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (state.transformOp) {
      dispatch({ type: 'TRANSFORM_CANCEL' });
      dispatch({ type: 'ADD_COMMAND', payload: 'Cancelled' });
    } else if (state.drawingInProgress3D.length > 0 || state.drawingInProgress.length > 0) {
      dispatch({ type: 'CLEAR_DRAWING' });
      dispatch({ type: 'ADD_COMMAND', payload: 'Command completed' });
    } else {
      // Show context menu
      const camera = isOrtho ? orthoCameraRef.current : perspCameraRef.current;
      const group = entitiesGroupRef.current;
      let entityId: string | undefined;
      if (camera && group) {
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          raycasterRef.current.setFromCamera(new THREE.Vector2(mx, my), camera);
          const intersects = raycasterRef.current.intersectObjects(group.children, true);
          if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj.parent && obj.parent !== group) obj = obj.parent as THREE.Object3D;
            entityId = obj.userData.entityId;
            if (entityId && !state.selectedIds.includes(entityId)) {
              dispatch({ type: 'SELECT', payload: [entityId] });
            }
          }
        }
      }
      dispatch({ type: 'SET_CONTEXT_MENU', payload: { x: e.clientX, y: e.clientY, entityId } });
    }
  }, [state.drawingInProgress3D.length, state.drawingInProgress.length, state.transformOp, state.selectedIds, isOrtho]);

  /* ── Tool action handlers ────────────────────────────────── */
  const handleSelect = (e: React.MouseEvent) => {
    const camera = isOrtho ? orthoCameraRef.current : perspCameraRef.current;
    const group = entitiesGroupRef.current;
    if (!camera || !group) return;
    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    const intersects = raycasterRef.current.intersectObjects(group.children, true);
    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj.parent && obj.parent !== group) obj = obj.parent as THREE.Object3D;
      const entityId = obj.userData.entityId;
      if (entityId) {
        if (e.ctrlKey || e.metaKey) {
          dispatch({ type: 'TOGGLE_SELECT', payload: entityId });
        } else {
          dispatch({ type: 'SELECT', payload: [entityId] });
        }
        return;
      }
    }
    if (!e.ctrlKey && !e.metaKey) dispatch({ type: 'DESELECT_ALL' });
  };

  /* ── Transform click handler ─────────────────────────────── */
  const handleTransformClick = () => {
    const op = state.transformOp;
    if (!op) return;

    if (op.phase === 'idle') {
      // Need to select objects first
      dispatch({ type: 'ADD_COMMAND', payload: 'Select objects first, then activate tool' });
      return;
    }
    if (op.phase === 'awaiting-base') {
      dispatch({ type: 'TRANSFORM_SET_BASE', payload: { ...worldPos } });
      dispatch({ type: 'ADD_COMMAND', payload: `Base point: ${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}, ${worldPos.z.toFixed(2)}` });
      return;
    }
    if (op.phase === 'awaiting-target') {
      dispatch({ type: 'TRANSFORM_EXECUTE', payload: { ...worldPos } });
      const toolNames: Record<string, string> = { move: 'Moved', copy: 'Copied', rotate: 'Rotated', scale: 'Scaled', mirror: 'Mirrored', offset: 'Offset', extrude: 'Extruded', array: 'Arrayed' };
      dispatch({ type: 'ADD_COMMAND', payload: `${toolNames[op.type] || op.type} ${op.entityIds.length} object(s)` });
      return;
    }
  };

  const handleDraw3DClick = () => {
    const p: Point3D = { x: worldPos.x, y: worldPos.y, z: worldPos.z };
    if (state.activeTool === 'line3d' || state.activeTool === 'line') {
      if (state.drawingInProgress3D.length === 0) {
        dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
        dispatch({ type: 'ADD_COMMAND', payload: `First point: ${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}` });
      } else {
        const lastPt = state.drawingInProgress3D[state.drawingInProgress3D.length - 1];
        const segLen = Math.sqrt((p.x - lastPt.x) ** 2 + (p.y - lastPt.y) ** 2 + (p.z - lastPt.z) ** 2);
        dispatch({ type: 'ADD_ENTITY_CONTINUE', payload: { id: generateId(), type: 'line3d', layerId: state.activeLayerId, data: { start: lastPt, end: p } } });
        dispatch({ type: 'SET_DRAWING_3D', payload: [p] });
        dispatch({ type: 'ADD_COMMAND', payload: `Line segment: L=${segLen.toFixed(2)}` });
      }
    } else if (state.activeTool === 'spline') {
      // Continuous spline point adding
      dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
      dispatch({ type: 'ADD_COMMAND', payload: `Spline point ${state.drawingInProgress3D.length + 1}: ${p.x.toFixed(2)}, ${p.z.toFixed(2)}` });
    } else if (state.activeTool === 'wall') {
      // Continuous wall drawing — chain walls corner to corner like SketchUp
      if (state.drawingInProgress3D.length === 0) {
        dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
        dispatch({ type: 'ADD_COMMAND', payload: `Wall start: ${p.x.toFixed(2)}, ${p.z.toFixed(2)}` });
      } else {
        const base = state.drawingInProgress3D[state.drawingInProgress3D.length - 1];
        const dx = p.x - base.x;
        const dz = p.z - base.z;
        const wallLength = Math.sqrt(dx * dx + dz * dz);
        if (wallLength < 0.5) return; // Too short

        // Determine wall orientation: along X or Z based on dominant direction
        const wallThickness = 3; // default wall thickness
        const wallHeight = 30; // default wall height
        
        // Create wall segment between the two points
        const minX = Math.min(base.x, p.x);
        const minZ = Math.min(base.z, p.z);
        const w = Math.abs(dx) || wallThickness;
        const d = Math.abs(dz) || wallThickness;
        
        // If wall is mostly along X, make it thin in Z; if along Z, thin in X
        const wallData = Math.abs(dx) > Math.abs(dz)
          ? { base: { x: minX, y: base.y, z: base.z - wallThickness / 2 }, width: Math.abs(dx), depth: wallThickness, height: wallHeight }
          : { base: { x: base.x - wallThickness / 2, y: base.y, z: minZ }, width: wallThickness, depth: Math.abs(dz), height: wallHeight };

        addEntity({ id: generateId(), type: 'wall', layerId: state.activeLayerId, data: wallData } as any);
        // Continue chain — keep the end point as next start
        dispatch({ type: 'SET_DRAWING_3D', payload: [p] });
        dispatch({ type: 'ADD_COMMAND', payload: `Wall: L=${wallLength.toFixed(2)} — click next corner or right-click to finish` });
      }
    } else if (state.activeTool === 'column') {
      if (state.drawingInProgress3D.length === 0) dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
      else {
        const base = state.drawingInProgress3D[0];
        addEntity({ id: generateId(), type: 'column', layerId: state.activeLayerId, data: { base, radius: Math.max(1, Math.sqrt((p.x - base.x) ** 2 + (p.z - base.z) ** 2)), height: Math.abs(p.y - base.y) || 30 } } as any);
      }
    } else if (state.activeTool === 'box3d') {
      if (state.drawingInProgress3D.length === 0) dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
      else if (state.drawingInProgress3D.length === 1) dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
      else {
        const p1 = state.drawingInProgress3D[0], p2 = state.drawingInProgress3D[1];
        addEntity({ id: generateId(), type: 'box3d', layerId: state.activeLayerId, data: { origin: { x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y, p.y), z: Math.min(p1.z, p2.z) }, width: Math.abs(p2.x - p1.x) || 10, depth: Math.abs(p2.z - p1.z) || 10, height: Math.abs(p.y - Math.min(p1.y, p2.y)) || 10 } } as any);
      }
    } else if (state.activeTool === 'window') {
      if (state.drawingInProgress3D.length === 0) dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
      else {
        const base = state.drawingInProgress3D[0];
        addEntity({ id: generateId(), type: 'window', layerId: state.activeLayerId, material: { ...MATERIAL_PRESETS['glass'] }, data: { base, width: Math.abs(p.x - base.x) || 12, height: Math.abs(p.y - base.y) || 15, depth: 1 } } as any);
      }
    } else if (state.activeTool === 'door') {
      if (state.drawingInProgress3D.length === 0) dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
      else {
        const base = state.drawingInProgress3D[0];
        addEntity({ id: generateId(), type: 'door', layerId: state.activeLayerId, material: { ...MATERIAL_PRESETS['wood-oak'] }, data: { base, width: Math.abs(p.x - base.x) || 10, height: Math.abs(p.y - base.y) || 24, depth: 1 } } as any);
      }
    } else if (state.activeTool === 'slab') {
      if (state.drawingInProgress3D.length === 0) dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
      else {
        const base = state.drawingInProgress3D[0];
        addEntity({ id: generateId(), type: 'slab', layerId: state.activeLayerId, material: { ...MATERIAL_PRESETS['concrete'] }, data: { origin: { x: Math.min(base.x, p.x), y: base.y, z: Math.min(base.z, p.z) }, width: Math.abs(p.x - base.x) || 30, depth: Math.abs(p.z - base.z) || 30, thickness: 2 } } as any);
      }
    } else if (['rectangle', 'circle'].includes(state.activeTool)) {
      if (state.drawingInProgress3D.length === 0) dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
      else {
        const start = state.drawingInProgress3D[0];
        if (state.activeTool === 'rectangle') {
          addEntity({ id: generateId(), type: 'rectangle', layerId: state.activeLayerId, data: { origin: { x: Math.min(start.x, p.x), y: Math.min(start.z, p.z) }, width: Math.abs(p.x - start.x) || 10, height: Math.abs(p.z - start.z) || 10 } });
        } else {
          addEntity({ id: generateId(), type: 'circle', layerId: state.activeLayerId, data: { center: { x: start.x, y: start.z }, radius: Math.sqrt((p.x - start.x) ** 2 + (p.z - start.z) ** 2) } });
        }
      }
    }
  };

  // Get 2D drawing point based on current drawing plane
  const get2DPoint = (): { point: Point2D; plane: string } => {
    const { normal } = getDrawingPlaneInfo();
    const absX = Math.abs(normal.x), absY = Math.abs(normal.y), absZ = Math.abs(normal.z);
    if (absY >= absX && absY >= absZ) {
      // XZ plane (top-down) - default
      return { point: { x: worldPos.x, y: worldPos.z }, plane: 'xz' };
    } else if (absZ >= absX) {
      // XY plane (front view) - draw vertically
      return { point: { x: worldPos.x, y: -worldPos.y }, plane: 'xy' };
    } else {
      // YZ plane (side view) - draw vertically
      return { point: { x: worldPos.z, y: -worldPos.y }, plane: 'yz' };
    }
  };

  const handleDrawClick = () => {
    const { point: p, plane: drawPlane } = get2DPoint();
    if (state.activeTool === 'line') {
      if (state.drawingInProgress.length === 0) dispatch({ type: 'ADD_DRAWING_POINT', payload: p });
      else addEntity({ id: generateId(), type: 'line', layerId: state.activeLayerId, drawPlane: drawPlane as any, data: { start: state.drawingInProgress[0], end: p } });
    } else if (state.activeTool === 'rectangle') {
      if (state.drawingInProgress.length === 0) dispatch({ type: 'ADD_DRAWING_POINT', payload: p });
      else {
        const o = state.drawingInProgress[0];
        addEntity({ id: generateId(), type: 'rectangle', layerId: state.activeLayerId, drawPlane: drawPlane as any, data: { origin: { x: Math.min(o.x, p.x), y: Math.min(o.y, p.y) }, width: Math.abs(p.x - o.x), height: Math.abs(p.y - o.y) } });
      }
    } else if (state.activeTool === 'circle') {
      if (state.drawingInProgress.length === 0) dispatch({ type: 'ADD_DRAWING_POINT', payload: p });
      else {
        const c = state.drawingInProgress[0];
        addEntity({ id: generateId(), type: 'circle', layerId: state.activeLayerId, drawPlane: drawPlane as any, data: { center: c, radius: Math.sqrt((p.x - c.x) ** 2 + (p.y - c.y) ** 2) } });
      }
    } else if (state.activeTool === 'polyline') {
      // Auto-close: if we have 2+ points and click near the start, close & fill
      if (state.drawingInProgress.length >= 2) {
        const startPt = state.drawingInProgress[0];
        const dist = Math.sqrt((p.x - startPt.x) ** 2 + (p.y - startPt.y) ** 2);
        if (dist < 3) {
          addEntity({ id: generateId(), type: 'polyline', layerId: state.activeLayerId, drawPlane: drawPlane as any, data: { points: [...state.drawingInProgress], closed: true, filled: true } });
          return;
        }
      }
      dispatch({ type: 'ADD_DRAWING_POINT', payload: p });
    } else if (state.activeTool === 'polygon') {
      if (state.drawingInProgress.length === 0) dispatch({ type: 'ADD_DRAWING_POINT', payload: p });
      else {
        const c = state.drawingInProgress[0];
        addEntity({ id: generateId(), type: 'polygon', layerId: state.activeLayerId, drawPlane: drawPlane as any, data: { center: c, radius: Math.sqrt((p.x - c.x) ** 2 + (p.y - c.y) ** 2), sides: 6, inscribed: true } });
      }
    } else if (state.activeTool === 'ellipse') {
      if (state.drawingInProgress.length === 0) dispatch({ type: 'ADD_DRAWING_POINT', payload: p });
      else {
        const c = state.drawingInProgress[0];
        addEntity({ id: generateId(), type: 'ellipse', layerId: state.activeLayerId, drawPlane: drawPlane as any, data: { center: c, radiusX: Math.abs(p.x - c.x), radiusY: Math.abs(p.y - c.y) } });
      }
    } else if (state.activeTool === 'arc') {
      if (state.drawingInProgress.length === 0) {
        dispatch({ type: 'ADD_DRAWING_POINT', payload: p });
        dispatch({ type: 'ADD_COMMAND', payload: 'Arc: click center point' });
      } else if (state.drawingInProgress.length === 1) {
        dispatch({ type: 'ADD_DRAWING_POINT', payload: p });
        const center = state.drawingInProgress[0];
        const radius = Math.sqrt((p.x - center.x) ** 2 + (p.y - center.y) ** 2);
        dispatch({ type: 'ADD_COMMAND', payload: `Arc: radius=${radius.toFixed(2)}, click end angle` });
      } else {
        const center = state.drawingInProgress[0];
        const startPt = state.drawingInProgress[1];
        const radius = Math.sqrt((startPt.x - center.x) ** 2 + (startPt.y - center.y) ** 2);
        const startAngle = Math.atan2(startPt.y - center.y, startPt.x - center.x) * 180 / Math.PI;
        const endAngle = Math.atan2(p.y - center.y, p.x - center.x) * 180 / Math.PI;
        addEntity({ id: generateId(), type: 'arc', layerId: state.activeLayerId, drawPlane: drawPlane as any, data: { center, radius, startAngle, endAngle } });
        dispatch({ type: 'ADD_COMMAND', payload: `Arc created: R=${radius.toFixed(2)}` });
      }
    } else if (state.activeTool === 'text') {
      const content = prompt('Enter text:');
      if (content) {
        addEntity({ id: generateId(), type: 'text', layerId: state.activeLayerId, drawPlane: drawPlane as any, data: { position: p, content, fontSize: 5, fontFamily: 'monospace' } });
        dispatch({ type: 'ADD_COMMAND', payload: `Text placed: "${content}"` });
      }
    } else if (state.activeTool === 'dimension') {
      if (state.drawingInProgress.length === 0) dispatch({ type: 'ADD_DRAWING_POINT', payload: p });
      else addEntity({ id: generateId(), type: 'dimension', layerId: state.activeLayerId, drawPlane: drawPlane as any, data: { start: state.drawingInProgress[0], end: p, offset: 5, dimType: 'linear' as const } });
    }
  };

  const handle3DPrimitiveClick = () => {
    const p: Point3D = { x: worldPos.x, y: worldPos.y, z: worldPos.z };
    if (state.activeTool === 'sphere') {
      if (state.drawingInProgress3D.length === 0) {
        dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
        dispatch({ type: 'ADD_COMMAND', payload: `Center: ${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}` });
      } else {
        const center = state.drawingInProgress3D[0];
        const r = Math.sqrt((p.x - center.x) ** 2 + (p.y - center.y) ** 2 + (p.z - center.z) ** 2) || 5;
        addEntity({ id: generateId(), type: 'sphere', layerId: state.activeLayerId, data: { center, radius: r } } as any);
      }
    } else if (state.activeTool === 'cone') {
      if (state.drawingInProgress3D.length === 0) {
        dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
      } else {
        const base = state.drawingInProgress3D[0];
        const r = Math.sqrt((p.x - base.x) ** 2 + (p.z - base.z) ** 2) || 5;
        const h = Math.abs(p.y - base.y) || 15;
        addEntity({ id: generateId(), type: 'cone', layerId: state.activeLayerId, data: { base, radius: r, height: h } } as any);
      }
    } else if (state.activeTool === 'cylinder') {
      if (state.drawingInProgress3D.length === 0) {
        dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
      } else {
        const base = state.drawingInProgress3D[0];
        const r = Math.sqrt((p.x - base.x) ** 2 + (p.z - base.z) ** 2) || 5;
        const h = Math.abs(p.y - base.y) || 20;
        addEntity({ id: generateId(), type: 'cylinder', layerId: state.activeLayerId, data: { base, radius: r, height: h } } as any);
      }
    } else if (state.activeTool === 'torus') {
      if (state.drawingInProgress3D.length === 0) {
        dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
      } else {
        const center = state.drawingInProgress3D[0];
        const majorR = Math.sqrt((p.x - center.x) ** 2 + (p.z - center.z) ** 2) || 10;
        addEntity({ id: generateId(), type: 'torus', layerId: state.activeLayerId, data: { center, majorRadius: majorR, minorRadius: majorR * 0.25 } } as any);
      }
    } else if (state.activeTool === 'pyramid') {
      if (state.drawingInProgress3D.length === 0) {
        dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
      } else {
        const base = state.drawingInProgress3D[0];
        const size = Math.sqrt((p.x - base.x) ** 2 + (p.z - base.z) ** 2) * 2 || 10;
        const h = Math.abs(p.y - base.y) || 15;
        addEntity({ id: generateId(), type: 'pyramid', layerId: state.activeLayerId, data: { base, baseSize: size, height: h, sides: 4 } } as any);
      }
    } else if (state.activeTool === 'stairs') {
      if (state.drawingInProgress3D.length === 0) {
        dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
      } else {
        const base = state.drawingInProgress3D[0];
        const w = Math.abs(p.x - base.x) || 12;
        addEntity({ id: generateId(), type: 'stairs', layerId: state.activeLayerId, data: { base, width: w, stepCount: 10, stepHeight: 1.7, stepDepth: 2.8 } } as any);
      }
    } else {
      addEntity({ id: generateId(), type: 'rectangle', layerId: state.activeLayerId, data: { origin: { x: p.x - 5, y: p.z - 5 }, width: 10, height: 10, extrude: 10 } } as any);
    }
  };

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (state.activeTool === 'polyline' && state.drawingInProgress.length >= 2) {
      addEntity({ id: generateId(), type: 'polyline', layerId: state.activeLayerId, data: { points: [...state.drawingInProgress], closed: false } });
    }
    // Spline: finish on double-click
    if (state.activeTool === 'spline' && state.drawingInProgress3D.length >= 2) {
      const pts = [...state.drawingInProgress3D];
      addEntity({ id: generateId(), type: 'polyline', layerId: state.activeLayerId, data: { points: pts.map(p => ({ x: p.x, y: p.z })), closed: false } } as any);
      dispatch({ type: 'ADD_COMMAND', payload: `Spline created: ${pts.length} control points` });
      dispatch({ type: 'CLEAR_DRAWING' });
      return;
    }
    // Push-Pull double-click: repeat last distance
    if (state.activeTool === 'push-pull' && lastPushPullDistRef.current !== 0 && !pushPullRef.current) {
      const camera = isOrtho ? orthoCameraRef.current : perspCameraRef.current;
      const group = entitiesGroupRef.current;
      if (!camera || !group) return;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const face = detectFaceAtRaycast(raycasterRef.current, group);
      if (face) {
        const entity = state.entities.find(e => e.id === face.entityId);
        if (entity) {
          const result = executePushPull(entity, face, lastPushPullDistRef.current);
          if (result) {
            dispatch({ type: 'REPLACE_ENTITIES', payload: [result] });
            dispatch({ type: 'ADD_COMMAND', payload: `Push/Pull repeat: ${Math.abs(lastPushPullDistRef.current).toFixed(2)} units` });
          }
        }
      }
    }
    // Double-click zoom-to-fit on entity (Select tool)
    if (state.activeTool === 'select') {
      const camera = isOrtho ? orthoCameraRef.current : perspCameraRef.current;
      const group = entitiesGroupRef.current;
      if (!camera || !group) return;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(group.children, true);
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && obj.parent !== group) obj = obj.parent as THREE.Object3D;
        // Zoom to fit the clicked entity
        const box = new THREE.Box3().setFromObject(obj);
        if (!box.isEmpty()) {
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const orbit = orbitRef.current;
          orbit.targetTarget.copy(center);
          orbit.targetSpherical.radius = Math.max(maxDim * 2.5, 15);
          dispatch({ type: 'ADD_COMMAND', payload: 'Zoom to fit entity' });
        }
      }
    }
  }, [state.activeTool, state.drawingInProgress, state.activeLayerId, state.entities, isOrtho]);

  /* ── View presets ─────────────────────────────────────────── */
  const setViewPreset = useCallback((view: string) => {
    const orbit = orbitRef.current;
    const dist = orbit.targetSpherical.radius;
    switch (view) {
      case 'top': orbit.targetSpherical.set(dist, 0.01, 0); break;
      case 'front': orbit.targetSpherical.set(dist, Math.PI / 2, 0); break;
      case 'back': orbit.targetSpherical.set(dist, Math.PI / 2, Math.PI); break;
      case 'side': orbit.targetSpherical.set(dist, Math.PI / 2, Math.PI / 2); break;
      case 'left': orbit.targetSpherical.set(dist, Math.PI / 2, -Math.PI / 2); break;
      case 'bottom': orbit.targetSpherical.set(dist, Math.PI - 0.01, 0); break;
      case 'isometric': orbit.targetSpherical.set(dist, Math.PI / 3.5, Math.PI / 4); break;
    }
    dispatch({ type: 'SET_VIEW', payload: view });
  }, []);

  // Expose controls globally for ViewCube + other components
  useEffect(() => {
    (window as any).__cadSetView = setViewPreset;
    (window as any).__cadToggleOrtho = () => setIsOrtho(prev => !prev);
    (window as any).__cadIsOrtho = isOrtho;
    (window as any).__cadResetView = () => {
      orbitRef.current.targetTarget.set(0, 0, 0);
      orbitRef.current.targetSpherical.set(100, Math.PI / 3.5, Math.PI / 4);
    };
    (window as any).__cadPanTo = (wx: number, wz: number) => {
      orbitRef.current.targetTarget.set(wx, 0, wz);
    };
    (window as any).__cadZoomExtents = () => {
      const group = entitiesGroupRef.current;
      if (!group || group.children.length === 0) {
        (window as any).__cadResetView();
        return;
      }
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      orbitRef.current.targetTarget.copy(center);
      orbitRef.current.targetSpherical.radius = Math.max(maxDim * 1.5, 20);
    };
    // Expose camera state for Scene Manager
    (window as any).__cadGetCamera = () => {
      const orbit = orbitRef.current;
      return {
        radius: orbit.spherical.radius,
        phi: orbit.spherical.phi,
        theta: orbit.spherical.theta,
        target: { x: orbit.target.x, y: orbit.target.y, z: orbit.target.z },
      };
    };
    (window as any).__cadSetCamera = (cam: { radius: number; phi: number; theta: number; target: { x: number; y: number; z: number } }) => {
      const orbit = orbitRef.current;
      orbit.targetSpherical.set(cam.radius, cam.phi, cam.theta);
      orbit.targetTarget.set(cam.target.x, cam.target.y, cam.target.z);
    };
    return () => {
      delete (window as any).__cadSetView;
      delete (window as any).__cadToggleOrtho;
      delete (window as any).__cadIsOrtho;
      delete (window as any).__cadResetView;
      delete (window as any).__cadPanTo;
      delete (window as any).__cadZoomExtents;
      delete (window as any).__cadGetCamera;
      delete (window as any).__cadSetCamera;
    };
  }, [setViewPreset, isOrtho]);

  // Dynamic input calculations
  const lastDrawPt3D = state.drawingInProgress3D.length > 0 ? state.drawingInProgress3D[state.drawingInProgress3D.length - 1] : null;
  const transformBase = state.transformOp?.basePoint || null;
  const dynamicRef = transformBase && state.transformOp?.phase === 'awaiting-target' ? transformBase : lastDrawPt3D;
  const dynamicDist = dynamicRef ? Math.sqrt((worldPos.x - dynamicRef.x) ** 2 + (worldPos.y - dynamicRef.y) ** 2 + (worldPos.z - dynamicRef.z) ** 2) : 0;
  const dynamicAngleXZ = dynamicRef ? Math.atan2(worldPos.z - dynamicRef.z, worldPos.x - dynamicRef.x) * 180 / Math.PI : 0;
  const dynamicDY = dynamicRef ? worldPos.y - dynamicRef.y : 0;
  const showDynamic = dynamicRef !== null && dynamicDist > 0.01;
  const cursorStyle = state.activeTool === 'select' ? (selBoxStartRef.current ? 'crosshair' : 'default') : state.activeTool === 'pan' ? 'grab' : isPushPull ? 'ns-resize' : isModifyTool ? 'move' : 'crosshair';

  return (
    <>
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0d0d0d]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
            <span className="text-white/50 text-xs font-mono">Initialising WebGL…</span>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ outline: 'none', cursor: cursorStyle }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
        tabIndex={0}
      />
      {/* Selection Box Visual */}
      {selBoxScreen && (
        <div
          className="pointer-events-none fixed z-[98]"
          style={{
            left: Math.min(selBoxScreen.x1, selBoxScreen.x2),
            top: Math.min(selBoxScreen.y1, selBoxScreen.y2),
            width: Math.abs(selBoxScreen.x2 - selBoxScreen.x1),
            height: Math.abs(selBoxScreen.y2 - selBoxScreen.y1),
            border: selBoxScreen.x2 >= selBoxScreen.x1
              ? '1.5px solid #4A90D9'
              : '1.5px dashed #22C55E',
            backgroundColor: selBoxScreen.x2 >= selBoxScreen.x1
              ? 'rgba(74,144,217,0.08)'
              : 'rgba(34,197,94,0.06)',
          }}
        />
      )}
      {/* Push-pull face highlight indicator */}
      {isPushPull && pushPullFace && !pushPullRef.current && (
        <div
          className="pointer-events-none fixed z-[99] bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded px-2 py-0.5 font-mono text-[9px] text-[#60A5FA]"
          style={{ left: cursorScreenPos.x + 16, top: cursorScreenPos.y + 12 }}
        >
          Push/Pull Face
        </div>
      )}
      {/* Dynamic input tooltip near cursor */}
      {showDynamic && (
        <div
          className="pointer-events-none fixed z-[100] bg-[#0a0a0a]/95 border border-[#00ccff]/20 rounded px-2 py-1 font-mono text-[10px] shadow-lg shadow-black/50"
          style={{ left: cursorScreenPos.x + 20, top: cursorScreenPos.y - 55 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[#00ccff]">L:</span>
            <span className="text-white/90">{dynamicDist.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#00ccff]">A:</span>
            <span className="text-white/90">{dynamicAngleXZ.toFixed(1)}°</span>
          </div>
          {Math.abs(dynamicDY) > 0.1 && (
            <div className="flex items-center gap-2">
              <span className="text-[#4488ff]">ΔY:</span>
              <span className="text-white/90">{dynamicDY.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
      {/* Snap indicator */}
      {activeSnap && (
        <div
          className="pointer-events-none fixed z-[101]"
          style={{ left: cursorScreenPos.x - 12, top: cursorScreenPos.y - 12 }}
        >
          {/* Snap marker */}
          <div
            className="w-6 h-6 flex items-center justify-center font-bold text-sm"
            style={{ color: getSnapColor(activeSnap.type) }}
          >
            {getSnapIcon(activeSnap.type)}
          </div>
          {/* Snap label */}
          <div
            className="absolute left-7 top-0 whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[9px] border"
            style={{
              color: getSnapColor(activeSnap.type),
              borderColor: getSnapColor(activeSnap.type) + '40',
              backgroundColor: '#0a0a0add',
            }}
          >
            {activeSnap.type === 'endpoint' ? 'Endpoint' :
             activeSnap.type === 'midpoint' ? 'Midpoint' :
             activeSnap.type === 'center' ? 'Center' :
             activeSnap.type}
          </div>
        </div>
      )}
      {/* Context Menu */}
      {state.contextMenu && (
        <CADContextMenu
          x={state.contextMenu.x}
          y={state.contextMenu.y}
          entityId={state.contextMenu.entityId}
          onClose={() => dispatch({ type: 'CLOSE_CONTEXT_MENU' })}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Static helper functions
   ═══════════════════════════════════════════════════════════════ */

function clearGroup(group: THREE.Group) {
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    disposeObject(child);
  }
}

/* ── Axes: X=Red, Y=Green, Z=Blue (AutoCAD standard) ──────── */
function buildAxes(scene: THREE.Scene) {
  const axisLength = 100000;

  // Axis lines
  const xMat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
  const yMat = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
  const zMat = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });

  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-axisLength, 0, 0), new THREE.Vector3(axisLength, 0, 0)]), xMat));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -axisLength, 0), new THREE.Vector3(0, axisLength, 0)]), yMat));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -axisLength), new THREE.Vector3(0, 0, axisLength)]), zMat));

  // Arrowhead cones
  addArrowCone(scene, new THREE.Vector3(50, 0, 0), new THREE.Euler(0, 0, -Math.PI / 2), 0xff0000);
  addArrowCone(scene, new THREE.Vector3(0, 50, 0), new THREE.Euler(0, 0, 0), 0x00ff00);
  addArrowCone(scene, new THREE.Vector3(0, 0, 50), new THREE.Euler(Math.PI / 2, 0, 0), 0x0000ff);

  // Axis labels (sprites always face camera)
  addAxisLabel(scene, 'X', new THREE.Vector3(55, 1, 0), 0xff0000);
  addAxisLabel(scene, 'Y', new THREE.Vector3(0, 55, 0), 0x00ff00);
  addAxisLabel(scene, 'Z', new THREE.Vector3(0, 1, 55), 0x0000ff);
}

function addArrowCone(scene: THREE.Scene, pos: THREE.Vector3, rot: THREE.Euler, color: number) {
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.8, 3, 12),
    new THREE.MeshBasicMaterial({ color })
  );
  cone.position.copy(pos);
  cone.rotation.copy(rot);
  scene.add(cone);
}

function addAxisLabel(scene: THREE.Scene, text: string, position: THREE.Vector3, color: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
  ctx.font = 'bold 80px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 64);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthTest: false })
  );
  sprite.position.copy(position);
  sprite.scale.set(4, 4, 1);
  sprite.renderOrder = 999;
  scene.add(sprite);
}

/* ── Truly Infinite Grid: shader-based, camera-following, fade-to-horizon ── */

function createInfiniteGridMaterial(color: THREE.Color, opacity: number, gridSpacing: number, fadeStart: number, fadeEnd: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uOpacity: { value: opacity },
      uGridSpacing: { value: gridSpacing },
      uFadeStart: { value: fadeStart },
      uFadeEnd: { value: fadeEnd },
      uLineWidth: { value: 1.0 },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uGridSpacing;
      uniform float uFadeStart;
      uniform float uFadeEnd;
      uniform float uLineWidth;
      varying vec3 vWorldPos;

      void main() {
        // Grid lines on XZ plane
        vec2 coord = vWorldPos.xz / uGridSpacing;
        vec2 grid = abs(fract(coord - 0.5) - 0.5);
        vec2 dGrid = fwidth(coord);
        vec2 lines = smoothstep(dGrid * uLineWidth, vec2(0.0), grid);
        float line = max(lines.x, lines.y);

        // Distance-based fade from camera (radial)
        float dist = length(vWorldPos.xz - cameraPosition.xz);
        float fade = 1.0 - smoothstep(uFadeStart, uFadeEnd, dist);

        float alpha = line * uOpacity * fade;
        if (alpha < 0.003) discard;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    extensions: { derivatives: true } as any,
  });
}

function createVerticalGridMaterial(color: THREE.Color, opacity: number, gridSpacing: number, fadeStart: number, fadeEnd: number, axis: 'xy' | 'yz'): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uOpacity: { value: opacity },
      uGridSpacing: { value: gridSpacing },
      uFadeStart: { value: fadeStart },
      uFadeEnd: { value: fadeEnd },
      uLineWidth: { value: 1.0 },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uGridSpacing;
      uniform float uFadeStart;
      uniform float uFadeEnd;
      uniform float uLineWidth;
      varying vec3 vWorldPos;

      void main() {
        vec2 coord = ${axis === 'xy' ? 'vWorldPos.xy' : 'vWorldPos.yz'} / uGridSpacing;
        vec2 grid = abs(fract(coord - 0.5) - 0.5);
        vec2 dGrid = fwidth(coord);
        vec2 lines = smoothstep(dGrid * uLineWidth, vec2(0.0), grid);
        float line = max(lines.x, lines.y);

        float dist = length(vWorldPos - cameraPosition);
        float fade = 1.0 - smoothstep(uFadeStart, uFadeEnd, dist);

        float alpha = line * uOpacity * fade;
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    extensions: { derivatives: true } as any,
  });
}

function buildInfiniteGrid(group: THREE.Group, gridSize: number, showFloor = true, showVertical = true) {
  const planeSize = 100000;
  const fadeStart = 500;
  const fadeEnd = 5000;

  const gridColor = new THREE.Color(0x444444);
  const majorEvery = gridSize < 1 ? 10 : gridSize < 5 ? 5 : 10;
  const majorStep = gridSize * majorEvery;
  const superStep = majorStep * majorEvery;

  if (showFloor) {
    // Minor grid
    const minorOpacity = 0.25;
    {
      const minorGeo = new THREE.PlaneGeometry(planeSize, planeSize);
      minorGeo.rotateX(-Math.PI / 2);
      const minorMat = createInfiniteGridMaterial(gridColor, minorOpacity, gridSize, fadeStart * 0.4, fadeEnd * 0.5);
      const minorMesh = new THREE.Mesh(minorGeo, minorMat);
      minorMesh.renderOrder = -1;
      minorMesh.frustumCulled = false;
      group.add(minorMesh);
    }

    // Major grid
    const majorGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    majorGeo.rotateX(-Math.PI / 2);
    const majorMat = createInfiniteGridMaterial(new THREE.Color(0x666666), 0.40, majorStep, fadeStart, fadeEnd);
    const majorMesh = new THREE.Mesh(majorGeo, majorMat);
    majorMesh.renderOrder = 0;
    majorMesh.frustumCulled = false;
    group.add(majorMesh);

    // Super grid
    {
      const superGeo = new THREE.PlaneGeometry(planeSize, planeSize);
      superGeo.rotateX(-Math.PI / 2);
      const superMat = createInfiniteGridMaterial(new THREE.Color(0x555555), 0.20, superStep, fadeStart * 1.5, fadeEnd * 2);
      const superMesh = new THREE.Mesh(superGeo, superMat);
      superMesh.renderOrder = 1;
      superMesh.frustumCulled = false;
      group.add(superMesh);
    }
  }

  if (showVertical) {
    // Vertical helper planes (XY and YZ)
    const vertFadeStart = 400;
    const vertFadeEnd = 3000;

    // XY plane
    const xyGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const xyMinorMat = createVerticalGridMaterial(new THREE.Color(0xffffff), 0.018, gridSize, vertFadeStart * 0.5, vertFadeEnd * 0.5, 'xy');
    const xyMinorMesh = new THREE.Mesh(xyGeo, xyMinorMat);
    xyMinorMesh.frustumCulled = false;
    group.add(xyMinorMesh);

    const xyMajorGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const xyMajorMat = createVerticalGridMaterial(new THREE.Color(0xffffff), 0.045, majorStep, vertFadeStart, vertFadeEnd, 'xy');
    const xyMajorMesh = new THREE.Mesh(xyMajorGeo, xyMajorMat);
    xyMajorMesh.frustumCulled = false;
    group.add(xyMajorMesh);

    // YZ plane
    const yzGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    yzGeo.rotateY(Math.PI / 2);
    const yzMinorMat = createVerticalGridMaterial(new THREE.Color(0xffffff), 0.018, gridSize, vertFadeStart * 0.5, vertFadeEnd * 0.5, 'yz');
    const yzMinorMesh = new THREE.Mesh(yzGeo, yzMinorMat);
    yzMinorMesh.frustumCulled = false;
    group.add(yzMinorMesh);

    const yzMajorGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    yzMajorGeo.rotateY(Math.PI / 2);
    const yzMajorMat = createVerticalGridMaterial(new THREE.Color(0xffffff), 0.045, majorStep, vertFadeStart, vertFadeEnd, 'yz');
    const yzMajorMesh = new THREE.Mesh(yzMajorGeo, yzMajorMat);
    yzMajorMesh.frustumCulled = false;
    group.add(yzMajorMesh);
  }
}

/* ── Material cache for performance ─────────────────────────── */
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

function getMaterial(entity: AnyCADEntity, layer: any, isSelected: boolean): THREE.MeshStandardMaterial {
  const mat = entity.material || MATERIAL_PRESETS['default'];
  const cacheKey = `${mat.preset}_${mat.color}_${mat.opacity}_${mat.metalness}_${mat.roughness}_${isSelected}`;
  
  const cached = materialCache.get(cacheKey);
  if (cached) return cached.clone(); // Clone so each mesh can be disposed independently
  
  const m = new THREE.MeshStandardMaterial({
    color: isSelected ? 0x00aaff : new THREE.Color(mat.color).getHex(),
    transparent: mat.opacity < 1 || isSelected,
    opacity: isSelected ? Math.max(mat.opacity, 0.7) : mat.opacity,
    metalness: mat.metalness,
    roughness: mat.roughness,
    side: mat.opacity < 1 ? THREE.DoubleSide : THREE.FrontSide,
  });
  if (mat.emissive) {
    m.emissive = new THREE.Color(mat.emissive);
    m.emissiveIntensity = mat.emissiveIntensity || 0.1;
  }
  materialCache.set(cacheKey, m);
  return m.clone();
}

/* ── Reusable geometry cache ───────────────────────────────── */
const geoCache = new Map<string, THREE.BufferGeometry>();

function getCachedGeo(key: string, factory: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let geo = geoCache.get(key);
  if (!geo) {
    geo = factory();
    geoCache.set(key, geo);
  }
  return geo;
}

/* ── Entity mesh builder ───────────────────────────────────── */
function buildEntityMesh(entity: AnyCADEntity, layer: any, isSelected: boolean): THREE.Object3D | null {
  const color = isSelected ? 0x00aaff : new THREE.Color(entity.color || layer?.color || '#ffffff').getHex();
  const lineColor = isSelected ? 0x00aaff : color;

  // SketchUp-style: always show edges on 3D solids + selection glow
  const addEdgesAndOutline = (mesh: THREE.Mesh, geo: THREE.BufferGeometry) => {
    // Always show edges (SketchUp signature look)
    const edgeColor = isSelected ? 0x00aaff : 0x222222;
    const edgeOpacity = isSelected ? 1.0 : 0.45;
    mesh.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 15),
      new THREE.LineBasicMaterial({ color: edgeColor, linewidth: 1, transparent: !isSelected, opacity: edgeOpacity })
    ));
    if (isSelected) {
      // Selection glow shell
      const glowMat = new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.06, side: THREE.BackSide });
      const glowMesh = new THREE.Mesh(geo.clone(), glowMat);
      glowMesh.scale.multiplyScalar(1.04);
      mesh.add(glowMesh);
    }
  };
  // Alias for backward compat
  const addSelectionOutline = addEdgesAndOutline;

  // Helper: map 2D point to 3D based on drawPlane
  const dp = entity.drawPlane || 'xz';
  const to3D = (p: { x: number; y: number }, elevation = 0.05): THREE.Vector3 => {
    switch (dp) {
      case 'xy': return new THREE.Vector3(p.x, -p.y, elevation);
      case 'yz': return new THREE.Vector3(elevation, -p.y, p.x);
      default:   return new THREE.Vector3(p.x, elevation, p.y);
    }
  };

  switch (entity.type) {
    case 'line': {
      const { start, end } = entity.data;
      return new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        to3D(start), to3D(end),
      ]), new THREE.LineBasicMaterial({ color: lineColor, linewidth: 2 }));
    }
    case 'line3d': {
      const { start, end } = entity.data as { start: { x: number; y: number; z: number }; end: { x: number; y: number; z: number } };
      const grp = new THREE.Group();
      grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(start.x, start.y, start.z), new THREE.Vector3(end.x, end.y, end.z),
      ]), new THREE.LineBasicMaterial({ color: lineColor, linewidth: 2 })));
      const dotGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({ color: lineColor });
      const d1 = new THREE.Mesh(dotGeo, dotMat); d1.position.set(start.x, start.y, start.z); grp.add(d1);
      const d2 = new THREE.Mesh(dotGeo, dotMat); d2.position.set(end.x, end.y, end.z); grp.add(d2);
      grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(start.x, 0.01, start.z), new THREE.Vector3(end.x, 0.01, end.z),
      ]), new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: 0.12 })));
      return grp;
    }
    case 'wall': {
      const { base, width, depth, height } = entity.data as { base: { x: number; y: number; z: number }; width: number; depth: number; height: number };
      const geo = new THREE.BoxGeometry(width, height, depth);
      const mat = getMaterial(entity, layer, isSelected);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(base.x + width / 2, base.y + height / 2, base.z + depth / 2);
      mesh.castShadow = true; mesh.receiveShadow = true;
      addSelectionOutline(mesh, geo);
      return mesh;
    }
    case 'box3d': {
      const { origin, width, depth, height } = entity.data as { origin: { x: number; y: number; z: number }; width: number; depth: number; height: number };
      const geo = new THREE.BoxGeometry(width, height, depth);
      const mat = getMaterial(entity, layer, isSelected);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(origin.x + width / 2, origin.y + height / 2, origin.z + depth / 2);
      mesh.castShadow = true; mesh.receiveShadow = true;
      addSelectionOutline(mesh, geo);
      return mesh;
    }
    case 'column': {
      const { base, radius, height } = entity.data as { base: { x: number; y: number; z: number }; radius: number; height: number };
      const geo = new THREE.CylinderGeometry(radius, radius, height, 32);
      const mat = getMaterial(entity, layer, isSelected);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(base.x, base.y + height / 2, base.z);
      mesh.castShadow = true; mesh.receiveShadow = true;
      addSelectionOutline(mesh, geo);
      return mesh;
    }
    case 'sphere': {
      const { center, radius } = entity.data as { center: { x: number; y: number; z: number }; radius: number };
      const geo = new THREE.SphereGeometry(radius, 48, 48);
      const mat = getMaterial(entity, layer, isSelected);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(center.x, center.y, center.z);
      mesh.castShadow = true; mesh.receiveShadow = true;
      addSelectionOutline(mesh, geo);
      return mesh;
    }
    case 'cone': {
      const { base, radius, height, topRadius = 0 } = entity.data as { base: { x: number; y: number; z: number }; radius: number; height: number; topRadius?: number };
      const geo = new THREE.CylinderGeometry(topRadius, radius, height, 32);
      const mat = getMaterial(entity, layer, isSelected);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(base.x, base.y + height / 2, base.z);
      mesh.castShadow = true; mesh.receiveShadow = true;
      addSelectionOutline(mesh, geo);
      return mesh;
    }
    case 'torus': {
      const { center, majorRadius, minorRadius } = entity.data as { center: { x: number; y: number; z: number }; majorRadius: number; minorRadius: number };
      const geo = new THREE.TorusGeometry(majorRadius, minorRadius, 24, 48);
      const mat = getMaterial(entity, layer, isSelected);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(center.x, center.y, center.z);
      mesh.rotation.x = Math.PI / 2;
      mesh.castShadow = true; mesh.receiveShadow = true;
      addSelectionOutline(mesh, geo);
      return mesh;
    }
    case 'cylinder': {
      const { base, radius, height } = entity.data as { base: { x: number; y: number; z: number }; radius: number; height: number };
      const geo = new THREE.CylinderGeometry(radius, radius, height, 32);
      const mat = getMaterial(entity, layer, isSelected);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(base.x, base.y + height / 2, base.z);
      mesh.castShadow = true; mesh.receiveShadow = true;
      addSelectionOutline(mesh, geo);
      return mesh;
    }
    case 'pyramid': {
      const { base, baseSize, height, sides = 4 } = entity.data as { base: { x: number; y: number; z: number }; baseSize: number; height: number; sides: number };
      const geo = new THREE.CylinderGeometry(0, baseSize / 2, height, sides);
      const mat = getMaterial(entity, layer, isSelected);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(base.x, base.y + height / 2, base.z);
      mesh.castShadow = true; mesh.receiveShadow = true;
      addSelectionOutline(mesh, geo);
      return mesh;
    }
    case 'stairs': {
      const { base, width, stepCount, stepHeight, stepDepth } = entity.data as { base: { x: number; y: number; z: number }; width: number; stepCount: number; stepHeight: number; stepDepth: number };
      const grp = new THREE.Group();
      const mat = getMaterial(entity, layer, isSelected);
      for (let i = 0; i < stepCount; i++) {
        const geo = new THREE.BoxGeometry(width, stepHeight, stepDepth);
        const step = new THREE.Mesh(geo, mat.clone());
        step.position.set(base.x + width / 2, base.y + stepHeight * (i + 0.5), base.z + stepDepth * (i + 0.5));
        step.castShadow = true; step.receiveShadow = true;
        if (isSelected) step.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x00aaff })));
        grp.add(step);
      }
      return grp;
    }
    case 'window': {
      const { base, width, height, depth } = entity.data as { base: { x: number; y: number; z: number }; width: number; height: number; depth: number };
      const grp = new THREE.Group();
      const glassGeo = new THREE.BoxGeometry(width - 1, height - 1, depth * 0.3);
      const glassMat = getMaterial(entity, layer, isSelected);
      const glass = new THREE.Mesh(glassGeo, glassMat);
      glass.position.set(base.x + width / 2, base.y + height / 2, base.z + depth / 2);
      grp.add(glass);
      const frameMat = new THREE.MeshStandardMaterial({ color: isSelected ? 0x00aaff : 0x444444, metalness: 0.6, roughness: 0.3 });
      const ft = 0.8;
      grp.add(createFramePart(base.x + width / 2, base.y + height - ft / 2, base.z + depth / 2, width, ft, depth, frameMat));
      grp.add(createFramePart(base.x + width / 2, base.y + ft / 2, base.z + depth / 2, width, ft, depth, frameMat));
      grp.add(createFramePart(base.x + ft / 2, base.y + height / 2, base.z + depth / 2, ft, height, depth, frameMat));
      grp.add(createFramePart(base.x + width - ft / 2, base.y + height / 2, base.z + depth / 2, ft, height, depth, frameMat));
      grp.add(createFramePart(base.x + width / 2, base.y + height / 2, base.z + depth / 2, width - 2, ft * 0.5, depth * 0.8, frameMat));
      return grp;
    }
    case 'door': {
      const { base, width, height, depth } = entity.data as { base: { x: number; y: number; z: number }; width: number; height: number; depth: number };
      const grp = new THREE.Group();
      const doorGeo = new THREE.BoxGeometry(width - 1, height - 0.5, depth);
      const doorMat = getMaterial(entity, layer, isSelected);
      const door = new THREE.Mesh(doorGeo, doorMat);
      door.position.set(base.x + width / 2, base.y + height / 2 - 0.25, base.z + depth / 2);
      door.castShadow = true; grp.add(door);
      const frameMat = new THREE.MeshStandardMaterial({ color: isSelected ? 0x00aaff : 0x555555, metalness: 0.3, roughness: 0.5 });
      grp.add(createFramePart(base.x + width / 2, base.y + height, base.z + depth / 2, width + 1, 1, depth + 0.5, frameMat));
      grp.add(createFramePart(base.x - 0.5, base.y + height / 2, base.z + depth / 2, 1, height, depth + 0.5, frameMat));
      grp.add(createFramePart(base.x + width + 0.5, base.y + height / 2, base.z + depth / 2, 1, height, depth + 0.5, frameMat));
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8), new THREE.MeshStandardMaterial({ color: 0xCCCCCC, metalness: 0.9, roughness: 0.1 }));
      handle.rotation.x = Math.PI / 2;
      handle.position.set(base.x + width - 2, base.y + height * 0.45, base.z + depth + 0.3);
      grp.add(handle);
      return grp;
    }
    case 'slab': {
      const { origin, width, depth, thickness } = entity.data as { origin: { x: number; y: number; z: number }; width: number; depth: number; thickness: number };
      const geo = new THREE.BoxGeometry(width, thickness, depth);
      const mat = getMaterial(entity, layer, isSelected);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(origin.x + width / 2, origin.y + thickness / 2, origin.z + depth / 2);
      mesh.castShadow = true; mesh.receiveShadow = true;
      addSelectionOutline(mesh, geo);
      return mesh;
    }
    case 'circle': {
      const { center, radius } = entity.data;
      const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
      return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(curve.getPoints(64).map(p => to3D({ x: p.x + center.x, y: p.y + center.y }))), new THREE.LineBasicMaterial({ color: lineColor }));
    }
    case 'rectangle': {
      const { origin, width, height } = entity.data;
      const extrudeHeight = entity.data.extrude;
      if (extrudeHeight) {
        const boxGeo = new THREE.BoxGeometry(width, extrudeHeight, height);
        const boxMat = getMaterial(entity, layer, isSelected);
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(origin.x + width / 2, extrudeHeight / 2, origin.y + height / 2);
        box.castShadow = true;
        addSelectionOutline(box, boxGeo);
        return box;
      }
      const pts = [
        to3D({ x: origin.x, y: origin.y }),
        to3D({ x: origin.x + width, y: origin.y }),
        to3D({ x: origin.x + width, y: origin.y + height }),
        to3D({ x: origin.x, y: origin.y + height }),
        to3D({ x: origin.x, y: origin.y }),
      ];
      return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: lineColor }));
    }
    case 'polyline': {
      const { points, closed, filled } = entity.data;
      if (points.length < 2) return null;
      const pts3d = points.map((p: { x: number; y: number }) => to3D(p));
      if (closed && filled && points.length >= 3) {
        const shape = new THREE.Shape();
        shape.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) shape.lineTo(points[i].x, points[i].y);
        shape.closePath();
        const meshGeom = new THREE.ShapeGeometry(shape);
        // Orient fill based on draw plane
        if (dp === 'xy') {
          meshGeom.rotateY(0); // already in XY
          meshGeom.translate(0, 0, 0.04);
        } else if (dp === 'yz') {
          meshGeom.rotateY(Math.PI / 2);
          meshGeom.translate(0.04, 0, 0);
        } else {
          // XZ default - rotate shape from XY to XZ
          meshGeom.rotateX(-Math.PI / 2);
          meshGeom.translate(0, 0.04, 0);
        }
        const fillColor = new THREE.Color(lineColor).multiplyScalar(0.6);
        const fillMat = new THREE.MeshStandardMaterial({ color: fillColor, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
        const fillMesh = new THREE.Mesh(meshGeom, fillMat);
        pts3d.push(pts3d[0].clone());
        const outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts3d), new THREE.LineBasicMaterial({ color: lineColor }));
        const group = new THREE.Group();
        group.add(fillMesh);
        group.add(outline);
        return group;
      }
      if (closed) pts3d.push(pts3d[0].clone());
      return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts3d), new THREE.LineBasicMaterial({ color: lineColor }));
    }
    case 'polygon': {
      const { center, radius, sides, rotation = 0 } = entity.data;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= sides; i++) {
        const a = (i * 2 * Math.PI) / sides + (rotation * Math.PI / 180);
        pts.push(to3D({ x: center.x + radius * Math.cos(a), y: center.y + radius * Math.sin(a) }));
      }
      return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: lineColor }));
    }
    case 'arc': {
      const { center, radius, startAngle, endAngle } = entity.data;
      const sA = (startAngle || 0) * Math.PI / 180;
      const eA = (endAngle || 360) * Math.PI / 180;
      let sweep = eA - sA;
      if (sweep <= 0) sweep += Math.PI * 2;
      const steps = Math.max(16, Math.ceil(Math.abs(sweep) / (Math.PI / 32)));
      const arcPts: THREE.Vector3[] = [];
      for (let i = 0; i <= steps; i++) {
        const a = sA + (i / steps) * sweep;
        arcPts.push(to3D({ x: center.x + radius * Math.cos(a), y: center.y + radius * Math.sin(a) }));
      }
      return new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), new THREE.LineBasicMaterial({ color: lineColor }));
    }
    case 'ellipse': {
      const { center, radiusX, radiusY, rotation = 0 } = entity.data;
      const curve = new THREE.EllipseCurve(0, 0, radiusX, radiusY, 0, Math.PI * 2, false, rotation * Math.PI / 180);
      return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(curve.getPoints(64).map(p => to3D({ x: p.x + center.x, y: p.y + center.y }))), new THREE.LineBasicMaterial({ color: lineColor }));
    }
    case 'text': {
      const { position, content, fontSize } = entity.data;
      const canvas = document.createElement('canvas');
      const scale = 4;
      canvas.width = content.length * fontSize * scale; canvas.height = fontSize * scale * 1.5;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = `#${lineColor.toString(16).padStart(6, '0')}`;
      ctx.font = `${fontSize * scale}px monospace`;
      ctx.fillText(content, 0, fontSize * scale);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }));
      sprite.position.set(position.x, 1, position.y);
      sprite.scale.set(content.length * fontSize * 0.15, fontSize * 0.2, 1);
      return sprite;
    }
    case 'dimension': {
      const { start, end } = entity.data;
      const grp = new THREE.Group();
      grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(start.x, 0.1, start.y), new THREE.Vector3(end.x, 0.1, end.y)]), new THREE.LineBasicMaterial({ color: 0x00ff00 })));
      const extMat = new THREE.LineBasicMaterial({ color: 0x00ff00, opacity: 0.5, transparent: true });
      grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(start.x, 0, start.y), new THREE.Vector3(start.x, 0.15, start.y)]), extMat));
      grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(end.x, 0, end.y), new THREE.Vector3(end.x, 0.15, end.y)]), extMat));
      // Dimension text
      const dist = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
      addTextSprite(grp, dist.toFixed(2), new THREE.Vector3((start.x + end.x) / 2, 0.5, (start.y + end.y) / 2), 0x00ff00);
      return grp;
    }
    default: return null;
  }
}

function createFramePart(x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
}

/* ── Preview builders ──────────────────────────────────────── */
function buildPreview3D(group: THREE.Group, tool: string, points: Point3D[], worldPos: Point3D) {
  const mat = new THREE.LineBasicMaterial({ color: 0x00ccff, opacity: 0.7, transparent: true });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x00ccff, opacity: 0.35, transparent: true });
  const ghostMat = new THREE.MeshStandardMaterial({ color: 0x00ccff, transparent: true, opacity: 0.15, side: THREE.DoubleSide });

  // Helper to add ghost mesh + edges
  const addGhostWithEdges = (geo: THREE.BufferGeometry, pos: THREE.Vector3) => {
    const mesh = new THREE.Mesh(geo, ghostMat);
    mesh.position.copy(pos);
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 15), edgeMat));
    group.add(mesh);
  };

  if ((tool === 'line3d' || tool === 'line') && points.length >= 1) {
    const s = points[0];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(s.x, s.y, s.z), new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z),
    ]), mat));
    const dist3D = Math.sqrt((worldPos.x - s.x) ** 2 + (worldPos.y - s.y) ** 2 + (worldPos.z - s.z) ** 2);
    addTextSprite(group, dist3D.toFixed(2), new THREE.Vector3((s.x + worldPos.x) / 2, (s.y + worldPos.y) / 2 + 1.5, (s.z + worldPos.z) / 2), 0x00ccff);
    if (Math.abs(worldPos.y - s.y) > 0.5) {
      const vg = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(worldPos.x, s.y, worldPos.z), new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z),
      ]);
      const dm = new THREE.LineDashedMaterial({ color: 0x4488ff, dashSize: 1, gapSize: 0.5, transparent: true, opacity: 0.5 });
      const vl = new THREE.Line(vg, dm); vl.computeLineDistances(); group.add(vl);
      addTextSprite(group, `H:${Math.abs(worldPos.y - s.y).toFixed(2)}`, new THREE.Vector3(worldPos.x + 2, (s.y + worldPos.y) / 2, worldPos.z), 0x4488ff);
    }
  }

  // Spline preview
  if (tool === 'spline' && points.length >= 1) {
    const allPts = [...points, worldPos];
    if (allPts.length >= 2) {
      if (allPts.length <= 2) {
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(
          allPts.map(p => new THREE.Vector3(p.x, p.y, p.z))
        ), mat));
      } else {
        const curvePoints = allPts.map(p => new THREE.Vector3(p.x, p.y, p.z));
        const curve = new THREE.CatmullRomCurve3(curvePoints, false, 'catmullrom', 0.5);
        const splinePts = curve.getPoints(Math.max(allPts.length * 12, 48));
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(splinePts), mat));
      }
      const dotGeo = new THREE.SphereGeometry(0.4, 6, 6);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.8 });
      for (const pt of allPts) {
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(pt.x, pt.y, pt.z);
        group.add(dot);
      }
      addTextSprite(group, `${allPts.length} pts`, new THREE.Vector3(worldPos.x + 3, worldPos.y + 2, worldPos.z), 0x00ccff);
    }
  }

  // Measure-distance preview
  if (tool === 'measure-distance' && points.length >= 1) {
    const s = points[0];
    const dashMat = new THREE.LineDashedMaterial({ color: 0xffcc00, dashSize: 1.5, gapSize: 0.8, transparent: true, opacity: 0.8 });
    const measureLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(s.x, s.y, s.z), new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z),
    ]), dashMat);
    measureLine.computeLineDistances();
    group.add(measureLine);
    const dist = Math.sqrt((worldPos.x - s.x) ** 2 + (worldPos.y - s.y) ** 2 + (worldPos.z - s.z) ** 2);
    addTextSprite(group, dist.toFixed(2), new THREE.Vector3((s.x + worldPos.x) / 2, Math.max(s.y, worldPos.y) + 2, (s.z + worldPos.z) / 2), 0xffcc00);
  }

  if (tool === 'wall' && points.length >= 1) {
    const base = points[points.length - 1];
    const dx = worldPos.x - base.x;
    const dz = worldPos.z - base.z;
    const wallThickness = 3;
    const wallHeight = 30;
    const wallLength = Math.sqrt(dx * dx + dz * dz);

    if (wallLength > 0.5) {
      let geoW: number, geoD: number, posX: number, posZ: number;
      if (Math.abs(dx) > Math.abs(dz)) {
        geoW = Math.abs(dx); geoD = wallThickness;
        posX = Math.min(base.x, worldPos.x) + geoW / 2;
        posZ = base.z;
      } else {
        geoW = wallThickness; geoD = Math.abs(dz);
        posX = base.x;
        posZ = Math.min(base.z, worldPos.z) + geoD / 2;
      }
      const geo = new THREE.BoxGeometry(geoW, wallHeight, geoD);
      addGhostWithEdges(geo, new THREE.Vector3(posX, base.y + wallHeight / 2, posZ));
      addTextSprite(group, `L:${wallLength.toFixed(1)}`, new THREE.Vector3(
        (base.x + worldPos.x) / 2, base.y + wallHeight + 3, (base.z + worldPos.z) / 2
      ), 0x00ccff);
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(base.x, base.y + 0.1, base.z),
      new THREE.Vector3(worldPos.x, base.y + 0.1, worldPos.z),
    ]), new THREE.LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.8 })));
  }

  if (tool === 'column' && points.length >= 1) {
    const base = points[0];
    const r = Math.max(1, Math.sqrt((worldPos.x - base.x) ** 2 + (worldPos.z - base.z) ** 2));
    const h = Math.abs(worldPos.y - base.y) || 30;
    const geo = new THREE.CylinderGeometry(r, r, h, 24);
    addGhostWithEdges(geo, new THREE.Vector3(base.x, base.y + h / 2, base.z));
  }

  if (tool === 'box3d') {
    if (points.length === 1) {
      const s = points[0];
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(s.x, s.y, s.z), new THREE.Vector3(worldPos.x, s.y, s.z),
        new THREE.Vector3(worldPos.x, s.y, worldPos.z), new THREE.Vector3(s.x, s.y, worldPos.z),
        new THREE.Vector3(s.x, s.y, s.z),
      ]), mat));
      // Fill the base rectangle
      const w = Math.abs(worldPos.x - s.x), d = Math.abs(worldPos.z - s.z);
      if (w > 0.1 && d > 0.1) {
        const fillGeo = new THREE.PlaneGeometry(w, d);
        fillGeo.rotateX(-Math.PI / 2);
        const fillMesh = new THREE.Mesh(fillGeo, new THREE.MeshBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.06, side: THREE.DoubleSide }));
        fillMesh.position.set(Math.min(s.x, worldPos.x) + w / 2, s.y + 0.02, Math.min(s.z, worldPos.z) + d / 2);
        group.add(fillMesh);
      }
    } else if (points.length === 2) {
      const p1 = points[0], p2 = points[1];
      const w = Math.abs(p2.x - p1.x) || 10, d = Math.abs(p2.z - p1.z) || 10;
      const h = Math.abs(worldPos.y - Math.min(p1.y, p2.y)) || 10;
      const ox = Math.min(p1.x, p2.x), oy = Math.min(p1.y, p2.y), oz = Math.min(p1.z, p2.z);
      const geo = new THREE.BoxGeometry(w, h, d);
      addGhostWithEdges(geo, new THREE.Vector3(ox + w / 2, oy + h / 2, oz + d / 2));
    }
  }

  // ── 3D primitive previews ──
  if (tool === 'sphere' && points.length >= 1) {
    const center = points[0];
    const r = Math.sqrt((worldPos.x - center.x) ** 2 + (worldPos.y - center.y) ** 2 + (worldPos.z - center.z) ** 2) || 5;
    const geo = new THREE.SphereGeometry(r, 24, 24);
    addGhostWithEdges(geo, new THREE.Vector3(center.x, center.y, center.z));
    addTextSprite(group, `R:${r.toFixed(2)}`, new THREE.Vector3(center.x, center.y + r + 2, center.z), 0x00ccff);
  }

  if (tool === 'cone' && points.length >= 1) {
    const base = points[0];
    const r = Math.sqrt((worldPos.x - base.x) ** 2 + (worldPos.z - base.z) ** 2) || 5;
    const h = Math.abs(worldPos.y - base.y) || 15;
    const geo = new THREE.CylinderGeometry(0, r, h, 24);
    addGhostWithEdges(geo, new THREE.Vector3(base.x, base.y + h / 2, base.z));
    addTextSprite(group, `R:${r.toFixed(1)} H:${h.toFixed(1)}`, new THREE.Vector3(base.x, base.y + h + 2, base.z), 0x00ccff);
  }

  if (tool === 'cylinder' && points.length >= 1) {
    const base = points[0];
    const r = Math.sqrt((worldPos.x - base.x) ** 2 + (worldPos.z - base.z) ** 2) || 5;
    const h = Math.abs(worldPos.y - base.y) || 20;
    const geo = new THREE.CylinderGeometry(r, r, h, 24);
    addGhostWithEdges(geo, new THREE.Vector3(base.x, base.y + h / 2, base.z));
    addTextSprite(group, `R:${r.toFixed(1)} H:${h.toFixed(1)}`, new THREE.Vector3(base.x, base.y + h + 2, base.z), 0x00ccff);
  }

  if (tool === 'torus' && points.length >= 1) {
    const center = points[0];
    const majorR = Math.sqrt((worldPos.x - center.x) ** 2 + (worldPos.z - center.z) ** 2) || 10;
    const minorR = majorR * 0.25;
    const geo = new THREE.TorusGeometry(majorR, minorR, 16, 32);
    const mesh = new THREE.Mesh(geo, ghostMat);
    mesh.position.set(center.x, center.y, center.z);
    mesh.rotation.x = Math.PI / 2;
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 15), edgeMat));
    group.add(mesh);
    addTextSprite(group, `R:${majorR.toFixed(1)}`, new THREE.Vector3(center.x, center.y + minorR + 2, center.z), 0x00ccff);
  }

  if (tool === 'pyramid' && points.length >= 1) {
    const base = points[0];
    const size = Math.sqrt((worldPos.x - base.x) ** 2 + (worldPos.z - base.z) ** 2) * 2 || 10;
    const h = Math.abs(worldPos.y - base.y) || 15;
    const geo = new THREE.CylinderGeometry(0, size / 2, h, 4);
    addGhostWithEdges(geo, new THREE.Vector3(base.x, base.y + h / 2, base.z));
    addTextSprite(group, `S:${size.toFixed(1)} H:${h.toFixed(1)}`, new THREE.Vector3(base.x, base.y + h + 2, base.z), 0x00ccff);
  }

  if (tool === 'stairs' && points.length >= 1) {
    const base = points[0];
    const w = Math.abs(worldPos.x - base.x) || 12;
    const stepCount = 10, stepH = 1.7, stepD = 2.8;
    for (let i = 0; i < Math.min(stepCount, 5); i++) {
      const geo = new THREE.BoxGeometry(w, stepH, stepD);
      const mesh = new THREE.Mesh(geo, ghostMat);
      mesh.position.set(base.x + w / 2, base.y + stepH * (i + 0.5), base.z + stepD * (i + 0.5));
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 15), edgeMat));
      group.add(mesh);
    }
    addTextSprite(group, `W:${w.toFixed(1)} ${stepCount} steps`, new THREE.Vector3(base.x + w / 2, base.y + stepCount * stepH + 2, base.z), 0x00ccff);
  }

  if ((tool === 'window' || tool === 'door') && points.length >= 1) {
    const base = points[0];
    const w = Math.abs(worldPos.x - base.x) || (tool === 'window' ? 12 : 10);
    const h = Math.abs(worldPos.y - base.y) || (tool === 'window' ? 15 : 24);
    const geo = new THREE.BoxGeometry(w, h, 1);
    addGhostWithEdges(geo, new THREE.Vector3(base.x + w / 2, base.y + h / 2, base.z + 0.5));
  }

  if (tool === 'slab' && points.length >= 1) {
    const base = points[0];
    const w = Math.abs(worldPos.x - base.x) || 30, d = Math.abs(worldPos.z - base.z) || 30;
    const geo = new THREE.BoxGeometry(w, 2, d);
    addGhostWithEdges(geo, new THREE.Vector3(Math.min(base.x, worldPos.x) + w / 2, base.y + 1, Math.min(base.z, worldPos.z) + d / 2));
  }

  // Rectangle/circle previews with fill
  if (tool === 'rectangle' && points.length >= 1) {
    const s = points[0];
    const w = Math.abs(worldPos.x - s.x), d = Math.abs(worldPos.z - s.z);
    // Outline
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(s.x, s.y, s.z), new THREE.Vector3(worldPos.x, s.y, s.z),
      new THREE.Vector3(worldPos.x, s.y, worldPos.z), new THREE.Vector3(s.x, s.y, worldPos.z),
      new THREE.Vector3(s.x, s.y, s.z),
    ]), mat));
    // Fill
    if (w > 0.1 && d > 0.1) {
      const fillGeo = new THREE.PlaneGeometry(w, d);
      fillGeo.rotateX(-Math.PI / 2);
      const fill = new THREE.Mesh(fillGeo, new THREE.MeshBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.06, side: THREE.DoubleSide }));
      fill.position.set(Math.min(s.x, worldPos.x) + w / 2, s.y + 0.02, Math.min(s.z, worldPos.z) + d / 2);
      group.add(fill);
    }
    addTextSprite(group, `${w.toFixed(1)} × ${d.toFixed(1)}`, new THREE.Vector3((s.x + worldPos.x) / 2, s.y + 2, (s.z + worldPos.z) / 2), 0x00ccff);
  }

  if (tool === 'circle' && points.length >= 1) {
    const c = points[0];
    const r = Math.sqrt((worldPos.x - c.x) ** 2 + (worldPos.z - c.z) ** 2);
    const circlePts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      circlePts.push(new THREE.Vector3(c.x + r * Math.cos(a), c.y + 0.05, c.z + r * Math.sin(a)));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(circlePts), mat));
    // Radius line
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(c.x, c.y + 0.05, c.z), new THREE.Vector3(worldPos.x, c.y + 0.05, worldPos.z),
    ]), new THREE.LineBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.4 })));
    addTextSprite(group, `R:${r.toFixed(2)}`, new THREE.Vector3(c.x, c.y + 2, c.z + r + 1), 0x00ccff);
  }
}

function buildPreview(group: THREE.Group, tool: string, points: Point2D[], worldPos: { x: number; z: number }) {
  const mat = new THREE.LineBasicMaterial({ color: 0x00ccff, opacity: 0.7, transparent: true });
  const p = { x: worldPos.x, y: worldPos.z };

  if (tool === 'line' && points.length === 1) {
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(points[0].x, 0.05, points[0].y), new THREE.Vector3(p.x, 0.05, p.y),
    ]), mat));
  } else if (tool === 'rectangle' && points.length === 1) {
    const o = points[0];
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(o.x, 0.05, o.y), new THREE.Vector3(p.x, 0.05, o.y),
      new THREE.Vector3(p.x, 0.05, p.y), new THREE.Vector3(o.x, 0.05, p.y), new THREE.Vector3(o.x, 0.05, o.y),
    ]), mat));
  } else if (tool === 'circle' && points.length === 1) {
    const c = points[0];
    const r = Math.sqrt((p.x - c.x) ** 2 + (p.y - c.y) ** 2);
    const curve = new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 2, false, 0);
    group.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(curve.getPoints(64).map(pt => new THREE.Vector3(pt.x + c.x, 0.05, pt.y + c.y))), mat));
  } else if (tool === 'polyline' && points.length > 0) {
    const pts3d = points.map(pt => new THREE.Vector3(pt.x, 0.05, pt.y));
    pts3d.push(new THREE.Vector3(p.x, 0.05, p.y));
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts3d), mat));
  } else if (tool === 'polygon' && points.length === 1) {
    const c = points[0];
    const r = Math.sqrt((p.x - c.x) ** 2 + (p.y - c.y) ** 2);
    const pts3d: THREE.Vector3[] = [];
    for (let i = 0; i <= 6; i++) pts3d.push(new THREE.Vector3(c.x + r * Math.cos((i * 2 * Math.PI) / 6), 0.05, c.y + r * Math.sin((i * 2 * Math.PI) / 6)));
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts3d), mat));
  } else if (tool === 'ellipse' && points.length === 1) {
    const c = points[0];
    const rx = Math.abs(p.x - c.x) || 0.1, ry = Math.abs(p.y - c.y) || 0.1;
    const curve = new THREE.EllipseCurve(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
    group.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(curve.getPoints(64).map(pt => new THREE.Vector3(pt.x + c.x, 0.05, pt.y + c.y))), mat));
  } else if (tool === 'arc') {
    if (points.length === 1) {
      // Show radius line from center to cursor
      const c = points[0];
      const r = Math.sqrt((p.x - c.x) ** 2 + (p.y - c.y) ** 2);
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(c.x, 0.05, c.y), new THREE.Vector3(p.x, 0.05, p.y),
      ]), mat));
      // Show full circle preview
      const circlePts: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        circlePts.push(new THREE.Vector3(c.x + r * Math.cos(a), 0.05, c.y + r * Math.sin(a)));
      }
      const dashMat = new THREE.LineDashedMaterial({ color: 0x00ccff, dashSize: 1, gapSize: 0.5, transparent: true, opacity: 0.3 });
      const circLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(circlePts), dashMat);
      circLine.computeLineDistances();
      group.add(circLine);
    } else if (points.length === 2) {
      // Show arc from start angle to cursor angle
      const c = points[0];
      const startPt = points[1];
      const r = Math.sqrt((startPt.x - c.x) ** 2 + (startPt.y - c.y) ** 2);
      const startAngle = Math.atan2(startPt.y - c.y, startPt.x - c.x);
      const endAngle = Math.atan2(p.y - c.y, p.x - c.x);
      const arcPts: THREE.Vector3[] = [];
      let sweep = endAngle - startAngle;
      if (sweep < 0) sweep += Math.PI * 2;
      const steps = Math.max(16, Math.ceil(Math.abs(sweep) / (Math.PI / 32)));
      for (let i = 0; i <= steps; i++) {
        const a = startAngle + (i / steps) * sweep;
        arcPts.push(new THREE.Vector3(c.x + r * Math.cos(a), 0.05, c.y + r * Math.sin(a)));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), mat));
      // Show radius lines
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(c.x, 0.05, c.y), new THREE.Vector3(c.x + r * Math.cos(startAngle), 0.05, c.y + r * Math.sin(startAngle)),
      ]), new THREE.LineBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.3 })));
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(c.x, 0.05, c.y), new THREE.Vector3(p.x, 0.05, p.y),
      ]), new THREE.LineBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.3 })));
    }
  }
}

function addTextSprite(group: THREE.Group, text: string, position: THREE.Vector3, color: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 32);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthTest: false }));
  sprite.position.copy(position);
  sprite.scale.set(5, 1.2, 1);
  sprite.renderOrder = 998;
  group.add(sprite);
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child: any) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
      else child.material.dispose();
    }
  });
}
