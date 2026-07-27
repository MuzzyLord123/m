import { useRef, Suspense, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Sphere, Html } from "@react-three/drei";
import * as THREE from "three";
import { TextureLoader } from "three";
import earthTexture from "@/assets/earth-nasa.webp";
import { useInViewport } from "@/hooks/useInViewport";

// Client locations with flags
const clientLocations = [
  { name: "UK", lat: 51.5, lng: -0.1, flag: "🇬🇧", color: "#f59e0b" },
  { name: "USA", lat: 40.7, lng: -74, flag: "🇺🇸", color: "#3b82f6" },
  { name: "Germany", lat: 52.5, lng: 13.4, flag: "🇩🇪", color: "#22c55e" },
  { name: "Australia", lat: -33.9, lng: 151.2, flag: "🇦🇺", color: "#a855f7" },
  { name: "Canada", lat: 43.7, lng: -79.4, flag: "🇨🇦", color: "#ef4444" },
  { name: "UAE", lat: 25.2, lng: 55.3, flag: "🇦🇪", color: "#14b8a6" },
];

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
    texture.anisotropy = 16;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
  }, [texture]);

  useFrame(() => {
    if (groupRef.current && !isPaused) {
      groupRef.current.rotation.y += 0.0015;
    }
  });

  // Generate connection lines
  const connections = useMemo(() => {
    const conns: { start: THREE.Vector3; end: THREE.Vector3; color: string }[] = [];
    const ukPos = latLngToVector3(clientLocations[0].lat, clientLocations[0].lng, 2.05);
    
    for (let i = 1; i < clientLocations.length; i++) {
      const endPos = latLngToVector3(clientLocations[i].lat, clientLocations[i].lng, 2.05);
      conns.push({ start: ukPos, end: endPos, color: clientLocations[i].color });
    }
    
    return conns;
  }, []);

  return (
    <group>
      {/* Rotating group with Earth, markers, and connections */}
      <group ref={groupRef}>
        {/* Main Earth sphere – high poly count for smooth edges */}
        <Sphere args={[2, 128, 128]}>
          <meshPhongMaterial
            map={texture}
            specularMap={texture}
            specular={new THREE.Color(0x999999)}
            shininess={15}
            bumpMap={texture}
            bumpScale={0.015}
            emissiveMap={texture}
            emissive={new THREE.Color(0x222222)}
            emissiveIntensity={0.3}
          />
        </Sphere>

        {/* Location Markers - rotate with Earth */}
        {clientLocations.map((location, index) => {
          const position = latLngToVector3(location.lat, location.lng, 2.08);
          return (
            <LocationMarker
              key={location.name}
              position={[position.x, position.y, position.z]}
              color={location.color}
              flag={location.flag}
              name={location.name}
              delay={index * 0.2}
              hideLabels={hideLabels}
            />
          );
        })}

        {/* Connection Lines - rotate with Earth */}
        {connections.map((conn, index) => (
          <AnimatedArc key={index} start={conn.start} end={conn.end} color={conn.color} delay={index * 0.5} />
        ))}
      </group>

      {/* Atmosphere inner glow */}
      <Sphere args={[2.03, 64, 64]}>
        <meshBasicMaterial
          color="#4a9eff"
          transparent
          opacity={0.06}
        />
      </Sphere>

      {/* Atmosphere outer glow – Fresnel-like rim */}
      <Sphere args={[2.15, 64, 64]}>
        <meshBasicMaterial
          color="#6db3f8"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Thin haze layer */}
      <Sphere args={[2.25, 32, 32]}>
        <meshBasicMaterial
          color="#87ceeb"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </Sphere>
    </group>
  );
}

function AnimatedArc({ start, end, color, delay }: { start: THREE.Vector3; end: THREE.Vector3; color: string; delay: number }) {
  const lineRef = useRef<THREE.Line>(null);
  
  const lineObject = useMemo(() => {
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const distance = start.distanceTo(end);
    midPoint.normalize().multiplyScalar(2 + distance * 0.3);
    
    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 });
    
    return new THREE.Line(geometry, material);
  }, [start, end, color]);

  useFrame((state) => {
    if (lineRef.current && lineRef.current.material) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      if (material && material.opacity !== undefined) {
        const pulse = Math.sin(state.clock.elapsedTime * 2 - delay) * 0.5 + 0.5;
        material.opacity = 0.3 + pulse * 0.5;
      }
    }
  });

  return <primitive object={lineObject} ref={lineRef} />;
}

function LocationMarker({ 
  position, 
  color, 
  flag, 
  name,
  delay,
  hideLabels = false
}: { 
  position: [number, number, number]; 
  color: string; 
  flag: string;
  name: string;
  delay: number;
  hideLabels?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

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
  });

  return (
    <group position={position}>
      {/* Glowing marker */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Outer ring pulse */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.1, 0.14, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Flag label - hidden when mobile menu is open */}
      {!hideLabels && (
        <Html
          position={[0, 0.25, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl drop-shadow-lg">{flag}</span>
            <span className="text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded whitespace-nowrap">
              {name}
            </span>
          </div>
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
      {/* Key light – bright sunlight */}
      <directionalLight position={[5, 3, 5]} intensity={2.8} color="#ffffff" />
      {/* Secondary light – fills shadows */}
      <directionalLight position={[-4, 2, -3]} intensity={1.2} color="#aaccff" />
      {/* Fill light */}
      <directionalLight position={[-3, -1, -4]} intensity={0.6} color="#e0e0e0" />
      {/* Ambient – strong overall fill so dark side isn't black */}
      <ambientLight intensity={1.1} />
      {/* Rim light for depth */}
      <pointLight position={[0, 0, 8]} intensity={0.5} color="#ffffff" />
      
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

export function Globe3D() {
  const isMenuOpen = useMobileMenuOpen();
  const [containerRef, isInViewport] = useInViewport<HTMLDivElement>();
  
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
          gl={{ 
            antialias: true, 
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.6,
          }}
          dpr={[1, 2]}
        >
          <Scene hideLabels={isMenuOpen} isPaused={isPaused} />
        </Canvas>
      </Suspense>
    </div>
  );
}
