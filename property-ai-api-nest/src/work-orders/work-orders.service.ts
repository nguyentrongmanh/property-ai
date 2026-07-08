import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import {
  DEFAULT_PER_PAGE,
  PaginatedResult,
} from '../common/pagination/paginated-result';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { IndexWorkOrdersDto } from './dto/index-work-orders.dto';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderCreationMode } from './enums/work-order-creation-mode.enum';
import { WorkOrdersRepository } from './work-orders.repository';

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly workOrders: WorkOrdersRepository,
    private readonly aiService: AiService,
  ) {}

  filter(filters: IndexWorkOrdersDto): Promise<PaginatedResult<WorkOrder>> {
    const page = filters.page ?? 1;
    const perPage = filters.per_page ?? DEFAULT_PER_PAGE;

    return this.workOrders.filter(filters, page, perPage);
  }

  /**
   * Creates a work order either from a plain-language description - the AI
   * classifier turns it into a title, category, priority and summary, and
   * nothing is saved if it fails - or, in "manual" mode, from fields the
   * caller supplies directly, skipping the AI call entirely.
   */
  async create(dto: CreateWorkOrderDto): Promise<WorkOrder> {
    if (dto.mode === WorkOrderCreationMode.Manual) {
      return this.workOrders.create({
        propertyId: dto.property_id,
        requesterEmail: dto.email,
        sourceText: dto.description,
        title: dto.title!,
        category: dto.category!,
        priority: dto.priority!,
        summary: dto.summary!,
      });
    }

    const generated = await this.aiService.generateWorkOrder(dto.description);

    return this.workOrders.create({
      propertyId: dto.property_id,
      requesterEmail: dto.email,
      sourceText: dto.description,
      title: generated.title,
      category: generated.category,
      priority: generated.priority,
      summary: generated.summary,
    });
  }
}
