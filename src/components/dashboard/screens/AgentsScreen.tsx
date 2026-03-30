import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "../GlassCard";
import {
  MessageSquare,
  Plus,
  Loader2,
  Pencil,
} from "lucide-react";
import {
  getChatUserId,
  listAgents,
  listToolDefinitions,
  createAgent,
  patchAgent,
  type Agent,
  type AgentTriggerType,
  type ToolDefinition,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const iconByName: Record<string, typeof MessageSquare> = {
  default: MessageSquare,
};

export const AgentsScreen = () => {
  const userId = getChatUserId();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editor, setEditor] = useState<{ mode: "create" | "edit"; agent?: Agent } | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftTools, setDraftTools] = useState<string[]>([]);
  const [draftTrigger, setDraftTrigger] = useState<AgentTriggerType>("manual");

  const { data: toolsCatalog = [] } = useQuery({
    queryKey: ["tools-catalog"],
    queryFn: () => listToolDefinitions(),
  });

  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ["agents", userId],
    queryFn: () => listAgents(userId),
  });

  const openCreate = () => {
    setDraftName("");
    setDraftDescription("");
    setDraftTools([]);
    setDraftTrigger("manual");
    setEditor({ mode: "create" });
  };

  const openEdit = (a: Agent) => {
    setDraftName(a.name);
    setDraftDescription(a.description);
    setDraftTools(a.tools ?? []);
    setDraftTrigger((a.trigger_type as AgentTriggerType) ?? "manual");
    setEditor({ mode: "edit", agent: a });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const name = draftName.trim();
      if (!name) throw new Error("Name is required");
      if (draftTools.length === 0) throw new Error("Select at least one tool");
      if (editor?.mode === "create") {
        return createAgent({
          user_id: userId,
          name,
          description: draftDescription.trim(),
          tools: draftTools,
          trigger_type: draftTrigger,
          is_active: true,
        });
      }
      if (editor?.agent) {
        return patchAgent(editor.agent.id, {
          user_id: userId,
          name,
          description: draftDescription.trim(),
          tools: draftTools,
          trigger_type: draftTrigger,
        });
      }
      throw new Error("Invalid editor state");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents", userId] });
      setEditor(null);
      toast({ title: "Saved", description: "Agent updated." });
    },
    onError: (e: Error) => {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ agent, enabled }: { agent: Agent; enabled: boolean }) =>
      patchAgent(agent.id, { user_id: userId, enabled }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents", userId] });
    },
    onError: () => {
      toast({ title: "Update failed", variant: "destructive" });
    },
  });

  const toggleTool = (name: string, checked: boolean) => {
    setDraftTools((prev) => {
      if (checked) return prev.includes(name) ? prev : [...prev, name];
      return prev.filter((t) => t !== name);
    });
  };

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
        Failed to load agents. Is the gateway running?
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Agents</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define tool bundles for chat. Manual agents run when your message matches an action.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent, i) => {
          const Icon = iconByName[agent.name] ?? MessageSquare;
          return (
            <GlassCard key={agent.id} hover delay={i * 0.05} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">{agent.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                      {(agent.trigger_type ?? "manual") === "auto" ? "auto (future)" : "manual"} ·{" "}
                      {agent.enabled ? "on" : "off"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(agent)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5"
                    aria-label="Edit agent"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      agent.enabled ? "bg-primary/30" : "bg-white/10"
                    }`}
                    onClick={() =>
                      toggleMutation.mutate({ agent, enabled: !agent.enabled })
                    }
                    disabled={toggleMutation.isPending}
                    aria-label={agent.enabled ? "Disable agent" : "Enable agent"}
                  >
                    <motion.div
                      animate={{ x: agent.enabled ? 20 : 2 }}
                      className={`absolute top-0.5 w-4 h-4 rounded-full ${
                        agent.enabled ? "bg-primary shadow-accent-sm" : "bg-muted-foreground"
                      }`}
                    />
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3">{agent.description || "—"}</p>
              {(agent.tools?.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(agent.tools ?? []).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      {agents.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          No agents yet. Create one to restrict which tools the assistant may use for your account.
          If you have none, the assistant still uses the full default tool set when you ask for reminders,
          notes, or tasks.
        </p>
      )}

      <Dialog open={editor != null} onOpenChange={(o) => !o && setEditor(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editor?.mode === "create" ? "Create agent" : "Edit agent"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Name</Label>
              <Input
                id="agent-name"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="e.g. Morning focus"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-desc">Description</Label>
              <Input
                id="agent-desc"
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                placeholder="What this agent is for"
              />
            </div>
            <div className="space-y-2">
              <Label>Trigger</Label>
              <Select
                value={draftTrigger}
                onValueChange={(v) => setDraftTrigger(v as AgentTriggerType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual (chat)</SelectItem>
                  <SelectItem value="auto">Automatic (future)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tools</Label>
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 space-y-3 max-h-48 overflow-y-auto">
                {toolsCatalog.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Loading tools…</p>
                ) : (
                  toolsCatalog.map((t: ToolDefinition) => (
                    <label
                      key={t.name}
                      className="flex items-start gap-3 cursor-pointer text-sm"
                    >
                      <Checkbox
                        checked={draftTools.includes(t.name)}
                        onCheckedChange={(c) => toggleTool(t.name, c === true)}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="font-medium text-foreground">{t.name}</span>
                        <span className="block text-[11px] text-muted-foreground leading-snug">
                          {t.description}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setEditor(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
