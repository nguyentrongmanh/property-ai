import { Building } from '../entities/building.entity';

export function serializeBuilding(building: Building) {
  return {
    id: building.id,
    name: building.name,
    type: building.type,
    status: building.status,
    city: building.city,
    units: building.units,
    occupancy_rate: building.occupancyRate,
    amenities: building.amenities,
    open_work_orders:
      building.openWorkOrdersCount === undefined
        ? undefined
        : building.openWorkOrdersCount,
  };
}
