/**
 * Custom error classes for Clado API errors.
 * Following Deno SDK Guide pattern: Error with status property.
 * @module
 */

/**
 * Base error class for Clado API errors.
 * Contains HTTP status code and detailed message.
 *
 * @example
 * ```ts
 * try {
 *   await client.searchPeople({ query: "test" });
 * } catch (error) {
 *   if (error instanceof CladoError) {
 *     console.log(`API error ${error.status}: ${error.message}`);
 *   }
 * }
 * ```
 */
export class CladoError extends Error {
  /** HTTP status code from the API response */
  status: number;

  /**
   * Create a new CladoError.
   * @param status - HTTP status code
   * @param message - Error message from API or description
   */
  constructor(status: number, message: string) {
    super(`API request failed with status ${status}: ${message}`);
    this.status = status;
    this.name = "CladoError";
  }
}

/**
 * Error thrown when rate limit is exceeded.
 * Contains retry-after duration for implementing backoff.
 *
 * @example
 * ```ts
 * try {
 *   await client.searchPeople({ query: "test" });
 * } catch (error) {
 *   if (error instanceof CladoRateLimitError) {
 *     console.log(`Rate limited. Retry after ${error.retryAfter}s`);
 *     await sleep(error.retryAfter * 1000);
 *   }
 * }
 * ```
 */
export class CladoRateLimitError extends CladoError {
  /** Seconds to wait before retrying */
  retryAfter: number;

  /**
   * Create a new CladoRateLimitError.
   * @param retryAfter - Seconds to wait before retrying
   * @param message - Optional custom message
   */
  constructor(retryAfter: number, message?: string) {
    super(429, message ?? `Rate limit exceeded, retry after ${retryAfter}s`);
    this.retryAfter = retryAfter;
    this.name = "CladoRateLimitError";
  }
}

/**
 * Error thrown when authentication fails.
 * Usually indicates invalid or expired API key.
 *
 * @example
 * ```ts
 * try {
 *   await client.searchPeople({ query: "test" });
 * } catch (error) {
 *   if (error instanceof CladoAuthError) {
 *     console.log("Invalid API key. Please check your credentials.");
 *   }
 * }
 * ```
 */
export class CladoAuthError extends CladoError {
  /**
   * Create a new CladoAuthError.
   * @param message - Optional custom message
   */
  constructor(message?: string) {
    super(401, message ?? "Invalid or expired API key");
    this.name = "CladoAuthError";
  }
}

/**
 * Error thrown when a requested resource is not found.
 *
 * @example
 * ```ts
 * try {
 *   await client.getDeepResearchStatus("invalid-job-id");
 * } catch (error) {
 *   if (error instanceof CladoNotFoundError) {
 *     console.log("Job not found");
 *   }
 * }
 * ```
 */
export class CladoNotFoundError extends CladoError {
  /**
   * Create a new CladoNotFoundError.
   * @param message - Optional custom message
   */
  constructor(message?: string) {
    super(404, message ?? "Resource not found");
    this.name = "CladoNotFoundError";
  }
}

/**
 * Error thrown when request validation fails.
 *
 * @example
 * ```ts
 * try {
 *   await client.searchPeople({ limit: 500 }); // Over max limit
 * } catch (error) {
 *   if (error instanceof CladoValidationError) {
 *     console.log(`Invalid request: ${error.message}`);
 *   }
 * }
 * ```
 */
export class CladoValidationError extends CladoError {
  /**
   * Create a new CladoValidationError.
   * @param message - Validation error details
   */
  constructor(message: string) {
    super(422, message);
    this.name = "CladoValidationError";
  }
}
