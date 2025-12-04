/**
 * Main CladoClient class for interacting with the Clado API.
 * @module
 */

import type {
  CancelJobResponse,
  ContactInfoOptions,
  ContactInfoResponse,
  CreditsResponse,
  DeepResearchInitResponse,
  DeepResearchOptions,
  DeepResearchStatusResponse,
  GetLinkedInOptions,
  LinkedInProfileResponse,
  PostReactionsOptions,
  PostReactionsResponse,
  ScrapeLinkedInOptions,
  SearchPeopleOptions,
  SearchPeopleResponse,
  SearchResult,
  WaitForDeepResearchOptions,
} from "./types.ts";

import { buildUrl, DEFAULT_BASE_URL, request, sleep, toSnakeCase } from "./utils.ts";
import { CladoError } from "./errors.ts";

/**
 * Options for creating a CladoClient instance.
 */
export interface CladoClientOptions {
  /**
   * API key for authentication.
   * If not provided, will attempt to read from CLADO_API_KEY environment variable.
   */
  apiKey?: string;

  /**
   * Base URL for the API.
   * @default "https://search.clado.ai"
   */
  baseUrl?: string;
}

/**
 * Client for interacting with the Clado LinkedIn Search & Enrichment API.
 *
 * @example Basic usage
 * ```ts
 * import { CladoClient } from "@clado/deno-sdk";
 *
 * // Uses CLADO_API_KEY environment variable
 * const client = new CladoClient();
 *
 * // Or provide API key explicitly
 * const client = new CladoClient({ apiKey: "lk_xxx" });
 *
 * const results = await client.searchPeople({
 *   query: "software engineers in San Francisco"
 * });
 * ```
 *
 * @example Supabase Edge Function
 * ```ts
 * import { CladoClient } from "@clado/deno-sdk";
 *
 * const client = new CladoClient();
 *
 * export default async function handler(req: Request) {
 *   const results = await client.searchPeople({ query: "..." });
 *   return new Response(JSON.stringify(results));
 * }
 * ```
 */
export class CladoClient {
  #apiKey: string;
  #baseUrl: string;

