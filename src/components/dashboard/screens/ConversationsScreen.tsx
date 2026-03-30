import { useState, useCallback, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Send, Bot, User, Loader2, Plus, MessageSquare, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { GlassCard } from "../GlassCard";
import {
  getCurrentChatSessionId,
  setCurrentChatSessionId,
  createChatSession,
  getChatSessions,
  getChatSessionMessages,
  getChatUserId,
  postChatMessageStream,
  renameChatSession,
  deleteChatSession,
  type ChatSession,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type MessageItem = { id?: string; role: "user" | "assistant"; text: string; time?: string };

function formatTime(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString();
  } catch {
    return "";
  }
}

/** Brain returns newest-first; UI is chronological. Treat common LLM role aliases as assistant for icons/layout. */
function normalizeMessageRole(role: string): "user" | "assistant" {
  const r = String(role ?? "").trim().toLowerCase();
  if (r === "assistant" || r === "model" || r === "ai") return "assistant";
  return "user";
}

export const ConversationsScreen = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionIdState] = useState<string | null>(() => getCurrentChatSessionId());
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ChatSession | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameBusy, setRenameBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const setCurrentSessionId = useCallback((id: string | null) => {
    setCurrentSessionIdState(id);
    setCurrentChatSessionId(id);
  }, []);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const list = await getChatSessions();
      setSessions(list);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const loadMessages = useCallback(async (sessionId: string) => {
    setLoadingMessages(true);
    try {
      const list = await getChatSessionMessages(sessionId);
      const chronological = [...list].reverse();
      setMessages(
        chronological.map((m) => {
          const t = formatTime(m.timestamp ?? null);
          return {
            id: m.message_id || undefined,
            role: normalizeMessageRole(m.role),
            text: m.content ?? "",
            time: t || undefined,
          };
        })
      );
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId, loadMessages]);

  useEffect(() => {
    if (renameTarget) setRenameDraft(renameTarget.title);
  }, [renameTarget]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  const handleNewChat = useCallback(async () => {
    try {
      const { session_id } = await createChatSession();
      if (session_id) {
        setCurrentSessionId(session_id);
        setMessages([]);
        await loadSessions();
      } else {
        toast({ title: "Could not create session", variant: "destructive" });
      }
    } catch (e) {
      toast({
        title: "Failed to create session",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [loadSessions, setCurrentSessionId, toast]);

  const handleSelectSession = useCallback(
    (sessionId: string) => {
      setCurrentSessionId(sessionId);
    },
    [setCurrentSessionId]
  );

  const confirmRename = useCallback(async () => {
    if (!renameTarget) return;
    const next = renameDraft.trim();
    if (!next) {
      toast({ title: "Enter a name", variant: "destructive" });
      return;
    }
    setRenameBusy(true);
    try {
      await renameChatSession(renameTarget.session_id, next);
      setRenameTarget(null);
      await loadSessions();
      toast({ title: "Chat renamed" });
    } catch (e) {
      toast({
        title: "Could not rename",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setRenameBusy(false);
    }
  }, [renameTarget, renameDraft, loadSessions, toast]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await deleteChatSession(deleteTarget.session_id);
      if (currentSessionId === deleteTarget.session_id) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      setDeleteTarget(null);
      await loadSessions();
      toast({ title: "Chat deleted" });
    } catch (e) {
      toast({
        title: "Could not delete",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDeleteBusy(false);
    }
  }, [deleteTarget, currentSessionId, loadSessions, setCurrentSessionId, toast]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      try {
        const { session_id } = await createChatSession();
        if (!session_id) {
          toast({ title: "Could not create session", variant: "destructive" });
          return;
        }
        sessionId = session_id;
        setCurrentSessionId(sessionId);
        setMessages([]);
        await loadSessions();
      } catch (e) {
        toast({
          title: "Failed to create session",
          description: e instanceof Error ? e.message : "Unknown error",
          variant: "destructive",
        });
        return;
      }
    }

    setInput("");
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { role: "user", text, time: now }]);
    setLoading(true);
    setStreamingContent("");

    try {
      let fullText = "";
      await postChatMessageStream(
        sessionId,
        text,
        (chunk) => {
          fullText += chunk;
          setStreamingContent(fullText);
        },
        () => {
          setMessages((prev) => [...prev, { role: "assistant", text: fullText || "(no response)", time: now }]);
          setStreamingContent(null);
          setLoading(false);
          loadSessions();
          queryClient.invalidateQueries({ queryKey: ["memory", getChatUserId()] });
        }
      );
    } catch (e) {
      toast({
        title: "Request failed",
        description: e instanceof Error ? e.message : "Could not reach assistant",
        variant: "destructive",
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, I couldn't process that. Please try again.", time: now },
      ]);
      setStreamingContent(null);
      setLoading(false);
    }
  }, [input, loading, currentSessionId, loadSessions, setCurrentSessionId, toast, queryClient]);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <GlassCard className="w-64 flex-shrink-0 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-white/5">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {loadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No chats yet</p>
          ) : (
            <ul className="space-y-1">
              {sessions.map((s) => (
                <li
                  key={s.session_id}
                  className={`rounded-xl transition-colors ${
                    currentSessionId === s.session_id ? "bg-primary/10 ring-1 ring-primary/20" : ""
                  }`}
                >
                  <div className="flex items-stretch min-h-[2.75rem]">
                    <button
                      type="button"
                      onClick={() => handleSelectSession(s.session_id)}
                      className={`flex-1 min-w-0 flex items-center gap-2 text-left px-3 py-2.5 rounded-l-xl transition-colors ${
                        currentSessionId === s.session_id ? "text-primary" : "hover:bg-white/5 text-muted-foreground"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate text-sm flex-1">{s.title}</span>
                      <span className="text-[10px] flex-shrink-0 tabular-nums">{formatTime(s.updated_at)}</span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="Chat actions"
                          className="px-2 rounded-r-xl text-muted-foreground hover:bg-white/10 hover:text-foreground data-[state=open]:bg-white/10 shrink-0"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => {
                            setRenameTarget(s);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(s)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </GlassCard>

      <GlassCard className="flex-1 flex flex-col overflow-hidden">
        {loadingMessages ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {messages.length === 0 && !streamingContent && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {currentSessionId ? "No messages in this chat." : "Start a new chat or select one from the sidebar."}
                </p>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id ?? `${msg.role}-${i}-${msg.text.slice(0, 48)}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-md rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary/10 border border-primary/20 text-foreground"
                        : "bg-secondary border border-white/5 text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                    {msg.time && <p className="text-[10px] text-muted-foreground mt-2">{msg.time}</p>}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-xl bg-secondary border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
              {streamingContent !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="max-w-md rounded-2xl px-4 py-3 bg-secondary border border-white/5 text-foreground">
                    <p className="text-sm whitespace-pre-line">
                      {streamingContent || (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
                        </span>
                      )}
                    </p>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-white/5">
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-secondary border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/30 transition-colors text-foreground placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={loading}
                  className="px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:shadow-accent-sm transition-all font-medium text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </GlassCard>

      <Dialog open={renameTarget !== null} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
          </DialogHeader>
          <Input
            value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            placeholder="Chat name"
            onKeyDown={(e) => e.key === "Enter" && !renameBusy && confirmRename()}
            className="mt-2"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setRenameTarget(null)} disabled={renameBusy}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmRename} disabled={renameBusy}>
              {renameBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && !deleteBusy && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &quot;{deleteTarget?.title}&quot; and all of its messages. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteBusy}
            >
              {deleteBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
