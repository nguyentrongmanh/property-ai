import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkOrder } from '../../work-orders/entities/work-order.entity';
import { BuildingStatus } from '../enums/building-status.enum';
import { BuildingType } from '../enums/building-type.enum';

@Entity({ name: 'buildings' })
export class Building {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  type: BuildingType | null;

  @Index()
  @Column({ type: 'varchar', default: BuildingStatus.Active })
  status: BuildingStatus;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  city: string | null;

  @Column({ type: 'int', nullable: true })
  units: number | null;

  @Index()
  @Column({
    name: 'occupancy_rate',
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) =>
        value === null ? null : parseFloat(value),
    },
  })
  occupancyRate: number | null;

  @Column({ type: 'jsonb', nullable: true })
  amenities: string[] | null;

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.building)
  workOrders: WorkOrder[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  openWorkOrdersCount?: number;
}
