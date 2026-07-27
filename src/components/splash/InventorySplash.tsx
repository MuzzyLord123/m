import {
  Package, Warehouse, BarChart3, Truck, ClipboardList, Layers,
  BoxSelect, ScanBarcode, ArrowUpDown, MapPin, Tags, ShoppingCart,
} from "lucide-react";
import { OrbitSplash, OrbitTool } from "./OrbitSplash";

interface InventorySplashProps {
  onComplete: () => void;
}

const TOOLS: OrbitTool[] = [
  { icon: Package, label: "Products", hex: "#f59e0b" },
  { icon: Warehouse, label: "Warehouse", hex: "#3b82f6" },
  { icon: BarChart3, label: "Analytics", hex: "#8b5cf6" },
  { icon: Truck, label: "Shipping", hex: "#22c55e" },
  { icon: ClipboardList, label: "Orders", hex: "#06b6d4" },
  { icon: Layers, label: "Stock", hex: "#ec4899" },
  { icon: BoxSelect, label: "Locations", hex: "#0ea5e9" },
  { icon: ScanBarcode, label: "Barcodes", hex: "#14b8a6" },
  { icon: ArrowUpDown, label: "Transfers", hex: "#a855f7" },
  { icon: MapPin, label: "Tracking", hex: "#f43f5e" },
  { icon: Tags, label: "Categories", hex: "#10b981" },
  { icon: ShoppingCart, label: "Purchasing", hex: "#eab308" },
];

export function InventorySplash({ onComplete }: InventorySplashProps) {
  return (
    <OrbitSplash
      onComplete={onComplete}
      config={{
        title: "INVENTORY",
        subtitle: "STOCK · TRACK · OPTIMIZE",
        tools: TOOLS,
        accentPrimary: "#f59e0b",
        accentSecondary: "#22c55e",
        duration: 3200,
      }}
    />
  );
}
