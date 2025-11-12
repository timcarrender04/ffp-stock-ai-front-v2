"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Icon } from "@iconify/react";
import { Card } from "@heroui/card";

import {
  fetchSymbolAnalysis,
  type SymbolAnalysis,
  type TimeframeAnalysis,
  formatPrice,
  formatPercent,
  formatVolume,
  getActionColor,
  getTrendColor,
  getRSIColor,
  getConfidenceColor,
} from "@/lib/services/symbolAnalysis";

interface SymbolAnalysisModalProps {
  symbol: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SymbolAnalysisModal({
  symbol,
  isOpen,
  onClose,
}: SymbolAnalysisModalProps) {
  const [analysis, setAnalysis] = React.useState<SymbolAnalysis | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTimeframe, setActiveTimeframe] = React.useState<string>("5m");
  const [isAudioPlaying, setIsAudioPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Fetch analysis when modal opens
  React.useEffect(() => {
    if (isOpen && symbol) {
      loadAnalysis();
    }

    // Cleanup audio on close
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isOpen, symbol]);

  const loadAnalysis = async () => {
    if (!symbol) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchSymbolAnalysis(symbol, {
        timeframes: ["5m", "15m", "30m"],
        refresh: false,
        includeAudio: true,
      });

      setAnalysis(data);

      // Set default timeframe to first available
      const timeframes = Object.keys(data.timeframe_analyses);

      if (timeframes.length > 0) {
        setActiveTimeframe(timeframes[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analysis");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!symbol) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchSymbolAnalysis(symbol, {
        timeframes: ["5m", "15m", "30m"],
        refresh: true,
        includeAudio: true,
      });

      setAnalysis(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh analysis",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = () => {
    if (!analysis?.audio_url) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(analysis.audio_url);
      audioRef.current.onended = () => setIsAudioPlaying(false);
      audioRef.current.onerror = () => {
        setIsAudioPlaying(false);
        setError("Failed to play audio");
      };
    }

    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play();
      setIsAudioPlaying(true);
    }
  };

  const renderHeader = () => {
    if (!analysis) return null;

    const priceChangeColor =
      analysis.price_change_pct >= 0 ? "text-green-400" : "text-red-400";

    return (
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{analysis.symbol}</h2>
          <div className="mt-1 flex items-center gap-3 text-sm">
            <span className="text-2xl font-semibold text-white">
              {formatPrice(analysis.current_price)}
            </span>
            <span className={`font-medium ${priceChangeColor}`}>
              {formatPercent(analysis.price_change_pct)}
            </span>
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            Volume: {formatVolume(analysis.volume)}
          </div>
        </div>
        <div className="flex gap-2">
          {analysis.audio_url && (
            <Button
              isIconOnly
              className="bg-finance-green text-black font-semibold"
              size="sm"
              variant="flat"
              onPress={handlePlayAudio}
            >
              <Icon
                className="text-lg"
                icon={isAudioPlaying ? "solar:pause-bold" : "solar:play-bold"}
              />
            </Button>
          )}
          <Button
            isIconOnly
            className="bg-finance-surface text-white border border-finance-green-40"
            isLoading={isLoading}
            size="sm"
            variant="flat"
            onPress={handleRefresh}
          >
            <Icon className="text-lg" icon="solar:refresh-outline" />
          </Button>
        </div>
      </div>
    );
  };

  const renderConsensus = () => {
    if (!analysis) return null;

    const { consensus, strategy } = analysis;

    return (
      <Card className="border border-finance-green-30 bg-finance-surface-70 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">AI Consensus</h3>
            <Chip
              color={getActionColor(consensus.action)}
              size="lg"
              variant="flat"
            >
              {consensus.action}
            </Chip>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-zinc-400">Confidence</p>
              <Chip
                color={getConfidenceColor(consensus.confidence)}
                variant="flat"
              >
                {(consensus.confidence * 100).toFixed(0)}%
              </Chip>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Alignment</p>
              <p className="text-sm font-medium capitalize text-white">
                {consensus.alignment}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Bullish TFs</p>
              <p className="text-sm font-medium text-green-400">
                {consensus.bullish_timeframes}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">Bearish TFs</p>
              <p className="text-sm font-medium text-red-400">
                {consensus.bearish_timeframes}
              </p>
            </div>
          </div>

          {strategy.action !== "HOLD" && (
            <>
              <div className="border-t border-finance-green-20 pt-4">
                <h4 className="mb-3 text-sm font-semibold text-finance-green">
                  Entry/Exit Strategy
                </h4>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-finance-surface-60 p-3">
                    <p className="text-xs text-zinc-400">Entry Price</p>
                    <p className="text-lg font-bold text-white">
                      {formatPrice(strategy.entry_price)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-red-900/20 p-3">
                    <p className="text-xs text-zinc-400">Stop Loss</p>
                    <p className="text-lg font-bold text-red-400">
                      {formatPrice(strategy.stop_loss)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-900/20 p-3">
                    <p className="text-xs text-zinc-400">TP1</p>
                    <p className="text-lg font-bold text-green-400">
                      {formatPrice(strategy.take_profit_1)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-900/20 p-3">
                    <p className="text-xs text-zinc-400">TP2</p>
                    <p className="text-lg font-bold text-green-400">
                      {formatPrice(strategy.take_profit_2)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-900/20 p-3">
                    <p className="text-xs text-zinc-400">TP3</p>
                    <p className="text-lg font-bold text-green-400">
                      {formatPrice(strategy.take_profit_3)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-finance-surface-60 p-3">
                    <p className="text-xs text-zinc-400">R:R Ratio</p>
                    <p className="text-lg font-bold text-finance-green">
                      1:{strategy.risk_reward_ratio?.toFixed(1) || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-finance-green-30 bg-finance-surface-60 p-3">
                <p className="text-xs font-semibold text-finance-green">
                  Position Size
                </p>
                <p className="text-lg font-bold text-white">
                  {strategy.position_size_pct.toFixed(1)}% of portfolio
                </p>
                <p className="mt-2 text-xs text-zinc-300">
                  {strategy.reasoning}
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
    );
  };

  const renderTimeframeAnalysis = (tf: TimeframeAnalysis) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-finance-surface-60 p-3">
            <p className="text-xs text-zinc-400">Trend</p>
            <Chip color={getTrendColor(tf.trend)} size="sm" variant="flat">
              {tf.trend}
            </Chip>
          </div>
          <div className="rounded-lg bg-finance-surface-60 p-3">
            <p className="text-xs text-zinc-400">Momentum</p>
            <Chip color={getTrendColor(tf.momentum)} size="sm" variant="flat">
              {tf.momentum}
            </Chip>
          </div>
          <div className="rounded-lg bg-finance-surface-60 p-3">
            <p className="text-xs text-zinc-400">Signal Strength</p>
            <p className="text-lg font-bold text-white">
              {tf.signal_strength.toFixed(0)}
            </p>
          </div>
        </div>

        <Card className="border border-finance-green-30 bg-finance-surface-70 p-4">
          <h4 className="mb-3 text-sm font-semibold text-finance-green">
            Technical Indicators
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
            <div>
              <p className="text-xs text-zinc-400">RSI</p>
              <Chip color={getRSIColor(tf.rsi)} size="sm" variant="flat">
                {tf.rsi.toFixed(1)}
              </Chip>
              <p className="mt-1 text-xs capitalize text-zinc-300">
                {tf.rsi_condition.replace("_", " ")}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">MACD</p>
              <p className="font-medium text-white">{tf.macd.toFixed(4)}</p>
              <p className="text-xs text-zinc-400">
                Signal: {tf.macd_signal.toFixed(4)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">ADX</p>
              <p className="font-medium text-white">{tf.adx.toFixed(1)}</p>
              <p className="text-xs text-zinc-400">
                {tf.adx > 25 ? "Strong trend" : "Weak trend"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">EMA 9</p>
              <p className="font-medium text-white">{formatPrice(tf.ema_9)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">EMA 21</p>
              <p className="font-medium text-white">{formatPrice(tf.ema_21)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400">ATR</p>
              <p className="font-medium text-white">{tf.atr.toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-4 border-t border-finance-green-20 pt-4">
            <h5 className="mb-2 text-xs font-semibold text-finance-green">
              Bollinger Bands
            </h5>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <p className="text-xs text-zinc-400">Upper</p>
                <p className="font-medium text-white">
                  {formatPrice(tf.bb_upper)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Middle</p>
                <p className="font-medium text-white">
                  {formatPrice(tf.bb_middle)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Lower</p>
                <p className="font-medium text-white">
                  {formatPrice(tf.bb_lower)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Position</p>
                <Chip size="sm" variant="bordered">
                  {tf.bb_position}
                </Chip>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-finance-green-20 pt-4">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-xs text-zinc-400">Volume Ratio</p>
                <p className="font-medium text-white">
                  {tf.volume_ratio.toFixed(2)}x
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Current Price</p>
                <p className="font-medium text-white">
                  {formatPrice(tf.price)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent className="bg-finance-surface-70 text-white">
        {() => (
          <>
            <ModalHeader className="border-b border-finance-green-30 pb-4">
              {renderHeader()}
            </ModalHeader>
            <ModalBody className="py-6">
              {isLoading && !analysis ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-center">
                    <Spinner color="success" size="lg" />
                    <p className="mt-4 text-zinc-300">Analyzing {symbol}...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-center">
                    <Icon
                      className="mx-auto text-4xl text-red-400"
                      icon="solar:danger-triangle-bold"
                    />
                    <p className="mt-4 text-red-300">{error}</p>
                    <Button
                      className="mt-4 bg-finance-green text-black font-semibold"
                      variant="flat"
                      onPress={loadAnalysis}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : analysis ? (
                <div className="space-y-6">
                  {renderConsensus()}

                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-white">
                      Multi-Timeframe Analysis
                    </h3>
                    <Tabs
                      aria-label="Timeframes"
                      classNames={{
                        tabList:
                          "bg-finance-surface-60 border border-finance-green-40",
                        tab: "data-[selected=true]:bg-finance-green data-[selected=true]:text-black",
                      }}
                      selectedKey={activeTimeframe}
                      variant="solid"
                      onSelectionChange={(key) =>
                        setActiveTimeframe(key as string)
                      }
                    >
                      {Object.entries(analysis.timeframe_analyses).map(
                        ([tf, data]) => (
                          <Tab key={tf} title={tf.toUpperCase()}>
                            {renderTimeframeAnalysis(data)}
                          </Tab>
                        ),
                      )}
                    </Tabs>
                  </div>
                </div>
              ) : null}
            </ModalBody>
            <ModalFooter className="border-t border-finance-green-30">
              <Button
                className="bg-finance-surface text-white border border-finance-green-40"
                variant="flat"
                onPress={onClose}
              >
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
