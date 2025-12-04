# Clado API Coverage

Complete mapping of Clado API endpoints to SDK methods.

---

## Search API (1 endpoint → 2 methods)

### GET /api/search

**SDK Methods:**

- `searchPeople(options)` - Single page search
- `searchPeopleAll(options)` - Async iterator for all results

**Parameters:**

```typescript
{
  query?: string;              // Natural language query
  limit?: number;              // 1-100, default 30
  offset?: number;             // Pagination offset
  searchId?: string;           // UUID from previous search
  advancedFiltering?: boolean; // AI filtering, default true
  companies?: string[];        // Filter by companies
  schools?: string[];          // Filter by schools
  legacy?: boolean;            // Use legacy format (deprecated)
}
```

**Response:**

```typescript
{
  results: SearchResult[];     // Array of profiles
  total: number;               // Total found
  query: string;               // Query executed
  search_id: string;           // UUID for pagination
}
```

**Credits:** 1 per result (advanced) or 5 flat (standard)

---

## Deep Research API (4 endpoints → 5 methods)

### POST /api/search/deep_research

**SDK Method:** `initiateDeepResearch(options)`

**Parameters:**

```typescript
{
  query: string;               // Required
  limit?: number;              // Max results
  companies?: string[];        // Filter
  schools?: string[];          // Filter
}
```

**Response:**

```typescript
{
  job_id: string;              // UUID for polling
  status: "pending";           // Initial status
  message?: string;            // Info message
}
```

**Credits:** 1 per result

---

### GET /api/search/deep_research/{job_id}

**SDK Method:** `getDeepResearchStatus(jobId)`

**Response:**

```typescript
{
  job_id: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  progress?: number;           // 0-100
  results?: SearchResult[];    // When completed
  total?: number;
  error?: string;              // If failed
  created_at?: string;
  updated_at?: string;
}
```

**Credits:** Free

---

### POST /api/search/deep_research/{job_id}/cancel

**SDK Method:** `cancelDeepResearch(jobId)`

**Response:**

```typescript
{
  success: boolean;
  message?: string;
}
```

**Credits:** Free

---

### POST /api/search/deep_research/{job_id}/continue

**SDK Method:** `continueDeepResearch(jobId, options)`

**Response:** Same as Get Status

**Credits:** 1 per result

---

### Helper Method

**SDK Method:** `waitForDeepResearch(jobId, options)`

Polls `getDeepResearchStatus()` until completion.

**Options:**

```typescript
{
  pollInterval?: number;       // Default: 2000ms
  timeout?: number;            // Default: 300000ms (5 min)
}
```

---

## Enrichment API (4 endpoints → 4 methods)

### GET /api/enrich/contact

**SDK Method:** `getContactInfo(options)`

**Parameters:**

```typescript
{
  linkedinUrl: string;         // Required
  enrichEmail?: boolean;       // Default: true
  enrichPhone?: boolean;       // Default: false
}
```

**Response:**

```typescript
{
  linkedin_url: string;
  email?: string | null;
  email_status?: "verified" | "unverified" | "not_found";
  phone?: string | null;
  phone_status?: "verified" | "unverified" | "not_found";
  credits_used?: number;
}
```

**Credits:** 4 (email), 10 (phone), 14 (both)

---

### GET /api/enrich/linkedin

**SDK Method:** `scrapeLinkedInProfile(options)` (live scraping)

**Parameters:**

```typescript
{
  linkedinUrl: string;
  includePosts?: boolean;      // Default: true
  includeExperience?: boolean; // Default: true
  includeEducation?: boolean;  // Default: true
}
```

**Response:**

```typescript
{
  profile: Profile;
  experience?: Experience[];
  education?: Education[];
  posts?: Post[];
  skills_details?: SkillDetail[];
}
```

**Credits:** 2

---

### GET /api/enrich/linkedin?database=true

**SDK Method:** `getLinkedInProfile(options)` (cached data)

**Parameters:**

```typescript
{
  linkedinUrl: string;
}
```

**Response:** Same as scrape

**Credits:** 1

---

### GET /api/enrich/reactions

**SDK Method:** `getPostReactions(options)`

**Parameters:**

```typescript
{
  postUrl: string;
  limit?: number;              // Default: 100
  reactionType?: "all" | "like" | "appreciation" | "empathy" | "interest" | "praise";
}
```

**Response:**

```typescript
{
  post_url: string;
  total_reactions: number;
  reactions: Reaction[];
}
```

**Credits:** 1

---

## Platform API (1 endpoint → 1 method)

### GET /api/credits

**SDK Method:** `getCredits()`

**Response:**

```typescript
{
  credits_remaining: number;
  credits_used: number;
  plan?: string;
  rate_limit_tier?: "free" | "tier1" | "tier2" | "tier3";
}
```

**Credits:** Free

---

## Type Definitions

### Core Types (97+ fields)

- `Profile` - Complete LinkedIn profile (97+ fields from modern format)
- `Experience` - Work history (48 fields including company details)
- `Education` - Educational background (15 fields)
- `Post` - LinkedIn post with engagement (25+ fields)
- `PostAuthor` - Post author info
- `PostImage` - Post image metadata ✅ **Fixed**
- `PostVideo` - Post video metadata ✅ **Fixed**
- `PersonMention` - Mentioned person
- `CompanyMention` - Mentioned company

### Additional Data Types

- `Award` - Awards and honors
- `Certification` - Professional certifications
- `Organization` - Organization memberships
- `Patent` - Patents filed/granted
- `Project` - Professional projects
- `Publication` - Published works
- `GitHubRepo` - GitHub repositories ✅ **Fixed**
- `SkillDetail` - Skills with endorsements

### Request/Response Types

- `SearchPeopleOptions` - Search parameters ✅ **Added legacy**
- `SearchPeopleResponse` - Search results
- `SearchResult` - Single result with profile + related data
- `DeepResearchOptions` - Deep research parameters
- `DeepResearchInitResponse` - Job initiation response
- `DeepResearchStatusResponse` - Job status response
- `DeepResearchStatus` - Status enum
- `WaitForDeepResearchOptions` - Polling options
- `CancelJobResponse` - Cancel confirmation ✅ **Added**
- `ContactInfoOptions` - Contact enrichment parameters
- `ContactInfoResponse` - Contact data
- `ContactStatus` - Verification status enum
- `ScrapeLinkedInOptions` - Scrape parameters
- `LinkedInProfileResponse` - Profile data
- `GetLinkedInOptions` - Database retrieval parameters
- `PostReactionsOptions` - Reactions parameters
- `PostReactionsResponse` - Reactions data
- `Reaction` - Single reaction
- `ReactionUser` - User who reacted
- `ReactionType` - Reaction type enum
- `CreditsResponse` - Credits info
- `RateLimitTier` - Tier enum

### Error Types

- `CladoError` - Base error with status
- `CladoAuthError` - 401 errors
- `CladoRateLimitError` - 429 errors with retryAfter
- `CladoNotFoundError` - 404 errors
- `CladoValidationError` - 422 errors

---

## OpenAPI Compliance Summary

✅ **All schema names match OpenAPI specification** ✅ **All endpoints implemented** ✅ **All
parameters supported** ✅ **All response types defined** ✅ **All error codes handled**

**Total API Coverage: 100%**
