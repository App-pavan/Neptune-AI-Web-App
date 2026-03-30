import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "../GlassCard";
import { Plus, Clock, Zap, ToggleLeft, ToggleRight, Edit3, Trash2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useState } from "react";

export const AutomationsScreen = () => {
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const { data: automations = [], isLoading, error } = useQuery({
    queryKey: ["automations"],
    queryFn: () => api.getAutomations(),
  });

  const enabledMap = automations.reduce<Record<string, boolean>>((acc, a) => {
    acc[a.id] = toggled[a.id] ?? a.enabled;
    return acc;
  }, {});
  const activeCount = Object.values(enabledMap).filter(Boolean).length;

  const toggle = (id: string) => setToggled((prev) => ({ ...prev, [id]: !enabledMap[id] }));

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
        Failed to load automations. Is the gateway running?
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Automations</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{activeCount} active rules</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm hover:bg-primary/20 transition-colors">
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>
      <div className="space-y-3">
        {automations.map((auto, i) => {
          const enabled = enabledMap[auto.id];
          return (
            <GlassCard key={auto.id} hover delay={i * 0.05} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      enabled ? "bg-primary/10 border border-primary/20" : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <Zap className={`w-5 h-5 ${enabled ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{auto.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-3 h-3" /> {auto.trigger}
                      </span>
                      <span className="text-[10px] text-muted-foreground">→ {auto.action}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => toggle(auto.id)} className="ml-2">
                    {enabled ? (
                      <ToggleRight className="w-8 h-8 text-primary" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
