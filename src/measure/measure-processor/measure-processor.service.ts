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
    const measureDatetimeObj = new Date(measureDatetime);
    console.log('measureDatetimeObj:', measureDatetimeObj);

    const startOfMonth = new Date(
      measureDatetimeObj.getFullYear(),
      measureDatetimeObj.getMonth(),
      1,
    );
    console.log('startOfMonth:', startOfMonth);

    const endOfMonth = new Date(
      measureDatetimeObj.getFullYear(),
      measureDatetimeObj.getMonth() + 1,
      0,
    );

    console.log('endOfMonth:', endOfMonth);

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
    );
    console.log('imageUrl:', imageUrl);

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
  }
}
