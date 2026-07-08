import {
  AiClient,
  GenerationConfig,
} from '../../src/ai/clients/ai-client.interface';

/**
 * Stands in for GeminiClient in e2e tests so they never make a real network
 * call. Mirrors the shape of a valid Gemini response for both AI features.
 */
export class FakeAiClient implements AiClient {
  generateText(
    _prompt: string,
    config: GenerationConfig = {},
  ): Promise<string> {
    if (config.responseMimeType === 'application/json') {
      return Promise.resolve(
        JSON.stringify({
          title: 'Fake generated title',
          category: 'general',
          priority: 'medium',
          summary: 'Fake generated summary.',
        }),
      );
    }

    return Promise.resolve('Fake building summary.');
  }
}
