import type { AIResponse } from "@/types";

interface ParsedResult {
  response: AIResponse | null;
  replyText: string;
}

export function extractJSONFromMarkdown(text: string): AIResponse | null {
  const jsonBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (jsonBlockMatch?.[1]) {
    try {
      return JSON.parse(jsonBlockMatch[1]) as AIResponse;
    } catch {
      // Fall through
    }
  }

  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      const candidate = text.substring(braceStart, braceEnd + 1);
      const parsed = JSON.parse(candidate);
      if (parsed.type && (parsed.type === "generate" || parsed.type === "modify")) {
        return parsed as AIResponse;
      }
    } catch {
      // Not valid JSON
    }
  }

  return null;
}

export function parseAIResponse(raw: string): ParsedResult {
  const response = extractJSONFromMarkdown(raw);

  let replyText = raw;

  if (response) {
    if (response.message) {
      replyText = response.message;
    } else {
      replyText = raw
        .replace(/```(?:json)?\s*\n[\s\S]*?\n```/g, "")
        .trim();
    }
  }

  return { response, replyText };
}
