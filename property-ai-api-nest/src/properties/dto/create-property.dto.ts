import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BuildingStatus } from '../enums/building-status.enum';
import { BuildingType } from '../enums/building-type.enum';

export class CreatePropertyDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsEnum(BuildingType)
  type?: BuildingType;

  @IsOptional()
  @IsEnum(BuildingStatus)
  status?: BuildingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  units?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  occupancy_rate?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}
