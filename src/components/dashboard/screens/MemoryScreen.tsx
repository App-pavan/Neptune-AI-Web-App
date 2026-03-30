import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { GlassCard } from "../GlassCard";
import { Search, Trash2, Edit3, Brain, User, Plus, Loader2, Heart, Tag } from "lucide-react";
import {
  createMemoryEntry,
  deleteMemoryEntry,
  getChatUserId,
  listMemoryEntries,
  updateMemoryEntry,
  type MemoryEntry,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const typeIcons: Record<string, typeof Brain> = {
  fact: Tag,
  preference: Heart,
  context: Brain,
};

function formatDate(iso: string | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

const MEM_TYPES = ["fact", "preference", "context"] as const;

export const MemoryScreen = () => {
  const userId = getChatUserId();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<{ mode: "add" | "edit"; entry?: MemoryEntry } | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [draftType, setDraftType] = useState<string>("fact");
  const [deleteTarget, setDeleteTarget] = useState<MemoryEntry | null>(null);

  const { data: memories = [], isLoading, error } = useQuery({
    queryKey: ["memory", userId],
    queryFn: () => listMemoryEntries(userId),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editor) return;
      const content = draftContent.trim();
      if (!content) throw new Error("Content required");
      if (editor.mode === "add") {
        return createMemoryEntry({ user_id: userId, content, type: draftType });
      }
      if (editor.entry) {
        return updateMemoryEntry(editor.entry.id, { user_id: userId, content, type: draftType });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["memory", userId] });
      setEditor(null);
      toast({ title: "Saved" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteMemoryEntry(id, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["memory", userId] });
      setDeleteTarget(null);
      toast({ title: "Memory deleted" });
    },
    onError: (e: Error) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const filtered = memories.filter((m) => {
    const matchFilter = activeFilter === "all" || m.type === activeFilter;
    const matchSearch = !search || m.content.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const filters = ["all", ...MEM_TYPES.filter((t) => memories.some((m) => m.type === t))];

  const openAdd = () => {
    setDraftContent("");
    setDraftType("fact");
    setEditor({ mode: "add" });
  };

  const openEdit = (m: MemoryEntry) => {
    setDraftContent(m.content);
    setDraftType(m.type || "fact");
    setEditor({ mode: "edit", entry: m });
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
        Failed to load memory. Is the gateway running?
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Memory Bank</h2>
          <span className="text-xs text-muted-foreground">({memories.length} entries)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary border border-white/10">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories..."
              className="bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground w-40"
            />
          </div>
          <Button type="button" size="sm" variant="secondary" className="gap-1" onClick={openAdd}>
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors capitalize ${
              activeFilter === f ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((mem, i) => {
          const Icon = typeIcons[mem.type] ?? User;
          const created = mem.created_at ?? mem.createdAt;
          return (
            <GlassCard key={mem.id} hover delay={i * 0.03} className="p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">{mem.content}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDate(created)} · <span className="capitalize">{mem.type}</span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  onClick={() => openEdit(mem)}
                >
                  <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                  onClick={() => setDeleteTarget(mem)}
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <Dialog open={editor !== null} onOpenChange={(o) => !o && setEditor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editor?.mode === "add" ? "Add memory" : "Edit memory"}</DialogTitle>
          </DialogHeader>
          <label className="text-xs text-muted-foreground">Type</label>
          <div className="flex gap-2 mb-3">
            {MEM_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDraftType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs capitalize ${
                  draftType === t ? "bg-primary/15 text-primary border border-primary/20" : "bg-secondary border border-white/10 text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <label className="text-xs text-muted-foreground">Content</label>
          <textarea
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            rows={4}
            className="w-full mt-1 bg-secondary border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-primary/30"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditor(null)}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete memory?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the entry from your profile and vector index.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
