import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ConfirmeValueValidationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { measure_uuid, confirmed_value } = req.body;

    // Validar measure_uuid
    if (typeof measure_uuid !== 'string' || measure_uuid.trim() === '') {
      throw new HttpException(
        {
          error_code: 'INVALID_DATA',
          error_description:
            'O UUID da medição é obrigatório e não pode estar vazio.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validar confirmed_value
    if (typeof confirmed_value !== 'number' || isNaN(confirmed_value)) {
      throw new HttpException(
        {
          error_code: 'INVALID_DATA',
          error_description: 'O valor confirmado deve ser um número válido.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    next();
  }
}
