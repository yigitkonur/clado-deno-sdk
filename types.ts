/**
 * Type definitions for the Clado API.
 * Based on the modern response format (legacy format deprecated Nov 2025).
 * @module
 */

// deno-lint-ignore-file camelcase
// API response types use snake_case to match the actual API response format

// =============================================================================
// Profile Types (97+ fields in modern format)
// =============================================================================

/** Department experience breakdown */
export interface DepartmentBreakdown {
  department: string;
  management_level: string | null;
  total_experience_duration_months: number;
}

/** Management level experience breakdown */
export interface ManagementBreakdown {
  department: string | null;
  management_level: string;
  total_experience_duration_months: number;
}

/** Additional salary projection details */
export interface AdditionalSalary {
  projected_additional_salary_type: string;
  projected_additional_salary_p25: number;
  projected_additional_salary_median: number;
  projected_additional_salary_p75: number;
}

/** LinkedIn profile with comprehensive fields */
export interface Profile {
  // Basic Identity (10 fields)
  id: string;
  name: string;
  full_name?: string;
  first_name?: string;
  first_name_initial?: string;
  middle_name?: string | null;
  middle_name_initial?: string | null;
  last_name?: string;
  last_name_initial?: string;

  // Professional Info (3 fields)
  headline?: string;
  description?: string | null;
  summary?: string | null;

  // Profile Images (2 fields)
  picture_permalink?: string | null;
  picture_url?: string | null;

  // Location Breakdown (8 fields)
  location?: string;
  location_full?: string;
  location_country?: string;
  location_city?: string | null;
  location_state?: string | null;
  location_country_iso2?: string;
  location_country_iso3?: string;
  location_regions?: string[];

  // LinkedIn Data (2 fields)
  linkedin_url?: string;
  linkedin_shorthand_names?: string[];

  // Engagement Metrics (7 fields)
  connections_count?: number;
  followers_count?: number;
  post_count?: number;
  posts?: string | null;
  liked_posts?: string | null;
  recommendations?: string | null;
  recommendations_count?: number;

  // Work Status (3 fields)
  is_working?: boolean | number;
  is_decision_maker?: boolean | number;
  total_experience_duration_months?: number;

  // Experience Breakdowns
  total_experience_duration_months_breakdown_department?: DepartmentBreakdown[];
  total_experience_duration_months_breakdown_management_level?: ManagementBreakdown[];

  // Active Experience Details (5 fields)
  active_experience_company_id?: number | null;
  active_experience_title?: string | null;
  active_experience_description?: string | null;
  active_experience_department?: string | null;
  active_experience_management_level?: string | null;

  // Skill Categories (5 fields)
  skills?: string[];
  inferred_skills?: string[];
  historical_skills?: string[];
  interests?: string[];
  services?: string | null;

  // Education Summary (2 fields)
  last_graduation_date?: number | null;
  education_degrees?: string[];

  // Salary Projections (17 fields)
  projected_total_salary?: number | null;
  projected_base_salary_p25?: number | null;
  projected_base_salary_median?: number | null;
  projected_base_salary_p75?: number | null;
  projected_base_salary_period?: string | null;
  projected_base_salary_currency?: string | null;
  projected_base_salary_updated_at?: string | null;
  projected_additional_salary_period?: string | null;
  projected_additional_salary_currency?: string | null;
  projected_additional_salary_updated_at?: string | null;
  projected_total_salary_p25?: number | null;
  projected_total_salary_median?: number | null;
  projected_total_salary_p75?: number | null;
  projected_total_salary_period?: string | null;
  projected_total_salary_currency?: string | null;
  projected_total_salary_updated_at?: string | null;
  projected_additional_salary?: AdditionalSalary[];

  // Content Statistics (6 fields)
  patents_count?: number;
  patents_topics?: string[];
  publications_count?: number;
  publications_topics?: string[];
  projects_count?: number;
  projects_topics?: string[];
}

// =============================================================================
// Experience Type (48 fields per job)
// =============================================================================

/** Work experience entry */
export interface Experience {
  // Basic Job Info
  title?: string;
  company_name?: string;
  description?: string | null;
  location?: string | null;

  // Dates (structured)
  start_date?: string;
  end_date?: string;
  date_from_year?: number | null;
  date_from_month?: number | null;
  date_to_year?: number | null;
  date_to_month?: number | null;
  duration_months?: number;
  is_current?: boolean;

  // Classification
  department?: string | null;
  management_level?: string | null;

  // Company Details
  company_id?: number | null;
  company_linkedin_url?: string | null;
  company_logo_url?: string | null;
  company_website?: string | null;
  company_industry?: string | null;
  company_size?: string | null;
  company_type?: string | null;
  company_founded_year?: number | null;
  company_headquarters?: string | null;
  company_description?: string | null;

  // Company Financials
  company_annual_revenue?: number | null;
  company_employee_count?: number | null;
  company_stock_ticker?: string | null;
  company_stock_exchange?: string | null;

