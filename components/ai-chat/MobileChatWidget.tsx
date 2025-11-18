"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import { Icon } from "@iconify/react";
import { Badge } from "@heroui/badge";

import { MobileAIChatRoom } from "./MobileAIChatRoom";

import { useChat } from "@/lib/ai-chat/ChatProvider";

export function MobileChatWidget() {
  const { isOpen, unreadCount, toggleChat, markAsRead } = useChat();
  const [isMounted, setIsMounted] = useState(false);

  // Only render on client to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Mark as read when opened
    if (isOpen) {
      markAsRead();
    }
  }, [isOpen, markAsRead]);

  // Prevent body scroll when chat is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Don't render until mounted to avoid hydration issues
  if (!isMounted) {
    return null;
  }

  if (!isOpen) {
    // Floating button - always visible on mobile
    return (
      <div className="fixed bottom-4 right-4 z-50 md:hidden">
        <Badge
          color="danger"
          content={unreadCount > 0 ? unreadCount : null}
          isInvisible={unreadCount === 0}
          placement="top-left"
        >
          <Button
            isIconOnly
            className="w-16 h-16 rounded-full shadow-2xl active:scale-95 transition-transform bg-finance-green hover:bg-finance-green/90"
            color="success"
            size="lg"
            onPress={toggleChat}
          >
            <Icon
              className="text-2xl text-white"
              icon="solar:users-group-two-rounded-bold"
            />
          </Button>
        </Badge>
      </div>
    );
  }

  // Full screen mobile chat
  return (
    <div className="fixed inset-0 z-[100] md:hidden">
      {/* Solid backdrop to block dashboard view */}
      <div className="absolute inset-0 bg-finance-black" />
      <div className="relative w-full h-full bg-finance-surface flex flex-col">
        {/* Mobile Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-finance-green-25 bg-finance-surface">
          <div className="flex items-center gap-2">
            <Icon
              className="text-2xl text-finance-green"
              icon="solar:users-group-two-rounded-bold"
            />
            <h2 className="text-lg font-semibold text-white">AI Agents</h2>
          </div>
          <Button
            isIconOnly
            className="bg-finance-surface hover:bg-finance-surface-80 min-w-[44px] min-h-[44px]"
            size="lg"
            variant="flat"
            onPress={toggleChat}
          >
            <Icon
              className="text-xl text-white"
              icon="solar:close-circle-bold"
            />
          </Button>
        </div>

        {/* Mobile Chat Room - Full height */}
        <div className="flex-1 overflow-hidden">
          <MobileAIChatRoom />
        </div>
      </div>
    </div>
  );
}
