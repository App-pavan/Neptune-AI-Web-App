import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, MessageSquare, Lightbulb, Smartphone, Clock, Loader2 } from "lucide-react";
import { useAppConfig } from "@/contexts/AppConfigContext";
import { useConversation } from "@/contexts/ConversationContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CommandBarProps {
  open: boolean;
  onClose: () => void;
  onSwitchToConversations?: () => void;
}

const suggestions = [
  { icon: MessageSquare, text: "Send message to Rahul on Slack saying I'm in traffic", category: "Communication" },
  { icon: Lightbulb, text: "Turn on living room lights", category: "Automation" },
  { icon: Clock, text: "Set reminder for 5 PM", category: "Scheduler" },
  { icon: Smartphone, text: "Ping all devices", category: "Devices" },
];

export const CommandBar = ({ open, onClose, onSwitchToConversations }: CommandBarProps) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { mode } = useAppConfig();
  const { addPair } = useConversation();
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const runQuery = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || loading) return;
      setLoading(true);
      try {
        const res = await api.postAssistantQuery(t, { device: "web", mode });
        const aiText = res.response + (res.agent ? `\n\n_${res.agent}_` : "");
        addPair(t, aiText);
        onSwitchToConversations?.();
        onClose();
        setQuery("");
      } catch (e) {
        toast({
          title: "Request failed",
          description: e instanceof Error ? e.message : "Could not reach assistant",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [loading, mode, addPair, onSwitchToConversations, onClose, toast]
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50"
          >
            <div className="glass rounded-2xl overflow-hidden shadow-accent-lg border border-white/10">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                <Search className="w-5 h-5 text-primary" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runQuery(query)}
                  placeholder="Ask Neptune anything..."
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm"
                />
                {loading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
              </div>
              <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
                {suggestions.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => runQuery(item.text)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors group text-left disabled:opacity-50"
                  >
                    <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="flex-1 text-sm text-foreground">{item.text}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{item.category}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
