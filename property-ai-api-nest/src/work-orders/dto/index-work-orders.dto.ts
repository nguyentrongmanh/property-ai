import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { WorkOrderCategory } from '../enums/work-order-category.enum';
import { WorkOrderPriority } from '../enums/work-order-priority.enum';
import { WorkOrderStatus } from '../enums/work-order-status.enum';

export class IndexWorkOrdersDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  property_id?: string;

  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @IsOptional()
  @IsEnum(WorkOrderPriority)
  priority?: WorkOrderPriority;

  @IsOptional()
  @IsEnum(WorkOrderCategory)
  category?: WorkOrderCategory;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  per_page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}
