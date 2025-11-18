"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { Badge } from "@heroui/badge";

import { AIAgentChatRoom } from "./AIAgentChatRoom";

import { useChat } from "@/lib/ai-chat/ChatProvider";

type WidgetSize = "minimized" | "normal" | "expanded" | "fullscreen";

export function FloatingChatWidget() {
  const { isOpen, unreadCount, toggleChat, markAsRead } = useChat();
  const [size, setSize] = useState<WidgetSize>("expanded");
  const [isMounted, setIsMounted] = useState(false);

  // Only render on client to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Keyboard shortcut: Alt+C to toggle chat
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "c") {
        e.preventDefault();
        toggleChat();
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [toggleChat]);

  useEffect(() => {
    // Mark as read when opened
    if (isOpen) {
      markAsRead();
    }
  }, [isOpen, markAsRead]);

  const getSizeClasses = () => {
    switch (size) {
      case "minimized":
        return "w-16 h-16";
      case "normal":
        return "w-full sm:w-[600px] h-[600px] sm:h-[700px]";
      case "expanded":
        return "w-full lg:w-[1200px] h-[700px] lg:h-[900px]";
      case "fullscreen":
        return "w-screen h-screen bottom-0 right-0";
    }
  };

  const handleToggleSize = () => {
    if (size === "normal") {
      setSize("expanded");
    } else if (size === "expanded") {
      setSize("fullscreen");
    } else if (size === "fullscreen") {
      setSize("expanded");
    }
  };

  const handleMinimize = () => {
    setSize("minimized");
  };

  const handleExpand = () => {
    setSize("expanded");
  };

  // Don't render until mounted to avoid hydration issues
  if (!isMounted) {
    return null;
  }

  if (!isOpen) {
    // Floating button - desktop only (mobile uses MobileChatWidget)
    return (
      <div className="hidden md:block fixed bottom-6 right-6 z-50">
        <Badge
          color="danger"
          content={unreadCount > 0 ? unreadCount : null}
          isInvisible={unreadCount === 0}
          placement="top-left"
        >
          <Button
            isIconOnly
            className="w-16 h-16 rounded-full shadow-2xl active:scale-95 transition-transform"
            color="success"
            size="lg"
            onPress={toggleChat}
          >
            <Icon
              className="text-2xl"
              icon="solar:users-group-two-rounded-bold"
            />
          </Button>
        </Badge>

        {/* Tooltip */}
        <div className="absolute bottom-full mb-2 right-0 bg-finance-surface px-3 py-1 rounded text-xs text-white whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          AI Agent Chat (Alt+C)
        </div>
      </div>
    );
  }

  // Desktop only - mobile uses MobileChatWidget
  return (
    <div
      className={`hidden md:block fixed z-50 transition-all duration-300 ${getSizeClasses()} shadow-2xl ${size === "fullscreen" ? "inset-0" : "bottom-6 right-6"}`}
    >
      <div
        className={`relative w-full h-full overflow-hidden border-2 border-finance-green-40 bg-finance-surface-70 backdrop-blur-xl ${size === "fullscreen" ? "rounded-none" : "rounded-3xl"}`}
      >
        {/* Header Controls */}
        {size === "minimized" ? (
          // Minimized state - show expand button in center
          <div className="w-full h-full flex items-center justify-center">
            <Button
              isIconOnly
              className="bg-finance-green/20 hover:bg-finance-green/30"
              color="success"
              size="lg"
              variant="flat"
              onPress={handleExpand}
            >
              <Icon
                className="text-2xl"
                icon="solar:users-group-two-rounded-bold"
              />
            </Button>
          </div>
        ) : (
          <>
            {/* Header Controls for Normal/Expanded */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <Button
                isIconOnly
                className="bg-finance-surface/80 hover:bg-finance-surface"
                size="sm"
                title="Minimize"
                variant="flat"
                onPress={handleMinimize}
              >
                <Icon
                  className="text-lg"
                  icon="solar:minimize-square-minimalistic-bold"
                />
              </Button>

              <Button
                isIconOnly
                className="bg-finance-surface/80 hover:bg-finance-surface"
                size="sm"
                title={
                  size === "fullscreen"
                    ? "Exit fullscreen"
                    : size === "expanded"
                      ? "Fullscreen"
                      : "Expand"
                }
                variant="flat"
                onPress={handleToggleSize}
              >
                <Icon
                  className="text-lg"
                  icon={
                    size === "fullscreen"
                      ? "solar:quit-fullscreen-bold"
                      : "solar:maximize-bold"
                  }
                />
              </Button>

              <Button
                isIconOnly
                className="bg-finance-surface/80 hover:bg-finance-surface"
                size="sm"
                title="Close"
                variant="flat"
                onPress={toggleChat}
              >
                <Icon className="text-lg" icon="solar:close-circle-bold" />
              </Button>
            </div>

            {/* Chat Room */}
            <div className="w-full h-full">
              <AIAgentChatRoom />
            </div>

            {/* Keyboard shortcut hint */}
            <div className="absolute bottom-2 left-2 text-[10px] text-zinc-500 opacity-50">
              Alt+C to toggle
            </div>
          </>
        )}
      </div>
    </div>
  );
}
