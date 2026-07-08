import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { Building } from './entities/building.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { IndexPropertiesDto } from './dto/index-properties.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertySummaryCacheService } from './property-summary-cache.service';
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
    private readonly summaryCache: PropertySummaryCacheService,
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

  async update(id: string, dto: UpdatePropertyDto): Promise<Building> {
    const building = await this.properties.update(id, {
      name: dto.name,
      type: dto.type,
      status: dto.status,
      city: dto.city,
      units: dto.units,
      occupancyRate: dto.occupancy_rate,
      amenities: dto.amenities,
    });

    await this.summaryCache.invalidate(id);
    return building;
  }

  statsByCity(): Promise<CityStats[]> {
    return this.properties.statsByCity();
  }

  async summary(id: string): Promise<string> {
    const cached = await this.summaryCache.get(id);
    if (cached !== null) {
      return cached;
    }

    const building = await this.properties.detailWithOpenWorkOrders(id);
    const summary = await this.aiService.generateBuildingSummary({
      building,
      openWorkOrders: building.workOrders,
    });

    await this.summaryCache.set(id, summary);
    return summary;
  }
}
