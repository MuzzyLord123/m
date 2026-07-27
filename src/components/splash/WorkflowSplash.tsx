import {
  Zap, GitBranch, Play, Clock, RefreshCw, Filter,
  Globe, Mail, ArrowRightLeft, CheckCircle,
} from "lucide-react";
import { OrbitSplash, OrbitTool } from "./OrbitSplash";

interface WorkflowSplashProps {
  onComplete: () => void;
}

const TOOLS: OrbitTool[] = [
  { icon: Play, label: "Trigger", hex: "#22c55e" },
  { icon: GitBranch, label: "Branch", hex: "#f59e0b" },
  { icon: Zap, label: "Action", hex: "#3b82f6" },
  { icon: Clock, label: "Delay", hex: "#8b5cf6" },
  { icon: RefreshCw, label: "Loop", hex: "#06b6d4" },
  { icon: Filter, label: "Filter", hex: "#ec4899" },
  { icon: Globe, label: "HTTP", hex: "#0ea5e9" },
  { icon: Mail, label: "Email", hex: "#10b981" },
  { icon: ArrowRightLeft, label: "Map", hex: "#f43f5e" },
  { icon: CheckCircle, label: "End", hex: "#a855f7" },
];

export function WorkflowSplash({ onComplete }: WorkflowSplashProps) {
  return (
    <OrbitSplash
      onComplete={onComplete}
      config={{
        title: "WORKFLOW ENGINE",
        subtitle: "AUTOMATE · CONNECT · ORCHESTRATE",
        tools: TOOLS,
        accentPrimary: "#3b82f6",
        accentSecondary: "#8b5cf6",
        duration: 3200,
      }}
    />
  );
}
