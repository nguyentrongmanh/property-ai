export class AiServiceException extends Error {
  private constructor(
    message: string,
    private readonly rateLimited: boolean,
  ) {
    super(message);
    this.name = 'AiServiceException';
  }

  static unreachable(reason: string): AiServiceException {
    return new AiServiceException(
      `The AI service could not be reached: ${reason}`,
      false,
    );
  }

  static invalidResponse(reason: string): AiServiceException {
    return new AiServiceException(
      `The AI service returned an unusable answer: ${reason}`,
      false,
    );
  }

  static rateLimited(): AiServiceException {
    return new AiServiceException(
      'The AI service rate limit was reached.',
      true,
    );
  }

  isRateLimited(): boolean {
    return this.rateLimited;
  }
}
