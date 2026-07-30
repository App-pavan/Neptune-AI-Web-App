/**
 * API client for the gateway (frontend → api-gateway → brain).
 * Base URL: VITE_API_GATEWAY_URL or http://localhost:7001
 */

const GATEWAY = import.meta.env.VITE_API_GATEWAY_URL ?? "http://localhost:7001";

async function fetchApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${GATEWAY}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((err as { message?: string }).message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface SystemStatus {
  status: "online" | "offline" | "degraded";
  mode: string;
  latency: number;
}

/** Combined status for core services */
export interface ServicesHealth {
  brain: "online" | "offline";
  gateway: "online" | "offline";
  mongo: "connected" | "disconnected";
  atlas_vector: "connected" | "disconnected";
}

export interface OverviewStats {
  status: "online" | "offline" | "degraded";
  mode: string;
  memory_count: number;
  memories_indexed: number;
  memory_label: string;
  active_provider: string;
  active_model: string;
  inference_load_percent: number;
}

export interface OverviewTimeseriesPoint {
  time: string;
  tokens: number;
  requests: number;
}

export interface OverviewActivity {
  time: string;
  event: string;
  type: string;
}

export interface OverviewData {
  stats: OverviewStats;
  timeseries: OverviewTimeseriesPoint[];
  activity: OverviewActivity[];
}

export interface AssistantQueryResponse {
  response: string;
  intent?: string;
  agent?: string;
}

export type AgentTriggerType = "manual" | "auto";

export interface Agent {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  tools?: string[];
  trigger_type?: AgentTriggerType;
}

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export async function listAgents(userId: string): Promise<Agent[]> {
  return fetchApi<Agent[]>(`/api/agents?user_id=${encodeURIComponent(userId)}`);
}

export async function listToolDefinitions(): Promise<ToolDefinition[]> {
  return fetchApi<ToolDefinition[]>("/api/tools");
}

export async function createAgent(body: {
  user_id: string;
  name: string;
  description?: string;
  tools?: string[];
  trigger_type?: AgentTriggerType;
  is_active?: boolean;
}): Promise<Agent> {
  return fetchApi<Agent>("/api/agents", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchAgent(
  id: string,
  body: {
    user_id: string;
    name?: string;
    description?: string;
    tools?: string[];
    trigger_type?: AgentTriggerType;
    enabled?: boolean;
  }
): Promise<Agent> {
  return fetchApi<Agent>(`/api/agents/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export interface Device {
  id: string;
  name: string;
  type: string;
  lastSeen: string;
}

export interface MemoryEntry {
  id: string;
  type: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  /** @deprecated use created_at */
  createdAt?: string;
}

export interface MemorySettings {
  user_id: string;
  memory_enabled: boolean;
  memory_extraction_enabled: boolean;
  memory_top_k: number;
  /** Min extractor confidence (0.35–0.95) before persisting a fact */
  memory_min_confidence: number;
  memory_types_include: string[];
}

export async function listMemoryEntries(userId: string, type?: string): Promise<MemoryEntry[]> {
  const u = new URL(`${GATEWAY}/api/memory`);
  u.searchParams.set("user_id", userId);
  if (type) u.searchParams.set("type", type);
  const res = await fetch(u.toString());
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export async function getMemorySettings(userId: string): Promise<MemorySettings> {
  return fetchApi<MemorySettings>(`/api/memory/settings?user_id=${encodeURIComponent(userId)}`);
}

export async function updateMemorySettings(
  body: Partial<MemorySettings> & { user_id: string }
): Promise<MemorySettings> {
  return fetchApi<MemorySettings>(`/api/memory/settings`, { method: "PUT", body: JSON.stringify(body) });
}

export async function createMemoryEntry(body: {
  user_id: string;
  content: string;
  type?: string;
}): Promise<MemoryEntry> {
  return fetchApi<MemoryEntry>(`/api/memory`, { method: "POST", body: JSON.stringify(body) });
}

export async function updateMemoryEntry(
  id: string,
  body: { user_id: string; content: string; type?: string }
): Promise<MemoryEntry> {
  return fetchApi<MemoryEntry>(`/api/memory/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) });
}

export async function deleteMemoryEntry(id: string, userId: string): Promise<void> {
  const res = await fetch(
    `${GATEWAY}/api/memory/${encodeURIComponent(id)}?user_id=${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string; detail?: string }).error ?? (err as { detail?: string }).detail ?? `HTTP ${res.status}`);
  }
}

export interface AppConfig {
  app_name: string;
  use_mock_llm: boolean;
  ollama_model: string;
  aiName?: string;
  responseStyle?: string;
  mode?: string;
}

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
}

export interface Integration {
  id: string;
  name: string;
  connected: boolean;
  description: string;
  lastSync: string;
}

/** LLM provider (api_key masked as *** in API responses) */
export interface LLMProvider {
  id: string;
  name: string;
  provider: "openai" | "ollama" | "mock" | "openrouter" | "gemini";
  api_url: string;
  api_key: string;
  model: string;
  is_active: boolean;
  config: { temperature: number; max_tokens: number };
  created_at: string | null;
  updated_at: string | null;
}

export async function getLLMProviders(): Promise<LLMProvider[]> {
  const res = await fetch(`${GATEWAY}/api/llm/providers`);
  const data = await res.json().catch(() => []);
  if (!res.ok) throw new Error((data as { detail?: string }).detail ?? "Failed to load providers");
  return Array.isArray(data) ? data : [];
}

export async function createLLMProvider(body: Partial<LLMProvider> & { name: string; provider: LLMProvider["provider"] }): Promise<LLMProvider> {
  const res = await fetch(`${GATEWAY}/api/llm/provider`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { detail?: string }).detail ?? "Failed to create provider");
  return data as LLMProvider;
}

export async function updateLLMProvider(id: string, body: Partial<LLMProvider>): Promise<LLMProvider> {
  const res = await fetch(`${GATEWAY}/api/llm/provider/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { detail?: string }).detail ?? "Failed to update provider");
  return data as LLMProvider;
}

