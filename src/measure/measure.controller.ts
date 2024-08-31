import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MeasureService } from './measure.service';
import { UploadMeasureService } from './upload-measure/upload-measure.service';

@Controller()
export class MeasureController {
  constructor(
    private readonly measureService: MeasureService,
    private readonly uploadMeasureService: UploadMeasureService,
  ) {}

  @Post('upload')
  async uploadMeasure(
    @Body()
    body: {
      image: string;
      customer_code: string;
      measure_datetime: Date;
      measure_type: 'WATER' | 'GAS';
    },
  ) {
    const { image, customer_code, measure_datetime, measure_type } = body;
    return this.uploadMeasureService.processAndSaveMeasure(
      image,
      customer_code,
      measure_datetime,
      measure_type,
    );
  }

  @Patch('confirm')
  async confirmMeasure(
    @Body() body: { measure_uuid: string; confirmed_value: number },
  ) {
    const { measure_uuid, confirmed_value } = body;
    return await this.measureService.confirmMeasure(
      measure_uuid,
      confirmed_value,
    );
  }

  @Get(':customer_code/list')
  async listMeasures(
    @Param('customer_code') customer_code: string,
    @Query('measure_type') measure_type?: 'WATER' | 'GAS',
  ) {
    return await this.measureService.getMeasuresByCustomerCode(
      customer_code,
      measure_type,
    );
  }
}
