import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { subDays, format, eachDayOfInterval, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface DayData {
  date: string;
  count: number;
  features: Record<string, number>;
}

export default function ActivityHeatmap({ days = 90 }: { days?: number }) {
  const { user } = useAuth();
  const [data, setData] = useState<DayData[]>([]);
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetch() {
      const since = subDays(new Date(), days).toISOString();
      const { data: logs } = await supabase
        .from("user_activity_log")
        .select("visited_at, feature_name")
        .eq("user_id", user!.id)
        .gte("visited_at", since)
        .order("visited_at", { ascending: true });

      if (!logs) return;

      // Group by date
      const map: Record<string, { count: number; features: Record<string, number> }> = {};
      for (const log of logs) {
        const dateKey = format(new Date(log.visited_at), "yyyy-MM-dd");
        if (!map[dateKey]) map[dateKey] = { count: 0, features: {} };
        map[dateKey].count++;
        map[dateKey].features[log.feature_name] = (map[dateKey].features[log.feature_name] || 0) + 1;
      }

      const interval = eachDayOfInterval({ start: subDays(new Date(), days), end: new Date() });
      const result: DayData[] = interval.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        return { date: key, count: map[key]?.count || 0, features: map[key]?.features || {} };
      });

      setData(result);
    }

    fetch();
  }, [user, days]);

  const maxCount = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data]);

  const getIntensity = (count: number) => {
    if (count === 0) return "bg-muted/30";
    const ratio = count / maxCount;
    if (ratio <= 0.25) return "bg-primary/20";
    if (ratio <= 0.5) return "bg-primary/40";
    if (ratio <= 0.75) return "bg-primary/60";
    return "bg-primary/90";
  };

  // Group into weeks (7-day columns)
  const weeks: DayData[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const totalActions = data.reduce((s, d) => s + d.count, 0);
  const activeDays = data.filter((d) => d.count > 0).length;

  if (data.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="liquid-glass-card p-4 sm:p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Your Activity</h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{totalActions} actions</span>
          <span>{activeDays} active days</span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-[3px] min-w-fit">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={cn("w-3 h-3 rounded-[2px] transition-colors cursor-pointer", getIntensity(day.count))}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  title={`${format(new Date(day.date), "d MMM")}: ${day.count} actions`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span>Less</span>
          {["bg-muted/30", "bg-primary/20", "bg-primary/40", "bg-primary/60", "bg-primary/90"].map((c, i) => (
            <div key={i} className={cn("w-2.5 h-2.5 rounded-[2px]", c)} />
          ))}
          <span>More</span>
        </div>
        {hoveredDay && hoveredDay.count > 0 && (
          <div className="text-[10px] text-muted-foreground">
            <span className="font-medium text-foreground">{format(new Date(hoveredDay.date), "d MMM")}</span>
            {" — "}
            {Object.entries(hoveredDay.features)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([f, c]) => `${c} ${f}`)
              .join(", ")}
          </div>
        )}
      </div>
    </motion.div>
  );
}
