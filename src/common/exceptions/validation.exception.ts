import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exception thrown when validation fails
 * Returns HTTP 400 Bad Request
 */
export class ValidationException extends HttpException {
  constructor(errors: string | Record<string, string[]>) {
    const message = typeof errors === 'string' ? errors : 'Validation failed';

    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'Bad Request',
        errors: typeof errors === 'object' ? errors : undefined,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
