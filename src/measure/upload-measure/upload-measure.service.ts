import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs-extra';
import * as path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { Measure } from '../entities/measure.entity';
import { Repository, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UploadMeasureService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private fileManager: GoogleAIFileManager;

  constructor(
    @InjectRepository(Measure)
    private readonly measureRepository: Repository<Measure>,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in .env');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.fileManager = new GoogleAIFileManager(apiKey);
  }

  async processAndSaveMeasure(data: any): Promise<any> {
    const { image, customer_code, measure_datetime, measure_type } = data;
    if (!image || !customer_code || !measure_datetime || !measure_type) {
      throw new HttpException('Dados inválidos', HttpStatus.BAD_REQUEST);
    }

    const measureDatetimeObj = new Date(measure_datetime);

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
        customerCode: customer_code,
        measureType: measure_type,
        measureDatetime: Between(startOfMonth, endOfMonth),
      },
    });

    if (existingMeasure) {
      throw new HttpException(
        'Leitura do mês já realizada',
        HttpStatus.CONFLICT,
      );
    }

    // Salvar a imagem temporária na raiz do projeto
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const tempFilePath = path.join(__dirname, `../../temp_${uuidv4()}.jpg`);
    await fs.writeFile(tempFilePath, buffer);

    // Fazer o upload da imagem usando o GoogleAIFileManager
    const uploadResponse = await this.fileManager.uploadFile(tempFilePath, {
      mimeType: 'image/jpeg',
      displayName: `Measure_${customer_code}`,
    });

    // Gerar o conteúdo usando o modelo
    const prompt = 'What was the consumption for the month? Just the number';
    const fileToGenerativePart = {
      inlineData: {
        data: base64Data,
        mimeType: 'image/jpeg',
      },
    };
    const result = await this.model.generateContent([
      prompt,
      fileToGenerativePart,
    ]);

    const measure_value = +result.response.text();
    const measure_uuid = uuidv4();

    // Remover o arquivo temporário
    /*     await fs.remove(tempFilePath); */

    const image_url = uploadResponse.file.uri;

    // Salvar a medição no banco de dados
    const newMeasure = this.measureRepository.create({
      customerCode: customer_code,
      measureDatetime: measure_datetime,
      measureType: measure_type,
      measureValue: measure_value,
      measureUuid: measure_uuid,
      imageUrl: image_url,
    });

    await this.measureRepository.save(newMeasure);

    return { image_url, measure_value, measure_uuid };
  }
}
