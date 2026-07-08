export enum WorkOrderPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Urgent = 'urgent',
}

/**
 * Numeric weight used to sort work orders from most to least urgent.
 */
export const WORK_ORDER_PRIORITY_WEIGHT: Record<WorkOrderPriority, number> = {
  [WorkOrderPriority.Urgent]: 4,
  [WorkOrderPriority.High]: 3,
  [WorkOrderPriority.Medium]: 2,
  [WorkOrderPriority.Low]: 1,
};
