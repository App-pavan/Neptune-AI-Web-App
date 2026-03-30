import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "../GlassCard";
import { Smartphone, Laptop, Watch, Wifi, WifiOff, Radar, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const iconByType: Record<string, typeof Smartphone> = {
  mobile: Smartphone,
  laptop: Laptop,
  web: Laptop,
  tablet: Laptop,
  wearable: Watch,
};

function formatLastSeen(iso: string) {
  try {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 60000;
    if (diff < 2) return "Active now";
    if (diff < 60) return `${Math.round(diff)}m ago`;
    if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

export const DevicesScreen = () => {
  const { data: devices = [], isLoading, error } = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.getDevices(),
  });

  const onlineCount = devices.filter((d) => {
    const mins = (Date.now() - new Date(d.lastSeen).getTime()) / 60000;
    return mins < 5;
  }).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Failed to load devices. Is the gateway running?
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Connected Devices</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {onlineCount} of {devices.length} online
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map((device, i) => {
          const Icon = iconByType[device.type] ?? Smartphone;
          const mins = (Date.now() - new Date(device.lastSeen).getTime()) / 60000;
          const status = mins < 5 ? "online" : "offline";
          return (
            <GlassCard key={device.id} hover delay={i * 0.05} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      status === "online" ? "bg-primary/10 border border-primary/20" : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${status === "online" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{device.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {status === "online" ? (
                        <Wifi className="w-3 h-3 text-success" />
                      ) : (
                        <WifiOff className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span className="text-[10px] text-muted-foreground">{formatLastSeen(device.lastSeen)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Radar className="w-3.5 h-3.5" />
                Send Test Ping
              </button>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
