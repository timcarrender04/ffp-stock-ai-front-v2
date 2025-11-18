"use client";

import React, { useRef, useEffect, useState } from "react";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";
import { Spinner } from "@heroui/spinner";

import { SymbolQuickViewPopover } from "../symbols/SymbolQuickViewPopover";

import { SymbolAwareChatMessage } from "./SymbolAwareChatMessage";
import { AgentCard } from "./AgentCard";
import { MentionInput } from "./MentionInput";

import { useChat } from "@/lib/ai-chat/ChatProvider";
import { useAlert } from "@/lib/contexts/AlertContext";

const AGENTS = [
  {
    id: "nova",
    name: "Nova",
    role: "Technical Analyst",
    avatar: "🔬",
    color: "blue",
    specialty: "Chart patterns, indicators, support/resistance",
  },
  {
    id: "atlas",
    name: "Atlas",
    role: "Macro Trader",
    avatar: "🌍",
    color: "purple",
    specialty: "Market sentiment, economic indicators, news",
  },
  {
    id: "cipher",
    name: "Cipher",
    role: "Quantitative Strategist",
    avatar: "📊",
    color: "green",
    specialty: "Statistical models, volume analysis, correlations",
  },
  {
    id: "sentinel",
    name: "Sentinel",
    role: "Risk Manager",
    avatar: "🛡️",
    color: "orange",
    specialty: "Risk assessment, position sizing, volatility",
  },
];

