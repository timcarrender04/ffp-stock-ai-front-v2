"use client";

import { usePathname } from "next/navigation";

import { FloatingChatWidget } from "@/components/ai-chat/FloatingChatWidget";
import { MobileChatWidget } from "@/components/ai-chat/MobileChatWidget";

export function ConditionalChatWidgets() {
  const pathname = usePathname();

  // Hide chat widgets on login and signup pages
  const hideChatPages = ["/login", "/signup"];
  const shouldHideChat = hideChatPages.includes(pathname);

  if (shouldHideChat) {
    return null;
  }

  return (
    <>
      <FloatingChatWidget />
      <MobileChatWidget />
    </>
  );
}
