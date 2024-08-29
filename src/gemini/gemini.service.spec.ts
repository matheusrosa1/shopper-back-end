import { Test, TestingModule } from '@nestjs/testing';
import { AnalyseService } from './analyze-image.service';

describe('GeminiService', () => {
  let service: AnalyseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyseService],
    }).compile();

    service = module.get<AnalyseService>(AnalyseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
