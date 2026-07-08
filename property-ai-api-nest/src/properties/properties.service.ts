import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { Building } from './entities/building.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { IndexPropertiesDto } from './dto/index-properties.dto';
import { CityStats, PropertiesRepository } from './properties.repository';
import {
  PaginatedResult,
  DEFAULT_PER_PAGE,
} from '../common/pagination/paginated-result';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly properties: PropertiesRepository,
    private readonly aiService: AiService,
  ) {}

  filter(filters: IndexPropertiesDto): Promise<PaginatedResult<Building>> {
    const page = filters.page ?? 1;
    const perPage = filters.per_page ?? DEFAULT_PER_PAGE;

    return this.properties.filter(filters, page, perPage);
  }

  detail(id: string): Promise<Building> {
    return this.properties.detail(id);
  }

  create(dto: CreatePropertyDto): Promise<Building> {
    return this.properties.create({
      name: dto.name,
      type: dto.type,
      status: dto.status,
      city: dto.city,
      units: dto.units,
      occupancyRate: dto.occupancy_rate,
      amenities: dto.amenities,
    });
  }

  statsByCity(): Promise<CityStats[]> {
    return this.properties.statsByCity();
  }

  async summary(id: string): Promise<string> {
    const building = await this.properties.detailWithOpenWorkOrders(id);

    return this.aiService.generateBuildingSummary({
      building,
      openWorkOrders: building.workOrders,
    });
  }
}
