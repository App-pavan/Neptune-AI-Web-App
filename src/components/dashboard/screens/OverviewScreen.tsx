import { Activity, Globe, Database, Zap, Cpu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { StatCard } from "../StatCard";
import { GlassCard } from "../GlassCard";
import { useAppConfig } from "@/contexts/AppConfigContext";
import { api } from "@/lib/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

export const OverviewScreen = () => {
  const { status, latency, mode } = useAppConfig();

  const { data: overview, isLoading } = useQuery({
    queryKey: ["overview", mode],
    queryFn: () => api.getOverview(mode),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const stats = overview?.stats;
  const timeseries = overview?.timeseries ?? [];
  const activity = overview?.activity ?? [];

  return (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Status" value={stats?.status ?? status} icon={Activity} delay={0} />
      <StatCard label="Mode" value={stats?.mode ?? mode} icon={Globe} delay={0.05} />
      <StatCard
        label="Memory Bank"
        value={isLoading ? "…" : stats?.memory_label ?? "0 entries"}
        icon={Database}
        delay={0.1}
      />
      <StatCard label="Latency" value={`${latency}ms`} icon={Zap} delay={0.15} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <GlassCard className="lg:col-span-2 p-6" delay={0.2}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-foreground">LLM Inference Load</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats?.active_provider ?? "No provider"} · {stats?.active_model ?? "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs text-primary font-mono">
              {stats?.inference_load_percent ?? 0}%
            </span>
          </div>
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeseries}>
              <defs>
                <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(240 6% 8%)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
                itemStyle={{ color: "#00F0FF" }}
              />
              <Area type="monotone" dataKey="tokens" stroke="#00F0FF" fillOpacity={1} fill="url(#colorTokens)" strokeWidth={2} name="Tokens" />
              <Area type="monotone" dataKey="requests" stroke="#22D3EE" fillOpacity={1} fill="url(#colorRequests)" strokeWidth={1.5} strokeDasharray="4 4" name="Requests" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard className="p-6 flex flex-col" delay={0.25}>
        <h3 className="text-base font-semibold text-foreground mb-5">Activity Log</h3>
        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity yet. Start a conversation to see events here.</p>
          ) : (
            activity.map((log, i) => (
              <div key={i} className="flex gap-3 group">
                <div className="w-0.5 bg-white/5 rounded-full group-hover:bg-primary/50 transition-colors flex-shrink-0 mt-1" style={{ minHeight: 32 }} />
                <div>
                  <p className="text-sm text-foreground/90">{log.event}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                    {log.time} · {log.type}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <p className="mt-4 text-[10px] text-muted-foreground border-t border-white/5 pt-4">
          {stats?.memories_indexed ?? 0} of {stats?.memory_count ?? 0} memories vector-indexed in Atlas
        </p>
      </GlassCard>
    </div>
  </div>
  );
};
