import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "../GlassCard";
import { MessageSquare, Mail, Calendar, CheckCircle, XCircle, ExternalLink, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const iconByName: Record<string, typeof MessageSquare> = {
  Slack: MessageSquare,
  WhatsApp: MessageSquare,
  "Email (Gmail)": Mail,
  "Google Calendar": Calendar,
};

export const IntegrationsScreen = () => {
  const { data: integrations = [], isLoading, error } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => api.getIntegrations(),
  });

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
        Failed to load integrations. Is the gateway running?
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Connect external services to Neptune AI (from gateway)</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((intg, i) => {
          const Icon = iconByName[intg.name] ?? MessageSquare;
          return (
            <GlassCard key={intg.id} hover delay={i * 0.05} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      intg.connected ? "bg-primary/10 border border-primary/20" : "bg-white/5 border border-white/10"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${intg.connected ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{intg.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {intg.connected ? (
                        <CheckCircle className="w-3 h-3 text-success" />
                      ) : (
                        <XCircle className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span className="text-[10px] text-muted-foreground">{intg.lastSync}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{intg.description}</p>
              <button
                className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  intg.connected ? "text-destructive hover:bg-destructive/10" : "text-primary hover:bg-primary/10"
                }`}
              >
                {intg.connected ? "Disconnect" : "Connect"}
                <ExternalLink className="w-3 h-3" />
              </button>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
