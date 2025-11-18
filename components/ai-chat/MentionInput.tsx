"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";

type Mention = {
  type: "agent" | "symbol";
  value: string;
  display: string;
};

type MentionInputProps = {
  onSend: (message: string, mentionedAgents: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
};

const AGENTS = [
  { id: "nova", name: "Nova", avatar: "🔬" },
  { id: "atlas", name: "Atlas", avatar: "🌍" },
  { id: "cipher", name: "Cipher", avatar: "📊" },
  { id: "sentinel", name: "Sentinel", avatar: "🛡️" },
];

export function MentionInput({
  onSend,
  disabled = false,
  placeholder = "Type @ to mention agents or $ for symbols...",
}: MentionInputProps) {
  const [value, setValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Mention[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const [top25Symbols, setTop25Symbols] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch top 25 symbols from moonshot.top_25 table
  useEffect(() => {
    const fetchTop25Symbols = async () => {
      try {
        const response = await fetch("/api/top/25?limit=25&select=symbol");

        if (response.ok) {
          const data = await response.json();
          // Extract symbols from the response
          const symbols = Array.isArray(data)
            ? data.map((item: { symbol: string }) => item.symbol.toUpperCase())
            : [];

          setTop25Symbols(symbols);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("Error fetching top 25 symbols:", error);
        // Fallback to empty array if fetch fails
        setTop25Symbols([]);
      }
    };

    // Fetch immediately
    fetchTop25Symbols();

    // Refresh every 5 minutes to get updated top 25
    const interval = setInterval(fetchTop25Symbols, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Detect @ or $ at cursor position
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);

    // Check for @ mention
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      const query = atMatch[1].toLowerCase();
      const filtered = AGENTS.filter((agent) =>
        agent.name.toLowerCase().startsWith(query),
      ).map((agent) => ({
        type: "agent" as const,
        value: agent.id,
        display: `${agent.avatar} ${agent.name}`,
      }));

      if (filtered.length > 0) {
        setSuggestions(filtered);
        setShowSuggestions(true);
        setMentionStart(cursorPos - atMatch[0].length);
        setSelectedIndex(0);

        return;
      }
    }

    // Check for $ symbol
    const dollarMatch = textBeforeCursor.match(/\$([A-Z]*)$/);

    if (dollarMatch) {
      const query = dollarMatch[1].toUpperCase();

      // Filter top 25 symbols based on query
      const filtered = top25Symbols
        .filter((symbol) => symbol.startsWith(query))
        .map((symbol) => ({
          type: "symbol" as const,
          value: symbol,
          display: `$${symbol}`,
        }));

      // Show suggestions if we have matches or if user is typing (to show all when just $)
      if (filtered.length > 0 || query.length === 0) {
        // If no query, show all top 25 symbols (limited to 15 for UI)
        const symbolsToShow =
          query.length === 0
            ? top25Symbols.slice(0, 15).map((symbol) => ({
                type: "symbol" as const,
                value: symbol,
                display: `$${symbol}`,
              }))
            : filtered.slice(0, 15); // Limit to 15 suggestions max

        if (symbolsToShow.length > 0) {
          setSuggestions(symbolsToShow);
          setShowSuggestions(true);
          setMentionStart(cursorPos - dollarMatch[0].length);
          setSelectedIndex(0);

          return;
        }
      }
    }

    // No matches, hide suggestions
    setShowSuggestions(false);
    setSuggestions([]);
  }, [value, top25Symbols]);

  const insertMention = (mention: Mention) => {
    const cursorPos = inputRef.current?.selectionStart || 0;
    const prefix = value.substring(0, mentionStart);
    const suffix = value.substring(cursorPos);

    const mentionText =
      mention.type === "agent" ? `@${mention.value} ` : `$${mention.value} `;

    const newValue = prefix + mentionText + suffix;

    setValue(newValue);
    setShowSuggestions(false);

    // Focus back to input
    setTimeout(() => {
      if (inputRef.current) {
        const newPos = prefix.length + mentionText.length;

        inputRef.current.focus();
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }

      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;

      case "Enter":
      case "Tab":
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          insertMention(suggestions[selectedIndex]);
        }
        break;

      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  const handleSend = () => {
    if (!value.trim() || disabled) {
      // eslint-disable-next-line no-console
      console.log("handleSend blocked:", {
        hasValue: !!value.trim(),
        disabled,
      });

      return;
    }

    // Extract mentioned agents
    const agentMatches = value.matchAll(/@(nova|atlas|cipher|sentinel)\b/gi);
    const mentionedAgents = Array.from(agentMatches).map((m) =>
      m[1].toLowerCase(),
    );

    // eslint-disable-next-line no-console
    console.log("handleSend called with:", { value, mentionedAgents });

    // Call onSend - it's async but we don't need to await it
    // The sendMessage function handles its own errors
    try {
      onSend(value, mentionedAgents);
      // Clear input immediately for better UX
      setValue("");
      setShowSuggestions(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error calling onSend:", error);
    }
  };

  return (
    <div className="relative">
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute bottom-full mb-2 left-0 right-0 max-h-48 overflow-y-auto bg-finance-surface border border-finance-green-25 z-50">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.value}`}
              className={`w-full px-4 py-2 cursor-pointer transition-colors text-left ${
                index === selectedIndex
                  ? "bg-finance-green-25"
                  : "hover:bg-finance-surface-60"
              }`}
              type="button"
              onClick={() => insertMention(suggestion)}
            >
              <span className="text-sm text-white">{suggestion.display}</span>
            </button>
          ))}
        </Card>
      )}

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          classNames={{
            input: "bg-finance-surface text-white",
            inputWrapper: "bg-finance-surface border-finance-green-25",
          }}
          disabled={disabled}
          endContent={
            <div className="flex gap-1 text-xs text-zinc-500">
              <span>@ for agents</span>
              <span>•</span>
              <span>$ for symbols</span>
            </div>
          }
          placeholder={placeholder}
          readOnly={false}
          value={value}
          onChange={(e) => {
            // eslint-disable-next-line no-console
            console.log("Input onChange:", e.target.value);
            setValue(e.target.value);
          }}
          onFocus={() => {
            // eslint-disable-next-line no-console
            console.log("Input focused");
          }}
          onKeyDown={handleKeyDown}
        />
        <Button
          color="success"
          isDisabled={!value.trim() || disabled}
          onPress={handleSend}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <line x1="22" x2="11" y1="2" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
