import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Building } from '../../properties/entities/building.entity';
import { WorkOrderCategory } from '../enums/work-order-category.enum';
import { WorkOrderPriority } from '../enums/work-order-priority.enum';
import { WorkOrderStatus } from '../enums/work-order-status.enum';

@Entity({ name: 'work_orders' })
export class WorkOrder {
  @PrimaryColumn()
  id: string;

  @Column({ name: 'property_id' })
  propertyId: string;

  @ManyToOne(() => Building, (building) => building.workOrders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'property_id' })
  building: Building;

  @Column({ name: 'source_text', type: 'text' })
  sourceText: string;

  @Column({ name: 'requester_email' })
  requesterEmail: string;

  @Column()
  title: string;

  @Index()
  @Column({ type: 'varchar' })
  category: WorkOrderCategory;

  @Index()
  @Column({ type: 'varchar' })
  priority: WorkOrderPriority;

  @Column({ type: 'text' })
  summary: string;

  @Index()
  @Column({ type: 'varchar', default: WorkOrderStatus.Open })
  status: WorkOrderStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
