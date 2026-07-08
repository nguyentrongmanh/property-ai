export const AI_CLIENT = Symbol('AI_CLIENT');

export interface GenerationConfig {
  temperature?: number;
  responseMimeType?: string;
  responseSchema?: Record<string, unknown>;
}

export interface AiClient {
  generateText(
    prompt: string,
    generationConfig?: GenerationConfig,
  ): Promise<string>;
}
