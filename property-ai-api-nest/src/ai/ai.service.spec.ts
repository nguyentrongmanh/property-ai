import { AiService } from './ai.service';
import { AiClient } from './clients/ai-client.interface';
import { AiServiceException } from './exceptions/ai-service.exception';
import { BuildingSummaryPromptBuilder } from './prompt-builders/building-summary-prompt.builder';
import { WorkOrderPromptBuilder } from './prompt-builders/work-order-prompt.builder';
import { WorkOrderResponseValidator } from './validators/work-order-response.validator';

const VALID_RESPONSE = JSON.stringify({
  title: 'Leak',
  category: 'plumbing',
  priority: 'high',
  summary: 'Fix it.',
});

class StubClient implements AiClient {
  responses: string[] = [];
  calls = 0;

  generateText(): Promise<string> {
    this.calls += 1;
    const next = this.responses.shift();
    if (next === undefined) {
      throw new Error('StubClient: no stubbed response left');
    }
    if (next === '__RATE_LIMITED__') {
      throw AiServiceException.rateLimited();
    }
    return Promise.resolve(next);
  }
}

describe('AiService', () => {
  let client: StubClient;
  let service: AiService;

  beforeEach(() => {
    client = new StubClient();
    service = new AiService(
      client,
      new BuildingSummaryPromptBuilder(),
      new WorkOrderPromptBuilder(),
      new WorkOrderResponseValidator(),
    );
  });

  it('returns a validated work order on the first successful attempt', async () => {
    client.responses = [VALID_RESPONSE];

    const result = await service.generateWorkOrder('there is a leak');

    expect(result.title).toBe('Leak');
    expect(client.calls).toBe(1);
  });

  it('retries once after an invalid response, then succeeds', async () => {
    client.responses = ['not json', VALID_RESPONSE];

    const result = await service.generateWorkOrder('there is a leak');

    expect(result.title).toBe('Leak');
    expect(client.calls).toBe(2);
  });

  it('gives up after the max attempts are exhausted', async () => {
    client.responses = ['not json', 'still not json'];

    await expect(service.generateWorkOrder('x')).rejects.toBeInstanceOf(
      AiServiceException,
    );
    expect(client.calls).toBe(2);
  });

  it('does not retry when the client reports a rate limit', async () => {
    client.responses = ['__RATE_LIMITED__'];

    let caught: AiServiceException | undefined;
    try {
      await service.generateWorkOrder('x');
    } catch (error) {
      caught = error as AiServiceException;
    }

    expect(caught?.isRateLimited()).toBe(true);
    expect(client.calls).toBe(1);
  });

  it('trims the building summary text', async () => {
    client.responses = ['  A quiet building with no open issues.  '];

    const summary = await service.generateBuildingSummary({
      building: {
        name: 'Test',
        type: 'office',
        status: 'active',
        city: 'Amsterdam',
        units: 10,
        occupancyRate: 0.9,
        amenities: [],
      } as never,
      openWorkOrders: [],
    });

    expect(summary).toBe('A quiet building with no open issues.');
  });
});
