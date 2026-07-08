import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { applyDefined } from '../common/database/apply-defined';
import { nextPrefixedId } from '../common/database/prefixed-id';
import { PaginatedResult } from '../common/pagination/paginated-result';
import { IndexWorkOrdersDto } from './dto/index-work-orders.dto';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderCategory } from './enums/work-order-category.enum';
import {
  WORK_ORDER_PRIORITY_WEIGHT,
  WorkOrderPriority,
} from './enums/work-order-priority.enum';
import { WorkOrderStatus } from './enums/work-order-status.enum';

export interface CreateWorkOrderAttributes {
  propertyId: string;
  requesterEmail: string;
  sourceText: string;
  title: string;
  category: WorkOrderCategory;
  priority: WorkOrderPriority;
  summary: string;
}

export interface UpdateWorkOrderAttributes {
  title?: string;
  category?: WorkOrderCategory;
  priority?: WorkOrderPriority;
  summary?: string;
  status?: WorkOrderStatus;
}

const ID_PREFIX = 'WO-';
const ID_START_NUMBER = 1001;

@Injectable()
export class WorkOrdersRepository {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrders: Repository<WorkOrder>,
  ) {}

  async filter(
    filters: IndexWorkOrdersDto,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<WorkOrder>> {
    const qb = this.workOrders.createQueryBuilder('wo');

    if (filters.property_id) {
      qb.andWhere('wo.propertyId = :propertyId', {
        propertyId: filters.property_id,
      });
    }
    if (filters.status) {
      qb.andWhere('wo.status = :status', { status: filters.status });
    }
    if (filters.priority) {
      qb.andWhere('wo.priority = :priority', { priority: filters.priority });
    }
    if (filters.category) {
      qb.andWhere('wo.category = :category', { category: filters.category });
    }

    qb.orderBy(this.urgencyOrderExpression(), 'DESC').addOrderBy(
      'wo.createdAt',
      'DESC',
    );
    qb.skip((page - 1) * perPage).take(perPage);

    const [items, total] = await qb.getManyAndCount();

    return { items, total, page, perPage };
  }

  async detail(id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrders.findOneBy({ id });

    if (!workOrder) {
      throw new NotFoundException(`Work order ${id} was not found.`);
    }

    return workOrder;
  }

  async create(attributes: CreateWorkOrderAttributes): Promise<WorkOrder> {
    const id = await nextPrefixedId(
      this.workOrders,
      ID_PREFIX,
      ID_START_NUMBER,
    );
    const workOrder = this.workOrders.create({ ...attributes, id });

    return this.workOrders.save(workOrder);
  }

  async update(
    id: string,
    attributes: UpdateWorkOrderAttributes,
  ): Promise<WorkOrder> {
    const workOrder = await this.detail(id);

    return this.workOrders.save(applyDefined(workOrder, attributes));
  }

  async delete(id: string): Promise<WorkOrder> {
    const workOrder = await this.detail(id);
    await this.workOrders.remove(workOrder);
    return workOrder;
  }

  /**
   * Ranks work orders by their priority weight (urgent=4...low=1) so the
   * most urgent ones sort first regardless of the database driver -
   * mirrors the original app's orderByRaw CASE expression.
   */
  private urgencyOrderExpression(): string {
    const cases = Object.entries(WORK_ORDER_PRIORITY_WEIGHT)
      .map(([priority, weight]) => `WHEN '${priority}' THEN ${weight}`)
      .join(' ');

    return `CASE wo.priority ${cases} ELSE 0 END`;
  }
}
