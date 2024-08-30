import { Module /* NestModule */ } from '@nestjs/common';
import { MeasureService } from './measure.service';
import { MeasureController } from './measure.controller';

/* import { MeasureValidationMiddleware } from '../middlewares/measure-validation.middleware';
import { ConfirmeValueValidationMiddleware } from '../middlewares/confirm-measure-validation.middleware'; */
import { TypeOrmModule } from '@nestjs/typeorm';
import { Measure } from './entities/measure.entity';
import { UploadMeasureService } from './upload-measure/upload-measure.service';

@Module({
  imports: [TypeOrmModule.forFeature([Measure])],
  controllers: [MeasureController],
  providers: [MeasureService, UploadMeasureService],
})
export class MeasureModule {
  /*   configure(consumer: MiddlewareConsumer) {
    consumer.apply(MeasureValidationMiddleware).forRoutes('upload');
    consumer.apply(ConfirmeValueValidationMiddleware).forRoutes('confirm');
  } */
}
