import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedData1719365581655 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "measures" ("measure_uuid", "image_url", "measure_value", "customer_code", "measure_datetime", "measure_type", "has_confirmed")
      VALUES
        (uuid_generate_v4(), 'http://example.com/image1.png', 120, 'customer_001', '2024-08-01T12:00:00Z', 'WATER', false),
        (uuid_generate_v4(), 'http://example.com/image2.png', 150, 'customer_002', '2024-08-02T13:00:00Z', 'GAS', true),
        (uuid_generate_v4(), 'http://example.com/image3.png', 80, 'customer_001', '2024-08-03T14:00:00Z', 'WATER', true),
        (uuid_generate_v4(), 'http://example.com/image4.png', 100, 'customer_003', '2024-08-04T15:00:00Z', 'GAS', false)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "measures" WHERE "image_url" IN ('http://example.com/image1.png', 'http://example.com/image2.png', 'http://example.com/image3.png', 'http://example.com/image4.png')`,
    );
  }
}
