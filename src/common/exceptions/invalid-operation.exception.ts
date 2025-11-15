import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exception thrown when an invalid operation is attempted
 * Returns HTTP 400 Bad Request
 */
export class InvalidOperationException extends HttpException {
  constructor(message: string = 'Invalid operation') {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'Bad Request',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
