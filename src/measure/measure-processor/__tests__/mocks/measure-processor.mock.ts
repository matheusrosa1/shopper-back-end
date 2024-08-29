// measure-processor.mock.ts

export const mockFileUploadService = {
  uploadBase64Image: jest
    .fn()
    .mockResolvedValue('http://example.com/image.jpg'),
};

export const mockAnalyseService = {
  analyzeImage: jest.fn().mockResolvedValue(12345),
};

export const mockMeasureRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn().mockResolvedValue({
    measureUuid: 'some-uuid',
    imageUrl: 'http://example.com/image.jpg',
    measureValue: 12345,
  }),
};
