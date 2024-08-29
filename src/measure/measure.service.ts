import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Measure } from './entities/measure.entity';
import { FileUploadService } from 'src/gemini/file-upload.service';
import { AnalyseService } from '../gemini/analyze-image.service';

@Injectable()
export class MeasureService {
  constructor(
    @InjectRepository(Measure)
    private readonly measureRepository: Repository<Measure>,
    private readonly fileUploadService: FileUploadService,
    private readonly geminiService: AnalyseService,
  ) {}

  async uploadImageAndSaveMeasure(
    imageBase64: string,
    customerCode: string,
    measureDatetime: Date,
    measureType: string,
  ): Promise<any> {
    try {
      // Faz o upload da imagem e obtém o URI
      const imageUri = await this.fileUploadService.uploadBase64Image(
        imageBase64,
        customerCode,
        measureDatetime,
      );

      // Analisa a imagem usando o Gemini
      const analysisResponse = await this.geminiService.analyzeImage(imageUri);

      // Extrai o valor da medição a partir da resposta da análise
      const measureValue =
        this.extractMeasureValueFromAnalysis(analysisResponse);

      // Verifica se já existe uma medição para o mesmo cliente, data e tipo
      const existingMeasure = await this.measureRepository.findOne({
        where: {
          customerCode: customerCode,
          measureDatetime: measureDatetime,
          measureType: measureType,
        },
      });

      if (existingMeasure) {
        throw new HttpException(
          'Leitura já realizada para o mês e tipo',
          HttpStatus.CONFLICT,
        );
      }

      // Cria e salva uma nova medição
      const newMeasure = this.measureRepository.create({
        measureUuid: uuidv4(),
        customerCode: customerCode,
        measureDatetime: measureDatetime,
        measureType: measureType,
        imageUrl: imageUri,
        measureValue: measureValue,
        hasConfirmed: false,
      });

      await this.measureRepository.save(newMeasure);

      return {
        imageUrl: imageUri,
        measureValue: measureValue,
        measureUuid: newMeasure.measureUuid,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to upload and save measure',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private extractMeasureValueFromAnalysis(analysisResponse: any): number {
    // Supondo que a análise retorna um texto que pode ser convertido para número
    const value = parseFloat(analysisResponse);
    if (isNaN(value)) {
      throw new HttpException(
        'Invalid measure value extracted from analysis',
        HttpStatus.BAD_REQUEST,
      );
    }
    return value;
  }

  async confirmMeasure(
    measureUuid: string,
    confirmedValue: number,
  ): Promise<any> {
    try {
      const measure = await this.measureRepository.findOne({
        where: { measureUuid: measureUuid },
      });

      if (!measure) {
        throw new HttpException('Leitura não encontrada', HttpStatus.NOT_FOUND);
      }

      if (measure.hasConfirmed) {
        throw new HttpException('Leitura já confirmada', HttpStatus.CONFLICT);
      }

      measure.measureValue = confirmedValue;
      measure.hasConfirmed = true;

      await this.measureRepository.save(measure);

      return { success: true };
    } catch (error) {
      throw new HttpException(
        'Failed to confirm measure',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getMeasures(customerCode: string, measureType?: string): Promise<any> {
    try {
      const query = this.measureRepository
        .createQueryBuilder('measure')
        .where('measure.customerCode = :customerCode', { customerCode });

      if (measureType) {
        query.andWhere('measure.measureType ILIKE :measureType', {
          measureType: measureType.toUpperCase(),
        });
      }

      const measures = await query.getMany();

      if (measures.length === 0) {
        throw new HttpException(
          'Nenhuma leitura encontrada',
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        customerCode: customerCode,
        measures: measures.map((measure) => ({
          measureUuid: measure.measureUuid,
          measureDatetime: measure.measureDatetime,
          measureType: measure.measureType,
          hasConfirmed: measure.hasConfirmed,
          imageUrl: measure.imageUrl,
        })),
      };
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve measures',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
