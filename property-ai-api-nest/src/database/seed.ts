import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import dataSource from './data-source';
import { User } from '../auth/entities/user.entity';
import { Building } from '../properties/entities/building.entity';
import { WorkOrder } from '../work-orders/entities/work-order.entity';

/**
 * Seeds a varied portfolio of buildings (some fields deliberately left null
 * so the API has to cope with incomplete records), a handful of work orders
 * so the read endpoints return meaningful data immediately, and one demo
 * user so the frontend has something to log in with. Mirrors the original
 * Laravel app's BuildingSeeder/WorkOrderSeeder data set.
 */
const buildings: Partial<Building>[] = [
  {
    id: 'P-001',
    name: 'Keizersgracht 128',
    type: 'office' as Building['type'],
    status: 'active' as Building['status'],
    city: 'Amsterdam',
    units: 14,
    occupancyRate: 0.86,
    amenities: ['elevator', 'parking'],
  },
  {
    id: 'P-002',
    name: 'Weena Tower',
    type: 'office' as Building['type'],
    status: 'active' as Building['status'],
    city: 'Rotterdam',
    units: 42,
    occupancyRate: 0.93,
    amenities: ['elevator', 'parking', 'security_desk', 'bike_storage'],
  },
  {
    id: 'P-003',
    name: 'Vredenburg Residences',
    type: 'residential' as Building['type'],
    status: 'active' as Building['status'],
    city: 'Utrecht',
    units: 68,
    occupancyRate: 0.97,
    amenities: ['elevator', 'bike_storage', 'rooftop_terrace'],
  },
  {
    id: 'P-004',
    name: 'Binckhorst Works',
    type: 'industrial' as Building['type'],
    status: 'active' as Building['status'],
    city: 'The Hague',
    units: 8,
    occupancyRate: 0.61,
    amenities: ['parking'],
  },
  {
    id: 'P-005',
    name: 'Strijp-S Lofts',
    type: 'mixed_use' as Building['type'],
    status: 'active' as Building['status'],
    city: 'Eindhoven',
    units: 35,
    occupancyRate: 0.74,
    amenities: ['elevator', 'gym', 'bike_storage'],
  },
  {
    id: 'P-006',
    name: 'De Pijp Passage',
    type: 'retail' as Building['type'],
    status: 'active' as Building['status'],
    city: 'Amsterdam',
    units: 12,
    occupancyRate: 0.58,
    amenities: null,
  },
  {
    id: 'P-007',
    name: 'Kop van Zuid Quarter',
    type: 'residential' as Building['type'],
    status: 'under_renovation' as Building['status'],
    city: 'Rotterdam',
    units: 54,
    occupancyRate: 0.35,
    amenities: ['elevator', 'parking', 'gym'],
  },
  {
    id: 'P-008',
    name: 'Zuidas Gateway',
    type: 'office' as Building['type'],
    status: 'active' as Building['status'],
    city: 'Amsterdam',
    units: 90,
    occupancyRate: null,
    amenities: ['elevator', 'parking', 'security_desk'],
  },
  {
    id: 'P-009',
    name: 'Oude Gracht Arcade',
    type: 'retail' as Building['type'],
    status: 'inactive' as Building['status'],
    city: 'Utrecht',
    units: 6,
    occupancyRate: 0.0,
    amenities: null,
  },
  {
    id: 'P-010',
    name: 'Sloterdijk Depot',
    type: 'industrial' as Building['type'],
    status: 'active' as Building['status'],
    city: null,
    units: null,
    occupancyRate: 0.8,
    amenities: ['parking'],
  },
  {
    id: 'P-011',
    name: 'Grote Markt Huis',
    type: null,
    status: 'active' as Building['status'],
    city: 'Groningen',
    units: 9,
    occupancyRate: 0.67,
    amenities: ['bike_storage'],
  },
  {
    id: 'P-012',
    name: 'Maastricht Wyck Court',
    type: 'residential' as Building['type'],
    status: 'active' as Building['status'],
    city: 'Maastricht',
    units: 22,
    occupancyRate: 0.91,
    amenities: ['elevator'],
  },
  {
    id: 'P-013',
    name: 'Leidsche Rijn Hub',
    type: 'mixed_use' as Building['type'],
    status: 'active' as Building['status'],
    city: 'Utrecht',
    units: 47,
    occupancyRate: 0.82,
    amenities: ['elevator', 'parking', 'gym', 'rooftop_terrace'],
  },
  {
    id: 'P-014',
    name: 'Spoorzone Warehouse',
    type: 'industrial' as Building['type'],
    status: 'under_renovation' as Building['status'],
    city: 'Tilburg',
    units: 4,
    occupancyRate: null,
    amenities: null,
  },
];

