"use client";

import React from "react";
import Image from "next/image";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Button } from "@heroui/button";

import { SymbolQuickViewPopover } from "../symbols/SymbolQuickViewPopover";

import { StreamingText } from "./StreamingText";

export type MessageProps = {
  id: string;
  message_type: "agent" | "user" | "system" | "trade_proposal";
  agent_id?: string;
  content: string;
  confidence?: number;
  symbols: string[];
  mentioned_agents: string[];
  created_at: string;
  isStreaming?: boolean;
  onSymbolClick?: (symbol: string) => void;
  onAgentClick?: (agentId: string) => void;
  onStreamingComplete?: () => void;
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
  onConfirmTrade?: (proposalId: string) => void;
  onRejectTrade?: (proposalId: string) => void;
};

const AGENTS = {
  nova: {
    name: "Nova",
    avatar: "🔬",
    color: "blue",
    role: "Technical Analyst",
  },
  atlas: {
    name: "Atlas",
    avatar: "🌍",
    color: "purple",
    role: "Macro Trader",
  },
  cipher: {
    name: "Cipher",
    avatar: "📊",
    color: "green",
    role: "Quant Strategist",
  },
  sentinel: {
    name: "Sentinel",
    avatar: "🛡️",
    color: "orange",
    role: "Risk Manager",
  },
};

