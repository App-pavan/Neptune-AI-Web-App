import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'idle' | 'busy';
  label?: string;
}

const statusStyles = {
  online: 'bg-success shadow-[0_0_8px_hsl(142_76%_46%/0.5)]',
  offline: 'bg-muted-foreground',
  idle: 'bg-warning shadow-[0_0_8px_hsl(38_92%_50%/0.5)]',
  busy: 'bg-destructive shadow-[0_0_8px_hsl(0_72%_51%/0.5)]',
};

export const StatusBadge = ({ status, label }: StatusBadgeProps) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-white/10">
    <div className={cn("w-2 h-2 rounded-full animate-pulse", statusStyles[status])} />
    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
      {label || status}
    </span>
  </div>
);
