"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";

import { useChat } from "@/lib/ai-chat/ChatProvider";
import { ProcessedTrade, TradeMetrics } from "@/lib/services/analytics";

interface AITradingProfileProps {
  trades: ProcessedTrade[];
  metrics: TradeMetrics;
}

export function AITradingProfile({ trades, metrics }: AITradingProfileProps) {
  const { sendMessage, messages } = useChat();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisMessages, setAnalysisMessages] = useState<any[]>([]);

  // Filter messages related to trading analysis
  useEffect(() => {
    const relevantMessages = messages.filter(
      (msg) => {
        // Check if content exists before accessing it
        if (!msg.content || typeof msg.content !== "string") {
          return false;
        }
        
        const lowerContent = msg.content.toLowerCase();
        
        return (
          lowerContent.includes("trading profile") ||
          lowerContent.includes("win rate") ||
          lowerContent.includes("profit factor") ||
          lowerContent.includes("risk management") ||
          msg.agent_id === "sentinel" ||
          msg.agent_id === "cipher"
        );
      },
    );

    setAnalysisMessages(relevantMessages);
  }, [messages]);

  const formatTradeSummary = () => {
    const winningTrades = trades.filter((t) => t.isWin);
    const losingTrades = trades.filter((t) => !t.isWin);

    const topWinners = winningTrades
      .sort((a, b) => b.pnlAmount - a.pnlAmount)
      .slice(0, 5);
    const topLosers = losingTrades
      .sort((a, b) => a.pnlAmount - b.pnlAmount)
      .slice(0, 5);

    const symbolPerformance = new Map<
      string,
      { wins: number; losses: number; totalPnL: number }
    >();

    trades.forEach((trade) => {
      if (!symbolPerformance.has(trade.symbol)) {
        symbolPerformance.set(trade.symbol, {
          wins: 0,
          losses: 0,
          totalPnL: 0,
        });
      }
      const perf = symbolPerformance.get(trade.symbol)!;

      if (trade.isWin) perf.wins++;
      else perf.losses++;
      perf.totalPnL += trade.pnlAmount;
    });

    return `
Trading Profile Analysis Request:

Total Trades: ${metrics.totalTrades}
Win Rate: ${metrics.winRate.toFixed(1)}%
Total P&L: $${metrics.totalPnL.toFixed(2)}
Profit Factor: ${metrics.profitFactor === Infinity ? "∞" : metrics.profitFactor.toFixed(2)}
Average Win: $${metrics.averageWin.toFixed(2)}
Average Loss: $${Math.abs(metrics.averageLoss).toFixed(2)}

Top 5 Winning Trades:
${topWinners.map((t, i) => `${i + 1}. ${t.symbol}: $${t.pnlAmount.toFixed(2)} (${t.pnlPercent.toFixed(2)}%)`).join("\n")}

Top 5 Losing Trades:
${topLosers.map((t, i) => `${i + 1}. ${t.symbol}: $${t.pnlAmount.toFixed(2)} (${t.pnlPercent.toFixed(2)}%)`).join("\n")}

Symbol Performance:
${Array.from(symbolPerformance.entries())
  .map(
    ([symbol, perf]) =>
      `${symbol}: ${perf.wins}W/${perf.losses}L, P&L: $${perf.totalPnL.toFixed(2)}`,
  )
  .slice(0, 10)
  .join("\n")}

Please analyze this trading profile and provide:
1. Why trades are winning vs losing
2. Trading pattern analysis
3. Risk management evaluation
4. Recommendations for improvement
`.trim();
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    const summary = formatTradeSummary();

    // Send to both Sentinel (Risk Manager) and Cipher (Quantitative Strategist)
    sendMessage(`@Sentinel @Cipher ${summary}`, ["sentinel", "cipher"]);

    // Reset analyzing state after a delay
    setTimeout(() => setIsAnalyzing(false), 2000);
  };

  return (
    <Card className="border border-finance-green-25 bg-gradient-to-br from-finance-surface-70/90 via-finance-surface-80 to-finance-surface-60 p-4 sm:p-6 shadow-xl">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              AI Trading Profile Analysis
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Get AI insights on your trading performance
            </p>
          </div>
          <Button
            color="primary"
            isLoading={isAnalyzing}
            size="sm"
            startContent={
              !isAnalyzing && (
                <Icon className="text-base" icon="solar:magic-stick-3-bold" />
              )
            }
            variant="flat"
            onPress={handleAnalyze}
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Profile"}
          </Button>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        {analysisMessages.length === 0 ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-finance-green-30/60 bg-black/20 p-4">
              <div className="flex items-start gap-3">
                <Icon
                  className="text-2xl text-finance-green-60 mt-1"
                  icon="solar:lightbulb-bolt-bold"
                />
                <div className="flex-1">
                  <p className="text-sm text-zinc-300 mb-2">
                    Click &quot;Analyze Profile&quot; to get AI-powered insights
                    on your trading performance.
                  </p>
                  <p className="text-xs text-zinc-400">
                    Our AI agents (Sentinel & Cipher) will analyze your win/loss
                    patterns, risk management, and provide actionable
                    recommendations.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-finance-green-30/60 bg-black/20 p-3">
                <p className="text-xs text-zinc-400 mb-1">Sentinel</p>
                <p className="text-sm text-white font-semibold">Risk Manager</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Evaluates risk management and position sizing
                </p>
              </div>
              <div className="rounded-lg border border-finance-green-30/60 bg-black/20 p-3">
                <p className="text-xs text-zinc-400 mb-1">Cipher</p>
                <p className="text-sm text-white font-semibold">
                  Quant Strategist
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Analyzes trading patterns and statistics
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analysisMessages.map((msg, index) => (
              <div
                key={msg.id || `msg-${index}-${msg.created_at || Date.now()}`}
                className="rounded-lg border border-finance-green-30/60 bg-black/20 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {msg.agent_id === "sentinel" ? (
                      <span className="text-2xl">🛡️</span>
                    ) : msg.agent_id === "cipher" ? (
                      <span className="text-2xl">📊</span>
                    ) : (
                      <Icon
                        className="text-2xl text-finance-green-60"
                        icon="solar:user-bold"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold text-white">
                        {msg.agent_id === "sentinel"
                          ? "Sentinel (Risk Manager)"
                          : msg.agent_id === "cipher"
                            ? "Cipher (Quant Strategist)"
                            : "AI Agent"}
                      </p>
                      {msg.timestamp && (
                        <span className="text-xs text-zinc-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                      {msg.content || "(No content)"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
