import { Building } from '../../properties/entities/building.entity';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';

export interface BuildingSummaryInputDto {
  building: Building;
  openWorkOrders: WorkOrder[];
}
