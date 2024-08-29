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
import { MeasureProcessorService } from './measure-processor/measure-processor.service';

@Controller('measure')
export class MeasureController {
  constructor(
    private readonly measureService: MeasureService,
    private readonly measureProcessorService: MeasureProcessorService,
  ) {}

  @Post('upload')
  async uploadImageAndProcessMeasure(
    @Body()
    body: {
      base64Image: string;
      customerCode: string;
      measureDatetime: Date;
      measureType: 'WATER' | 'GAS';
    },
  ) {
    const { base64Image, customerCode, measureDatetime, measureType } = body;
    return await this.measureProcessorService.uploadImageAndProcessMeasure(
      base64Image,
      customerCode,
      measureDatetime,
      measureType,
    );
  }

  @Patch('confirm')
  async confirmMeasure(
    @Body() body: { measureUuid: string; confirmedValue: number },
  ) {
    const { measureUuid, confirmedValue } = body;
    return await this.measureService.confirmMeasure(
      measureUuid,
      confirmedValue,
    );
  }

  @Get(':customerCode/list')
  async listMeasures(
    @Param('customerCode') customerCode: string,
    @Query('type') measureType?: 'WATER' | 'GAS',
  ) {
    return await this.measureService.getMeasuresByCustomerCode(
      customerCode,
      measureType,
    );
  }
}
