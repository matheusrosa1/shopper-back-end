import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { AnalyseService } from './analyze-image.service';

@Module({
  providers: [FileUploadService, AnalyseService],
  exports: [FileUploadService, AnalyseService], // Exporta os serviços para uso em outros módulos
})
export class GeminiModule {}
