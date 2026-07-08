import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import {
  DEFAULT_PER_PAGE,
  PaginatedResult,
} from '../common/pagination/paginated-result';
import { PropertySummaryCacheService } from '../properties/property-summary-cache.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { IndexWorkOrdersDto } from './dto/index-work-orders.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderCreationMode } from './enums/work-order-creation-mode.enum';
import { WorkOrdersRepository } from './work-orders.repository';

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly workOrders: WorkOrdersRepository,
    private readonly aiService: AiService,
    private readonly summaryCache: PropertySummaryCacheService,
  ) {}

  filter(filters: IndexWorkOrdersDto): Promise<PaginatedResult<WorkOrder>> {
    const page = filters.page ?? 1;
    const perPage = filters.per_page ?? DEFAULT_PER_PAGE;

    return this.workOrders.filter(filters, page, perPage);
  }

  detail(id: string): Promise<WorkOrder> {
    return this.workOrders.detail(id);
  }

  async update(id: string, dto: UpdateWorkOrderDto): Promise<WorkOrder> {
    const workOrder = await this.workOrders.update(id, {
      title: dto.title,
      category: dto.category,
      priority: dto.priority,
      summary: dto.summary,
      status: dto.status,
    });

    await this.summaryCache.invalidate(workOrder.propertyId);
    return workOrder;
  }

  /**
   * Creates a work order either from a plain-language description - the AI
   * classifier turns it into a title, category, priority and summary, and
   * nothing is saved if it fails - or, in "manual" mode, from fields the
   * caller supplies directly, skipping the AI call entirely.
   */
  async create(dto: CreateWorkOrderDto): Promise<WorkOrder> {
    if (dto.mode === WorkOrderCreationMode.Manual) {
      const workOrder = await this.workOrders.create({
        propertyId: dto.property_id,
        requesterEmail: dto.email,
        sourceText: dto.description,
        title: dto.title!,
        category: dto.category!,
        priority: dto.priority!,
        summary: dto.summary!,
      });

      await this.summaryCache.invalidate(workOrder.propertyId);
      return workOrder;
    }

    const generated = await this.aiService.generateWorkOrder(dto.description);

    const workOrder = await this.workOrders.create({
      propertyId: dto.property_id,
      requesterEmail: dto.email,
      sourceText: dto.description,
      title: generated.title,
      category: generated.category,
      priority: generated.priority,
      summary: generated.summary,
    });

    await this.summaryCache.invalidate(workOrder.propertyId);
    return workOrder;
  }

  async delete(id: string): Promise<void> {
    const workOrder = await this.workOrders.delete(id);
    await this.summaryCache.invalidate(workOrder.propertyId);
  }
}
