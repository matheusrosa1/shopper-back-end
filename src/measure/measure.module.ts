import { Module /* NestModule */ } from '@nestjs/common';
import { MeasureService } from './measure.service';
import { MeasureController } from './measure.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Measure } from './entities/measure.entity';
import { UploadMeasureService } from './upload-measure/upload-measure.service';

@Module({
  imports: [TypeOrmModule.forFeature([Measure])],
  controllers: [MeasureController],
  providers: [MeasureService, UploadMeasureService],
})
export class MeasureModule {}
