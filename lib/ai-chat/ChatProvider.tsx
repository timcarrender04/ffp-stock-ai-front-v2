"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";

const AGENT_NAME_MAP: Record<string, string> = {
  nova: "Nova",
  atlas: "Atlas",
  cipher: "Cipher",
  sentinel: "Sentinel",
};

export type Message = {
  id: string;
  message_type: "agent" | "user" | "system" | "trade_proposal";
  agent_id?: string;
  user_id?: string;
  content: string;
  confidence?: number;
  symbols: string[];
  mentioned_agents: string[];
  created_at: string;
  context_data?: any;
  isStreaming?: boolean; // For typewriter effect
  sender_name?: string;
  sender_avatar?: string;
  trade_proposal?: {
    proposal_id: string;
    symbol: string;
    side: "buy" | "sell";
    quantity: number;
    entry_price?: number;
    stop_loss?: number;
    take_profit?: number;
    order_type: "market" | "limit";
    reasoning: string;
    status?: "pending" | "executed" | "rejected" | "failed";
  };
};

type ChatContextType = {
  messages: Message[];
  isConnected: boolean;
  isRestApiAvailable: boolean;
  isOpen: boolean;
  unreadCount: number;
  activeSymbols: string[];
  sessionId: string | null;
  sendMessage: (content: string, mentionedAgents?: string[]) => void;
  addSymbolToWatch: (symbol: string) => void;
  removeSymbolFromWatch: (symbol: string) => void;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  markAsRead: () => void;
  markMessageComplete: (messageId: string) => void;
  clearChat: () => void;
  confirmTrade: (proposalId: string) => void;
  rejectTrade: (proposalId: string) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isRestApiAvailable, setIsRestApiAvailable] = useState(true); // Assume REST API is available
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeSymbols, setActiveSymbols] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  // Supabase client is only created on client-side to avoid hydration issues
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const top25SnapshotRef = useRef<any[]>([]);
  const connectionAttemptsRef = useRef<number>(0);
  const wsDisabledRef = useRef<boolean>(false); // Disable WebSocket after too many failures

  const userId = session?.user?.id ?? null;
  const userMetadata = (session?.user?.user_metadata ?? {}) as Record<
    string,
    string | undefined
  >;
  const {
    first_name: metadataFirstName,
    last_name: metadataLastName,
    full_name: metadataFullName,
    name: metadataName,
    avatar_url: metadataAvatarUrl,
    picture: metadataPicture,
    image: metadataImage,
  } = userMetadata;

  const userDisplayName = useMemo(() => {
    if (!session?.user) {
      return "Trader";
    }

    const composedName = [metadataFirstName, metadataLastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return (
      metadataFullName ||
      metadataName ||
      (composedName.length > 0 ? composedName : undefined) ||
      session.user.email?.split("@")[0] ||
      "Trader"
    );
  }, [
    session?.user,
    metadataFirstName,
    metadataLastName,
    metadataFullName,
    metadataName,
  ]);

  const userAvatar = useMemo(() => {
    if (!session?.user) return undefined;

    return metadataAvatarUrl || metadataPicture || metadataImage || undefined;
  }, [metadataAvatarUrl, metadataPicture, metadataImage, session?.user]);

  const syncTop25Snapshot = useCallback(async () => {
    try {
      const response = await fetch("/api/top/25?limit=25");

      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      const payload = await response.json();
      const data = Array.isArray(payload) ? payload : payload?.data || [];

      top25SnapshotRef.current = data;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "context_update",
            data: { top25: data },
          }),
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Error syncing top 25 snapshot:", error);
    }
  }, []);

  // Initialize session and connections
  useEffect(() => {
    // Only initialize on client-side to avoid hydration issues
    if (typeof window === "undefined") {
      return;
    }

    // Initialize Supabase client only on client-side
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }

    initializeChat();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    void syncTop25Snapshot();
    const interval = setInterval(() => {
      void syncTop25Snapshot();
    }, 60_000);

    return () => clearInterval(interval);
  }, [syncTop25Snapshot]);

  // Track unread when chat is closed
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      // Increment unread for new messages
      const lastMessage = messages[messages.length - 1];

      if (lastMessage.message_type === "agent") {
        setUnreadCount((prev) => prev + 1);
      }
    }
  }, [messages, isOpen]);

  const initializeChat = async () => {
    try {
      // Get or create session
      const response = await fetch("/api/ai-chat/session");

      if (response.ok) {
        const data = await response.json();

        setSessionId(data.session_id);
        setActiveSymbols(
          (data.active_symbols || []).map((symbol: string) =>
            String(symbol).toUpperCase(),
          ),
        );
      }

      // Connect WebSocket for agent messages
      connectWebSocket();

      // Supabase Realtime is disabled to prevent connection errors
      // We use the AI Chat WebSocket service for all real-time messaging
      // subscribeToRealtimeMessages(); // Disabled - not needed

      // Load recent messages
      loadRecentMessages();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Error initializing chat:", error);
    }
  };

  const connectWebSocket = () => {
    // Skip WebSocket if disabled after too many failures
    if (wsDisabledRef.current) {
      return;
    }

    // Get API URL - prefer environment variable, fallback to localhost
    // For WebSocket, we need direct connection (can't proxy WebSocket through Next.js easily)
    const apiUrl =
      process.env.NEXT_PUBLIC_AI_CHAT_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "http://localhost:8001"
        : "http://localhost:8001");

    // Convert HTTP/HTTPS to WS/WSS properly
    const wsUrl =
      apiUrl.replace(/^https:/, "wss:").replace(/^http:/, "ws:") + "/ws/chat";

    const maxSilentAttempts = 3; // Only log first 3 connection failures
    const maxAttemptsBeforeDisable = 5; // Disable WebSocket after 5 failed attempts

    // Only log connection attempts for first few tries
    if (connectionAttemptsRef.current < maxSilentAttempts) {
      // eslint-disable-next-line no-console
      console.log("🔌 Connecting to AI Chat WebSocket:", wsUrl);
    }

    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      // If WebSocket constructor throws (shouldn't happen, but handle it)
      connectionAttemptsRef.current++;
      if (connectionAttemptsRef.current <= maxSilentAttempts) {
        // eslint-disable-next-line no-console
        console.warn(
          "❌ Failed to create WebSocket connection. REST API fallback will be used.",
        );
      }
      if (connectionAttemptsRef.current >= maxAttemptsBeforeDisable) {
        wsDisabledRef.current = true;
        // eslint-disable-next-line no-console
        console.log(
          "🔇 WebSocket disabled after multiple failures. Using REST API only.",
        );
      }

      return;
    }

    ws.onopen = () => {
      // eslint-disable-next-line no-console
      console.log("✅ AI Chat WebSocket connected successfully!");
      connectionAttemptsRef.current = 0; // Reset on successful connection
      wsDisabledRef.current = false; // Re-enable if connection succeeds
      setIsConnected(true);

      // Send init message
      ws.send(
        JSON.stringify({
          type: "init",
          data: {
            symbols: activeSymbols,
          },
        }),
      );

      if (top25SnapshotRef.current.length > 0) {
        ws.send(
          JSON.stringify({
            type: "context_update",
            data: { top25: top25SnapshotRef.current },
          }),
        );
      }

      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Start sending ping messages every 30 seconds to keep connection alive
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping", data: {} }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        handleWebSocketMessage(message);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      connectionAttemptsRef.current++;
      // Only log first few errors to reduce console spam
      if (connectionAttemptsRef.current <= maxSilentAttempts) {
        // eslint-disable-next-line no-console
        console.warn(
          `❌ AI Chat WebSocket connection error (attempt ${connectionAttemptsRef.current}/${maxSilentAttempts}). REST API fallback will be used.`,
        );
      }

      // Disable WebSocket after too many failures to reduce console noise
      if (connectionAttemptsRef.current >= maxAttemptsBeforeDisable) {
        wsDisabledRef.current = true;
        if (connectionAttemptsRef.current === maxAttemptsBeforeDisable) {
          // eslint-disable-next-line no-console
          console.log(
            "🔇 WebSocket disabled after multiple failures. Using REST API only. Refresh page to retry WebSocket.",
          );
        }
        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      }

      setIsConnected(false);
      // Suppress the error event from bubbling to console
      error.preventDefault?.();
    };

    ws.onclose = (event) => {
      // Only log if it's an unexpected close (not clean shutdown) and first few attempts
      if (
        event.code !== 1000 &&
        connectionAttemptsRef.current <= maxSilentAttempts
      ) {
        // eslint-disable-next-line no-console
        console.log(
          "🔌 AI Chat WebSocket closed:",
          event.code,
          event.reason || "Connection failed",
        );
      }
      setIsConnected(false);

      // Clear ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      // Only attempt reconnect if it wasn't a clean close and WebSocket isn't disabled
      if (event.code !== 1000 && !wsDisabledRef.current) {
        // Exponential backoff with max delay
        const baseDelay = 5000; // Start with 5 seconds
        const maxDelay = 30000; // Max 30 seconds
        const delay = Math.min(
          maxDelay,
          baseDelay * Math.pow(1.5, Math.min(connectionAttemptsRef.current, 5)),
        );

        // Only log reconnect attempts for first few failures
        if (connectionAttemptsRef.current <= maxSilentAttempts) {
          // eslint-disable-next-line no-console
          console.log(
            `🔄 WebSocket reconnecting in ${Math.round(delay / 1000)}s... (REST API available as fallback)`,
          );
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          if (!wsDisabledRef.current) {
            connectWebSocket();
          }
        }, delay);
      }
    };

    wsRef.current = ws;
  };

  // Supabase Realtime is completely disabled - we use AI Chat WebSocket instead
  // This function is kept for reference but never called
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _subscribeToRealtimeMessages = () => {
    // No-op - Supabase Realtime is disabled
    return () => {};
  };

  const handleWebSocketMessage = (message: any) => {
    const { type, data } = message;

    switch (type) {
      case "agent_message":
        // Check if this message includes a trade proposal
        if (data.trade_proposal) {
          const tradeMessageId = `trade-${data.trade_proposal.proposal_id}`;
          setMessages((prev) => {
            // Check if message with this ID already exists
            const existingIndex = prev.findIndex((msg) => msg.id === tradeMessageId);
            if (existingIndex >= 0) {
              // Update existing message
              return prev.map((msg, idx) =>
                idx === existingIndex
                  ? normalizeMessage({
                      ...msg,
                      content: data.content || msg.content,
                      confidence: data.confidence ?? msg.confidence,
                      trade_proposal: data.trade_proposal,
                      isStreaming: false,
                    })
                  : msg,
              );
            }
            // Add new message
            return [
              ...prev,
              normalizeMessage({
                id: tradeMessageId,
                message_type: "trade_proposal",
                agent_id: data.agent_id,
                content: data.content || "",
                confidence: data.confidence,
                symbols: data.symbols || [data.trade_proposal.symbol],
                mentioned_agents: data.mentioned_agents || [],
                created_at: data.timestamp || new Date().toISOString(),
                context_data: data.context_data,
                sender_name: data.sender_name || data.agent_name,
                trade_proposal: data.trade_proposal,
                isStreaming: false,
              }),
            ];
          });
        } else {
          // Regular agent message - use data.id if available, otherwise generate unique ID
          const agentMessageId = data.id || `agent-${Date.now()}-${Math.random()}`;
          setMessages((prev) => {
            // Check if message with this ID already exists
            const existingIndex = prev.findIndex((msg) => msg.id === agentMessageId);
            if (existingIndex >= 0) {
              // Update existing message
              return prev.map((msg, idx) =>
                idx === existingIndex
                  ? normalizeMessage({
                      ...msg,
                      content: data.content || msg.content,
                      confidence: data.confidence ?? msg.confidence,
                      isStreaming: true, // Enable streaming effect
                    })
                  : msg,
              );
            }
            // Add new message
            return [
              ...prev,
              normalizeMessage({
                id: agentMessageId,
                message_type: "agent",
                agent_id: data.agent_id,
                content: data.content || "",
                confidence: data.confidence,
                symbols: data.symbols || [],
                mentioned_agents: data.mentioned_agents || [],
                created_at: data.timestamp || new Date().toISOString(),
                context_data: data.context_data,
                sender_name: data.sender_name || data.agent_name,
                isStreaming: true, // Enable streaming effect
              }),
            ];
          });
        }
        break;

      case "trade_proposal":
        // Direct trade proposal message
        const proposalMessageId = `trade-${data.proposal_id}`;
        setMessages((prev) => {
          // Check if message with this ID already exists
          const existingIndex = prev.findIndex((msg) => msg.id === proposalMessageId);
          if (existingIndex >= 0) {
            // Update existing message
            return prev.map((msg, idx) =>
              idx === existingIndex
                ? normalizeMessage({
                    ...msg,
                    content: data.content || msg.content || `Trade proposal for ${data.symbol}`,
                    trade_proposal: data,
                    isStreaming: false,
                  })
                : msg,
            );
          }
          // Add new message
          return [
            ...prev,
            normalizeMessage({
              id: proposalMessageId,
              message_type: "trade_proposal",
              agent_id: data.agent_id,
              content: data.content || `Trade proposal for ${data.symbol}`,
              symbols: [data.symbol],
              mentioned_agents: [],
              created_at: data.created_at || new Date().toISOString(),
              sender_name: data.agent_name,
              trade_proposal: data,
              isStreaming: false,
            }),
          ];
        });
        break;

      case "trade_executed":
      case "trade_rejected":
      case "trade_error":
        // Update existing trade proposal message
        setMessages((prev) =>
          prev.map((msg) => {
            if (
              msg.trade_proposal?.proposal_id === data.proposal_id ||
              msg.id === `trade-${data.proposal_id}`
            ) {
              return {
                ...msg,
                trade_proposal: {
                  ...msg.trade_proposal!,
                  status:
                    type === "trade_executed"
                      ? "executed"
                      : type === "trade_rejected"
                        ? "rejected"
                        : "failed",
                },
                content:
                  msg.content + (data.message ? `\n\n${data.message}` : ""),
              };
            }

            return msg;
          }),
        );
        break;

      case "system":
      case "system_message":
        const systemMessageId = data.id || `system-${Date.now()}-${Math.random()}`;
        setMessages((prev) => {
          // Check if message with this ID already exists
          const existingIndex = prev.findIndex((msg) => msg.id === systemMessageId);
          if (existingIndex >= 0) {
            // Update existing message
            return prev.map((msg, idx) =>
              idx === existingIndex
                ? normalizeMessage({
                    ...msg,
                    content: data.content || msg.content,
                    isStreaming: false,
                  })
                : msg,
            );
          }
          // Add new message
          return [
            ...prev,
            normalizeMessage({
              id: systemMessageId,
              message_type: "system",
              content: data.content || "",
              symbols: data.symbols || [],
              mentioned_agents: [],
              created_at: new Date().toISOString(),
              isStreaming: false, // System messages don't stream
            }),
          ];
        });
        break;

      case "pong":
      case "heartbeat":
      case "ack":
        // Silent protocol/control frames
        break;

      case "error":
        // eslint-disable-next-line no-console
        console.warn("Chat error:", data.message);
        break;

      default:
        // eslint-disable-next-line no-console
        console.log("Unknown message type:", type);
    }
  };

  const loadRecentMessages = async () => {
    try {
      const response = await fetch("/api/ai-chat/messages?limit=50");

      if (response.ok) {
        const data = await response.json();

        // Mark all loaded messages as not streaming (they're historical)
        const historicalMessages = (data.messages || []).map((msg: Message) =>
          normalizeMessage({
            ...msg,
            // Ensure ID is unique - use database ID if available, fallback to generated
            id: msg.id || `msg-${Date.now()}-${Math.random()}`,
            isStreaming: false,
          }),
        );

        // Remove duplicates by ID, keeping the most recent one
        const uniqueMessages = historicalMessages.reduce((acc: Message[], msg: Message) => {
          const existingIndex = acc.findIndex((m) => m.id === msg.id);
          if (existingIndex >= 0) {
            // Replace with newer message if timestamp is more recent
            const existingMsg = acc[existingIndex];
            const msgTime = new Date(msg.created_at).getTime();
            const existingTime = new Date(existingMsg.created_at).getTime();
            if (msgTime > existingTime) {
              acc[existingIndex] = msg;
            }
          } else {
            acc.push(msg);
          }
          return acc;
        }, []);

        // Sort by created_at to maintain chronological order
        uniqueMessages.sort((a: Message, b: Message) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );

        setMessages(uniqueMessages);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Error loading messages:", error);
    }
  };

  const getSenderName = useCallback(
    (message: Partial<Message>) => {
      if (message.sender_name) {
        return message.sender_name;
      }

      if (message.message_type === "agent" && message.agent_id) {
        return (
          message.context_data?.sender_name ||
          AGENT_NAME_MAP[message.agent_id] ||
          message.agent_id
        );
      }

      if (message.message_type === "user") {
        if (
          message.context_data?.sender_name &&
          typeof message.context_data.sender_name === "string"
        ) {
          return message.context_data.sender_name;
        }

        if (message.user_id && userId && message.user_id === userId) {
          return "You";
        }

        return "Trader";
      }

      return "System";
    },
    [userId],
  );

  const normalizeMessage = useCallback(
    (message: Partial<Message>): Message => {
      const contextData =
        (message.context_data as Record<string, unknown> | undefined) || {};
      const senderName =
        message.sender_name ||
        (typeof contextData.sender_name === "string"
          ? (contextData.sender_name as string)
          : undefined) ||
        getSenderName(message);
      const senderAvatar =
        message.sender_avatar ||
        (typeof contextData.sender_avatar === "string"
          ? (contextData.sender_avatar as string)
          : undefined);

      return {
        ...message,
        sender_name: senderName,
        sender_avatar: senderAvatar,
        context_data: contextData,
      } as Message;
    },
    [getSenderName],
  );

  const confirmTrade = useCallback(
    async (proposalId: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        // Fallback to REST API
        try {
          const response = await fetch("/api/ai-chat/trade/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              proposal_id: proposalId,
              user_id: userId,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to confirm trade");
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Error confirming trade:", error);
        }

        return;
      }

      wsRef.current.send(
        JSON.stringify({
          type: "confirm_trade",
          data: {
            proposal_id: proposalId,
            user_id: userId,
          },
        }),
      );
    },
    [userId],
  );

  const rejectTrade = useCallback(
    async (proposalId: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        // Fallback to REST API
        try {
          const response = await fetch("/api/ai-chat/trade/reject", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              proposal_id: proposalId,
              user_id: userId,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to reject trade");
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Error rejecting trade:", error);
        }

        return;
      }

      wsRef.current.send(
        JSON.stringify({
          type: "reject_trade",
          data: {
            proposal_id: proposalId,
            user_id: userId,
          },
        }),
      );
    },
    [userId],
  );

  const sendMessage = useCallback(
    async (content: string, mentionedAgents: string[] = []) => {
      const trimmed = content.trim();

      if (!trimmed) {
        return;
      }

      // Extract symbols from content
      const symbolRegex = /\$([A-Za-z]{1,5})(?=\b|$|[^A-Za-z0-9])/gi;
      const symbols = Array.from(
        new Set(
          Array.from(trimmed.matchAll(symbolRegex)).map((match) =>
            match[1].toUpperCase(),
          ),
        ),
      );

      // Optimistically add user message to UI
      const userMessageId = `user-${Date.now()}-${Math.random()}`;
      const userMessage = normalizeMessage({
        id: userMessageId,
        message_type: "user",
        user_id: userId ?? undefined,
        content: trimmed,
        symbols,
        mentioned_agents: mentionedAgents,
        created_at: new Date().toISOString(),
        context_data: {
          sender_name: userDisplayName,
          sender_avatar: userAvatar,
        },
      });

      setMessages((prev) => {
        // Check if message with this ID already exists (shouldn't happen but prevent duplicates)
        const existingIndex = prev.findIndex((msg) => msg.id === userMessageId);
        if (existingIndex >= 0) {
          return prev; // Message already exists, don't add duplicate
        }
        return [...prev, userMessage];
      });

      // Try WebSocket first if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(
            JSON.stringify({
              type: "user_message",
              data: {
                content: trimmed,
                user_id: userId || "", // Backend requires string, not null
                mentioned_agents: mentionedAgents || [],
                symbols: symbols || [],
                user_name: userDisplayName || undefined,
                user_avatar: userAvatar || undefined,
              },
            }),
          );

          // Add symbols to watch list
          if (symbols.length > 0) {
            setActiveSymbols((prev) => {
              const newSymbols = Array.from(new Set([...prev, ...symbols]));

              return newSymbols;
            });
          }

          return;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn(
            "WebSocket send failed, falling back to REST API:",
            error,
          );
        }
      }

      // Fallback to REST API if WebSocket is not connected
      // Use Next.js API route as proxy to avoid CORS and Docker networking issues
      try {
        // eslint-disable-next-line no-console
        console.log(
          "Using REST API fallback for message send via Next.js proxy",
        );

        // Create abort controller for timeout (more compatible than AbortSignal.timeout)
        // Use longer timeout for LLM inference - can take several minutes
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => {
          abortController.abort();
        }, 600000); // 10 minutes timeout for LLM inference

        let response: Response;

        try {
          // Use Next.js API route as proxy - it handles Docker networking internally
          response = await fetch("/api/ai-chat/message", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: trimmed,
              user_id: userId || "", // Backend requires string, not null
              mentioned_agents: mentionedAgents || [],
              symbols: symbols || [],
              user_name: userDisplayName || undefined,
              user_avatar: userAvatar || undefined,
            }),
            signal: abortController.signal,
          });

          // Clear timeout on success
          clearTimeout(timeoutId);
        } catch (fetchError: any) {
          // Clear timeout on error
          clearTimeout(timeoutId);

          // eslint-disable-next-line no-console
          console.error("Fetch error details:", fetchError);

          // Re-throw with more context
          if (fetchError.name === "AbortError") {
            throw new Error("Request timed out after 10 minutes. The AI service may be slow to respond.");
          }
          throw fetchError;
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");

          // eslint-disable-next-line no-console
          console.error("API error response:", response.status, errorText);
          throw new Error(
            `HTTP error! status: ${response.status}, body: ${errorText}`,
          );
        }

        const data = await response.json().catch((parseError) => {
          // eslint-disable-next-line no-console
          console.error("JSON parse error:", parseError);
          throw new Error("Failed to parse response from server");
        });

        // Add symbols to watch list
        if (symbols.length > 0) {
          setActiveSymbols((prev) => {
            const newSymbols = Array.from(new Set([...prev, ...symbols]));

            return newSymbols;
          });
        }

        // Process agent responses if any
        if (data.responses && Array.isArray(data.responses)) {
          data.responses.forEach((response: any) => {
            if (response.agent_id && response.content) {
              const responseMessageId = response.id || `agent-${Date.now()}-${Math.random()}`;
              setMessages((prev) => {
                // Check if message with this ID already exists
                const existingIndex = prev.findIndex((msg) => msg.id === responseMessageId);
                if (existingIndex >= 0) {
                  // Update existing message
                  return prev.map((msg, idx) =>
                    idx === existingIndex
                      ? normalizeMessage({
                          ...msg,
                          content: response.content || msg.content,
                          confidence: response.confidence ?? msg.confidence,
                        })
                      : msg,
                  );
                }
                // Add new message
                return [
                  ...prev,
                  normalizeMessage({
                    id: responseMessageId,
                    message_type: "agent",
                    agent_id: response.agent_id,
                    content: response.content || "",
                    confidence: response.confidence,
                    symbols: response.symbols || [],
                    created_at: response.timestamp || new Date().toISOString(),
                  }),
                ];
              });
            }
          });
        }
        // Mark REST API as available on successful request
        setIsRestApiAvailable(true);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to send message via REST API:", error);

        // Determine error message with more details
        let errorMessage =
          "Failed to send message. Please check your connection and try again.";

        if (error instanceof Error) {
          // eslint-disable-next-line no-console
          console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });

          if (
            error.name === "AbortError" ||
            error.message.includes("timeout")
          ) {
            errorMessage =
              "Request timed out. The AI service may be slow to respond. Please try again.";
          } else if (
            error.message.includes("Failed to fetch") ||
            error.message.includes("NetworkError") ||
            error.message.includes("Network request failed")
          ) {
            errorMessage =
              "Cannot connect to AI service. Please check if the service is running and accessible.";
            setIsRestApiAvailable(false);
          } else if (error.message.includes("CORS")) {
            errorMessage =
              "CORS error: The AI service is blocking requests from this origin.";
          } else {
            errorMessage = `Error: ${error.message}`;
          }
        } else {
          // eslint-disable-next-line no-console
          console.error("Unknown error type:", error);
        }

        // Show user-friendly error
        setMessages((prev) => [
          ...prev,
          normalizeMessage({
            id: `error-${Date.now()}`,
            message_type: "system",
            content: errorMessage,
            created_at: new Date().toISOString(),
          }),
        ]);
      }
    },
    [userId, userDisplayName, userAvatar, normalizeMessage],
  );

  const syncSymbols = useCallback(
    (type: "add_symbols" | "remove_symbols", symbols: string[]) => {
      if (
        symbols.length === 0 ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN
      ) {
        return;
      }

      wsRef.current.send(
        JSON.stringify({
          type,
          data: {
            symbols,
          },
        }),
      );
    },
    [],
  );

  const addSymbolToWatch = useCallback(
    (symbol: string) => {
      const normalized = symbol.trim().toUpperCase();

      if (!normalized) {
        return;
      }

      let added = false;

      setActiveSymbols((prev) => {
        if (prev.includes(normalized)) {
          return prev;
        }

        added = true;

        return [...prev, normalized];
      });

      if (added) {
        syncSymbols("add_symbols", [normalized]);
      }
    },
    [syncSymbols],
  );

  const removeSymbolFromWatch = useCallback(
    (symbol: string) => {
      const normalized = symbol.trim().toUpperCase();

      if (!normalized) {
        return;
      }

      let removed = false;

      setActiveSymbols((prev) => {
        if (!prev.includes(normalized)) {
          return prev;
        }

        removed = true;

        return prev.filter((item) => item !== normalized);
      });

      if (removed) {
        syncSymbols("remove_symbols", [normalized]);
      }
    },
    [syncSymbols],
  );

  const openChat = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);

    if (!isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const markMessageComplete = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isStreaming: false } : msg,
      ),
    );
  }, []);

  const clearChat = useCallback(async () => {
    try {
      // Call frontend API route which handles user authentication
      const response = await fetch("/api/ai-chat/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
          errorData.message || `Failed to clear chat: ${response.status}`,
        );
      }

      const result = await response.json();

      // eslint-disable-next-line no-console
      console.log(`Cleared ${result.deleted_count} messages from database`);

      // Clear all messages from state
      setMessages([]);
      // Reset unread count
      setUnreadCount(0);
      // Note: We keep the WebSocket connection and active symbols
      // as the user might want to continue chatting
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error clearing chat:", error);
      // Still clear local state even if API call fails
      setMessages([]);
      setUnreadCount(0);
    }
  }, [sessionId]);

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
  };

  const value: ChatContextType = {
    messages,
    isConnected,
    isRestApiAvailable,
    isOpen,
    unreadCount,
    activeSymbols,
    sessionId,
    sendMessage,
    addSymbolToWatch,
    removeSymbolFromWatch,
    openChat,
    closeChat,
    toggleChat,
    markAsRead,
    markMessageComplete,
    clearChat,
    confirmTrade,
    rejectTrade,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);

  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }

  return context;
}
