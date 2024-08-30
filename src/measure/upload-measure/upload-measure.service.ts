import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MeasureService } from '../measure.service';
import { Measure } from '../entities/measure.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as uuid from 'uuid';

@Injectable()
export class UploadMeasureService {
  private readonly fileManager: GoogleAIFileManager;
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private readonly measureService: MeasureService,
    @InjectRepository(Measure)
    private readonly measureRepository: Repository<Measure>,
  ) {
    this.fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async processAndSaveMeasure(
    base64Image: string,
    customerCode: string,
    measureDatetime: Date,
    measureType: 'WATER' | 'GAS',
  ): Promise<{
    measure_value: number;
    image_url: string;
    measure_uuid: string;
  }> {
    // Verificar se já existe uma leitura no mês para o tipo de medida
    const existingMeasure = await this.measureService.checkExistingMeasure(
      customerCode,
      measureDatetime,
      measureType,
    );

    if (existingMeasure) {
      throw new HttpException(
        {
          error_code: 'DOUBLE_REPORT',
          error_description: 'Leitura do mês já realizada',
        },
        HttpStatus.CONFLICT,
      );
    }

    // Remover o cabeçalho 'data:image/jpeg;base64,' ou similar
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    /*     const buffer = Buffer.from(base64Data, 'base64'); */
    /*   const base64String = buffer.toString('base64');  */ // Convertendo de volta para uma string base64 */

    // Fazer o upload da imagem
    const uploadResponse = await this.fileManager.uploadFile(base64Data, {
      mimeType: 'image/jpeg', // Ajuste conforme necessário
      displayName: 'Uploaded Image',
    });

    const fileUri = uploadResponse.file.uri;

    // Integre com a API LLM para extrair o valor da imagem
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
    });

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResponse.file.mimeType,
          fileUri: fileUri,
        },
      },
      { text: 'Extract the numerical value from this image.' },
    ]);

    const extractedValue = parseInt(result.response.text(), 10);

    // Criar a nova medida
    const newMeasure = this.measureRepository.create({
      customerCode,
      measureDatetime,
      measureType,
      measureValue: extractedValue,
      imageUrl: fileUri,
      measureUuid: uuid.v4(),
    });

    const savedMeasure = await this.measureRepository.save(newMeasure);

    return {
      measure_value: savedMeasure.measureValue,
      image_url: savedMeasure.imageUrl,
      measure_uuid: savedMeasure.measureUuid,
    };
  }
}
