import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MeasureService } from '../measure.service';
import { Measure } from '../entities/measure.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  base64Decode,
  getMimeType,
  getMimeTypeFromBase64,
  MimeTypeIsValid,
} from 'src/utils/gemini-utils';
import { v4 as uuidv4 } from 'uuid';
/* import fs from 'fs'; */
import * as path from 'path';

@Injectable()
export class UploadMeasureService {
  private readonly fileManager: GoogleAIFileManager;
  private readonly genAI: GoogleGenerativeAI;

  constructor(
    private readonly measureService: MeasureService,
    @InjectRepository(Measure)
    private readonly measureRepository: Repository<Measure>,
  ) {
    /*     this.fileManager = new GoogleAIFileManager(
      process.env.GEMINI_API_KEY ?? '',
    ); */
    /*     this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? ''); */
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

    const fileManager = new GoogleAIFileManager(
      process.env.GEMINI_API_KEY ?? '',
    );

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

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
    try {
      const mimeType = getMimeTypeFromBase64(base64Image);

      if (!MimeTypeIsValid(mimeType)) {
        throw new HttpException(
          {
            error_code: 'INVALID_DATA',
            error_description: 'Tipo de imagem não suportado',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const fileExtension = getMimeType(mimeType);
      const fileName = `${customerCode}-${Date.now()}.${fileExtension}`;
      const pathname = path.join(__dirname, '../../../uploads', fileName);

      base64Decode(base64Image.split(';base64,').pop() ?? '', pathname);

      const uploadResponse = await fileManager.uploadFile(pathname, {
        mimeType,
        displayName: 'Uploaded Image',
      });

      /*       fs.unlinkSync(pathname); */

      const fileUri = uploadResponse.file.uri;

      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      const result = await model.generateContent([
        {
          fileData: {
            mimeType: uploadResponse.file.mimeType,
            fileUri: fileUri,
          },
        },
        { text: 'Extrair o valor numérico desta imagem.' },
      ]);

      const extractedValue = parseInt(result.response.text(), 10);

      // Criar a nova medida
      const measureUuid = uuidv4();
      const newMeasure = this.measureRepository.create({
        customerCode,
        measureDatetime,
        measureType,
        measureValue: extractedValue,
        measureUuid,
        imageUrl: fileUri,
      });

      const savedMeasure = await this.measureRepository.save(newMeasure);

      return {
        measure_value: savedMeasure.measureValue,
        image_url: savedMeasure.imageUrl,
        measure_uuid: savedMeasure.measureUuid,
      };
    } catch (error) {
      console.error('Error processing measure:', error);
      throw new HttpException(
        {
          error_code: 'INTERNAL_ERROR',
          error_description: 'Erro ao processar a medição',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
