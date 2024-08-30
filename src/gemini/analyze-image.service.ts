import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AnalyzeService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzeImage(image: string): Promise<number> {
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

      const measureValue = parseInt(result.response.text(), 10);
      return measureValue;
    } catch (error) {
      console.error('Erro ao analisar a imagem:', error);
      throw new Error('Erro ao processar a imagem');
    }
  }
}
