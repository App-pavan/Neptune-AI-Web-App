import { Activity, Globe, Database, Zap, Cpu } from "lucide-react";
import { StatCard } from "../StatCard";
import { GlassCard } from "../GlassCard";
import { useAppConfig } from "@/contexts/AppConfigContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const SYSTEM_STATS = [
  { name: "12:00", cpu: 12, mem: 32, lat: 14 },
  { name: "12:05", cpu: 18, mem: 34, lat: 12 },
  { name: "12:10", cpu: 45, mem: 40, lat: 28 },
  { name: "12:15", cpu: 30, mem: 38, lat: 15 },
  { name: "12:20", cpu: 22, mem: 36, lat: 18 },
  { name: "12:25", cpu: 55, mem: 42, lat: 32 },
  { name: "12:30", cpu: 38, mem: 39, lat: 20 },
];

const activityLog = [
  { time: "2m ago", event: 'Message sent to Rahul via WhatsApp', type: "communication" },
  { time: "8m ago", event: 'Reminder created: "Team standup at 3 PM"', type: "scheduler" },
  { time: "14m ago", event: 'Memory Indexed: "Meeting Notes Q4"', type: "memory" },
  { time: "32m ago", event: "Automation: AC set to 22°C", type: "home" },
  { time: "1h ago", event: "Security: New device linked", type: "security" },
  { time: "2h ago", event: "System: Kernel updated to v2.4", type: "system" },
];

export const OverviewScreen = () => {
  const { status, latency, mode } = useAppConfig();
  return (
  <div className="space-y-6">
    {/* Stats Row - status & latency from gateway */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Status" value={status} icon={Activity} delay={0} />
      <StatCard label="Mode" value={mode} icon={Globe} delay={0.05} />
      <StatCard label="Memory Used" value="4.2 GB" icon={Database} delay={0.1} />
      <StatCard label="Latency" value={`${latency}ms`} icon={Zap} delay={0.15} />
    </div>

    {/* Main Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* System Graph */}
      <GlassCard className="lg:col-span-2 p-6" delay={0.2}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-foreground">Neural Processing Unit</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time inference load</p>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs text-primary font-mono">42%</span>
          </div>
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={SYSTEM_STATS}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
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
              <Area type="monotone" dataKey="cpu" stroke="#00F0FF" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={2} />
              <Area type="monotone" dataKey="mem" stroke="#22D3EE" fillOpacity={1} fill="url(#colorMem)" strokeWidth={1.5} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Activity Feed */}
      <GlassCard className="p-6 flex flex-col" delay={0.25}>
        <h3 className="text-base font-semibold text-foreground mb-5">Activity Log</h3>
        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
          {activityLog.map((log, i) => (
            <div key={i} className="flex gap-3 group">
              <div className="w-0.5 bg-white/5 rounded-full group-hover:bg-primary/50 transition-colors flex-shrink-0 mt-1" style={{ minHeight: 32 }} />
              <div>
                <p className="text-sm text-foreground/90">{log.event}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                  {log.time} · {log.type}
                </p>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-4 w-full py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors border-t border-white/5 pt-4">
          View Full Audit Trail
        </button>
      </GlassCard>
    </div>
  </div>
  );
};
