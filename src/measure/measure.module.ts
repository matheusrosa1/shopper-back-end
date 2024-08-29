import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MeasureService } from './measure.service';
import { MeasureController } from './measure.controller';
import { MeasureProcessorService } from './measure-processor/measure-processor.service';
import { MeasureValidationMiddleware } from 'src/middlewares/measure-validation.middleware';
import { ConfirmeValueValidationMiddleware } from 'src/middlewares/confirm-measure-validation.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Measure } from './entities/measure.entity';
import { GeminiModule } from 'src/gemini/gemini.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Measure]), // Adicione esta linha para fornecer o MeasureRepository
    GeminiModule,
  ],
  controllers: [MeasureController],
  providers: [MeasureService, MeasureProcessorService],
})
export class MeasureModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MeasureValidationMiddleware).forRoutes('upload');
    consumer.apply(ConfirmeValueValidationMiddleware).forRoutes('confirm');
  }
}
