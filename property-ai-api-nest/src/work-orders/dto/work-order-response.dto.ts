import { WorkOrder } from '../entities/work-order.entity';

export function serializeWorkOrder(workOrder: WorkOrder) {
  return {
    id: workOrder.id,
    property_id: workOrder.propertyId,
    source_text: workOrder.sourceText,
    requester_email: workOrder.requesterEmail,
    title: workOrder.title,
    category: workOrder.category,
    priority: workOrder.priority,
    summary: workOrder.summary,
    status: workOrder.status,
    created_at: workOrder.createdAt.toISOString().slice(0, 10),
  };
}
