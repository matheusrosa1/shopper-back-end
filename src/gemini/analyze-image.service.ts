import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AnalyseService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async analyzeImage(imageUrl: string): Promise<any> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flask',
      });

      const result = await model.generateContent([imageUrl]);

      const response = result.response;

      return response.text;
    } catch {
      throw new HttpException(
        'Failed to analyze image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
