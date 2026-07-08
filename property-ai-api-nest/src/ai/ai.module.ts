import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AI_CLIENT } from './clients/ai-client.interface';
import { GeminiClient } from './clients/gemini.client';
import { BuildingSummaryPromptBuilder } from './prompt-builders/building-summary-prompt.builder';
import { WorkOrderPromptBuilder } from './prompt-builders/work-order-prompt.builder';
import { WorkOrderResponseValidator } from './validators/work-order-response.validator';

@Module({
  providers: [
    AiService,
    BuildingSummaryPromptBuilder,
    WorkOrderPromptBuilder,
    WorkOrderResponseValidator,
    { provide: AI_CLIENT, useClass: GeminiClient },
  ],
  exports: [AiService],
})
export class AiModule {}
