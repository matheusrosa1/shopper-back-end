import {
  Controller,
  /*   Get,
  Post,
  Body,
  Patch,
  Param,
  Delete, */
} from '@nestjs/common';
import { MeasureService } from './measure.service';
/* import { CreateMeasureDto } from './dto/create-measure.dto';
import { UpdateMeasureDto } from './dto/update-measure.dto'; */

@Controller('measure')
export class MeasureController {
  constructor(private readonly measureService: MeasureService) {}
}
