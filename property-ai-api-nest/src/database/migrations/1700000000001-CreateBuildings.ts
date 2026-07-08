import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBuildings1700000000001 implements MigrationInterface {
  name = 'CreateBuildings1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "buildings" (
        "id" varchar PRIMARY KEY,
        "name" varchar NOT NULL,
        "type" varchar,
        "status" varchar NOT NULL DEFAULT 'active',
        "city" varchar,
        "units" integer,
        "occupancy_rate" decimal(3,2),
        "amenities" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_buildings_type" ON "buildings" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_buildings_status" ON "buildings" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_buildings_city" ON "buildings" ("city")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_buildings_occupancy_rate" ON "buildings" ("occupancy_rate")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "buildings"`);
  }
}