export function SymbolAwareChatMessage({
  message_type,
  agent_id,
  content,
  confidence,
  symbols,
  mentioned_agents: _mentionedAgents,
  created_at,
  isStreaming = false,
  onSymbolClick,
  onAgentClick,
  onStreamingComplete,
  sender_name,
  sender_avatar,
  trade_proposal,
  onConfirmTrade,
  onRejectTrade,
}: MessageProps) {
  const isAgent = message_type === "agent";
  const isUser = message_type === "user";
  const isSystem = message_type === "system";
  const isTradeProposal = message_type === "trade_proposal";

  const agent =
    isAgent && agent_id ? AGENTS[agent_id as keyof typeof AGENTS] : null;

  const renderContent = () => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Updated regex: case-insensitive, handles end of string, allows 1-5 letter symbols
    // Matches $SYMBOL followed by word boundary, end of string, or non-word character
    const symbolRegex = /\$([A-Za-z]{1,5})(?=\b|$|[^A-Za-z0-9])/gi;
    const agentRegex =
      /@(nova|atlas|cipher|sentinel|Nova|Atlas|Cipher|Sentinel)\b/gi;

    const combined = [
      ...Array.from(content.matchAll(symbolRegex)),
      ...Array.from(content.matchAll(agentRegex)),
    ].sort((a, b) => a.index! - b.index!);

    combined.forEach((match, idx) => {
      const matchIndex = match.index!;

      if (matchIndex > lastIndex) {
        parts.push(content.substring(lastIndex, matchIndex));
      }

      if (match[0].startsWith("$")) {
        // Normalize symbol to uppercase for consistency
        const symbol = match[1].toUpperCase();

        parts.push(
          <SymbolQuickViewPopover
            key={`${idx}-symbol-${match.index}`}
            symbol={symbol}
            onAddToChat={
              onSymbolClick ? () => onSymbolClick(symbol) : undefined
            }
          >
            <Chip
              className="cursor-pointer text-xs mx-0.5"
              color="success"
              size="sm"
              variant="flat"
            >
              ${symbol}
            </Chip>
          </SymbolQuickViewPopover>,
        );
      } else if (match[0].startsWith("@")) {
        const agentName = match[1].toLowerCase();

        parts.push(
          <Chip
            key={`${idx}-agent`}
            className="cursor-pointer text-xs mx-0.5"
            color="primary"
            size="sm"
            variant="flat"
            onClick={() => onAgentClick?.(agentName)}
          >
            @{match[1]}
          </Chip>,
        );
      }

      lastIndex = matchIndex + match[0].length;
    });

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <Chip className="text-xs opacity-70" size="sm" variant="flat">
          {content}
        </Chip>
      </div>
    );
  }

  const displayName =
    sender_name || (isAgent && agent?.name) || (isUser ? "Trader" : "System");

  const subtitle = isAgent
    ? (agent?.role ?? "Agent")
    : isUser
      ? displayName === "You"
        ? "You"
        : "Member"
      : "";

  const renderAvatar = () => {
    if (isAgent && agent) {
      return (
        <div className="w-10 h-10 rounded-full bg-finance-surface border border-finance-green-25 flex items-center justify-center text-xl">
          {agent.avatar}
        </div>
      );
    }

    if (sender_avatar) {
      return (
        <Image
          alt={displayName ?? "Chat participant"}
          className="w-10 h-10 rounded-full border border-finance-green-25 object-cover"
          height={40}
          referrerPolicy="no-referrer"
          src={sender_avatar}
          width={40}
        />
      );
    }

    return (
      <div className="w-10 h-10 rounded-full bg-finance-surface border border-finance-green-25 flex items-center justify-center text-sm font-semibold uppercase">
        {displayName?.charAt(0) ?? "U"}
      </div>
    );
  };

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className="flex-shrink-0">{renderAvatar()}</div>

      <div className={`flex flex-col ${isUser ? "items-end" : ""} max-w-[80%]`}>
        <div
          className={`flex items-center gap-2 mb-1 ${isUser ? "flex-row-reverse" : ""}`}
        >
          <span className="text-sm font-semibold text-finance-green">
            {displayName}
          </span>
          {subtitle ? (
            <span className="text-xs text-zinc-500">{subtitle}</span>
          ) : null}
        </div>

        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-finance-green text-black"
              : "bg-finance-surface border border-finance-green-25 text-white"
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">
            {isAgent && isStreaming ? (
              <StreamingText
                content={content}
                isStreaming={true}
                speed={3}
                onComplete={onStreamingComplete}
              />
            ) : (
              renderContent()
            )}
          </div>

          {confidence !== undefined && isAgent && (
            <div className="mt-3 pt-2 border-t border-finance-green-25 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="opacity-70">Confidence</span>
                <span>{(confidence * 100).toFixed(0)}%</span>
              </div>
              <Progress
                className="max-w-full"
                color={
                  confidence > 0.7
                    ? "success"
                    : confidence > 0.5
                      ? "warning"
                      : "danger"
                }
                size="sm"
                value={confidence * 100}
              />
            </div>
          )}

          {symbols.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {symbols.map((symbol) => (
                <SymbolQuickViewPopover
                  key={symbol}
                  symbol={symbol}
                  onAddToChat={
                    onSymbolClick ? () => onSymbolClick(symbol) : undefined
                  }
                >
                  <Chip
                    className="cursor-pointer text-xs"
                    color="success"
                    size="sm"
                    variant="flat"
                  >
                    ${symbol}
                  </Chip>
                </SymbolQuickViewPopover>
              ))}
            </div>
          )}

          {isTradeProposal && trade_proposal && (
            <div className="mt-4 pt-3 border-t border-finance-green-25">
              <div className="space-y-3">
                <div className="bg-finance-surface-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-finance-green">
                      Trade Proposal
                    </span>
                    <Chip
                      color={
                        trade_proposal.side === "buy" ? "success" : "danger"
                      }
                      size="sm"
                      variant="flat"
                    >
                      {trade_proposal.side.toUpperCase()}
                    </Chip>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="opacity-70">Symbol:</span>
                      <span className="font-semibold">
                        ${trade_proposal.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Quantity:</span>
                      <span>{trade_proposal.quantity}</span>
                    </div>
                    {trade_proposal.entry_price && (
                      <div className="flex justify-between">
                        <span className="opacity-70">Entry Price:</span>
                        <span>${trade_proposal.entry_price.toFixed(2)}</span>
                      </div>
                    )}
                    {trade_proposal.stop_loss && (
                      <div className="flex justify-between">
                        <span className="opacity-70">Stop Loss:</span>
                        <span className="text-red-400">
                          ${trade_proposal.stop_loss.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {trade_proposal.take_profit && (
                      <div className="flex justify-between">
                        <span className="opacity-70">Take Profit:</span>
                        <span className="text-green-400">
                          ${trade_proposal.take_profit.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="opacity-70">Order Type:</span>
                      <span className="capitalize">
                        {trade_proposal.order_type}
                      </span>
                    </div>
                  </div>
                  {trade_proposal.reasoning && (
                    <div className="mt-2 pt-2 border-t border-finance-green-25">
                      <p className="text-xs opacity-80 italic">
                        {trade_proposal.reasoning}
                      </p>
                    </div>
                  )}
                </div>

                {trade_proposal.status === "pending" &&
                  onConfirmTrade &&
                  onRejectTrade && (
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        color="success"
                        size="sm"
                        onPress={() =>
                          onConfirmTrade(trade_proposal.proposal_id)
                        }
                      >
                        Yes, Execute
                      </Button>
                      <Button
                        className="flex-1"
                        color="danger"
                        size="sm"
                        variant="flat"
                        onPress={() =>
                          onRejectTrade(trade_proposal.proposal_id)
                        }
                      >
                        No, Reject
                      </Button>
                    </div>
                  )}

                {trade_proposal.status === "executed" && (
                  <div className="text-xs text-green-400 font-semibold">
                    ✅ Order executed successfully
                  </div>
                )}

                {trade_proposal.status === "rejected" && (
                  <div className="text-xs text-zinc-500">
                    ❌ Trade proposal rejected
                  </div>
                )}

                {trade_proposal.status === "failed" && (
                  <div className="text-xs text-red-400">
                    ❌ Order execution failed
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <span className="text-xs text-zinc-500 mt-1">
          {formatTime(created_at)}
        </span>
      </div>
    </div>
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
