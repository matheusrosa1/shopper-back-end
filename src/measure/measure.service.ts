import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Measure } from './entities/measure.entity';

@Injectable()
export class MeasureService {
  constructor(
    @InjectRepository(Measure)
    private readonly measureRepository: Repository<Measure>,
  ) {}

  async confirmMeasure(
    measureUuid: string,
    confirmedValue: number,
  ): Promise<any> {
    try {
      const measure = await this.measureRepository.findOneBy({
        measureUuid,
      });

      if (!measure) {
        throw new HttpException(
          {
            error_code: 'MEASURE_NOT_FOUND',
            error_description: 'Leitura do mês já realizada',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (measure.hasConfirmed) {
        throw new HttpException(
          {
            error_code: 'CONFIRMATION_DUPLICATE',
            error_description: 'Leitura do mês já realizada',
          },
          HttpStatus.CONFLICT,
        );
      }
      measure.measureValue = confirmedValue;
      measure.hasConfirmed = true;

      await this.measureRepository.save(measure);

      return { success: true };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(
          'Failed to confirm measure',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