export async function deleteLLMProvider(id: string): Promise<void> {
  const res = await fetch(`${GATEWAY}/api/llm/provider/${encodeURIComponent(id)}`, { method: "DELETE" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { detail?: string }).detail ?? "Failed to delete provider");
}

export async function activateLLMProvider(id: string): Promise<LLMProvider> {
  const res = await fetch(`${GATEWAY}/api/llm/provider/${encodeURIComponent(id)}/activate`, { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { detail?: string }).detail ?? "Failed to activate provider");
  return data as LLMProvider;
}

/** Chat session for sidebar list */
export interface ChatSession {
  session_id: string;
  title: string;
  updated_at: string | null;
}

const CHAT_SESSION_KEY = "neptune_chat_session_id";
const CHAT_CURRENT_SESSION_KEY = "neptune_current_chat_session_id";
const CHAT_USER_ID_KEY = "neptune_chat_user_id";

export function getChatSessionId(): string {
  let id = typeof localStorage !== "undefined" ? localStorage.getItem(CHAT_SESSION_KEY) : null;
  if (!id) {
    id = crypto.randomUUID();
    localStorage?.setItem(CHAT_SESSION_KEY, id);
  }
  return id;
}

/** User id for chat sessions (default "default"; can be set from auth later) */
export function getChatUserId(): string {
  if (typeof localStorage === "undefined") return "default";
  return localStorage.getItem(CHAT_USER_ID_KEY) || "default";
}

export function setChatUserId(userId: string): void {
  localStorage?.setItem(CHAT_USER_ID_KEY, userId);
}

/** Current persistent session id (from POST /chat/session). Stored in localStorage. */
export function getCurrentChatSessionId(): string | null {
  return localStorage?.getItem(CHAT_CURRENT_SESSION_KEY) ?? null;
}

export function setCurrentChatSessionId(sessionId: string | null): void {
  if (sessionId == null) localStorage?.removeItem(CHAT_CURRENT_SESSION_KEY);
  else localStorage?.setItem(CHAT_CURRENT_SESSION_KEY, sessionId);
}