  // Change Tracking
  change_detected?: boolean;
  change_type?: string | null;
  change_date?: string | null;
  previous_title?: string | null;
  previous_company?: string | null;
}

// =============================================================================
// Education Type
// =============================================================================

/** Education entry */
export interface Education {
  degree?: string | null;
  field_of_study?: string | null;
  school_name?: string;
  description?: string | null;

  // Dates
  start_date?: string | null;
  end_date?: string | null;
  date_from_year?: number | null;
  date_from_month?: number | null;
  date_to_year?: number | null;
  date_to_month?: number | null;

  // School Details
  school_linkedin_url?: string | null;
  school_logo_url?: string | null;
  school_type?: string | null;

  // Activities
  activities_societies?: string | null;
  grade?: string | null;
}

// =============================================================================
// Post Types
// =============================================================================

/** Post author information */
export interface PostAuthor {
  firstName?: string;
  lastName?: string;
  username?: string;
  url?: string;
}

/** Post image */
export interface PostImage {
  url: string;
  width?: number;
  height?: number;
}

/** Post video */
export interface PostVideo {
  url: string;
  width?: number;
  height?: number;
}

/** Person mentioned in a post */
export interface PersonMention {
  firstName?: string;
  lastName?: string;
  urn?: string;
  publicIdentifier?: string;
}

/** Company mentioned in a post */
export interface CompanyMention {
  id?: number;
  name?: string;
  publicIdentifier?: string;
  url?: string;
}

/** LinkedIn post */
export interface Post {
  text?: string;
  postUrl?: string;
  urn?: string;

  // Engagement Metrics
  totalReactionCount?: number;
  likeCount?: number;
  appreciationCount?: number;
  empathyCount?: number;
  InterestCount?: number; // Note: API uses capital I
  praiseCount?: number;
  commentsCount?: number;
  repostsCount?: number;

  // Timestamps
  postedAt?: string;
  postedDate?: string;
  postedDateTimestamp?: number;

  // Metadata
  reposted?: boolean;
  isBrandPartnership?: boolean;

  // Author (for reposts)
  author?: PostAuthor;

  // Media
  image?: PostImage[];
  video?: PostVideo[];

  // Mentions
  mentions?: PersonMention[];
  companyMentions?: CompanyMention[];
}

// =============================================================================
// Additional Profile Data Types
// =============================================================================

/** Award or honor */
export interface Award {
  title?: string;
  issuer?: string;
  description?: string;
  date_year?: number;
  date_month?: number;
  order_in_profile?: number;
}

/** Professional certification */
export interface Certification {
  title?: string;
  issuer?: string;
  date_from_year?: number;
  date_from_month?: number;
  date_to_year?: number;
  date_to_month?: number;
}

/** Organization membership */
export interface Organization {
  organization_name?: string;
  position?: string;
  description?: string;
  date_from_year?: number;
  date_from_month?: number;
  date_to_year?: number;
  date_to_month?: number;
}

/** Patent filed or granted */
export interface Patent {
  title?: string;
  description?: string;
  status?: string;
  date_year?: number;
  date_month?: number;
}

/** Professional project */
export interface Project {
  name?: string;
  description?: string;
  date_from_year?: number;
  date_from_month?: number;
  date_to_year?: number;
  date_to_month?: number;
}

/** Published work */
export interface Publication {
  title?: string;
  description?: string;
  publisher_names?: string;
  date_year?: number;
  date_month?: number;
}

/** GitHub repository */
export interface GitHubRepo {
  name?: string;
  summary?: string;
  stars?: number;
  contributions_count?: number;
}

/** Skill with endorsement details */
export interface SkillDetail {
  name: string;
  endorsement_count?: number;
}

// =============================================================================
// Search Types
// =============================================================================

/** Options for searching people */
export interface SearchPeopleOptions {
  /** Natural language search query (required for new search, optional with searchId) */
  query?: string;
  /** Maximum number of results to return (default: 30, max: 100) */
  limit?: number;
  /** Number of results to skip for pagination (default: 0) */
  offset?: number;
  /** UUID from previous search to continue pagination */
  searchId?: string;
  /** Enable AI agent-based filtering (default: true) */
  advancedFiltering?: boolean;
  /** Filter by company names */
  companies?: string[];
  /** Filter by school names */
  schools?: string[];
  /** DEPRECATED: Use legacy format (default: false for modern format) */
  legacy?: boolean;
}

/** Complete search result with profile and related data */
export interface SearchResult {
  profile: Profile;
  experience?: Experience[];
  education?: Education[];
  posts?: Post[];
  awards?: Award[];
  certifications?: Certification[];
  organizations?: Organization[];
  patents?: Patent[];
  projects?: Project[];
  publications?: Publication[];
  github_repos?: GitHubRepo[];
}

