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
    const { image, customer_code, measure_datetime, measure_type } = req.body;

    // Validar measureType
    if (measure_type !== 'WATER' || measure_type !== 'GAS') {
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
    if (typeof image !== 'string' || !image.startsWith('data:image/')) {
      throw new HttpException(
        {
          error_code: 'INVALID_DATA',
          error_description: 'O formato da imagem base64 fornecida é inválido.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar customerCode
    if (typeof customer_code !== 'string' || customer_code.trim() === '') {
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
      !(measure_datetime instanceof Date) ||
      isNaN(measure_datetime.getTime())
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
