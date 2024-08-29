import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class MeasureValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { base64Image, customerCode, measureDatetime, measureType } =
      req.body;

    // Validar measureType
    if (measureType !== 'WATER' && measureType !== 'GAS') {
      throw new HttpException(
        {
          error_code: 'INVALID_DATA',
          error_description:
            'O tipo de medição fornecido é inválido. Deve ser WATER ou GAS.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar base64Image
    if (
      typeof base64Image !== 'string' ||
      !base64Image.startsWith('data:image/')
    ) {
      throw new HttpException(
        {
          error_code: 'INVALID_DATA',
          error_description: 'O formato da imagem base64 fornecida é inválido.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar customerCode
    if (typeof customerCode !== 'string' || customerCode.trim() === '') {
      throw new HttpException(
        {
          error_code: 'INVALID_DATA',
          error_description:
            'O código do cliente é obrigatório e não pode estar vazio.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar measureDatetime
    if (
      !(measureDatetime instanceof Date) ||
      isNaN(measureDatetime.getTime())
    ) {
      throw new HttpException(
        {
          error_code: 'INVALID_DATA',
          error_description: 'A data e hora da medição fornecida é inválida.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    next();
  }
}
