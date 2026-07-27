import {
  Users, Target, DollarSign, TrendingUp, Handshake, BarChart3,
  Phone, Mail, Calendar, FileText, Briefcase, LineChart,
} from "lucide-react";
import { OrbitSplash, OrbitTool } from "./OrbitSplash";

interface CRMSplashProps {
  onComplete: () => void;
}

const TOOLS: OrbitTool[] = [
  { icon: Target, label: "Pipeline", hex: "#f59e0b" },
  { icon: Users, label: "Contacts", hex: "#3b82f6" },
  { icon: DollarSign, label: "Deals", hex: "#22c55e" },
  { icon: TrendingUp, label: "Forecast", hex: "#8b5cf6" },
  { icon: Handshake, label: "Proposals", hex: "#06b6d4" },
  { icon: BarChart3, label: "Analytics", hex: "#ec4899" },
  { icon: Phone, label: "Calls", hex: "#10b981" },
  { icon: Mail, label: "Outreach", hex: "#f43f5e" },
  { icon: Calendar, label: "Follow-ups", hex: "#0ea5e9" },
  { icon: FileText, label: "Notes", hex: "#a855f7" },
  { icon: Briefcase, label: "Accounts", hex: "#14b8a6" },
  { icon: LineChart, label: "Revenue", hex: "#eab308" },
];

export function CRMSplash({ onComplete }: CRMSplashProps) {
  return (
    <OrbitSplash
      onComplete={onComplete}
      config={{
        title: "QUOORO CRM",
        subtitle: "RELATIONSHIPS · REVENUE · GROWTH",
        tools: TOOLS,
        accentPrimary: "#f59e0b",
        accentSecondary: "#ec4899",
        duration: 3200,
      }}
    />
  );
}
