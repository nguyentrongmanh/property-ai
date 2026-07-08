import { UnprocessableEntityException, ValidationError } from '@nestjs/common';

/**
 * Turns class-validator errors into Laravel's familiar
 * {message, errors: {field: [messages]}} shape under a 422 status.
 */
export function validationExceptionFactory(
  errors: ValidationError[],
): UnprocessableEntityException {
  const fieldErrors: Record<string, string[]> = {};

  const collect = (error: ValidationError, path: string) => {
    const property = path ? `${path}.${error.property}` : error.property;

    if (error.constraints) {
      fieldErrors[property] = Object.values(error.constraints);
    }

    error.children?.forEach((child) => collect(child, property));
  };

  errors.forEach((error) => collect(error, ''));

  return new UnprocessableEntityException({
    message: 'The given data was invalid.',
    errors: fieldErrors,
  });
}
