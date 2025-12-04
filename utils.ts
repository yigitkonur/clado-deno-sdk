/**
 * Internal utilities for HTTP requests and helpers.
 * @module
 */

import {
  CladoAuthError,
  CladoError,
  CladoNotFoundError,
  CladoRateLimitError,
  CladoValidationError,
} from "./errors.ts";

/** Default base URL for Clado API */
export const DEFAULT_BASE_URL = "https://search.clado.ai";

/** Default retry configuration */
export const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
};

/**
 * Build URL with query parameters.
 * Handles arrays and undefined values correctly.
 *
 * @param baseUrl - Base URL
 * @param path - API path
 * @param params - Query parameters
 * @returns Complete URL with query string
 */
export function buildUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string | number | boolean | string[] | undefined>,
): string {
  const url = new URL(path, baseUrl);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        // Handle array params (e.g., companies[]=A&companies[]=B)
        for (const item of value) {
          url.searchParams.append(key, String(item));
        }
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

/**
 * Convert camelCase options to snake_case for API.
 * Only converts known fields, passes through unknown fields.
 *
 * @param obj - Object with camelCase keys
 * @returns Object with snake_case keys for API consumption
 */
export function toSnakeCase<T extends object>(
  obj: T,
): Record<string, unknown> {
  const snakeCaseMap: Record<string, string> = {
    searchId: "search_id",
    advancedFiltering: "advanced_filtering",
    linkedinUrl: "linkedin_url",
    enrichEmail: "enrich_email",
    enrichPhone: "enrich_phone",
    includePosts: "include_posts",
    includeExperience: "include_experience",
    includeEducation: "include_education",
    postUrl: "post_url",
    reactionType: "reaction_type",
  };

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = snakeCaseMap[key] ?? key;
    result[snakeKey] = value;
  }
  return result;
}

/**
 * Sleep for specified milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay.
 */
export function calculateBackoff(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
): number {
  const delay = initialDelayMs * Math.pow(2, attempt);
  // Add jitter (±10%)
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  return Math.min(delay + jitter, maxDelayMs);
}

/** Request options for internal HTTP client */
export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
  retry?: boolean;
  maxRetries?: number;
}

/**
 * Parse error response from API.
 */
async function parseErrorResponse(response: Response): Promise<string> {
  try {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      return json.detail || json.error || json.message || text;
    } catch {
      return text || response.statusText;
    }
  } catch {
    return response.statusText;
  }
}

/**
 * Make HTTP request to Clado API with authentication and retry logic.
 *
 * @param url - Full URL to request
 * @param apiKey - API key for authentication
 * @param options - Request options
 * @returns Parsed JSON response
 * @throws CladoError subclasses for various error conditions
 */
export async function request<T>(
  url: string,
  apiKey: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    retry = true,
    maxRetries = DEFAULT_RETRY_CONFIG.maxRetries,
  } = options;

  const requestHeaders: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
    ...headers,
  };

  if (body) {
    requestHeaders["Content-Type"] = "application/json";
  }

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Handle successful response
      if (response.ok) {
        const text = await response.text();
        if (!text) return {} as T;
        return JSON.parse(text) as T;
      }

      // Handle error responses
      const errorMessage = await parseErrorResponse(response);

      switch (response.status) {
        case 401:
          throw new CladoAuthError(errorMessage);

        case 404:
          throw new CladoNotFoundError(errorMessage);

        case 422:
          throw new CladoValidationError(errorMessage);

        case 429: {
          // Rate limit - extract retry-after header
          const retryAfter = parseInt(
            response.headers.get("Retry-After") || "60",
            10,
          );

          if (retry && attempt < maxRetries) {
            // Wait and retry
            await sleep(retryAfter * 1000);
            attempt++;
            continue;
          }

          throw new CladoRateLimitError(retryAfter, errorMessage);
        }

        default:
          // For 5xx errors, retry with backoff
          if (response.status >= 500 && retry && attempt < maxRetries) {
            const delay = calculateBackoff(
              attempt,
              DEFAULT_RETRY_CONFIG.initialDelayMs,
              DEFAULT_RETRY_CONFIG.maxDelayMs,
            );
            await sleep(delay);
            attempt++;
            continue;
          }

          throw new CladoError(response.status, errorMessage);
      }
    } catch (error) {
      // Re-throw Clado errors
      if (error instanceof CladoError) {
        throw error;
      }

      // Network errors - retry with backoff
      if (retry && attempt < maxRetries) {
        const delay = calculateBackoff(
          attempt,
          DEFAULT_RETRY_CONFIG.initialDelayMs,
          DEFAULT_RETRY_CONFIG.maxDelayMs,
        );
        await sleep(delay);
        attempt++;
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }

      throw new CladoError(
        0,
        `Network error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Should not reach here, but just in case
  throw lastError || new CladoError(0, "Request failed after retries");
}
