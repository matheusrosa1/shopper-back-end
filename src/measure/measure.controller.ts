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
  async uploadMeasure(@Body() data: any) {
    return this.uploadMeasureService.processAndSaveMeasure(data);
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
