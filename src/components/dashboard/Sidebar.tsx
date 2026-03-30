import { motion } from "framer-motion";
import {
  LayoutDashboard, MessageSquare, ShieldCheck, Database,
  Smartphone, Workflow, Plug, Settings, Zap, ChevronLeft, ChevronRight, Bot
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { useState } from "react";
import { useAppConfig } from "@/contexts/AppConfigContext";

const navItems = [
  { id: "overview", icon: LayoutDashboard, label: "Overview" },
  { id: "conversations", icon: MessageSquare, label: "Conversations" },
  { id: "llm-providers", icon: Bot, label: "LLM Providers" },
  { id: "agents", icon: ShieldCheck, label: "Agents" },
  { id: "memory", icon: Database, label: "Memory" },
  { id: "devices", icon: Smartphone, label: "Devices" },
  { id: "automations", icon: Workflow, label: "Automations" },
  { id: "integrations", icon: Plug, label: "Integrations" },
  { id: "settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { status, latency } = useAppConfig();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen border-r border-white/5 flex flex-col p-4 gap-6 bg-sidebar sticky top-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 min-h-[48px]">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-accent-sm flex-shrink-0">
          <Zap className="text-primary-foreground fill-primary-foreground w-5 h-5" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-bold tracking-[0.2em] text-foreground text-sm whitespace-nowrap"
          >
            NEPTUNE AI
          </motion.span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
              activeTab === item.id
                ? "bg-primary/10 text-primary"
                : "hover:bg-white/5 text-muted-foreground"
            }`}
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 ${
              activeTab === item.id ? "text-primary" : "group-hover:text-foreground"
            }`} />
            {!collapsed && (
              <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
            )}
            {activeTab === item.id && (
              <motion.div
                layoutId="activeNav"
                className="absolute right-2 w-1 h-4 bg-primary rounded-full shadow-accent-sm"
              />
            )}
          </button>
        ))}
      </nav>

      {/* Live status from gateway */}
      {!collapsed && (
        <GlassCard className="p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
            System
          </p>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Status</span>
                <span className="font-mono capitalize">{status}</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: status === "online" ? 100 : status === "degraded" ? 50 : 0 }}
                  transition={{ duration: 0.5 }}
                  className={`h-full rounded-full shadow-accent-sm ${
                    status === "online" ? "bg-primary" : status === "degraded" ? "bg-warning" : "bg-muted-foreground"
                  }`}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Latency</span>
                <span className="font-mono">{latency}ms</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: Math.min(100, (latency / 200) * 100) }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-cyan-400 rounded-full shadow-accent-sm"
                />
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-2 rounded-xl hover:bg-white/5 text-muted-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
};