export function MobileAIChatRoom() {
  const { confirm } = useAlert();
  const {
    messages,
    isConnected,
    isRestApiAvailable,
    activeSymbols,
    sendMessage,
    addSymbolToWatch,
    removeSymbolFromWatch,
    markMessageComplete,
    clearChat,
    confirmTrade,
    rejectTrade,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAgentsExpanded, setIsAgentsExpanded] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getMarketPhase = () => {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Check if it's a market day
    if (day < 1 || day > 5) {
      return {
        phase: "closed",
        label: "Market Closed",
        color: "gray",
        activity: "low",
      };
    }

    // Eastern Time conversion (assuming client is in ET, adjust if needed)
    if (hour >= 4 && hour < 9) {
      return {
        phase: "pre_market",
        label: "Pre-Market",
        color: "blue",
        activity: "moderate",
      };
    } else if (hour >= 9 && hour < 10) {
      return {
        phase: "opening_bell",
        label: "Opening Bell",
        color: "green",
        activity: "high",
      };
    } else if (hour >= 10 && hour < 14) {
      return {
        phase: "morning_session",
        label: "Morning Session",
        color: "blue",
        activity: "moderate",
      };
    } else if (hour >= 14 && hour < 16) {
      return {
        phase: "power_hour",
        label: "Power Hour",
        color: "orange",
        activity: "high",
      };
    } else if (hour >= 16 && hour < 16.5) {
      return {
        phase: "closing_bell",
        label: "Closing Bell",
        color: "red",
        activity: "high",
      };
    } else if (hour >= 16.5 && hour < 20) {
      return {
        phase: "post_market",
        label: "Post-Market",
        color: "purple",
        activity: "moderate",
      };
    } else {
      return {
        phase: "closed",
        label: "Market Closed",
        color: "gray",
        activity: "low",
      };
    }
  };

  const getAgentStats = (agentId: string) => {
    const agentMessages = messages.filter((m) => m.agent_id === agentId);
    const lastMessage = agentMessages[agentMessages.length - 1];
    const avgConfidence =
      agentMessages.length > 0
        ? agentMessages.reduce((sum, m) => sum + (m.confidence || 0), 0) /
          agentMessages.length
        : 0;

    return {
      messageCount: agentMessages.length,
      lastActivity: lastMessage?.created_at,
      avgConfidence,
    };
  };

  const handleSymbolClick = (symbol: string) => {
    addSymbolToWatch(symbol);
  };

  const handleSymbolRemove = (symbol: string) => {
    removeSymbolFromWatch(symbol);
  };

  const handleAgentClick = (_agentId: string) => {
    // Reserved for future agent drill-down interactions
  };

  const handleMentionAgent = (_agentId: string) => {
    // This would insert @agent into the input - handled by MentionInput
  };

  const marketPhase = getMarketPhase();

  return (
    <div className="flex flex-col h-full bg-finance-surface">
      {/* Header - Mobile optimized */}
      <div className="flex-shrink-0 p-3 border-b border-finance-green-25">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {marketPhase.activity === "high" && (
              <Icon
                className="text-sm text-orange-400"
                icon="solar:flash-bold"
              />
            )}
            {marketPhase.activity === "moderate" && (
              <Icon
                className="text-sm text-blue-400"
                icon="solar:chart-square-bold"
              />
            )}
            {marketPhase.activity === "low" && (
              <Icon className="text-sm text-gray-400" icon="solar:moon-bold" />
            )}
            <Chip
              className={`text-xs ${
                marketPhase.color === "green"
                  ? "bg-green-500/20 text-green-300"
                  : marketPhase.color === "blue"
                    ? "bg-blue-500/20 text-blue-300"
                    : marketPhase.color === "orange"
                      ? "bg-orange-500/20 text-orange-300"
                      : marketPhase.color === "red"
                        ? "bg-red-500/20 text-red-300"
                        : marketPhase.color === "purple"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-gray-500/20 text-gray-300"
              }`}
              size="sm"
              variant="flat"
            >
              {marketPhase.label}
            </Chip>
            <span className="text-xs text-zinc-400">•</span>
            <span suppressHydrationWarning className="text-xs text-zinc-400">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors rounded-md hover:bg-zinc-800"
              title="Clear chat"
              onClick={async () => {
                const confirmed = await confirm(
                  "Are you sure you want to clear all chat messages? This action cannot be undone.",
                  {
                    title: "Clear Chat",
                    variant: "warning",
                  },
                );

                if (confirmed) {
                  clearChat();
                }
              }}
            >
              <Icon className="text-sm" icon="solar:trash-bin-trash-bold" />
            </button>
            {isConnected ? (
              <Chip color="success" size="sm" variant="flat">
                <Icon className="mr-1 text-xs" icon="solar:wifi-router-bold" />
                Connected
              </Chip>
            ) : isRestApiAvailable ? (
              <Chip color="warning" size="sm" variant="flat">
                <Icon
                  className="mr-1 text-xs"
                  icon="solar:cloud-storage-bold"
                />
                REST API
              </Chip>
            ) : (
              <Chip color="danger" size="sm" variant="flat">
                <Icon className="mr-1 text-xs" icon="solar:wifi-router-bold" />
                Disconnected
              </Chip>
            )}
          </div>
        </div>

        {/* Active Symbols */}
        {activeSymbols.length > 0 && (
          <div>
            <p className="text-xs text-zinc-400 mb-1">Watching:</p>
            <div className="flex flex-wrap gap-1">
              {activeSymbols.map((symbol) => (
                <SymbolQuickViewPopover
                  key={symbol}
                  symbol={symbol}
                  onAddToChat={() => handleSymbolClick(symbol)}
                >
                  <Chip
                    className="cursor-pointer group"
                    color="success"
                    endContent={
                      <button
                        aria-label={`Stop watching ${symbol}`}
                        className="ml-1 text-xs opacity-50 transition-opacity group-hover:opacity-100"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleSymbolRemove(symbol);
                        }}
                      >
                        <Icon icon="solar:close-square-bold" />
                      </button>
                    }
                    size="sm"
                    variant="flat"
                  >
                    ${symbol}
                  </Chip>
                </SymbolQuickViewPopover>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Agent Cards - Mobile 2x2 grid (Collapsible) */}
      <div className="flex-shrink-0 bg-finance-surface border-b border-finance-green-25">
        <button
          className="w-full flex items-center justify-between p-3 hover:bg-finance-surface-60 transition-colors"
          type="button"
          onClick={() => setIsAgentsExpanded(!isAgentsExpanded)}
        >
          <div className="flex items-center gap-2">
            <Icon
              className="text-lg text-finance-green"
              icon="solar:users-group-two-rounded-bold"
            />
            <span className="text-sm font-medium text-finance-green">
              AI Agents
            </span>
            <Chip className="text-xs" size="sm" variant="flat">
              {AGENTS.length}
            </Chip>
          </div>
          <Icon
            className={`text-lg text-zinc-400 transition-transform ${
              isAgentsExpanded ? "rotate-180" : ""
            }`}
            icon="solar:alt-arrow-down-bold"
          />
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isAgentsExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="p-3 pt-0">
            <div className="grid grid-cols-2 gap-2">
              {AGENTS.map((agent) => {
                const stats = getAgentStats(agent.id);

                return (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    confidence={stats.avgConfidence}
                    isActive={isConnected}
                    lastActivity={stats.lastActivity}
                    messageCount={stats.messageCount}
                    onMention={() => handleMentionAgent(agent.id)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400">
            {isConnected ? (
              <>
                <Icon className="text-4xl mb-3" icon="solar:chat-round-bold" />
                <div className="flex items-center gap-2 mb-2">
                  <Icon
                    className="text-xl text-finance-green animate-pulse"
                    icon="solar:users-group-two-rounded-bold"
                  />
                  <p className="text-sm">
                    Agents are monitoring {marketPhase.label.toLowerCase()}
                  </p>
                </div>
                <p className="text-xs mt-2 text-center px-4">
                  They&apos;ll start discussing top stocks as market activity
                  picks up. Ask about any stock to join the conversation!
                </p>
              </>
            ) : (
              <>
                <Spinner className="mb-3" color="success" size="lg" />
                <p className="text-sm">Connecting to AI agents...</p>
              </>
            )}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <SymbolAwareChatMessage
                key={message.id}
                {...message}
                onAgentClick={handleAgentClick}
                onConfirmTrade={confirmTrade}
                onRejectTrade={rejectTrade}
                onStreamingComplete={() => markMessageComplete(message.id)}
                onSymbolClick={handleSymbolClick}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t border-finance-green-25">
        <MentionInput
          disabled={false}
          placeholder="Ask the agents a question..."
          onSend={sendMessage}
        />
      </div>
    </div>
  );
}
