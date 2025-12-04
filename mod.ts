/**
 * # Clado SDK for Deno
 *
 * A TypeScript SDK for the Clado LinkedIn Search & Enrichment API.
 * Optimized for Deno and Supabase Edge Functions.
 *
 * ## Features
 *
 * - **Search**: Find LinkedIn profiles using natural language queries
 * - **Deep Research**: Comprehensive async profile research with polling
 * - **Enrichment**: Get contact info, scrape profiles, analyze post reactions
 * - **Platform**: Check credits and rate limits
 *
 * ## Quick Start
 *
 * ```typescript
 * import { CladoClient } from "@clado/deno-sdk";
 *
 * // Uses CLADO_API_KEY env var by default
 * const client = new CladoClient();
 *
 * // Or provide API key explicitly
 * const client = new CladoClient({ apiKey: "lk_xxx" });
 *
 * // Search for profiles
 * const results = await client.searchPeople({
 *   query: "software engineers in San Francisco",
 *   limit: 10,
 * });
 *
 * console.log(`Found ${results.total} profiles`);
 * ```
 *
 * ## Supabase Edge Functions
 *
 * ```typescript
 * import { CladoClient } from "@clado/deno-sdk";
 *
 * const client = new CladoClient(); // Uses env var
 *
 * export default async function handler(req: Request): Promise<Response> {
 *   const results = await client.searchPeople({ query: "..." });
 *   return new Response(JSON.stringify(results));
 * }
 * ```
 *
 * @module
 */

// Re-export main client
export { CladoClient } from "./client.ts";
export type { CladoClientOptions } from "./client.ts";

// Re-export all types
export type {
  AdditionalSalary,
  Award,
  CancelJobResponse,
  Certification,
  CompanyMention,
  // Enrichment types
  ContactInfoOptions,
  ContactInfoResponse,
  ContactStatus,
  // Platform types
  CreditsResponse,
  DeepResearchInitResponse,
  // Deep Research types
  DeepResearchOptions,
  DeepResearchStatus,
  DeepResearchStatusResponse,
  DepartmentBreakdown,
  Education,
  Experience,
  GetLinkedInOptions,
  GitHubRepo,
  LinkedInProfileResponse,
  ManagementBreakdown,
  Organization,
  Patent,
  PersonMention,
  Post,
  PostAuthor,
  PostImage,
  PostReactionsOptions,
  PostReactionsResponse,
  PostVideo,
  // Profile types
  Profile,
  Project,
  Publication,
  RateLimitTier,
  Reaction,
  ReactionType,
  ReactionUser,
  ScrapeLinkedInOptions,
  // Search types
  SearchPeopleOptions,
  SearchPeopleResponse,
  SearchResult,
  SkillDetail,
  WaitForDeepResearchOptions,
} from "./types.ts";

// Re-export error classes
export {
  CladoAuthError,
  CladoError,
  CladoNotFoundError,
  CladoRateLimitError,
  CladoValidationError,
} from "./errors.ts";
