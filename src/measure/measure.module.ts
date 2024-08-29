import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MeasureService } from './measure.service';
import { MeasureController } from './measure.controller';
import { MeasureProcessorService } from './measure-processor/measure-processor.service';
import { MeasureValidationMiddleware } from 'src/middlewares/measure-validation.middleware';

@Module({
  controllers: [MeasureController],
  providers: [MeasureService, MeasureProcessorService],
})
export class MeasureModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MeasureValidationMiddleware).forRoutes('upload');
  }
}
