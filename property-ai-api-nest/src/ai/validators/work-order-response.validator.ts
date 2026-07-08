import { Injectable } from '@nestjs/common';
import { AiServiceException } from '../exceptions/ai-service.exception';
import { AIWorkOrderDto } from '../dto/ai-work-order.dto';
import { WorkOrderCategory } from '../../work-orders/enums/work-order-category.enum';
import { WorkOrderPriority } from '../../work-orders/enums/work-order-priority.enum';

const MAX_TITLE_LENGTH = 120;
const MAX_SUMMARY_LENGTH = 500;

@Injectable()
export class WorkOrderResponseValidator {
  validate(data: Record<string, unknown>): AIWorkOrderDto {
    const title = this.cleanString(data.title);
    const summary = this.cleanString(data.summary);

    if (title === null || summary === null) {
      throw AiServiceException.invalidResponse(
        'title or summary is missing or empty',
      );
    }

    const category = this.tryEnum(WorkOrderCategory, data.category);
    const priority = this.tryEnum(WorkOrderPriority, data.priority);

    if (category === null || priority === null) {
      throw AiServiceException.invalidResponse(
        'category or priority is not an allowed value',
      );
    }

    return {
      title: title.slice(0, MAX_TITLE_LENGTH),
      category,
      priority,
      summary: summary.slice(0, MAX_SUMMARY_LENGTH),
    };
  }

  private cleanString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }

  private tryEnum<T extends Record<string, string>>(
    enumObject: T,
    value: unknown,
  ): T[keyof T] | null {
    if (typeof value !== 'string') {
      return null;
    }

    return Object.values(enumObject).includes(value)
      ? (value as T[keyof T])
      : null;
  }
}