/** Response from search people endpoint */
export interface SearchPeopleResponse {
  /** Array of matching profiles with related data */
  results: SearchResult[];
  /** Total number of profiles found */
  total: number;
  /** The search query that was executed */
  query: string;
  /** UUID for pagination - use with offset for next pages */
  search_id: string;
}

// =============================================================================
// Deep Research Types
// =============================================================================

/** Options for initiating deep research */
export interface DeepResearchOptions {
  /** Natural language search query */
  query: string;
  /** Maximum number of results */
  limit?: number;
  /** Filter by company names */
  companies?: string[];
  /** Filter by school names */
  schools?: string[];
}

/** Response when initiating deep research */
export interface DeepResearchInitResponse {
  /** Unique job identifier for status polling */
  job_id: string;
  /** Initial status */
  status: "pending";
  /** Human-readable message */
  message?: string;
}

/** Deep research job status values */
export type DeepResearchStatus = "pending" | "searching" | "in_progress" | "completed" | "failed";

/** Response from deep research status endpoint */
export interface DeepResearchStatusResponse {
  /** Job identifier */
  job_id: string;
  /** Current job status */
  status: DeepResearchStatus;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Results when completed */
  results?: SearchResult[];
  /** Total results found */
  total?: number;
  /** Error message if failed */
  error?: string;
  /** Job creation timestamp */
  created_at?: string;
  /** Last update timestamp */
  updated_at?: string;
}

/** Options for waiting on deep research completion */
export interface WaitForDeepResearchOptions {
  /** Polling interval in milliseconds (default: 2000) */
  pollInterval?: number;
  /** Maximum time to wait in milliseconds (default: 300000 = 5 min) */
  timeout?: number;
}

// =============================================================================
// Enrichment Types
// =============================================================================

/** Contact information status */
export type ContactStatus = "verified" | "unverified" | "not_found";

/** Options for getting contact information */
export interface ContactInfoOptions {
  /** LinkedIn profile URL */
  linkedinUrl: string;
  /** Whether to enrich email (default: true) */
  enrichEmail?: boolean;
  /** Whether to enrich phone (default: false) */
  enrichPhone?: boolean;
}

/** Response from contact info endpoint */
export interface ContactInfoResponse {
  /** LinkedIn profile URL */
  linkedin_url: string;
  /** Email address if found */
  email?: string | null;
  /** Email verification status */
  email_status?: ContactStatus;
  /** Phone number if found */
  phone?: string | null;
  /** Phone verification status */
  phone_status?: ContactStatus;
  /** Credits consumed for this request */
  credits_used?: number;
}

/** Options for scraping LinkedIn profile */
export interface ScrapeLinkedInOptions {
  /** LinkedIn profile URL */
  linkedinUrl: string;
  /** Include recent posts (default: true) */
  includePosts?: boolean;
  /** Include work experience (default: true) */
  includeExperience?: boolean;
  /** Include education (default: true) */
  includeEducation?: boolean;
}

/** Response from LinkedIn profile endpoints */
export interface LinkedInProfileResponse {
  profile: Profile;
  experience?: Experience[];
  education?: Education[];
  posts?: Post[];
  skills_details?: SkillDetail[];
}

/** Options for getting LinkedIn profile from database */
export interface GetLinkedInOptions {
  /** LinkedIn profile URL */
  linkedinUrl: string;
}

/** Reaction types on LinkedIn posts */
export type ReactionType = "all" | "like" | "appreciation" | "empathy" | "interest" | "praise";

/** Options for getting post reactions */
export interface PostReactionsOptions {
  /** LinkedIn post URL */
  postUrl: string;
  /** Maximum reactions to return (default: 100) */
  limit?: number;
  /** Filter by reaction type */
  reactionType?: ReactionType;
}

/** User who reacted to a post */
export interface ReactionUser {
  name?: string;
  linkedin_url?: string;
  headline?: string;
  picture_url?: string | null;
}

/** Single reaction on a post */
export interface Reaction {
  type: string;
  user: ReactionUser;
  timestamp?: string;
}

/** Response from post reactions endpoint */
export interface PostReactionsResponse {
  /** Post URL */
  post_url: string;
  /** Total reaction count */
  total_reactions: number;
  /** List of reactions */
  reactions: Reaction[];
}

// =============================================================================
// Platform Types
// =============================================================================

/** Rate limit tier */
export type RateLimitTier = "free" | "tier1" | "tier2" | "tier3";

/** Response from credits endpoint */
export interface CreditsResponse {
  /** Remaining credits */
  credits_remaining: number;
  /** Credits used to date */
  credits_used: number;
  /** Current plan name */
  plan?: string;
  /** Current rate limit tier */
  rate_limit_tier?: RateLimitTier;
}

/** Response from cancel deep research endpoint */
export interface CancelJobResponse {
  /** Whether the cancellation was successful */
  success: boolean;
  /** Human-readable message */
  message?: string;
}
