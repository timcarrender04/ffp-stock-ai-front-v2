"use client";

import type {
  NewsArticle,
  NewsEvent,
  NewsQueueItem,
} from "@/lib/services/news";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Image } from "@heroui/image";

import {
  formatDateTime,
  formatNumber,
  formatPercent,
  formatPercentRaw,
  formatRelativeTime,
} from "@/lib/utils/formatters";

type Props = {
  events: NewsEvent[];
  articles: NewsArticle[];
  queue: NewsQueueItem[];
};

export function NewsRadar({ events, articles, queue }: Props) {
  // Deduplicate events based on title, symbol, and event_type
  const uniqueEvents = events.reduce((acc: NewsEvent[], current) => {
    const isDuplicate = acc.some(
      (event) =>
        event.title === current.title &&
        event.symbol === current.symbol &&
        event.event_type === current.event_type,
    );

    if (!isDuplicate) {
      acc.push(current);
    }

    return acc;
  }, []);

  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 w-full max-w-full overflow-hidden">
      <Card className="border border-finance-green-25 bg-finance-surface-70/80 shadow-2xl backdrop-blur-xl lg:col-span-2">
        <CardHeader className="flex items-center justify-between p-3 sm:p-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-finance-green-70">
              Signal Sweep
            </p>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              News & Catalyst Feed
            </h3>
          </div>
          <Icon
            className="text-xl sm:text-2xl text-finance-green"
            icon="solar:radar-2-bold-duotone"
          />
        </CardHeader>
        <CardBody className="flex flex-col gap-3 p-3 sm:p-4">
          {uniqueEvents.length === 0 ? (
            <p className="text-xs sm:text-sm text-zinc-400">
              No real-time events yet.
            </p>
          ) : (
            uniqueEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-col gap-2 rounded-2xl border border-finance-green-30/60 bg-black/15 p-3 sm:p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Chip size="sm" variant="flat">
                      {event.event_type}
                    </Chip>
                    {event.symbol ? (
                      <span className="text-sm font-semibold text-white">
                        {event.symbol}
                      </span>
                    ) : null}
                  </div>
                  <span
                    suppressHydrationWarning
                    className="text-xs text-zinc-400"
                  >
                    {formatRelativeTime(event.occurred_at)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-white">
                    {event.title ?? "News alert"}
                  </p>
                  <p className="text-xs text-zinc-300 line-clamp-2">
                    {event.summary}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                  <span>Confidence {formatPercent(event.confidence, 0)}</span>
                  {event.movement ? <span>Bias {event.movement}</span> : null}
                  <span>Source {event.source}</span>
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      <div className="flex flex-col gap-4 sm:gap-6">
        <Card className="border border-finance-green-25 bg-finance-surface-70/80 shadow-2xl backdrop-blur-xl">
          <CardHeader className="flex items-center justify-between p-3 sm:p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-finance-green-70">
                Featured Stories
              </p>
              <h3 className="text-base sm:text-lg font-semibold text-white">
                Moonshot Digest
              </h3>
            </div>
            <Icon
              className="text-lg sm:text-xl text-finance-green"
              icon="solar:news-linear-duotone"
            />
          </CardHeader>
          <CardBody className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4">
            {articles.length === 0 ? (
              <p className="text-xs sm:text-sm text-zinc-400">
                No articles harvested yet.
              </p>
            ) : (
              articles.slice(0, 4).map((article) => (
                <div
                  key={article.id}
                  className="flex gap-2 sm:gap-3 rounded-2xl border border-finance-green-30/60 bg-black/15 p-3 sm:p-4"
                >
                  <div className="relative h-12 w-12 sm:h-16 sm:w-16 overflow-hidden rounded-xl border border-finance-green-30/60 bg-finance-surface-80 flex-shrink-0">
                    {article.image_url ? (
                      <Image
                        alt={article.headline}
                        className="h-full w-full object-cover"
                        height={64}
                        loading="lazy"
                        src={article.image_url}
                        width={64}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-finance-green-60">
                        <Icon className="text-2xl" icon="solar:news-outline" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <Link
                      className="text-sm font-semibold text-white hover:text-finance-green"
                      href={article.url ?? "#"}
                      target="_blank"
                    >
                      {article.headline}
                    </Link>
                    <p
                      suppressHydrationWarning
                      className="text-xs text-zinc-400"
                    >
                      {article.primary_symbol ?? "Multi-symbol"} ·{" "}
                      {formatDateTime(article.published_at)}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                      <span>Source {article.source}</span>
                      <span>Sentiment {article.movement ?? "neutral"}</span>
                      <span>
                        Confidence {formatPercentRaw(article.confidence, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card className="border border-finance-green-25 bg-finance-surface-70/80 shadow-2xl backdrop-blur-xl">
          <CardHeader className="flex items-center justify-between p-3 sm:p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-finance-green-70">
                AI Research Queue
              </p>
              <h3 className="text-base sm:text-lg font-semibold text-white">
                Processing Status
              </h3>
            </div>
            <Icon
              className="text-lg sm:text-xl text-finance-green"
              icon="solar:cpu-bolt-linear"
            />
          </CardHeader>
          <CardBody className="flex flex-col gap-3 p-3 sm:p-4">
            {queue.length === 0 ? (
              <p className="text-xs sm:text-sm text-zinc-400">
                Queue is clear.
              </p>
            ) : (
              queue.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 rounded-2xl border border-finance-green-30/60 bg-black/15 p-3 sm:p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {item.symbol}
                      </span>
                      <Chip size="sm" variant="flat">
                        {item.queue_status}
                      </Chip>
                    </div>
                    <p
                      suppressHydrationWarning
                      className="text-xs text-zinc-400"
                    >
                      Trigger {item.trigger_reason} ·{" "}
                      {formatRelativeTime(item.created_at)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-300">
                      <span>Priority {formatNumber(item.priority)}</span>
                      <span>
                        Confidence {formatPercent(item.confidence_score, 0)}
                      </span>
                      <span>Errors {item.error_count ?? 0}</span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right text-xs text-zinc-400">
                    <p suppressHydrationWarning>
                      Started {formatRelativeTime(item.processing_started_at)}
                    </p>
                    <p suppressHydrationWarning>
                      Finished{" "}
                      {formatRelativeTime(item.processing_completed_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
