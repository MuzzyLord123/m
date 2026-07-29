import { useRef, Suspense, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Sphere, Html } from "@react-three/drei";
import * as THREE from "three";
import { TextureLoader } from "three";
import earthTexture from "@/assets/earth-nasa.webp";
import { useInViewport } from "@/hooks/useInViewport";

/**
 * ONE marker, on Wales.
 *
 * This previously plotted six "client locations" - UK, USA, Germany, Australia,
 * Canada, UAE - each with a flag emoji, joined by animated arcs. Two problems:
 * emoji are banned in the UI, and the arcs asserted a global client base that
 * does not exist.
 *
 * A rotating globe implying global reach is also a SaaS cliche. For a studio in
 * Wales it is far more interesting inverted: a single ember marker on Wales.
 * Specificity of place reads as confidence, and it happens to be true.
 */
const STUDIO = { name: "Wales", lat: 52.13, lng: -3.78 };

/** Matches --primary in dark mode (#E8613C). The globe reads on the dark hero. */
const EMBER = "#E8613C";


// Hook to listen for mobile menu state
function useMobileMenuOpen() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleMenuOpen = () => setIsMenuOpen(true);
    const handleMenuClose = () => setIsMenuOpen(false);

    window.addEventListener('mobileMenuOpened', handleMenuOpen);
    window.addEventListener('mobileMenuClosed', handleMenuClose);

    return () => {
      window.removeEventListener('mobileMenuOpened', handleMenuOpen);
      window.removeEventListener('mobileMenuClosed', handleMenuClose);
    };
  }, []);

  return isMenuOpen;
}

// Convert lat/lng to 3D position
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
}

function EarthWithMarkers({ hideLabels = false, isPaused = false }: { hideLabels?: boolean; isPaused?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useLoader(TextureLoader, earthTexture);

  // Configure texture for maximum quality and vibrancy
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4; // 16-tap aniso was pure per-frame cost at this size
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
  }, [texture]);

  useFrame((_, delta) => {
    if (groupRef.current && !isPaused) {
      // Delta-based, so the spin speed is identical at any frame rate.
      // (0.0015/frame at 60fps = 0.09 rad/s.)
      groupRef.current.rotation.y += Math.min(delta, 0.1) * 0.09;
    }
  });

  return (
    <group>
      {/* Rotating group with Earth, markers, and connections */}
      <group ref={groupRef}>
        {/* Main Earth sphere – high poly count for smooth edges */}
        {/* 96 segments, not 128 — indistinguishable at rendered size, ~45%
            fewer vertices. Part of the mobile-fluidity budget. */}
        <Sphere args={[2, 96, 96]}>
          <meshPhongMaterial
            map={texture}
            /* Multiplies the NASA texture with a warm tint. The raw imagery is a
               vivid photographic blue that fights the ember palette; graded, the
               oceans settle into deep slate-teal and the globe sits in the page
               instead of shouting at it. */
            color={new THREE.Color(0xffe4d2)}
            specularMap={texture}
            specular={new THREE.Color(0x8a7a70)}
            shininess={14}
            bumpMap={texture}
            bumpScale={0.015}
            emissiveMap={texture}
            emissive={new THREE.Color(0x2a1a14)}
            emissiveIntensity={0.3}
          />
        </Sphere>

        {/* The single studio marker, rotating with the Earth. */}
        {(() => {
          const p = latLngToVector3(STUDIO.lat, STUDIO.lng, 2.08);
          return (
            <LocationMarker
              position={[p.x, p.y, p.z]}
              color={EMBER}
              name={STUDIO.name}
              delay={0}
              hideLabels={hideLabels}
            />
          );
        })()}
      </group>

      {/* One tight ember rim, replacing three blue shells (#4a9eff / #6db3f8 /
          #87ceeb). That blue was the LLM house palette rendered in 3D. */}
      <Sphere args={[2.14, 48, 48]}>
        <meshBasicMaterial
          color={EMBER}
          transparent
          opacity={0.09}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
}

