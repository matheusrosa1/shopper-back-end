import { Test, TestingModule } from '@nestjs/testing';
import { MeasureProcessorService } from '../measure-processor.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Measure } from '../../../measure/entities/measure.entity';

import {
  mockFileUploadService,
  mockAnalyseService,
  mockMeasureRepository,
} from './mocks/measure-processor.mock';
import { FileUploadService } from 'src/gemini/file-upload.service';
import { AnalyseService } from 'src/gemini/analyze-image.service';

// Importa os serviços a serem mockados
const MockFileUploadService = mockFileUploadService;
const MockAnalyseService = mockAnalyseService;
const MockMeasureRepository = mockMeasureRepository;

describe('MeasureProcessorService', () => {
  let service: MeasureProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeasureProcessorService,
        { provide: FileUploadService, useValue: MockFileUploadService },
        { provide: AnalyseService, useValue: MockAnalyseService },
        {
          provide: getRepositoryToken(Measure),
          useValue: MockMeasureRepository,
        },
      ],
    }).compile();

    service = module.get<MeasureProcessorService>(MeasureProcessorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload image and process measure', async () => {
    const base64Image = 'base64Image';
    const customerCode = 'customerCode';
    const measureDatetime = new Date();
    const measureType = 'WATER';

    // Mocking the behavior
    MockFileUploadService.uploadBase64Image.mockResolvedValue(
      'http://example.com/image.jpg',
    );
    MockAnalyseService.analyzeImage.mockResolvedValue(100);
    MockMeasureRepository.findOne.mockResolvedValue(null);
    MockMeasureRepository.save.mockResolvedValue({
      measureUuid: 'uuid',
      imageUrl: 'http://example.com/image.jpg',
      measureValue: 100,
      customerCode,
      measureDatetime,
      measureType,
      hasConfirmed: false,
    });

    const result = await service.uploadImageAndProcessMeasure(
      base64Image,
      customerCode,
      measureDatetime,
      measureType,
    );

    expect(MockFileUploadService.uploadBase64Image).toHaveBeenCalledWith(
      base64Image,
      customerCode,
      measureDatetime,
    );
    expect(MockAnalyseService.analyzeImage).toHaveBeenCalledWith(
      'http://example.com/image.jpg',
    );
    expect(MockMeasureRepository.findOne).toHaveBeenCalledWith({
      where: {
        customerCode,
        measureDatetime: expect.anything(),
        measureType,
      },
    });
    expect(MockMeasureRepository.save).toHaveBeenCalledWith({
      customerCode,
      measureDatetime,
      measureType,
      imageUrl: 'http://example.com/image.jpg',
      measureValue: 100,
      hasConfirmed: false,
    });

    expect(result).toEqual({
      image_url: 'http://example.com/image.jpg',
      measure_value: 100,
      measure_uuid: 'uuid',
    });
  });

  it('should throw an error if measure already exists', async () => {
    const base64Image = 'base64Image';
    const customerCode = 'customerCode';
    const measureDatetime = new Date();
    const measureType = 'WATER';

    // Mocking the behavior
    MockMeasureRepository.findOne.mockResolvedValue({}); // Simulates existing measure

    try {
      await service.uploadImageAndProcessMeasure(
        base64Image,
        customerCode,
        measureDatetime,
        measureType,
      );
    } catch (error) {
      expect(error.response).toEqual({
        error_code: 'DOUBLE_REPORT',
        error_description: 'Leitura do mês já realizada',
      });
    }
  });

  it('should handle errors from file upload', async () => {
    const base64Image = 'base64Image';
    const customerCode = 'customerCode';
    const measureDatetime = new Date();
    const measureType = 'WATER';

    // Mocking the behavior
    MockFileUploadService.uploadBase64Image.mockRejectedValue(
      new Error('Upload failed'),
    );

    try {
      await service.uploadImageAndProcessMeasure(
        base64Image,
        customerCode,
        measureDatetime,
        measureType,
      );
    } catch (error) {
      expect(error.response).toEqual('Failed to process image');
    }
  });

  it('should handle errors from image analysis', async () => {
    const base64Image = 'base64Image';
    const customerCode = 'customerCode';
    const measureDatetime = new Date();
    const measureType = 'WATER';

    // Mocking the behavior
    MockFileUploadService.uploadBase64Image.mockResolvedValue(
      'http://example.com/image.jpg',
    );
    MockAnalyseService.analyzeImage.mockRejectedValue(
      new Error('Analysis failed'),
    );

    try {
      await service.uploadImageAndProcessMeasure(
        base64Image,
        customerCode,
        measureDatetime,
        measureType,
      );
    } catch (error) {
      expect(error.response).toEqual('Failed to process image');
    }
  });
});
