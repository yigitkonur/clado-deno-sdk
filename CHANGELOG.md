# Changelog

## [0.2.0] - 2025-12-06

### Changed
- **BREAKING**: `scrapeLinkedInProfile()` now uses `/api/enrich/scrape` endpoint instead of `/api/enrich/linkedin`
- This change enables **posts to be returned** when `includePosts: true` is set
- Response format remains `LinkedInProfileResponse` (backward compatible)

### Added
- `ScrapeRawResponse` type for internal scrape endpoint response
- `ScrapeRawProfileData` type for raw profile data
- `transformScrapeResponse()` utility function to normalize responses

### Fixed
- Posts were never returned despite `includePosts: true` - now properly returns up to 50 posts

All notable changes to this project will be documented in this file.

## [0.1.1] - 2024-12-04

### Fixed
- **Modern API format by default**: All search and enrichment methods now automatically use `legacy=false` to ensure modern format with 97+ profile fields
- **Deep research status types**: Added `"searching"` status to `DeepResearchStatus` type union
- **Wait logic**: Updated `waitForDeepResearch()` to properly handle `"searching"` status

### Added
- **Supabase demo functions**: 6 production-ready Edge Functions demonstrating all SDK features
- **Modern format showcase**: New example (`modern_format_showcase.ts`) highlighting 97+ profile fields
- **Enhanced examples**: Updated `basic_usage.ts` to show rich modern format fields
- **Comprehensive README**: Added Supabase demo functions section with live URLs
- **API key format docs**: Documented support for both `lk_` and `sk-` prefixes

### Changed
- **Lint configuration**: Excluded `examples/` from no-console rule
- **Package namespace**: Changed from `@clado/deno-sdk` to `@yigitkonur/clado-sdk` (community package)

## [0.1.0] - 2024-12-04

### Added

- Initial release of Clado SDK for Deno
- **Search API**
  - `searchPeople()` - Search LinkedIn profiles with natural language queries
  - `searchPeopleAll()` - Async iterator for paginating through all results
  - Pagination support via `searchId` and `offset`
  - Advanced filtering option for AI-powered result quality
- **Deep Research API**
  - `initiateDeepResearch()` - Start async research jobs
  - `getDeepResearchStatus()` - Poll job status
  - `cancelDeepResearch()` - Cancel running jobs
  - `continueDeepResearch()` - Expand existing research
  - `waitForDeepResearch()` - Helper for automatic polling until completion
- **Enrichment API**
  - `getContactInfo()` - Get email and phone for LinkedIn profiles
  - `scrapeLinkedInProfile()` - Live profile scraping
  - `getLinkedInProfile()` - Get cached profile from database
  - `getPostReactions()` - Analyze LinkedIn post engagement
- **Platform API**
  - `getCredits()` - Check credit balance and rate limit tier
- **Error Handling**
  - `CladoError` - Base error class with HTTP status
  - `CladoAuthError` - 401 authentication errors
  - `CladoRateLimitError` - 429 rate limit errors with `retryAfter`
  - `CladoNotFoundError` - 404 not found errors
  - `CladoValidationError` - 422 validation errors
- **Features**
  - Full TypeScript type definitions (97+ profile fields)
  - Automatic retry with exponential backoff
  - Environment variable support (`CLADO_API_KEY`)
  - Zero external dependencies
  - Optimized for Supabase Edge Functions / Deno Deploy

### Notes

- Uses modern response format (legacy format deprecated Nov 2025)
- Follows official Deno SDK Guide best practices
- Compatible with Deno 2.0+
