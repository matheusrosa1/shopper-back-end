import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MeasureProcessorService } from '../measure-processor.service';
import { Measure } from '../../entities/measure.entity';
import { FileUploadService } from '../../../gemini/file-upload.service';
import { AnalyseService } from '../../../gemini/analyze-image.service';

describe('MeasureProcessorService', () => {
  let service: MeasureProcessorService;
  let measureRepository: Repository<Measure>;
  let fileUploadService: FileUploadService;
  let analyseService: AnalyseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeasureProcessorService,
        {
          provide: getRepositoryToken(Measure),
          useClass: Repository,
        },
        {
          provide: FileUploadService,
          useValue: {
            uploadBase64Image: jest.fn(),
          },
        },
        {
          provide: AnalyseService,
          useValue: {
            analyzeImage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MeasureProcessorService>(MeasureProcessorService);
    measureRepository = module.get<Repository<Measure>>(
      getRepositoryToken(Measure),
    );
    fileUploadService = module.get<FileUploadService>(FileUploadService);
    analyseService = module.get<AnalyseService>(AnalyseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload image, analyze it, and save the measure successfully', async () => {
    const base64Image = 'data:image/png;base64,XYZ';
    const customerCode = 'CUSTOMER123';
    const measureDatetime = new Date();
    const measureType = 'WATER';

    const mockImageUrl = 'http://example.com/image.png';
    const mockMeasureValue = 12345;
    const mockSavedMeasure = {
      measureUuid: 'UUID123',
    };

    jest.spyOn(measureRepository, 'findOne').mockResolvedValue(null);
    jest
      .spyOn(fileUploadService, 'uploadBase64Image')
      .mockResolvedValue(mockImageUrl);
    jest
      .spyOn(analyseService, 'analyzeImage')
      .mockResolvedValue(mockMeasureValue);
    jest
      .spyOn(measureRepository, 'save')
      .mockResolvedValue(mockSavedMeasure as any);

    const result = await service.uploadImageAndProcessMeasure(
      base64Image,
      customerCode,
      measureDatetime,
      measureType,
    );

    expect(result).toEqual({
      image_url: mockImageUrl,
      measure_value: mockMeasureValue,
      measure_uuid: mockSavedMeasure.measureUuid,
    });
    expect(fileUploadService.uploadBase64Image).toHaveBeenCalledWith(
      base64Image,
      customerCode,
      measureDatetime,
    );
    expect(analyseService.analyzeImage).toHaveBeenCalledWith(mockImageUrl);
    expect(measureRepository.save).toHaveBeenCalled();
  });

  it('should throw an error if measure already exists for the month', async () => {
    const base64Image = 'data:image/png;base64,XYZ';
    const customerCode = 'CUSTOMER123';
    const measureDatetime = new Date();
    const measureType = 'WATER';

    const existingMeasure = new Measure();

    jest.spyOn(measureRepository, 'findOne').mockResolvedValue(existingMeasure);

    await expect(
      service.uploadImageAndProcessMeasure(
        base64Image,
        customerCode,
        measureDatetime,
        measureType,
      ),
    ).rejects.toThrow(
      new HttpException(
        {
          error_code: 'DOUBLE_REPORT',
          error_description: 'Leitura do mês já realizada',
        },
        HttpStatus.CONFLICT,
      ),
    );
  });

  it('should throw an internal server error if any unexpected error occurs', async () => {
    const base64Image = 'data:image/png;base64,XYZ';
    const customerCode = 'CUSTOMER123';
    const measureDatetime = new Date();
    const measureType = 'WATER';

    jest
      .spyOn(measureRepository, 'findOne')
      .mockRejectedValue(new Error('Unexpected Error'));

    await expect(
      service.uploadImageAndProcessMeasure(
        base64Image,
        customerCode,
        measureDatetime,
        measureType,
      ),
    ).rejects.toThrow(
      new HttpException(
        'Failed to process image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      ),
    );
  });
});
