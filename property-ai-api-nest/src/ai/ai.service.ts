import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AiClient } from './clients/ai-client.interface';
import { AI_CLIENT } from './clients/ai-client.interface';
import { AiServiceException } from './exceptions/ai-service.exception';
import { AIWorkOrderDto } from './dto/ai-work-order.dto';
import { BuildingSummaryInputDto } from './dto/building-summary-input.dto';
import { BuildingSummaryPromptBuilder } from './prompt-builders/building-summary-prompt.builder';
import { WorkOrderPromptBuilder } from './prompt-builders/work-order-prompt.builder';
import { WorkOrderResponseValidator } from './validators/work-order-response.validator';
import { WorkOrderCategory } from '../work-orders/enums/work-order-category.enum';
import { WorkOrderPriority } from '../work-orders/enums/work-order-priority.enum';

const MAX_ATTEMPTS = 2;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(AI_CLIENT) private readonly client: AiClient,
    private readonly buildingSummaryPromptBuilder: BuildingSummaryPromptBuilder,
    private readonly workOrderPromptBuilder: WorkOrderPromptBuilder,
    private readonly workOrderResponseValidator: WorkOrderResponseValidator,
  ) {}

  async generateWorkOrder(description: string): Promise<AIWorkOrderDto> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await this.requestWorkOrder(description);
      } catch (error) {
        if (error instanceof AiServiceException && error.isRateLimited()) {
          throw error;
        }

        lastError = error;
        this.logger.warn(
          `Work order generation attempt failed. attempt=${attempt} reason=${
            error instanceof Error ? error.message : 'unknown error'
          }`,
        );
      }
    }

    throw lastError;
  }

  async generateBuildingSummary(
    input: BuildingSummaryInputDto,
  ): Promise<string> {
    const answer = await this.client.generateText(
      this.buildingSummaryPromptBuilder.build(input),
      {
        temperature: 0.4,
      },
    );

    return answer.trim();
  }

  private async requestWorkOrder(description: string): Promise<AIWorkOrderDto> {
    const answer = await this.client.generateText(
      this.workOrderPromptBuilder.build(description),
      this.workOrderGenerationConfig(),
    );

    let decoded: unknown;
    try {
      decoded = JSON.parse(answer);
    } catch {
      throw AiServiceException.invalidResponse('answer is not valid JSON');
    }

    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      Array.isArray(decoded)
    ) {
      throw AiServiceException.invalidResponse('answer is not valid JSON');
    }

    return this.workOrderResponseValidator.validate(
      decoded as Record<string, unknown>,
    );
  }

  private workOrderGenerationConfig() {
    return {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          category: { type: 'STRING', enum: Object.values(WorkOrderCategory) },
          priority: { type: 'STRING', enum: Object.values(WorkOrderPriority) },
          summary: { type: 'STRING' },
        },
        required: ['title', 'category', 'priority', 'summary'],
      },
    };
  }
}
