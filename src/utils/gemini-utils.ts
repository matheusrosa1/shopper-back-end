import * as fs from 'fs';
import * as path from 'path';

/* import path from 'path'; */

export const getMimeType = (mimeType: string) => {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/jpg':
    case 'image/jpeg':
      return 'jpeg';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
      return 'heic';
    case 'image/heif':
      return 'heif';
  }
};
export const ensureDirectoryExistence = (filePath: string) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const base64Decode = (base64str: string, file: string) => {
  ensureDirectoryExistence(file); // Garante que o diretório existe
  const bitmap = Buffer.from(base64str, 'base64');
  fs.writeFileSync(file, bitmap);
};
/* export const decode64Base = (base64str: string, file: any) => {
  const bitmap = Buffer.from(base64str, 'base64');
  return fs.writeFileSync(file, bitmap);
}; */

export const getMimeTypeFromBase64 = (base64Str: any) => {
  return base64Str.split(';base64,').shift().replace('data:', '');
};

export const MimeTypeIsValid = (image: string) => {
  const mimeType = image.split(';base64,').shift()?.replace('data:', '') ?? '';
  const validMimeTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/heic',
    'image/heif',
  ];

  return validMimeTypes.some((x) => x === mimeType);
};
/* 
export const rootDir = path.resolve; */
