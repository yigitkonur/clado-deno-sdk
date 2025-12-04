/**
 * Error handling example for Clado SDK.
 * Demonstrates proper error handling patterns for production use.
 *
 * Run with:
 * CLADO_API_KEY=lk_xxx deno run --allow-env --allow-net examples/error_handling.ts
 */

import {
  CladoAuthError,
  CladoClient,
  CladoError,
  CladoNotFoundError,
  CladoRateLimitError,
  CladoValidationError,
} from "../mod.ts";

// =============================================================================
// Basic Error Handling Pattern
// =============================================================================

console.log("=== Basic Error Handling ===\n");

const client = new CladoClient();

try {
  const results = await client.searchPeople({
    query: "software engineers",
    limit: 10,
  });
  console.log(`Found ${results.total} profiles`);
} catch (error) {
  if (error instanceof CladoError) {
    console.log(`API Error ${error.status}: ${error.message}`);
  } else {
    console.log(`Unexpected error: ${error}`);
  }
}

// =============================================================================
// Comprehensive Error Handling
// =============================================================================

console.log("\n=== Comprehensive Error Handling ===\n");

async function searchWithFullErrorHandling(query: string) {
  try {
    return await client.searchPeople({ query, limit: 10 });
  } catch (error) {
    // Handle rate limiting - wait and retry
    if (error instanceof CladoRateLimitError) {
      console.log(`Rate limited! Waiting ${error.retryAfter} seconds...`);
      await new Promise((r) => setTimeout(r, error.retryAfter * 1000));
      // Retry once
      return await client.searchPeople({ query, limit: 10 });
    }

    // Handle authentication errors
    if (error instanceof CladoAuthError) {
      console.error("Authentication failed. Please check your API key.");
      console.error("Ensure CLADO_API_KEY environment variable is set correctly.");
      throw error; // Re-throw to stop execution
    }

    // Handle validation errors (bad request parameters)
    if (error instanceof CladoValidationError) {
      console.error(`Invalid request: ${error.message}`);
      console.error("Please check your search parameters.");
      throw error;
    }

    // Handle not found errors
    if (error instanceof CladoNotFoundError) {
      console.error(`Resource not found: ${error.message}`);
      return null;
    }

    // Handle other API errors
    if (error instanceof CladoError) {
      console.error(`API Error (${error.status}): ${error.message}`);

      // Differentiate by status code
      if (error.status >= 500) {
        console.error("Server error - the API may be temporarily unavailable.");
        console.error("The SDK will retry automatically for 5xx errors.");
      }
      throw error;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error("Network error - check your internet connection.");
      throw error;
    }

    // Unknown error
    console.error("An unexpected error occurred:", error);
    throw error;
  }
}

// Test the comprehensive handler
try {
  const results = await searchWithFullErrorHandling("data scientists");
  if (results) {
    console.log(`Search successful: ${results.total} results`);
  }
} catch {
  console.log("Search failed after error handling");
}

// =============================================================================
// Rate Limit Handling with Exponential Backoff
// =============================================================================

console.log("\n=== Rate Limit Handling with Backoff ===\n");

// Example: Rate limit handling with backoff (callable pattern)
async function _searchWithBackoff(
  query: string,
  maxRetries = 3,
): Promise<Awaited<ReturnType<typeof client.searchPeople>> | null> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.searchPeople({ query, limit: 10 });
    } catch (error) {
      if (error instanceof CladoRateLimitError) {
        lastError = error;

        if (attempt < maxRetries) {
          // Use server-provided retry-after or exponential backoff
          const waitTime = error.retryAfter * 1000 || Math.pow(2, attempt) * 1000;
          console.log(`Attempt ${attempt + 1} rate limited. Waiting ${waitTime / 1000}s...`);
          await new Promise((r) => setTimeout(r, waitTime));
          continue;
        }
      }

      // For other errors, don't retry
      throw error;
    }
  }

  console.error(`Failed after ${maxRetries} retries due to rate limiting`);
  throw lastError;
}

// =============================================================================
// Graceful Degradation Pattern
// =============================================================================

console.log("\n=== Graceful Degradation ===\n");