function LocationMarker({
  position,
  color,
  name,
  delay,
  hideLabels = false
}: {
  position: [number, number, number];
  color: string;
  name: string;
  delay: number;
  hideLabels?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const worldPos = useRef(new THREE.Vector3());
  const camDir = useRef(new THREE.Vector3());

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.3;
      meshRef.current.scale.setScalar(scale);
    }
    if (ringRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3 + delay) * 0.2;
      ringRef.current.scale.setScalar(scale);
      ringRef.current.lookAt(0, 0, 0);
    }

    // drei's <Html> has no depth, so the label would otherwise stay visible
    // while Wales is round the back of the planet. Fade it on the facing angle
    // instead — written straight to the DOM node so this costs no re-renders.
    // Both vectors are preallocated: the previous version cloned two Vector3s
    // per frame, and that steady allocation churn shows up as GC pauses
    // exactly where frames are scarcest (throttled mobile CPUs).
    if (groupRef.current) {
      groupRef.current.getWorldPosition(worldPos.current).normalize();
      camDir.current.copy(state.camera.position).normalize();
      const facing = worldPos.current.dot(camDir.current);
      const opacity = THREE.MathUtils.clamp((facing - 0.1) / 0.35, 0, 1);
      if (labelRef.current) labelRef.current.style.opacity = String(opacity);
      if (meshRef.current) {
        (meshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + opacity * 0.75;
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Glowing marker */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color={color} transparent />
      </mesh>
      
      {/* Outer ring pulse */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.1, 0.14, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Label. The flag emoji is gone - emoji are banned in the UI, and this
          one asserted a client presence that does not exist. */}
      {!hideLabels && (
        <Html position={[0, 0.24, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <span
            ref={labelRef}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/80 whitespace-nowrap"
          >
            {name}
          </span>
        </Html>
      )}
    </group>
  );
}

function Scene({ hideLabels = false, isPaused = false }: { hideLabels?: boolean; isPaused?: boolean }) {
  const [isDragging, setIsDragging] = useState(false);
  
  // Combine pause conditions: out of viewport OR user is dragging
  const shouldPauseRotation = isPaused || isDragging;
  
  return (
    <>
      {/* Key light – warm sun */}
      <directionalLight position={[5, 3, 5]} intensity={2.6} color="#fff3e6" />
      {/* Secondary fill. Was #aaccff — a blue fill light, which is most of why
          the oceans read as brand blue rather than as water. */}
      <directionalLight position={[-4, 2, -3]} intensity={1.1} color="#e8c4a8" />
      {/* Low fill */}
      <directionalLight position={[-3, -1, -4]} intensity={0.55} color="#d8cec6" />
      {/* Ambient – keeps the terminator readable */}
      <ambientLight intensity={1.05} />
      {/* Ember rim, matching the bloom behind the sphere */}
      <pointLight position={[0, 0, 8]} intensity={0.55} color="#ffb894" />
      
      <EarthWithMarkers hideLabels={hideLabels} isPaused={shouldPauseRotation} />
      
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI - Math.PI / 4}
        rotateSpeed={0.5}
        autoRotate={!shouldPauseRotation}
        autoRotateSpeed={0.5}
        onStart={() => setIsDragging(true)}
        onEnd={() => setIsDragging(false)}
      />
    </>
  );
}

function GlobeLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

/* Hysteresis for the frameloop gate. With the default 50px margin the render
   loop cut out while the globe's last slice was still on screen, so a scrolling
   visitor could watch the spin freeze at the hero boundary. 320px means the
   freeze always happens well off-screen. Hoisted so the observer is created
   once, not per render. */
const FRAMELOOP_VIEWPORT: IntersectionObserverInit = { threshold: 0, rootMargin: "320px" };

export function Globe3D() {
  const isMenuOpen = useMobileMenuOpen();
  const [containerRef, isInViewport] = useInViewport<HTMLDivElement>(FRAMELOOP_VIEWPORT);
  
  // Pause globe when not in viewport to save battery
  const isPaused = !isInViewport;
  
  return (
    <div 
      ref={containerRef}
      className="w-full h-full min-h-[300px] sm:min-h-[400px] cursor-grab active:cursor-grabbing relative globe-container globe-optimized"
    >
      <Suspense fallback={<GlobeLoader />}>
        <Canvas
          camera={{ position: [0, 0, 6], fov: 45 }}
          style={{ background: "transparent" }}
          /* antialias off + dpr cap 1.5: MSAA and a 2x render target were most
             of the per-frame pixel cost. At this canvas size the difference is
             invisible; the frame budget it frees is not (audit F1 follow-up —
             the hero scrolled at 8fps under 4x throttle with the globe live). */
          gl={{
            antialias: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.6,
          }}
          dpr={[1, 1.25]}
          /* MOTION-AUDIT F1. The default frameloop="always" keeps the three.js
             render loop running even when the globe is scrolled far off-screen —
             the old viewport "pause" only froze the rotation value while the
             renderer kept burning the whole frame budget. Measured on the
             production build at 4x CPU throttle: 4.1fps scrolling the homepage,
             55.6fps with this canvas hidden. Driving frameloop from the existing
             IntersectionObserver signal keeps the globe spinning whenever it is
             visible and stops the render loop entirely when it is not. */
          /* "demand" mode was tried here and reverted: drei's OrbitControls
             invalidates on every damping/auto-rotate change event, so demand
             degenerates into an unbounded render loop that is WORSE than
             "always" (measured: post-hero scroll fell from 58.5fps to 19.7).
             Viewport-gated always/never is the verified fast configuration. */
          frameloop={isInViewport ? "always" : "never"}
        >
          <Scene hideLabels={isMenuOpen} isPaused={isPaused} />
        </Canvas>
      </Suspense>
    </div>
  );
}
