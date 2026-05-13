import type {
  ChatMessage,
  ModelConfig,
  AIRequestConfig,
  ContentPart,
} from "@/types";
import { buildSystemPrompt, buildCanvasContext, buildPrototypeContext, buildConversationMessages, buildMemoryContext, type MemoryContextInput } from "./ContextBuilder";

interface BuildRequestInput {
  modelConfig: ModelConfig;
  messages: ChatMessage[];
  canvasJSON: string;
  canvasWidth: number;
  canvasHeight: number;
  screenshotDataUrl?: string;
  skillName?: string;
  memoryContext?: MemoryContextInput;
  prototypeHtml?: string;
  prototypeCss?: string;
}

export class ChatEngine {
  private requestCounter = 0;

  generateRequestId(): string {
    this.requestCounter += 1;
    return `req-${Date.now()}-${this.requestCounter}`;
  }

  buildRequest(input: BuildRequestInput): AIRequestConfig {
    if (!input.modelConfig) {
      throw new Error("No model configured. Please go to Settings and configure a model first.");
    }

    const {
      modelConfig,
      messages,
      canvasJSON,
      canvasWidth,
      canvasHeight,
      screenshotDataUrl,
      skillName,
      memoryContext,
      prototypeHtml,
      prototypeCss,
    } = input;

    const systemPrompt = buildSystemPrompt({
      canvasWidth,
      canvasHeight,
    });

    const contextContent = prototypeHtml
      ? buildPrototypeContext(prototypeHtml, prototypeCss ?? "")
      : buildCanvasContext({
          canvasJSON,
          canvasWidth,
          canvasHeight,
        });

    const canvasContextMessage = screenshotDataUrl && !prototypeHtml
      ? {
          role: "user" as const,
          content: [
            { type: "text" as const, text: contextContent },
            { type: "image_url" as const, image_url: { url: screenshotDataUrl } },
          ] as ContentPart[],
        }
      : { role: "user" as const, content: contextContent as string };

    const conversationMessages = buildConversationMessages(messages);

    const fullMessages: Array<{
      role: "user" | "assistant" | "system";
      content: string | ContentPart[];
    }> = [
      { role: "system", content: systemPrompt },
      canvasContextMessage,
    ];

    if (memoryContext) {
      const memoryStr = buildMemoryContext(memoryContext);
      if (memoryStr) {
        fullMessages.push({ role: "system", content: memoryStr });
      }
    }

    if (skillName) {
      fullMessages.push({
        role: "system",
        content: `Active skill: ${skillName}. Follow the skill's structured generation process.`,
      });
    }

    fullMessages.push(...conversationMessages);

    return {
      modelConfigId: modelConfig.id,
      messages: fullMessages,
      stream: true,
      temperature: 0.7,
      maxTokens: 16384,
    };
  }

  async sendRequest(config: AIRequestConfig, requestId: string): Promise<void> {
    const { invoke } = await import("@tauri-apps/api/core");

    await invoke("ai_chat_stream", {
      input: {
        model_config_id: config.modelConfigId,
        messages: config.messages.map((m) => ({
          role: m.role,
          content: typeof m.content === "string" ? m.content : m.content,
        })),
        stream: config.stream,
        request_id: requestId,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      },
    });
  }
}
