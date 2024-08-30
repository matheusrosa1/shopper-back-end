import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Measure } from './entities/measure.entity';

@Injectable()
export class MeasureService {
  constructor(
    @InjectRepository(Measure)
    private readonly measureRepository: Repository<Measure>,
  ) {}

  async checkExistingMeasure(
    customerCode: string,
    measureDatetime: Date,
    measureType: 'WATER' | 'GAS',
  ): Promise<boolean> {
    // Verificar se já existe uma medida no mês para o cliente e tipo de medida
    const measureDatetimeObj = new Date(measureDatetime);
    const startOfMonth = new Date(
      measureDatetimeObj.getFullYear(),
      measureDatetimeObj.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      measureDatetimeObj.getFullYear(),
      measureDatetimeObj.getMonth() + 1,
      0,
    );

    const existingMeasure = await this.measureRepository.findOne({
      where: {
        customerCode,
        measureDatetime: Between(startOfMonth, endOfMonth),
        measureType,
      },
    });

    return !!existingMeasure; // Retorna true se uma medida já existe, caso contrário false
  }

  async saveMeasure(data: {
    customerCode: string;
    measureDatetime: Date;
    measureType: 'WATER' | 'GAS';
    measureValue: number;
    imageUrl: string;
  }): Promise<Measure> {
    const newMeasure = this.measureRepository.create({
      customerCode: data.customerCode,
      measureDatetime: data.measureDatetime,
      measureType: data.measureType,
      measureValue: data.measureValue,
      imageUrl: data.imageUrl,
    });

    return await this.measureRepository.save(newMeasure);
  }
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
  async getMeasuresByCustomerCode(
    customerCode: string,
    measureType?: string,
  ): Promise<any> {
    try {
      if (measureType && !['WATER', 'GAS'].includes(measureType)) {
        throw new HttpException(
          {
            error_code: 'INVALID_TYPE',
            error_description: 'Tipo de medição não permitida',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      const measures = await this.measureRepository.find({
        where: {
          customerCode,
          measureType: measureType ? measureType.toUpperCase() : undefined,
        },
      });
      if (measures.length === 0) {
        throw new HttpException(
          {
            error_code: 'MEASURES_NOT_FOUND',
            error_description: 'Nenhuma leitura encontrada',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        customer_code: customerCode,
        measures: measures.map((measure) => ({
          measure_uuid: measure.measureUuid,
          measure_datetime: measure.measureDatetime,
          measure_type: measure.measureType,
          has_confirmed: measure.hasConfirmed,
          image_url: measure.imageUrl,
        })),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(
          'Failed to get measures',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
