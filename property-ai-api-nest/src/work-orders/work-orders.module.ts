import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { PropertiesModule } from '../properties/properties.module';
import { WorkOrder } from './entities/work-order.entity';
import { PropertyExistsConstraint } from './validators/property-exists.constraint';
import { WorkOrdersController } from './work-orders.controller';
import { WorkOrdersRepository } from './work-orders.repository';
import { WorkOrdersService } from './work-orders.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkOrder]), AiModule, PropertiesModule],
  controllers: [WorkOrdersController],
  providers: [
    WorkOrdersService,
    WorkOrdersRepository,
    PropertyExistsConstraint,
  ],
})
export class WorkOrdersModule {}
