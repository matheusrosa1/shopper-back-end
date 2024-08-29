import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Repository, Between } from 'typeorm';
import { Measure } from '../entities/measure.entity';
import { FileUploadService } from 'src/gemini/file-upload.service';
import { AnalyseService } from 'src/gemini/analyze-image.service';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class MeasureProcessorService {
  constructor(
    @InjectRepository(Measure)
    private readonly measureRepository: Repository<Measure>,
    private readonly fileUploadService: FileUploadService,
    private readonly analyseService: AnalyseService,
  ) {}

  async uploadImageAndProcessMeasure(
    base64Image: string,
    customerCode: string,
    measureDatetime: Date,
    measureType: 'WATER' | 'GAS',
  ): Promise<any> {
    try {
      const startOfMonth = new Date(
        measureDatetime.getFullYear(),
        measureDatetime.getMonth(),
        1,
      );
      const endOfMonth = new Date(
        measureDatetime.getFullYear(),
        measureDatetime.getMonth() + 1,
        0,
      );
      const existingMeasure = await this.measureRepository.findOne({
        where: {
          customerCode: customerCode,
          measureDatetime: Between(startOfMonth, endOfMonth),
          measureType: measureType,
        },
      });

      if (existingMeasure) {
        throw new HttpException(
          {
            error_code: 'DOUBLE_REPORT',
            error_description: 'Leitura do mês já realizada',
          },
          HttpStatus.CONFLICT,
        );
      }
      const imageUrl = await this.fileUploadService.uploadBase64Image(
        base64Image,
        customerCode,
        measureDatetime,
      );

      // Analisa a imagem
      const measureValue = await this.analyseService.analyzeImage(imageUrl);

      // Salva a medição no banco de dados
      const newMeasure = this.measureRepository.create({
        customerCode,
        measureDatetime,
        measureType,
        imageUrl,
        measureValue,
        hasConfirmed: false,
      });
      const savedMeasure = await this.measureRepository.save(newMeasure);

      return {
        image_url: imageUrl,
        measure_value: measureValue,
        measure_uuid: savedMeasure.measureUuid,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(
          'Failed to process image',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