  /**
   * Create a new CladoClient instance.
   *
   * @param options - Client configuration options
   * @throws Error if no API key is provided and CLADO_API_KEY env var is not set
   *
   * @example
   * ```ts
   * // Using environment variable
   * const client = new CladoClient();
   *
   * // Using explicit API key
   * const client = new CladoClient({ apiKey: "lk_xxx" });
   * ```
   */
  constructor(options: CladoClientOptions = {}) {
    if (options.apiKey) {
      this.#apiKey = options.apiKey;
    } else {
      const envKey = Deno.env.get("CLADO_API_KEY");
      if (!envKey) {
        throw new Error(
          "API key not provided and CLADO_API_KEY env var is not set",
        );
      }
      this.#apiKey = envKey;
    }

    this.#baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  }

  // ===========================================================================
  // Search API
  // ===========================================================================

  /**
   * Search for LinkedIn profiles using natural language queries.
   *
   * @param options - Search options
   * @returns Search results with profiles and pagination info
   *
   * @example Basic search
   * ```ts
   * const results = await client.searchPeople({
   *   query: "software engineers at Google",
   *   limit: 20,
   * });
   * console.log(`Found ${results.total} profiles`);
   * ```
   *
   * @example Pagination
   * ```ts
   * const page1 = await client.searchPeople({ query: "engineers" });
   * const page2 = await client.searchPeople({
   *   searchId: page1.search_id,
   *   offset: 30,
   * });
   * ```
   */
  async searchPeople(
    options: SearchPeopleOptions,
  ): Promise<SearchPeopleResponse> {
    const params = toSnakeCase(options);
    const url = buildUrl(
      this.#baseUrl,
      "/api/search",
      params as Record<string, string | number | boolean | string[] | undefined>,
    );
    return await request<SearchPeopleResponse>(url, this.#apiKey);
  }

  /**
   * Iterate through all search results using an async generator.
   * Automatically handles pagination.
   *
   * @param options - Search options (query is required)
   * @yields Individual search results
   *
   * @example
   * ```ts
   * for await (const result of client.searchPeopleAll({ query: "engineers" })) {
   *   console.log(result.profile.name);
   * }
   * ```
   */
  async *searchPeopleAll(
    options: SearchPeopleOptions & { query: string },
  ): AsyncGenerator<SearchResult> {
    let searchId: string | undefined;
    let offset = 0;
    const limit = options.limit ?? 30;

    while (true) {
      const response = await this.searchPeople({
        ...options,
        searchId,
        offset,
        limit,
      });

      for (const result of response.results) {
        yield result;
      }

      // Check if we've fetched all results
      if (response.results.length < limit || offset + response.results.length >= response.total) {
        break;
      }

      searchId = response.search_id;
      offset += response.results.length;
    }
  }

  // ===========================================================================
  // Deep Research API
  // ===========================================================================

  /**
   * Initiate a deep research job for comprehensive profile data.
   * Returns immediately with a job ID for status polling.
   *
   * @param options - Research options
   * @returns Job ID and initial status
   *
   * @example
   * ```ts
   * const job = await client.initiateDeepResearch({
   *   query: "ML engineers at startups",
   *   limit: 50,
   * });
   * console.log(`Job started: ${job.job_id}`);
   * ```
   */
  async initiateDeepResearch(
    options: DeepResearchOptions,
  ): Promise<DeepResearchInitResponse> {
    const url = buildUrl(this.#baseUrl, "/api/search/deep_research");
    return await request<DeepResearchInitResponse>(url, this.#apiKey, {
      method: "POST",
      body: options,
    });
  }

  /**
   * Get the status of a deep research job.
   *
   * @param jobId - Job ID from initiateDeepResearch
   * @returns Current status and results if completed
   *
   * @example
   * ```ts
   * const status = await client.getDeepResearchStatus(jobId);
   * if (status.status === "completed") {
   *   console.log(`Found ${status.total} profiles`);
   * }
   * ```
   */
  async getDeepResearchStatus(
    jobId: string,
  ): Promise<DeepResearchStatusResponse> {
    const url = buildUrl(this.#baseUrl, `/api/search/deep_research/${jobId}`);
    return await request<DeepResearchStatusResponse>(url, this.#apiKey);
  }

  /**
   * Cancel a running deep research job.
   *
   * @param jobId - Job ID to cancel
   * @returns Cancellation confirmation
   *
   * @example
   * ```ts
   * const result = await client.cancelDeepResearch(jobId);
   * console.log(result.message);
   * ```
   */
  async cancelDeepResearch(jobId: string): Promise<CancelJobResponse> {
    const url = buildUrl(
      this.#baseUrl,
      `/api/search/deep_research/${jobId}/cancel`,
    );
    return await request<CancelJobResponse>(url, this.#apiKey, { method: "POST" });
  }

  /**
   * Continue an existing deep research job with additional results.
   *
   * @param jobId - Job ID to continue
   * @param options - Additional options (e.g., new limit)
   * @returns Updated job status
   *
   * @example
   * ```ts
   * const continued = await client.continueDeepResearch(jobId, { limit: 100 });
   * ```
   */
  async continueDeepResearch(
    jobId: string,
    options?: Partial<DeepResearchOptions>,
  ): Promise<DeepResearchStatusResponse> {
    const url = buildUrl(
      this.#baseUrl,
      `/api/search/deep_research/${jobId}/continue`,
    );
    return await request<DeepResearchStatusResponse>(url, this.#apiKey, {
      method: "POST",
      body: options,
    });
  }

  /**
   * Wait for a deep research job to complete.
   * Polls the status endpoint until completion or timeout.
   *
   * @param jobId - Job ID to wait for
   * @param options - Polling options
   * @returns Final status with results
   * @throws CladoError if job fails or times out
   *
   * @example
   * ```ts
   * const job = await client.initiateDeepResearch({ query: "..." });
   * const result = await client.waitForDeepResearch(job.job_id, {
   *   pollInterval: 3000,
   *   timeout: 300000, // 5 minutes
   * });
   * console.log(`Got ${result.results?.length} profiles`);
   * ```
   */
  async waitForDeepResearch(
    jobId: string,
    options: WaitForDeepResearchOptions = {},
  ): Promise<DeepResearchStatusResponse> {
    const { pollInterval = 2000, timeout = 300000 } = options;
    const startTime = Date.now();

    while (true) {
      const status = await this.getDeepResearchStatus(jobId);

      if (status.status === "completed") {
        return status;
      }

      if (status.status === "failed") {
        throw new CladoError(500, status.error ?? "Deep research job failed");
      }

      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new CladoError(
          408,
          `Deep research job timed out after ${timeout}ms`,
        );
      }

      await sleep(pollInterval);
    }
  }

  // ===========================================================================
  // Enrichment API
  // ===========================================================================

  /**
   * Get contact information (email, phone) for a LinkedIn profile.
   *
   * @param options - Contact info options
   * @returns Contact information with verification status
   *
   * @example
   * ```ts
   * const contact = await client.getContactInfo({
   *   linkedinUrl: "https://linkedin.com/in/johndoe",
   *   enrichEmail: true,
   *   enrichPhone: true,
   * });
   * if (contact.email) {
   *   console.log(`Email: ${contact.email} (${contact.email_status})`);
   * }
   * ```
   */
  async getContactInfo(
    options: ContactInfoOptions,
  ): Promise<ContactInfoResponse> {
    const params = toSnakeCase(options);
    const url = buildUrl(
      this.#baseUrl,
      "/api/enrich/contact",
      params as Record<string, string | number | boolean | string[] | undefined>,
    );
    return await request<ContactInfoResponse>(url, this.#apiKey);
  }

  /**
   * Scrape a LinkedIn profile for detailed data (live scraping).
   * Costs 2 credits per request.
   *
   * @param options - Scrape options
   * @returns Full profile with experience, education, and posts
   *
   * @example
   * ```ts
   * const profile = await client.scrapeLinkedInProfile({
   *   linkedinUrl: "https://linkedin.com/in/johndoe",
   *   includePosts: true,
   * });
   * console.log(profile.profile.headline);
   * ```
   */
  async scrapeLinkedInProfile(
    options: ScrapeLinkedInOptions,
  ): Promise<LinkedInProfileResponse> {
    const params = toSnakeCase(options);
    const url = buildUrl(
      this.#baseUrl,
      "/api/enrich/linkedin",
      params as Record<string, string | number | boolean | string[] | undefined>,
    );
    return await request<LinkedInProfileResponse>(url, this.#apiKey);
  }

  /**
   * Get a LinkedIn profile from the database (cached data).
   * Costs 1 credit per request.
   *
   * @param options - Options with LinkedIn URL
   * @returns Profile data from database
   *
   * @example
   * ```ts
   * const profile = await client.getLinkedInProfile({
   *   linkedinUrl: "https://linkedin.com/in/johndoe",
   * });
   * ```
   */
  async getLinkedInProfile(
    options: GetLinkedInOptions,
  ): Promise<LinkedInProfileResponse> {
    const params = {
      ...toSnakeCase(options),
      database: true,
    };
    const url = buildUrl(
      this.#baseUrl,
      "/api/enrich/linkedin",
      params as Record<string, string | number | boolean | string[] | undefined>,
    );
    return await request<LinkedInProfileResponse>(url, this.#apiKey);
  }

  /**
   * Get reactions and engagement data for a LinkedIn post.
   *
   * @param options - Post reactions options
   * @returns Reactions with user details
   *
   * @example
   * ```ts
   * const reactions = await client.getPostReactions({
   *   postUrl: "https://linkedin.com/posts/...",
   *   limit: 100,
   * });
   * console.log(`Total reactions: ${reactions.total_reactions}`);
   * ```
   */
  async getPostReactions(
    options: PostReactionsOptions,
  ): Promise<PostReactionsResponse> {
    const params = toSnakeCase(options);
    const url = buildUrl(
      this.#baseUrl,
      "/api/enrich/reactions",
      params as Record<string, string | number | boolean | string[] | undefined>,
    );
    return await request<PostReactionsResponse>(url, this.#apiKey);
  }

  // ===========================================================================
  // Platform API
  // ===========================================================================

  /**
   * Get current credit balance and rate limit tier.
   *
   * @returns Credits and tier information
   *
   * @example
   * ```ts
   * const credits = await client.getCredits();
   * console.log(`Remaining: ${credits.credits_remaining}`);
   * console.log(`Tier: ${credits.rate_limit_tier}`);
   * ```
   */
  async getCredits(): Promise<CreditsResponse> {
    const url = buildUrl(this.#baseUrl, "/api/credits");
    return await request<CreditsResponse>(url, this.#apiKey);
  }
}
