import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('measures')
export class Measure {
  @PrimaryGeneratedColumn('uuid')
  measure_uuid: string;

  @Column({ name: 'image_url', nullable: false })
  imageUrl: string;

  @Column({ name: 'measure_value', type: 'integer', nullable: false })
  measureValue: number;

  @Column({ name: 'customer_code', nullable: false })
  customerCode: string;

  @Column({ name: 'measure_datetime', type: 'timestamptz', nullable: false })
  measureDatetime: Date;

  @Column({
    name: 'measure_type',
    type: 'enum',
    enum: ['WATER', 'GAS'],
    nullable: false,
  })
  measureType: string;

  @Column({ name: 'has_confirmed', type: 'boolean', default: false })
  hasConfirmed: boolean;
}
