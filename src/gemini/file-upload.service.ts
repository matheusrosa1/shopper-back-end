import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import * as fs from 'fs-extra';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  private fileManager: GoogleAIFileManager;

  constructor() {
    this.fileManager = new GoogleAIFileManager(process.env.API_KEY);
  }

  async uploadBase64Image(
    base64Image: string,
    customerCode: string,
    measureDatetime: Date,
  ): Promise<string> {
    try {
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

      const buffer = Buffer.from(base64Data, 'base64');

      const tempFilePath = path.join(
        __dirname,
        `temp_${customerCode}_${measureDatetime.toISOString()}.jpg`,
      );

      await fs.writeFile(tempFilePath, buffer);

      const uploadResponse = await this.fileManager.uploadFile(tempFilePath, {
        mimeType: 'image/jpeg',
        displayName: `Measure_${customerCode}_${measureDatetime.toISOString()}`,
      });

      await fs.remove(tempFilePath);

      return uploadResponse.file.uri;
    } catch {
      throw new HttpException(
        'Failed to upload file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
