/**
 * Tests for mention parsing and symbol detection
 * Run with: npm test mention-parsing.test.ts
 */

describe("Mention Parsing", () => {
  test("extracts agent mentions from content", () => {
    const content =
      "Hey @Nova, what do you think about this setup? @Atlas might have insights too.";
    const agentRegex = /@(nova|atlas|cipher|sentinel)\b/gi;
    const matches = Array.from(content.matchAll(agentRegex));
    const agents = matches.map((m) => m[1].toLowerCase());

    expect(agents).toEqual(["nova", "atlas"]);
  });

  test("extracts stock symbols from content", () => {
    const content =
      "Looking at $PLTR and $NVDA - both showing strength. $TSLA too.";
    const symbolRegex = /\$([A-Z]{1,5})\b/g;
    const matches = Array.from(content.matchAll(symbolRegex));
    const symbols = matches.map((m) => m[1]);

    expect(symbols).toEqual(["PLTR", "NVDA", "TSLA"]);
  });

  test("handles mixed content with both mentions and symbols", () => {
    const content =
      "@Cipher, check out $PLTR volume. @Sentinel, what's the risk on $NVDA?";

    const agentMatches = Array.from(
      content.matchAll(/@(nova|atlas|cipher|sentinel)\b/gi),
    );
    const agents = agentMatches.map((m) => m[1].toLowerCase());

    const symbolMatches = Array.from(content.matchAll(/\$([A-Z]{1,5})\b/g));
    const symbols = symbolMatches.map((m) => m[1]);

    expect(agents).toEqual(["cipher", "sentinel"]);
    expect(symbols).toEqual(["PLTR", "NVDA"]);
  });

  test("case insensitive agent matching", () => {
    const content = "@NOVA @Nova @nova all refer to same agent";
    const agentRegex = /@(nova|atlas|cipher|sentinel)\b/gi;
    const matches = Array.from(content.matchAll(agentRegex));
    const agents = matches.map((m) => m[1].toLowerCase());

    expect(agents).toEqual(["nova", "nova", "nova"]);
    expect(new Set(agents).size).toBe(1); // All same agent
  });

  test("ignores invalid symbols", () => {
    const content = "$A $TOOLONG $NVDA $12345";
    const symbolRegex = /\$([A-Z]{1,5})\b/g;
    const matches = Array.from(content.matchAll(symbolRegex));
    const symbols = matches.map((m) => m[1]);

    // Should only match valid 1-5 letter symbols
    expect(symbols).toEqual(["A", "NVDA"]);
  });

  test("handles content without any mentions or symbols", () => {
    const content = "This is just a regular message about the market.";

    const agentMatches = Array.from(
      content.matchAll(/@(nova|atlas|cipher|sentinel)\b/gi),
    );
    const symbolMatches = Array.from(content.matchAll(/\$([A-Z]{1,5})\b/g));

    expect(agentMatches.length).toBe(0);
    expect(symbolMatches.length).toBe(0);
  });
});

describe("WebSocket Message Format", () => {
  test("formats user message correctly", () => {
    const content = "What about $PLTR?";
    const mentionedAgents = ["nova"];
    const symbols = ["PLTR"];

    const message = {
      type: "user_message",
      data: {
        content,
        user_id: "test-user",
        mentioned_agents: mentionedAgents,
        symbols,
      },
    };

    expect(message.type).toBe("user_message");
    expect(message.data.mentioned_agents).toContain("nova");
    expect(message.data.symbols).toContain("PLTR");
  });

  test("formats agent message correctly", () => {
    const agentMessage = {
      type: "agent_message",
      data: {
        agent_id: "nova",
        agent_name: "Nova",
        content: "Looking at $PLTR, RSI is at 68...",
        confidence: 0.75,
        symbols: ["PLTR"],
        mentioned_agents: [],
        timestamp: new Date().toISOString(),
      },
    };

    expect(agentMessage.data.agent_id).toBe("nova");
    expect(agentMessage.data.confidence).toBeGreaterThan(0);
    expect(agentMessage.data.confidence).toBeLessThanOrEqual(1);
  });
});

describe("Confidence Extraction", () => {
  test("extracts explicit confidence percentage", () => {
    const content = "I'm 75% confident this will break out.";
    const match = content.match(/(\d+)%\s+confident/i);
    const confidence = match ? parseFloat(match[1]) / 100 : 0.7;

    expect(confidence).toBe(0.75);
  });

  test("maps confidence keywords to values", () => {
    const confidenceMap: Record<string, number> = {
      "very confident": 0.85,
      "fairly confident": 0.75,
      "moderately confident": 0.6,
      "not confident": 0.4,
      uncertain: 0.3,
    };

    expect(confidenceMap["very confident"]).toBe(0.85);
    expect(confidenceMap["uncertain"]).toBe(0.3);
  });
});

export {}; // Make this a module
