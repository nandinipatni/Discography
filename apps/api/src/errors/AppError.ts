/**
 * Typed application error.
 *
 * Throw AppError anywhere in a route or middleware to produce a clean JSON
 * error response via the centralised Fastify setErrorHandler in app.ts.
 *
 * @example
 *   throw new AppError(404, 'Project not found');
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
    // Maintains proper prototype chain in transpiled code
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
