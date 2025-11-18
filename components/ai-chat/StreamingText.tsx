"use client";

import React, { useState, useEffect, useRef } from "react";

type StreamingTextProps = {
  content: string;
  speed?: number; // Characters per frame (default: 2)
  onComplete?: () => void;
  isStreaming?: boolean;
};

export function StreamingText({
  content,
  speed = 2,
  onComplete,
  isStreaming = true,
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(!isStreaming);
  const currentIndexRef = useRef(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // If not streaming, show all content immediately
    if (!isStreaming) {
      setDisplayedText(content);
      setIsComplete(true);

      return;
    }

    // Reset when content changes
    currentIndexRef.current = 0;
    setDisplayedText("");
    setIsComplete(false);

    let lastTime = performance.now();
    const targetFrameTime = 1000 / 60; // 60 FPS

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;

      if (deltaTime >= targetFrameTime) {
        lastTime = currentTime;

        if (currentIndexRef.current < content.length) {
          // Add multiple characters per frame for smoother, faster streaming
          const charsToAdd = Math.min(
            speed,
            content.length - currentIndexRef.current,
          );

          currentIndexRef.current += charsToAdd;

          setDisplayedText(content.slice(0, currentIndexRef.current));
        } else {
          // Streaming complete
          setIsComplete(true);
          onComplete?.();

          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [content, speed, isStreaming, onComplete]);

  return (
    <>
      {displayedText}
      {!isComplete && (
        <span className="inline-block w-1 h-4 bg-finance-green ml-0.5 animate-pulse" />
      )}
    </>
  );
}
