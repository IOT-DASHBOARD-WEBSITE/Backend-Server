import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exception thrown when a requested resource is not found
 * Returns HTTP 404 Not Found
 */
export class ResourceNotFoundException extends HttpException {
  constructor(resource: string = 'Resource', identifier?: string) {
    const message = identifier
      ? `${resource} with ID ${identifier} not found`
      : `${resource} not found`;

    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message,
        error: 'Not Found',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