interface ProfileData {
  name: string;
  headline?: string;
  email?: string;
  phone?: string;
}

// Example: Graceful degradation pattern (callable pattern)
async function _getProfileWithGracefulDegradation(
  linkedinUrl: string,
): Promise<ProfileData | null> {
  // Try to get full profile data
  try {
    const profile = await client.scrapeLinkedInProfile({
      linkedinUrl,
      includePosts: true,
    });

    const result: ProfileData = {
      name: profile.profile.name,
      headline: profile.profile.headline,
    };

    // Try to enrich with contact info (may fail separately)
    try {
      const contact = await client.getContactInfo({
        linkedinUrl,
        enrichEmail: true,
        enrichPhone: true,
      });
      result.email = contact.email ?? undefined;
      result.phone = contact.phone ?? undefined;
    } catch (_err) {
      console.log("Contact enrichment failed, continuing without contact info");
      // Don't fail the whole operation
    }

    return result;
  } catch (error) {
    // If live scraping fails, try database lookup
    if (error instanceof CladoError && error.status >= 500) {
      console.log("Live scraping failed, falling back to database...");
      try {
        const cached = await client.getLinkedInProfile({ linkedinUrl });
        return {
          name: cached.profile.name,
          headline: cached.profile.headline,
        };
      } catch {
        console.log("Database lookup also failed");
      }
    }
    return null;
  }
}

// =============================================================================
// Deep Research Error Handling
// =============================================================================

console.log("\n=== Deep Research Error Handling ===\n");

// Example: Deep research with proper cleanup (callable pattern)
async function _runDeepResearchSafely(query: string) {
  let jobId: string | null = null;

  try {
    // Start the job
    const job = await client.initiateDeepResearch({ query, limit: 20 });
    jobId = job.job_id;
    console.log(`Started job: ${jobId}`);

    // Wait with timeout handling
    const result = await client.waitForDeepResearch(jobId, {
      pollInterval: 2000,
      timeout: 60000, // 1 minute timeout for this example
    });

    console.log(`Job completed: ${result.total} profiles found`);
    return result;
  } catch (error) {
    if (error instanceof CladoError) {
      // Check if it's a timeout
      if (error.status === 408) {
        console.log("Job timed out. You can check status later or cancel.");

        // Optionally cancel the job
        if (jobId) {
          try {
            await client.cancelDeepResearch(jobId);
            console.log("Job cancelled successfully");
          } catch {
            console.log("Failed to cancel job");
          }
        }
      } else {
        console.log(`Deep research failed: ${error.message}`);
      }
    }
    return null;
  }
}

// =============================================================================
// Production-Ready Wrapper Class
// =============================================================================

console.log("\n=== Production Wrapper Example ===\n");

class CladoService {
  private client: CladoClient;
  private maxRetries: number;

  constructor(apiKey?: string, maxRetries = 3) {
    this.client = new CladoClient({ apiKey });
    this.maxRetries = maxRetries;
  }

  async searchPeople(query: string, limit = 30) {
    return await this.withRetry(() =>
      this.client.searchPeople({
        query,
        limit,
        advancedFiltering: true,
      })
    );
  }

  async getProfile(linkedinUrl: string) {
    return await this.withRetry(() =>
      this.client.scrapeLinkedInProfile({
        linkedinUrl,
        includePosts: false, // Reduce data for speed
      })
    );
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i <= this.maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry auth or validation errors
        if (error instanceof CladoAuthError || error instanceof CladoValidationError) {
          throw error;
        }

        // Retry rate limits and server errors
        if (error instanceof CladoRateLimitError) {
          await new Promise((r) => setTimeout(r, error.retryAfter * 1000));
          continue;
        }

        if (error instanceof CladoError && error.status >= 500 && i < this.maxRetries) {
          await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
          continue;
        }

        throw error;
      }
    }

    throw lastError ?? new Error("Unknown error after retries");
  }
}

// Use the production wrapper
const service = new CladoService();
try {
  const results = await service.searchPeople("engineers", 5);
  console.log(`Service returned ${results.total} results`);
} catch (error) {
  console.log(`Service error: ${error}`);
}

console.log("\n=== Error Handling Examples Complete ===");
