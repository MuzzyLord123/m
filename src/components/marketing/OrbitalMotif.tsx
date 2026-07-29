import { LineDraw, DrawPath, DrawPoint, DrawLabel } from "@/components/motion/LineDraw";

/**
 * The natural-graphics motif: orbital linework (Checkpoint 1, option A).
 *
 * Everything here derives from what the site already owns — the globe, the
 * studio coordinates, the drafting grid. Strokes are currentColor so each
 * placement inherits its context (ink at low opacity for structure, ember for
 * the route); every piece reveals with Line Draw and reads as an instrument
 * diagram, not decoration.
 *
 * All SVGs carry an explicit viewBox and are sized by their container, so they
 * reserve layout space and introduce zero CLS.
 */

/** Orbit rings + route arc that frame the hero globe. Sits behind the canvas. */
export function OrbitHeroRings({ className }: { className?: string }) {
  return (
    <LineDraw viewBox="0 0 560 560" className={className}>
      {/* Two orbital ellipses around the sphere's box. */}
      <g style={{ transformOrigin: "280px 280px", transform: "rotate(-14deg)" }}>
        <DrawPath
          d="M 30 280 A 250 96 0 1 1 530 280 A 250 96 0 1 1 30 280"
          stroke="hsl(var(--foreground))"
          opacity={0.16}
          duration={1.6}
        />
      </g>
      <g style={{ transformOrigin: "280px 280px", transform: "rotate(9deg)" }}>
        <DrawPath
          d="M 60 280 A 220 70 0 1 1 500 280 A 220 70 0 1 1 60 280"
          stroke="hsl(var(--foreground))"
          opacity={0.1}
          at={0.15}
          duration={1.6}
        />
      </g>
      {/* The route: one ember arc across the upper orbit. */}
      <DrawPath
        d="M 96 208 Q 280 92 474 190"
        stroke="hsl(var(--primary))"
        strokeWidth={1.2}
        opacity={0.85}
        at={0.55}
        duration={1.0}
      />
      <DrawPoint cx={96} cy={208} r={3} fill="hsl(var(--primary))" ring at={0.5} />
      <DrawPoint cx={474} cy={190} r={2.5} fill="hsl(var(--foreground))" at={1.5} />
      <DrawPoint cx={430} cy={392} r={2.5} fill="hsl(var(--foreground))" at={1.7} />
    </LineDraw>
  );
}

/** Wide, flat orbit arc used as a section divider. Height ~90px at full width. */
export function OrbitDivider({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <LineDraw viewBox="0 0 1200 90" className={className}>
      <DrawPath
        d="M 0 82 Q 600 -46 1200 82"
        stroke="hsl(var(--foreground))"
        opacity={0.14}
        duration={1.4}
      />
      <DrawPath
        d="M 340 44 Q 600 -6 860 44"
        stroke="hsl(var(--primary))"
        strokeWidth={1.2}
        opacity={0.8}
        at={0.4}
        duration={0.9}
      />
      <DrawPoint cx={340} cy={44} r={2.5} fill="hsl(var(--primary))" at={0.35} />
      <DrawPoint cx={860} cy={44} r={2.5} fill="hsl(var(--primary))" ring at={1.2} />
      {label && (
        <DrawLabel x={600} y={78} anchor="middle" fill="hsl(var(--muted-foreground))" at={1.4}>
          {label}
        </DrawLabel>
      )}
    </LineDraw>
  );
}

/** Coordinate plot for the reach section: three plotted points, one route. */
export function CoordPlot({ className }: { className?: string }) {
  return (
    <LineDraw viewBox="0 0 520 320" className={className}>
      {/* graticule fragments */}
      <DrawPath d="M 20 250 Q 260 190 500 250" stroke="hsl(var(--foreground))" opacity={0.12} dashed />
      <DrawPath d="M 40 130 Q 260 80 480 130" stroke="hsl(var(--foreground))" opacity={0.12} dashed at={0.2} />
      {/* routes from the studio point */}
      <DrawPath
        d="M 150 210 Q 250 120 372 96"
        stroke="hsl(var(--primary))"
        strokeWidth={1.2}
        opacity={0.8}
        at={0.5}
        duration={0.9}
      />
      <DrawPath
        d="M 150 210 Q 300 240 452 208"
        stroke="hsl(var(--foreground))"
        opacity={0.3}
        at={0.75}
        duration={0.9}
      />
      <DrawPoint cx={150} cy={210} r={3.5} fill="hsl(var(--primary))" ring at={0.45} />
      <DrawPoint cx={372} cy={96} r={2.5} fill="hsl(var(--foreground))" at={1.4} />
      <DrawPoint cx={452} cy={208} r={2.5} fill="hsl(var(--foreground))" at={1.65} />
      <DrawLabel x={128} y={244} fill="hsl(var(--muted-foreground))" at={1.1}>
        52.13° N, 3.78° W
      </DrawLabel>
    </LineDraw>
  );
}
