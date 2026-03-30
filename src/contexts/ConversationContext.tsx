import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ConversationMessage = {
  role: "user" | "ai";
  text: string;
  time: string;
};

interface ConversationContextValue {
  messages: ConversationMessage[];
  addMessage: (msg: ConversationMessage) => void;
  addPair: (userText: string, aiText: string) => void;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);

  const addMessage = useCallback((msg: ConversationMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const addPair = useCallback((userText: string, aiText: string) => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      { role: "user", text: userText, time: now },
      { role: "ai", text: aiText, time: now },
    ]);
  }, []);

  const value = useMemo(
    () => ({ messages, addMessage, addPair }),
    [messages, addMessage, addPair]
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error("useConversation must be used within ConversationProvider");
  return ctx;
}
