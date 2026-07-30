import { GlassCard } from "../GlassCard";
import { Bot, Volume2, MessageCircle, MapPin, Save, Loader2, Database } from "lucide-react";
import { useState, useEffect } from "react";
import { useAppConfig } from "@/contexts/AppConfigContext";
import { useToast } from "@/hooks/use-toast";
import { getMemorySettings, updateMemorySettings, getChatUserId } from "@/lib/api";
import { Switch } from "@/components/ui/switch";

export const SettingsScreen = () => {
  const { config, updateConfig, isLoading } = useAppConfig();
  const { toast } = useToast();
  const [aiName, setAiName] = useState("Neptune");
  const [responseStyle, setResponseStyle] = useState("detailed");
  const [activeMode, setActiveMode] = useState("home");
  const [saving, setSaving] = useState(false);
  const [memoryLoading, setMemoryLoading] = useState(true);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [memoryExtraction, setMemoryExtraction] = useState(true);
  const [memoryTopK, setMemoryTopK] = useState(4);
  const [memoryMinConfidence, setMemoryMinConfidence] = useState(0.65);
  const [memoryTypes, setMemoryTypes] = useState<string[]>(["fact", "preference", "context"]);
  const [memorySaving, setMemorySaving] = useState(false);

  useEffect(() => {
    if (config) {
      setAiName(config.aiName ?? "Neptune");
      setResponseStyle(config.responseStyle ?? "detailed");
      setActiveMode(config.mode ?? "home");
    }
  }, [config]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMemoryLoading(true);
      try {
        const s = await getMemorySettings(getChatUserId());
        if (cancelled) return;
        setMemoryEnabled(s.memory_enabled);
        setMemoryExtraction(s.memory_extraction_enabled);
        setMemoryTopK(s.memory_top_k);
        setMemoryMinConfidence(
          typeof s.memory_min_confidence === "number" ? s.memory_min_confidence : 0.65
        );
        setMemoryTypes(s.memory_types_include?.length ? s.memory_types_include : ["fact", "preference", "context"]);
      } catch {
        if (!cancelled) setMemoryEnabled(true);
      } finally {
        if (!cancelled) setMemoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleMemoryType = (t: string) => {
    setMemoryTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleSaveMemory = async () => {
    setMemorySaving(true);
    try {
      await updateMemorySettings({
        user_id: getChatUserId(),
        memory_enabled: memoryEnabled,
        memory_extraction_enabled: memoryExtraction,
        memory_top_k: memoryTopK,
        memory_min_confidence: memoryMinConfidence,
        memory_types_include: memoryTypes.length ? memoryTypes : ["fact", "preference", "context"],
      });
      toast({ title: "Memory settings saved" });
    } catch (e) {
      toast({
        title: "Could not save memory settings",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setMemorySaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig({ aiName, responseStyle, mode: activeMode });
      toast({ title: "Settings saved", description: "Your preferences have been updated." });
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Could not save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !config) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Configure your AI assistant (saved via gateway)</p>
      </div>

      <GlassCard className="p-5" delay={0}>
        <div className="flex items-center gap-3 mb-4">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI Identity</h3>
        </div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Assistant Name</label>
        <input
          value={aiName}
          onChange={(e) => setAiName(e.target.value)}
          className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/30 transition-colors text-foreground"
        />
      </GlassCard>

      <GlassCard className="p-5" delay={0.05}>
        <div className="flex items-center gap-3 mb-4">
          <Volume2 className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Voice Settings</h3>
        </div>
        <div className="flex gap-2">
          {["Male", "Female", "Neutral"].map((v) => (
            <button key={v} className="px-4 py-2 rounded-xl text-xs bg-secondary border border-white/10 text-muted-foreground hover:text-foreground hover:border-primary/20 transition-colors">
              {v}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5" delay={0.1}>
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Response Style</h3>
        </div>
        <div className="flex gap-2">
          {["short", "detailed"].map((s) => (
            <button
              key={s}
              onClick={() => setResponseStyle(s)}
              className={`px-4 py-2 rounded-xl text-xs capitalize transition-colors ${
                responseStyle === s ? "bg-primary/10 border border-primary/20 text-primary" : "bg-secondary border border-white/10 text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-5" delay={0.12}>
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Memory</h3>
        </div>
        {memoryLoading ? (
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-foreground">Enable memory retrieval</p>
                <p className="text-[10px] text-muted-foreground">Inject relevant past facts into chat (Atlas Vector Search)</p>
              </div>
              <Switch checked={memoryEnabled} onCheckedChange={setMemoryEnabled} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-foreground">Auto-extract from chat</p>
                <p className="text-[10px] text-muted-foreground">Silently learns stable habits/preferences after each reply (nothing said in chat)</p>
              </div>
              <Switch checked={memoryExtraction} onCheckedChange={setMemoryExtraction} disabled={!memoryEnabled} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Max memories to retrieve (1–20)</label>
              <input
                type="number"
                min={1}
                max={20}
                value={memoryTopK}
                onChange={(e) => setMemoryTopK(Number(e.target.value) || 4)}
                disabled={!memoryEnabled}
                className="mt-1 w-full bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/30 text-foreground disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Min confidence to save (0.35–0.95)</label>
              <input
                type="number"
                min={0.35}
                max={0.95}
                step={0.05}
                value={memoryMinConfidence}
                onChange={(e) => setMemoryMinConfidence(Number(e.target.value) || 0.65)}
                disabled={!memoryEnabled || !memoryExtraction}
                className="mt-1 w-full bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/30 text-foreground disabled:opacity-50"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Higher = fewer, surer memories. Lower = more aggressive learning.</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Include types in retrieval</p>
              <div className="flex flex-wrap gap-2">
                {(["fact", "preference", "context"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    disabled={!memoryEnabled}
                    onClick={() => toggleMemoryType(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs capitalize transition-colors ${
                      memoryTypes.includes(t)
                        ? "bg-primary/10 border border-primary/20 text-primary"
                        : "bg-secondary border border-white/10 text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveMemory}
              disabled={memorySaving}
              className="flex items-center gap-2 px-4 py-2 bg-secondary border border-white/10 rounded-xl text-sm hover:border-primary/20 disabled:opacity-50"
            >
              {memorySaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save memory settings
            </button>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-5" delay={0.15}>
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Active Mode</h3>
        </div>
        <div className="flex gap-2">
          {["home", "work", "driving"].map((m) => (
            <button
              key={m}
              onClick={() => setActiveMode(m)}
              className={`px-4 py-2 rounded-xl text-xs capitalize transition-colors ${
                activeMode === m ? "bg-primary/10 border border-primary/20 text-primary" : "bg-secondary border border-white/10 text-muted-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </GlassCard>

      {config && (
        <GlassCard className="p-5" delay={0.2}>
          <h3 className="text-sm font-semibold text-foreground mb-2">Brain</h3>
          <p className="text-xs text-muted-foreground">Model: {config.ollama_model} · Mock LLM: {config.use_mock_llm ? "Yes" : "No"}</p>
        </GlassCard>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:shadow-accent-sm transition-all font-medium text-sm disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Changes
      </button>
    </div>
  );
};
