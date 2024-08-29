import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMeasureTable1675282034000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criação do tipo ENUM
    await queryRunner.query(`
      CREATE TYPE "measure_type_enum" AS ENUM ('WATER', 'GAS');
    `);

    // Criação da tabela utilizando o tipo ENUM
    await queryRunner.query(`
      CREATE TABLE "measures" (
        "measure_uuid" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        "image_url" VARCHAR NOT NULL,
        "measure_value" INTEGER NOT NULL,
        "customer_code" VARCHAR NOT NULL,
        "measure_datetime" TIMESTAMPTZ NOT NULL,
        "measure_type" "measure_type_enum" NOT NULL,
        "has_confirmed" BOOLEAN DEFAULT false
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover a tabela
    await queryRunner.query(`DROP TABLE "measures";`);

    // Remover o tipo ENUM
    await queryRunner.query(`DROP TYPE "measure_type_enum";`);
  }
}
