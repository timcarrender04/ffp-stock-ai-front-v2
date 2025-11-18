"use client";

import React from "react";
import { Card } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";

type AgentCardProps = {
  agent: {
    id: string;
    name: string;
    role: string;
    avatar: string;
    color: string;
    specialty: string;
  };
  isActive?: boolean;
  lastActivity?: string;
  confidence?: number;
  messageCount?: number;
  onMention?: () => void;
};

export function AgentCard({
  agent,
  isActive = false,
  lastActivity,
  confidence,
  messageCount = 0,
  onMention,
}: AgentCardProps) {
  const colorClasses = {
    blue: "bg-blue-500/20 border-blue-500/40 text-blue-300",
    purple: "bg-purple-500/20 border-purple-500/40 text-purple-300",
    green: "bg-green-500/20 border-green-500/40 text-green-300",
    orange: "bg-orange-500/20 border-orange-500/40 text-orange-300",
  };

  const colorClass =
    colorClasses[agent.color as keyof typeof colorClasses] || colorClasses.blue;

  return (
    <Card
      isPressable
      className={`p-3 border ${colorClass} cursor-pointer transition-all hover:scale-105`}
      onPress={onMention}
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl flex-shrink-0">{agent.avatar}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-white truncate">
              {agent.name}
            </h4>
            {isActive && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
            )}
          </div>

          <p className="text-xs opacity-70 truncate">{agent.role}</p>

          <div className="mt-2 space-y-1">
            <p className="text-[10px] opacity-60 line-clamp-2">
              {agent.specialty}
            </p>

            {confidence !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span>Confidence</span>
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

            <div className="flex items-center justify-between text-[10px] mt-2">
              <Chip className="text-[9px] px-1" size="sm" variant="flat">
                {messageCount} messages
              </Chip>

              {lastActivity && (
                <span className="opacity-50 text-[9px]">
                  {formatTime(lastActivity)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleDateString();
}