const workOrders: Partial<WorkOrder>[] = [
  {
    id: 'WO-1001',
    propertyId: 'P-001',
    sourceText:
      'the elevator in the lobby keeps stopping and makes a grinding noise',
    requesterEmail: 'tenant.degroot@example.com',
    title: 'Lobby elevator stopping and making noise',
    category: 'elevator' as WorkOrder['category'],
    priority: 'high' as WorkOrder['priority'],
    summary:
      'Lobby elevator is stopping between floors and producing a grinding noise. Needs inspection by a lift engineer.',
    status: 'open' as WorkOrder['status'],
  },
  {
    id: 'WO-1002',
    propertyId: 'P-001',
    sourceText:
      'water is dripping from the ceiling in the second floor hallway near unit 2B',
    requesterEmail: 'caretaker.jansen@example.com',
    title: 'Ceiling leak in second floor hallway',
    category: 'plumbing' as WorkOrder['category'],
    priority: 'urgent' as WorkOrder['priority'],
    summary:
      'Active water leak from the ceiling near unit 2B, likely from the unit above. Risk of water damage.',
    status: 'open' as WorkOrder['status'],
  },
  {
    id: 'WO-1003',
    propertyId: 'P-002',
    sourceText:
      'air conditioning on floor 12 has been blowing warm air since monday',
    requesterEmail: 'office.manager@example.com',
    title: 'AC blowing warm air on floor 12',
    category: 'hvac' as WorkOrder['category'],
    priority: 'medium' as WorkOrder['priority'],
    summary:
      'Air conditioning unit serving floor 12 is not cooling. Reported since Monday.',
    status: 'in_progress' as WorkOrder['status'],
  },
  {
    id: 'WO-1004',
    propertyId: 'P-003',
    sourceText:
      'the front door intercom buzzes but does not open the door anymore',
    requesterEmail: 'resident.visser@example.com',
    title: 'Front door intercom not releasing lock',
    category: 'security' as WorkOrder['category'],
    priority: 'high' as WorkOrder['priority'],
    summary:
      'Intercom rings through but the door release does not work, residents cannot buzz in visitors.',
    status: 'open' as WorkOrder['status'],
  },
  {
    id: 'WO-1005',
    propertyId: 'P-005',
    sourceText:
      'two light fittings in the parking garage are flickering and one is completely dead',
    requesterEmail: 'facilities@example.com',
    title: 'Faulty lighting in parking garage',
    category: 'electrical' as WorkOrder['category'],
    priority: 'low' as WorkOrder['priority'],
    summary:
      'Two flickering fittings and one dead lamp in the parking garage. Replace lamps and check ballasts.',
    status: 'open' as WorkOrder['status'],
  },
  {
    id: 'WO-1006',
    propertyId: 'P-007',
    sourceText:
      'renovation crew left debris blocking the emergency exit on the ground floor',
    requesterEmail: 'safety.officer@example.com',
    title: 'Emergency exit blocked by renovation debris',
    category: 'general' as WorkOrder['category'],
    priority: 'urgent' as WorkOrder['priority'],
    summary:
      'Construction debris is blocking the ground floor emergency exit. Must be cleared immediately for fire safety.',
    status: 'completed' as WorkOrder['status'],
  },
];

async function seed() {
  const db = await dataSource.initialize();

  await db.getRepository(Building).upsert(buildings, ['id']);
  await db.getRepository(WorkOrder).upsert(workOrders, ['id']);

  const demoEmail = 'demo@example.com';
  const existingDemoUser = await db
    .getRepository(User)
    .findOne({ where: { email: demoEmail } });
  if (!existingDemoUser) {
    await db.getRepository(User).save({
      name: 'Demo User',
      email: demoEmail,
      passwordHash: await bcrypt.hash('password123', 12),
    });
  }

  console.log(
    `Seeded ${buildings.length} buildings, ${workOrders.length} work orders, and the demo user.`,
  );
  console.log(`Demo login: ${demoEmail} / password123`);

  await db.destroy();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
