import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';
import { AiServiceException } from '../exceptions/ai-service.exception';
import { AiClient, GenerationConfig } from './ai-client.interface';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_TRANSPORT_ATTEMPTS = 3;
const RETRY_DELAY_MS = 500;

/**
 * Thin HTTP client for Gemini's generateContent endpoint, shared by every
 * AI feature. Maps transport failures onto AiServiceException.
 */
@Injectable()
export class GeminiClient implements AiClient {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  async generateText(
    prompt: string,
    generationConfig: GenerationConfig = {},
  ): Promise<string> {
    const apiKey = this.config.get('gemini.apiKey', { infer: true });
    const model = this.config.get('gemini.model', { infer: true });

    if (apiKey === '') {
      throw AiServiceException.unreachable(
        'no API key configured (set GEMINI_API_KEY)',
      );
    }

    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig,
    });

    let lastTransportError: unknown;

    for (let attempt = 1; attempt <= MAX_TRANSPORT_ATTEMPTS; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(`${BASE_URL}/${model}:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.status === 429) {
          throw AiServiceException.rateLimited();
        }

        if (!response.ok) {
          throw AiServiceException.unreachable(
            `upstream responded with status ${response.status}`,
          );
        }

        const payload = (await response.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const answer = payload.candidates?.[0]?.content?.parts?.[0]?.text;

        if (typeof answer !== 'string' || answer.trim() === '') {
          throw AiServiceException.invalidResponse(
            'response contained no text candidate',
          );
        }

        return answer;
      } catch (error) {
        clearTimeout(timeout);

        if (error instanceof AiServiceException) {
          throw error;
        }

        lastTransportError = error;
        if (attempt < MAX_TRANSPORT_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
    }

    const reason =
      lastTransportError instanceof Error
        ? lastTransportError.message
        : 'unknown error';
    throw AiServiceException.unreachable(reason);
  }
}