export async function createChatSession(): Promise<{ session_id: string | null }> {
  const userId = getChatUserId();
  const res = await fetch(`${GATEWAY}/api/chat/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to create session");
  return data as { session_id: string | null };
}

export async function getChatSessions(): Promise<ChatSession[]> {
  const userId = getChatUserId();
  const res = await fetch(`${GATEWAY}/api/chat/sessions?user_id=${encodeURIComponent(userId)}`);
  const data = await res.json().catch(() => []);
  if (!res.ok) return [];
  const raw = Array.isArray(data) ? data : (data && typeof data === "object" && Array.isArray((data as { sessions?: unknown }).sessions) ? (data as { sessions: ChatSession[] }).sessions : []);
  return raw
    .map((s: Record<string, unknown>) => ({
      session_id: String(s?.session_id ?? ""),
      title: String(s?.title ?? "New chat"),
      updated_at: s?.updated_at != null ? String(s.updated_at) : null,
    }))
    .filter((s) => s.session_id.length > 0);
}

export async function renameChatSession(sessionId: string, title: string): Promise<void> {
  const userId = getChatUserId();
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Title is required");
  const res = await fetch(`${GATEWAY}/api/chat/session/${encodeURIComponent(sessionId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, title: trimmed }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data as { detail?: string }).detail ??
      (data as { error?: string }).error ??
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const userId = getChatUserId();
  const res = await fetch(
    `${GATEWAY}/api/chat/session/${encodeURIComponent(sessionId)}?user_id=${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data as { detail?: string }).detail ??
      (data as { error?: string }).error ??
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
}

export type ChatSessionMessage = {
  role: string;
  content: string;
  message_id?: string;
  timestamp?: string | null;
};

export async function getChatSessionMessages(sessionId: string): Promise<ChatSessionMessage[]> {
  const res = await fetch(`${GATEWAY}/api/chat/session/${encodeURIComponent(sessionId)}/messages`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  // Support both paginated response { messages, next_cursor } and legacy array
  if (Array.isArray(data)) return data as ChatSessionMessage[];
  const list = (data as { messages?: ChatSessionMessage[] }).messages;
  return Array.isArray(list) ? list : [];
}

/**
 * Stream chat response from gateway (brain). Calls onChunk for each text chunk, onDone when finished.
 */
export async function postChatMessageStream(
  sessionId: string,
  message: string,
  onChunk: (chunk: string) => void,
  onDone?: () => void
): Promise<void> {
  // #region agent log
  fetch('http://127.0.0.1:7796/ingest/e9b40b8b-88c3-4911-843b-8352d405c927',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'69f447'},body:JSON.stringify({sessionId:'69f447',location:'api.ts:postChatMessageStream:entry',message:'postChatMessageStream called',data:{gateway:GATEWAY,sessionId,msgLen:message?.length},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const res = await fetch(`${GATEWAY}/api/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message }),
  });
  if (!res.ok) {
    // #region agent log
    const errBody = await res.json().catch(() => ({ error: res.statusText }));
    fetch('http://127.0.0.1:7796/ingest/e9b40b8b-88c3-4911-843b-8352d405c927',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'69f447'},body:JSON.stringify({sessionId:'69f447',location:'api.ts:postChatMessageStream:resNotOk',message:'fetch res not ok',data:{status:res.status,errBody},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw new Error((errBody as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  const reader = res.body?.getReader();
  if (!reader) {
    // #region agent log
    fetch('http://127.0.0.1:7796/ingest/e9b40b8b-88c3-4911-843b-8352d405c927',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'69f447'},body:JSON.stringify({sessionId:'69f447',location:'api.ts:postChatMessageStream:noReader',message:'res.body has no reader',data:{},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    onDone?.();
    return;
  }
  const decoder = new TextDecoder();
  let chunkCount = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunkCount++;
      onChunk(decoder.decode(value, { stream: true }));
    }
  } finally {
    // #region agent log
    fetch('http://127.0.0.1:7796/ingest/e9b40b8b-88c3-4911-843b-8352d405c927',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'69f447'},body:JSON.stringify({sessionId:'69f447',location:'api.ts:postChatMessageStream:streamDone',message:'stream loop finished',data:{chunkCount},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    onDone?.();
  }
}

export const api = {
  getSystemStatus: (mode?: string) =>
    fetchApi<SystemStatus>(`/api/system/status${mode ? `?mode=${encodeURIComponent(mode)}` : ""}`),

  getServicesHealth: () => fetchApi<ServicesHealth>("/api/system/services"),

  getOverview: (mode?: string) =>
    fetchApi<OverviewData>(`/api/system/overview${mode ? `?mode=${encodeURIComponent(mode)}` : ""}`),

  postAssistantQuery: (text: string, context?: { device?: string; mode?: string }) =>
    fetchApi<AssistantQueryResponse>("/api/assistant/query", {
      method: "POST",
      body: JSON.stringify({ text, context }),
    }),

  getAgents: () => listAgents(getChatUserId()),
  getDevices: () => fetchApi<Device[]>("/api/devices"),
  getMemory: () => listMemoryEntries(getChatUserId()),
  getConfig: () => fetchApi<AppConfig>("/api/config"),
  updateConfig: (body: { aiName?: string; responseStyle?: string; mode?: string }) =>
    fetchApi<AppConfig>("/api/config", { method: "PATCH", body: JSON.stringify(body) }),
  getAutomations: () => fetchApi<Automation[]>("/api/automations"),
  getIntegrations: () => fetchApi<Integration[]>("/api/integrations"),
};
