import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateMeasureDto {
  @IsString()
  @IsNotEmpty()
  image: string;

  @IsString()
  @IsNotEmpty()
  customer_code: string;

  @IsDate()
  @IsNotEmpty()
  measure_datetime: Date;

  @IsString()
  @IsNotEmpty()
  measure_type: string;
}
