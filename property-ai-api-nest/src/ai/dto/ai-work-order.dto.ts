import { WorkOrderCategory } from '../../work-orders/enums/work-order-category.enum';
import { WorkOrderPriority } from '../../work-orders/enums/work-order-priority.enum';

export interface AIWorkOrderDto {
  title: string;
  category: WorkOrderCategory;
  priority: WorkOrderPriority;
  summary: string;
}
