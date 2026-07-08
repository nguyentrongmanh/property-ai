import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Validate,
  ValidateIf,
} from 'class-validator';
import { PropertyExistsConstraint } from '../validators/property-exists.constraint';
import { WorkOrderCategory } from '../enums/work-order-category.enum';
import { WorkOrderCreationMode } from '../enums/work-order-creation-mode.enum';
import { WorkOrderPriority } from '../enums/work-order-priority.enum';

export class CreateWorkOrderDto {
  @IsString()
  @Validate(PropertyExistsConstraint)
  property_id: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsOptional()
  @IsEnum(WorkOrderCreationMode)
  mode: WorkOrderCreationMode = WorkOrderCreationMode.Ai;

  @IsString()
  @MinLength(10, {
    message: 'Please describe the problem in a bit more detail.',
  })
  @MaxLength(2000)
  description: string;

  // Only required in "manual" mode - in "ai" mode these are generated from
  // the description instead, so they must stay absent/ignored there.
  @ValidateIf(
    (dto: CreateWorkOrderDto) => dto.mode === WorkOrderCreationMode.Manual,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @ValidateIf(
    (dto: CreateWorkOrderDto) => dto.mode === WorkOrderCreationMode.Manual,
  )
  @IsEnum(WorkOrderCategory)
  category?: WorkOrderCategory;

  @ValidateIf(
    (dto: CreateWorkOrderDto) => dto.mode === WorkOrderCreationMode.Manual,
  )
  @IsEnum(WorkOrderPriority)
  priority?: WorkOrderPriority;

  @ValidateIf(
    (dto: CreateWorkOrderDto) => dto.mode === WorkOrderCreationMode.Manual,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  summary?: string;
}
