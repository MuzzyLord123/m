import {
  Home, Sparkles, Globe, Paintbrush, Package, Layout, Target,
  Workflow, FileText, Search, Megaphone, Share2, Calendar,
  HardDrive, Mail, MessageSquare, Radio, PenTool, Boxes,
  FileSpreadsheet, Users, CreditCard, Ticket, Settings,
} from "lucide-react";
import { OrbitSplash, OrbitTool } from "./OrbitSplash";

interface MainSplashProps {
  onComplete: () => void;
}

const TOOLS: OrbitTool[] = [
  { icon: Home, label: "Dashboard", hex: "#a0a0a0" },
  { icon: Sparkles, label: "AI", hex: "#c0c0c0" },
  { icon: Globe, label: "Website", hex: "#909090" },
  { icon: Paintbrush, label: "Designer", hex: "#b0b0b0" },
  { icon: Package, label: "Products", hex: "#8a8a8a" },
  { icon: Layout, label: "Apps", hex: "#9a9a9a" },
  { icon: Target, label: "CRM", hex: "#aaaaaa" },
  { icon: Workflow, label: "Workflows", hex: "#bababa" },
  { icon: FileText, label: "Content", hex: "#959595" },
  { icon: Search, label: "SEO", hex: "#a5a5a5" },
  { icon: Megaphone, label: "Ads", hex: "#b5b5b5" },
  { icon: Share2, label: "Social", hex: "#8f8f8f" },
  { icon: Calendar, label: "Calendar", hex: "#c5c5c5" },
  { icon: HardDrive, label: "Storage", hex: "#858585" },
  { icon: Mail, label: "Mail", hex: "#9f9f9f" },
  { icon: MessageSquare, label: "Messages", hex: "#afafaf" },
  { icon: Radio, label: "Comms", hex: "#bfbfbf" },
  { icon: PenTool, label: "CAD", hex: "#939393" },
  { icon: Boxes, label: "Inventory", hex: "#a3a3a3" },
  { icon: FileSpreadsheet, label: "Office", hex: "#b3b3b3" },
  { icon: Users, label: "Team", hex: "#8d8d8d" },
  { icon: CreditCard, label: "Billing", hex: "#9d9d9d" },
  { icon: Ticket, label: "Support", hex: "#adadad" },
  { icon: Settings, label: "Settings", hex: "#c3c3c3" },
];

export function MainSplash({ onComplete }: MainSplashProps) {
  return (
    <OrbitSplash
      onComplete={onComplete}
      config={{
        title: "QUOORO",
        subtitle: "BUSINESS SUITE",
        tools: TOOLS,
        accentPrimary: "#b0b0b0",
        accentSecondary: "#e0e0e0",
        duration: 3400,
      }}
    />
  );
}
