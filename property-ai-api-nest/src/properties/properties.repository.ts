import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { nextPrefixedId } from '../common/database/prefixed-id';
import { PaginatedResult } from '../common/pagination/paginated-result';
import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { WorkOrderStatus } from '../work-orders/enums/work-order-status.enum';
import { Building } from './entities/building.entity';
import { IndexPropertiesDto } from './dto/index-properties.dto';
import { BuildingStatus } from './enums/building-status.enum';
import { BuildingType } from './enums/building-type.enum';

export interface CityStats {
  city: string;
  total_properties: number;
  average_occupancy_rate: number | null;
}

export interface CreateBuildingAttributes {
  name: string;
  type?: BuildingType;
  status?: BuildingStatus;
  city?: string;
  units?: number;
  occupancyRate?: number;
  amenities?: string[];
}

const ID_PREFIX = 'P-';
const ID_PAD_LENGTH = 3;

@Injectable()
export class PropertiesRepository {
  constructor(
    @InjectRepository(Building)
    private readonly buildings: Repository<Building>,
  ) {}

  async filter(
    filters: IndexPropertiesDto,
    page: number,
    perPage: number,
  ): Promise<PaginatedResult<Building>> {
    const qb = this.buildings.createQueryBuilder('building');

    if (filters.city) {
      qb.andWhere('building.city = :city', { city: filters.city });
    }
    if (filters.type) {
      qb.andWhere('building.type = :type', { type: filters.type });
    }
    if (filters.status) {
      qb.andWhere('building.status = :status', { status: filters.status });
    }
    if (filters.min_occupancy !== undefined) {
      qb.andWhere('building.occupancyRate >= :minOccupancy', {
        minOccupancy: filters.min_occupancy,
      });
    }

    qb.orderBy('building.occupancyRate', 'DESC').addOrderBy(
      'building.name',
      'ASC',
    );
    qb.skip((page - 1) * perPage).take(perPage);

    const [items, total] = await qb.getManyAndCount();

    return { items, total, page, perPage };
  }

  async create(attributes: CreateBuildingAttributes): Promise<Building> {
    const id = await nextPrefixedId(
      this.buildings,
      ID_PREFIX,
      1,
      ID_PAD_LENGTH,
    );
    const building = this.buildings.create({ ...attributes, id });

    return this.buildings.save(building);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.buildings.count({ where: { id } });
    return count > 0;
  }

  async detail(id: string): Promise<Building> {
    const building = await this.buildings.findOneBy({ id });

    if (!building) {
      throw new NotFoundException(`Building ${id} was not found.`);
    }

    building.openWorkOrdersCount = await this.buildings.manager
      .getRepository(WorkOrder)
      .count({ where: { propertyId: id, status: WorkOrderStatus.Open } });

    return building;
  }

  async detailWithOpenWorkOrders(id: string): Promise<Building> {
    const building = await this.buildings
      .createQueryBuilder('building')
      .leftJoinAndSelect(
        'building.workOrders',
        'openWorkOrder',
        'openWorkOrder.status = :status',
        { status: WorkOrderStatus.Open },
      )
      .where('building.id = :id', { id })
      .getOne();

    if (!building) {
      throw new NotFoundException(`Building ${id} was not found.`);
    }

    return building;
  }

  async statsByCity(): Promise<CityStats[]> {
    const rows = await this.buildings
      .createQueryBuilder('building')
      .select('building.city', 'city')
      .addSelect('COUNT(*)', 'total_properties')
      .addSelect('AVG(building.occupancyRate)', 'average_occupancy_rate')
      .where('building.city IS NOT NULL')
      .groupBy('building.city')
      .orderBy('building.city', 'ASC')
      .getRawMany<{
        city: string;
        total_properties: string;
        average_occupancy_rate: string | null;
      }>();

    return rows.map((row) => ({
      city: row.city,
      total_properties: parseInt(row.total_properties, 10),
      average_occupancy_rate:
        row.average_occupancy_rate === null
          ? null
          : Math.round(parseFloat(row.average_occupancy_rate) * 100) / 100,
    }));
  }
}
