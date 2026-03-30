import { useState, useCallback } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { GlassCard } from "../GlassCard";
import {
  getLLMProviders,
  createLLMProvider,
  updateLLMProvider,
  deleteLLMProvider,
  activateLLMProvider,
  type LLMProvider,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Bot, Plus, Loader2, Check, Pencil, Trash2, Zap } from "lucide-react";

const PROVIDER_OPTIONS: { value: LLMProvider["provider"]; label: string }[] = [
  { value: "mock", label: "Mock" },
  { value: "ollama", label: "Ollama" },
  { value: "openai", label: "OpenAI" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "gemini", label: "Google Gemini" },
];

const emptyForm = {
  name: "",
  provider: "mock" as LLMProvider["provider"],
  api_url: "",
  api_key: "",
  model: "",
  temperature: 0.7,
  max_tokens: 2048,
  set_active: false,
};

export const LLMProvidersScreen = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["llm-providers"],
    queryFn: getLLMProviders,
  });

  const createMutation = useMutation({
    mutationFn: (body: typeof emptyForm) =>
      createLLMProvider({
        name: body.name,
        provider: body.provider,
        api_url: body.api_url || undefined,
        api_key: body.api_key || undefined,
        model: body.model || undefined,
        config: { temperature: body.temperature, max_tokens: body.max_tokens },
        set_active: body.set_active,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["llm-providers"] });
      setShowForm(false);
      setForm(emptyForm);
      toast({
        title: "Provider created",
        description: variables.set_active ? "Provider created and set as active." : "Provider created.",
      });
    },
    onError: (e: Error) => {
      toast({ title: "Create failed", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<LLMProvider> }) => updateLLMProvider(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["llm-providers"] });
      setEditingId(null);
      setForm(emptyForm);
      toast({ title: "Provider updated" });
    },
    onError: (e: Error) => {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLLMProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["llm-providers"] });
      toast({ title: "Provider deleted", variant: "destructive" });
    },
    onError: (e: Error) => {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    },
  });

  const activateMutation = useMutation({
    mutationFn: activateLLMProvider,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["llm-providers"] });
      toast({ title: "Provider activated", description: `${data.name} is now the active LLM.` });
    },
    onError: (e: Error) => {
      toast({ title: "Activate failed", description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (editingId) {
      const body: Partial<LLMProvider> = {
        name: form.name,
        provider: form.provider,
        api_url: form.api_url || undefined,
        model: form.model || undefined,
        config: { temperature: form.temperature, max_tokens: form.max_tokens },
      };
      if (form.api_key && form.api_key !== "***") body.api_key = form.api_key;
      updateMutation.mutate({ id: editingId, body });
    } else {
      createMutation.mutate(form);
    }
  }, [form, editingId, createMutation, updateMutation, toast]);

  const startEdit = useCallback((p: LLMProvider) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      provider: p.provider,
      api_url: p.api_url || "",
      api_key: "", // Never send stored key to client; leave blank to keep existing
      model: p.model || "",
      temperature: p.config?.temperature ?? 0.7,
      max_tokens: p.config?.max_tokens ?? 2048,
      set_active: false,
    });
    setShowForm(true);
  }, []);

  const cancelForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">LLM Providers</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Add, edit, or switch LLM providers. Only one can be active at a time. Chat uses the active provider.
        </p>
      </div>

      {showForm ? (
        <GlassCard className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">{editingId ? "Edit provider" : "Add provider"}</h3>
          <div className="grid gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. OpenAI GPT-4"
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/30 text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Provider type</label>
              <select
                value={form.provider}
                onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value as LLMProvider["provider"] }))}
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/30 text-foreground"
              >
                {PROVIDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">API URL</label>
              <input
                value={form.api_url}
                onChange={(e) => setForm((f) => ({ ...f, api_url: e.target.value }))}
                placeholder="OpenAI/OpenRouter v1 URL, Ollama host, or Gemini https://generativelanguage.googleapis.com/v1"
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/30 text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">API Key (stored securely, never shown)</label>
              <input
                type="password"
                value={form.api_key}
                onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                placeholder={editingId ? "Leave blank to keep existing" : "Required for OpenAI, OpenRouter, Gemini"}
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/30 text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Model</label>
              <input
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                placeholder="e.g. gpt-4o-mini, llama2, gemini-1.5-flash"
                className="w-full bg-secondary border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/30 text-foreground"
              />
            </div>
            <div className="flex gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Temperature</label>
                <input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={form.temperature}
                  onChange={(e) => setForm((f) => ({ ...f, temperature: Number(e.target.value) || 0.7 }))}
                  className="w-24 bg-secondary border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Max tokens</label>
                <input
                  type="number"
                  min={1}
                  max={128000}
                  value={form.max_tokens}
                  onChange={(e) => setForm((f) => ({ ...f, max_tokens: Number(e.target.value) || 2048 }))}
                  className="w-24 bg-secondary border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground"
                />
              </div>
            </div>
            {!editingId && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.set_active}
                  onChange={(e) => setForm((f) => ({ ...f, set_active: e.target.checked }))}
                  className="rounded border-white/20"
                />
                Set as active after create
              </label>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Save" : "Create"}
            </button>
            <button
              onClick={cancelForm}
              className="px-4 py-2 rounded-xl bg-secondary border border-white/10 text-sm text-foreground hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </GlassCard>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add provider
        </button>
      )}

      <div className="space-y-3">
        {providers.length === 0 ? (
          <GlassCard className="p-8 text-center text-sm text-muted-foreground">
            No providers yet. Add one to get started.
          </GlassCard>
        ) : (
          providers.map((p) => (
            <GlassCard key={p.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground truncate">{p.name}</span>
                    {p.is_active && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[10px] font-medium">
                        <Zap className="w-3 h-3" />
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {p.provider} · {p.model || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!p.is_active && (
                  <button
                    onClick={() => activateMutation.mutate(p.id)}
                    disabled={activateMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 disabled:opacity-50"
                  >
                    {activateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    Activate
                  </button>
                )}
                <button
                  onClick={() => startEdit(p)}
                  className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${p.name}"?`)) deleteMutation.mutate(p.id);
                  }}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
};
