# Changelog

All notable changes to the Clado SDK for Deno will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
