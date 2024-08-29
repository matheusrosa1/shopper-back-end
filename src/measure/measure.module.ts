import { Module /* NestModule */ } from '@nestjs/common';
import { MeasureService } from './measure.service';
import { MeasureController } from './measure.controller';
import { MeasureProcessorService } from './measure-processor/measure-processor.service';
/* import { MeasureValidationMiddleware } from '../middlewares/measure-validation.middleware';
import { ConfirmeValueValidationMiddleware } from '../middlewares/confirm-measure-validation.middleware'; */
import { TypeOrmModule } from '@nestjs/typeorm';
import { Measure } from './entities/measure.entity';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [TypeOrmModule.forFeature([Measure]), GeminiModule],
  controllers: [MeasureController],
  providers: [MeasureService, MeasureProcessorService],
})
export class MeasureModule {
  /*   configure(consumer: MiddlewareConsumer) {
    consumer.apply(MeasureValidationMiddleware).forRoutes('upload');
    consumer.apply(ConfirmeValueValidationMiddleware).forRoutes('confirm');
  } */
}
