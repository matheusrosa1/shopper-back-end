// src/measure/upload-measure.service.ts

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { Measure } from '../entities/measure.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Between } from 'typeorm';

@Injectable()
export class UploadMeasureService {
  private genAI: GoogleGenerativeAI;
  private model: any;

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
  }

  async processAndSaveMeasure(data: any) {
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

    try {
      const fileToGenerativePart = {
        inlineData: {
          data: image,
          mimeType: 'image/jpeg',
        },
      };

      const prompt = 'What was the consumption for the month? Just the number';
      const result = await this.model.generateContent([
        prompt,
        fileToGenerativePart,
      ]);

      const measure_value = +result.response.text();
      const measure_uuid = uuidv4();

      const dataIMG = new Date(measure_datetime);
      const fileName = `[${measure_type}]${dataIMG.getDate()}-${dataIMG.getMonth()}-${dataIMG.getFullYear()}.png`;
      const filePath = path.join(__dirname, '..', 'uploads', fileName);

      const buff = Buffer.from(image, 'base64');
      fs.writeFileSync(filePath, buff);

      const image_url = `http://localhost:3001/uploads/${fileName}`;

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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(
          'Erro ao processar a imagem',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
