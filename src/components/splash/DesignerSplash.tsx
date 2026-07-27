import {
  Paintbrush, Globe, Layers, Palette, Sparkles, Wand2,
  Layout, Image, Type, Grid3X3, Pencil, Eye,
} from "lucide-react";
import { OrbitSplash, OrbitTool } from "./OrbitSplash";

interface DesignerSplashProps {
  onComplete: () => void;
}

const TOOLS: OrbitTool[] = [
  { icon: Paintbrush, label: "Styles", hex: "#a855f7" },
  { icon: Globe, label: "Publish", hex: "#3b82f6" },
  { icon: Layers, label: "Sections", hex: "#06b6d4" },
  { icon: Palette, label: "Themes", hex: "#ec4899" },
  { icon: Wand2, label: "AI Magic", hex: "#8b5cf6" },
  { icon: Layout, label: "Layout", hex: "#0ea5e9" },
  { icon: Image, label: "Media", hex: "#14b8a6" },
  { icon: Type, label: "Typography", hex: "#f59e0b" },
  { icon: Grid3X3, label: "Grid", hex: "#6366f1" },
  { icon: Pencil, label: "Editor", hex: "#22c55e" },
  { icon: Eye, label: "Preview", hex: "#f43f5e" },
  { icon: Sparkles, label: "Effects", hex: "#10b981" },
];

export function DesignerSplash({ onComplete }: DesignerSplashProps) {
  return (
    <OrbitSplash
      onComplete={onComplete}
      config={{
        title: "WORKSHOP",
        subtitle: "DESIGN · BUILD · PUBLISH",
        tools: TOOLS,
        accentPrimary: "#a855f7",
        accentSecondary: "#3b82f6",
        duration: 3200,
      }}
    />
  );
}
