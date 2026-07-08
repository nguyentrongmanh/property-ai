import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkOrders1700000000002 implements MigrationInterface {
  name = 'CreateWorkOrders1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "work_orders" (
        "id" varchar PRIMARY KEY,
        "property_id" varchar NOT NULL REFERENCES "buildings"("id") ON DELETE CASCADE,
        "source_text" text NOT NULL,
        "requester_email" varchar NOT NULL,
        "title" varchar NOT NULL,
        "category" varchar NOT NULL,
        "priority" varchar NOT NULL,
        "summary" text NOT NULL,
        "status" varchar NOT NULL DEFAULT 'open',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_work_orders_property_id" ON "work_orders" ("property_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_work_orders_category" ON "work_orders" ("category")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_work_orders_priority" ON "work_orders" ("priority")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_work_orders_status" ON "work_orders" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "work_orders"`);
  }
}
