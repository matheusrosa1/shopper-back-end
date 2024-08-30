import { Test, TestingModule } from '@nestjs/testing';
import { UploadMeasureService } from './upload-measure.service';

describe('UploadMeasureService', () => {
  let service: UploadMeasureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadMeasureService],
    }).compile();

    service = module.get<UploadMeasureService>(UploadMeasureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
