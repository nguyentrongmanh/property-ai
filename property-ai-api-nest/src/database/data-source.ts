import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Building } from '../properties/entities/building.entity';
import { WorkOrder } from '../work-orders/entities/work-order.entity';
import { CreateUsers1700000000000 } from './migrations/1700000000000-CreateUsers';
import { CreateBuildings1700000000001 } from './migrations/1700000000001-CreateBuildings';
import { CreateWorkOrders1700000000002 } from './migrations/1700000000002-CreateWorkOrders';

loadEnv();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url:
    process.env.DATABASE_URL ??
    'postgres://property_ai:property_ai@localhost:5432/property_ai',
  entities: [User, Building, WorkOrder],
  migrations: [
    CreateUsers1700000000000,
    CreateBuildings1700000000001,
    CreateWorkOrders1700000000002,
  ],
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
