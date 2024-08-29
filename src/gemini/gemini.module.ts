import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { AnalyseService } from './analyze-image.service';

@Module({
  providers: [FileUploadService, AnalyseService],
  exports: [FileUploadService, AnalyseService],
})
export class GeminiModule {}
