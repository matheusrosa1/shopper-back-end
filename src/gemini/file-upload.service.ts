import { Injectable /*  HttpException, HttpStatus */ } from '@nestjs/common';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import * as fs from 'fs-extra';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  private fileManager: GoogleAIFileManager;

  constructor() {
    this.fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
  }

  async uploadBase64Image(
    base64Image: string,
    customerCode: string,
  ): Promise<string> {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const buffer = Buffer.from(base64Data, 'base64');

    const tempFilePath = path.join(__dirname, `temp_${customerCode}.jpg`);

    await fs.writeFile(tempFilePath, buffer);

    const uploadResponse = await this.fileManager.uploadFile(tempFilePath, {
      mimeType: 'image/jpeg',
      displayName: `Measure_${customerCode}`,
    });

    await fs.remove(tempFilePath);

    return uploadResponse.file.uri;
  }
}
