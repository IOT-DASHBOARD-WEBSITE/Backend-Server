import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exception thrown when there's a conflict (e.g., duplicate resource)
 * Returns HTTP 409 Conflict
 */
export class ConflictException extends HttpException {
  constructor(message: string = 'Resource already exists') {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message,
        error: 'Conflict',
      },
      HttpStatus.CONFLICT,
    );
  }
}
