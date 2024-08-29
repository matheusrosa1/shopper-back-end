import { Module } from '@nestjs/common';
import { MeasureService } from './measure.service';
import { MeasureController } from './measure.controller';
import { MeasureProcessorService } from './measure-processor/measure-processor.service';

@Module({
  controllers: [MeasureController],
  providers: [MeasureService, MeasureProcessorService],
})
export class MeasureModule {}
