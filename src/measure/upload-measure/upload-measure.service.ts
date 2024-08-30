import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs-extra';
import * as path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Measure } from '../entities/measure.entity';
import { Repository, Between } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UploadMeasureService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(
    @InjectRepository(Measure)
    private readonly measureRepository: Repository<Measure>,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
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

    const buffer = Buffer.from(image, 'base64');

    const dataIMG = new Date(measure_datetime);
    const fileName = `[${measure_type}]${dataIMG.getDate()}-${dataIMG.getMonth()}-${dataIMG.getFullYear()}.png`;

    const tempFilePath = path.join(__dirname, fileName);

    await fs.writeFile(tempFilePath, buffer);

    const measure_value = +result.response.text();
    const measure_uuid = uuidv4();

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
  }
}
