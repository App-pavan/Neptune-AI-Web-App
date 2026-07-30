import { Bell, Search, Command } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { useAppConfig } from "@/contexts/AppConfigContext";

const SERVICE_BADGES: { key: keyof ReturnType<typeof useAppConfig>["servicesHealth"]; label: string }[] = [
  { key: "brain", label: "Brain" },
  { key: "gateway", label: "Gateway" },
  { key: "mongo", label: "Mongo" },
  { key: "atlas_vector", label: "Atlas" },
];

function toBadgeStatus(
  value: "online" | "offline" | "connected" | "disconnected"
): "online" | "offline" | "idle" | "busy" {
  if (value === "online" || value === "connected") return "online";
  return "offline";
}

interface TopbarProps {
  onCommandOpen: () => void;
}

export const Topbar = ({ onCommandOpen }: TopbarProps) => {
  const { mode, servicesHealth } = useAppConfig();
  return (
  <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 backdrop-blur-md sticky top-0 z-10 bg-background/80">
    <div className="flex items-center gap-6">
      {SERVICE_BADGES.map(({ key, label }) => (
        <StatusBadge
          key={key}
          status={toBadgeStatus(servicesHealth[key])}
          label={label}
        />
      ))}
      <div className="h-4 w-px bg-white/10" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="text-muted-foreground/60 font-mono text-xs">MODE:</span>
        <span className="text-primary font-semibold tracking-wide text-xs uppercase">{mode}</span>
      </div>
    </div>

    <div className="flex items-center gap-3">
      {/* Command bar trigger */}
      <button
        onClick={onCommandOpen}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary border border-white/10 hover:border-white/20 transition-colors text-muted-foreground text-xs"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Command</span>
        <kbd className="ml-2 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono">
          <Command className="w-2.5 h-2.5 inline" />K
        </kbd>
      </button>

      <button className="p-2 hover:bg-white/5 rounded-xl transition-colors relative">
        <Bell className="w-5 h-5 text-muted-foreground" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background animate-pulse-glow" />
      </button>

      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/30 to-primary/10 border border-white/10 flex items-center justify-center">
        <span className="text-xs font-bold text-primary">N</span>
      </div>
    </div>
  </header>
  );
};
