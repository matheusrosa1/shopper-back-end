import { Test, TestingModule } from '@nestjs/testing';
import { MeasureProcessorService } from './measure-processor.service';

describe('MeasureProcessorService', () => {
  let service: MeasureProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MeasureProcessorService],
    }).compile();

    service = module.get<MeasureProcessorService>(MeasureProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
