import { LucideIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  delay?: number;
}

export const StatCard = ({ label, value, icon: Icon, trend, delay = 0 }: StatCardProps) => (
  <GlassCard hover delay={delay} className="p-5 flex flex-col gap-1">
    <div className="flex items-center justify-between text-muted-foreground mb-2">
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Live</span>
    </div>
    <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums font-mono">
      {value}
    </div>
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      {trend && <span className="text-[10px] text-success font-medium">{trend}</span>}
    </div>
  </GlassCard>
);
