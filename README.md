# Clado SDK for Deno

[![JSR](https://jsr.io/badges/@yigitkonur/clado-sdk)](https://jsr.io/@yigitkonur/clado-sdk)
[![JSR Score](https://jsr.io/badges/@yigitkonur/clado-sdk/score)](https://jsr.io/@yigitkonur/clado-sdk)

> **Note:** This is an unofficial community SDK for the Clado API. Not affiliated with or endorsed by Clado.

A TypeScript SDK for the [Clado LinkedIn Search & Enrichment API](https://docs.clado.ai). Optimized
for Deno and Supabase Edge Functions.

## Features

- 🔍 **Search** - Find LinkedIn profiles using natural language queries
- 🔬 **Deep Research** - Comprehensive async profile research with polling
- 📧 **Enrichment** - Get contact info, scrape profiles, analyze post reactions
- 💳 **Platform** - Check credits and rate limits
- 🚀 **Edge Ready** - Optimized for Supabase Edge Functions / Deno Deploy
- 📝 **Fully Typed** - 97+ profile fields with complete TypeScript definitions
- 🔄 **Auto Retry** - Exponential backoff for rate limits and server errors

## Installation

### JSR (Recommended)

```bash
deno add @yigitkonur/clado-sdk
```

### Import directly

```typescript
import { CladoClient } from "jsr:@yigitkonur/clado-sdk";
```

### deno.land/x

```typescript
import { CladoClient } from "https://deno.land/x/clado/mod.ts";
```

## Quick Start

```typescript
import { CladoClient } from "@yigitkonur/clado-sdk";

// Uses CLADO_API_KEY environment variable by default
const client = new CladoClient();

// Or provide API key explicitly
const client = new CladoClient({ apiKey: "lk_xxx" });

// Search for profiles
const results = await client.searchPeople({
  query: "software engineers in San Francisco",
  limit: 10,
});

console.log(`Found ${results.total} profiles`);
for (const result of results.results) {
  console.log(`- ${result.profile.name}: ${result.profile.headline}`);
}
```

## API Reference

### Search People

Search for LinkedIn profiles using natural language queries.

```typescript
const results = await client.searchPeople({
  query: "ML engineers at startups",
  limit: 30, // Max 100
  advancedFiltering: true, // AI-powered filtering (default)
  companies: ["Google", "Meta"], // Filter by company
  schools: ["Stanford"], // Filter by school
});

// Pagination using search_id
const page2 = await client.searchPeople({
  searchId: results.search_id,
  offset: 30,
});
```

#### Async Iterator for Large Result Sets

```typescript
for await (const result of client.searchPeopleAll({ query: "engineers" })) {
  console.log(result.profile.name);
  // Automatically handles pagination
}
```

### Deep Research

Initiate comprehensive async research jobs for detailed profile data.

```typescript
// Start a job
const job = await client.initiateDeepResearch({
  query: "machine learning engineers",
  limit: 50,
});

// Option 1: Poll manually
let status = await client.getDeepResearchStatus(job.job_id);
while (status.status === "pending" || status.status === "in_progress") {
  await new Promise((r) => setTimeout(r, 3000));
  status = await client.getDeepResearchStatus(job.job_id);
}

// Option 2: Use the helper (recommended)
const result = await client.waitForDeepResearch(job.job_id, {
  pollInterval: 2000, // Poll every 2 seconds
  timeout: 300000, // 5 minute timeout
});

// Cancel a job
await client.cancelDeepResearch(job.job_id);

// Continue with more results
await client.continueDeepResearch(job.job_id, { limit: 100 });
```

### Enrichment

Get contact information and detailed profile data.

```typescript
// Get contact info (email/phone)
const contact = await client.getContactInfo({
  linkedinUrl: "https://linkedin.com/in/johndoe",
  enrichEmail: true,
  enrichPhone: true, // Costs 10 credits if found
});

if (contact.email) {
  console.log(`Email: ${contact.email} (${contact.email_status})`);
}

// Scrape profile (live data, 2 credits)
const profile = await client.scrapeLinkedInProfile({
  linkedinUrl: "https://linkedin.com/in/johndoe",
  includePosts: true,
  includeExperience: true,
  includeEducation: true,
});

// Get profile from database (cached, 1 credit)
const cached = await client.getLinkedInProfile({
  linkedinUrl: "https://linkedin.com/in/johndoe",
});

// Analyze post reactions
const reactions = await client.getPostReactions({
  postUrl: "https://linkedin.com/posts/...",
  limit: 100,
  reactionType: "like", // Filter by type
});
```

### Platform

Check your account status.

```typescript
const credits = await client.getCredits();
console.log(`Remaining: ${credits.credits_remaining}`);
console.log(`Used: ${credits.credits_used}`);
console.log(`Tier: ${credits.rate_limit_tier}`);
```

## Error Handling

The SDK provides typed error classes for different error conditions:

```typescript
import {
  CladoAuthError,
  CladoClient,
  CladoError,
  CladoNotFoundError,
  CladoRateLimitError,
  CladoValidationError,
} from "@yigitkonur/clado-sdk";

try {
  await client.searchPeople({ query: "test" });
} catch (error) {
  if (error instanceof CladoRateLimitError) {
    // Rate limited - wait and retry
    console.log(`Rate limited. Retry after ${error.retryAfter}s`);
    await new Promise((r) => setTimeout(r, error.retryAfter * 1000));
  } else if (error instanceof CladoAuthError) {
    // Invalid API key
    console.log("Invalid API key");
  } else if (error instanceof CladoNotFoundError) {
    // Resource not found
    console.log("Not found");
  } else if (error instanceof CladoValidationError) {
    // Invalid request parameters
    console.log(`Validation error: ${error.message}`);
  } else if (error instanceof CladoError) {
    // Other API error
    console.log(`API error ${error.status}: ${error.message}`);
  }
}
```

## Supabase Edge Functions

The SDK is optimized for Supabase Edge Functions:

```typescript
// functions/search/index.ts
import { CladoClient, CladoError } from "jsr:@yigitkonur/clado-sdk";

// Initialize outside handler for reuse
const client = new CladoClient(); // Uses CLADO_API_KEY env var

export default async function handler(req: Request): Promise<Response> {
  try {
    const { query, limit = 10 } = await req.json();

    const results = await client.searchPeople({ query, limit });

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof CladoError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.status },
      );
    }
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 },
    );
  }
}
```

Set the secret in Supabase:

```bash
supabase secrets set CLADO_API_KEY=lk_xxx
```

## Configuration

### Environment Variable

The SDK reads from `CLADO_API_KEY` by default:

```bash
export CLADO_API_KEY=lk_xxx
deno run --allow-env --allow-net your_script.ts
```

### Explicit Configuration

```typescript
const client = new CladoClient({
  apiKey: "lk_xxx",
  baseUrl: "https://search.clado.ai", // Optional, for custom deployments
});
```

## Pricing

| Endpoint                    | Credits      |
| --------------------------- | ------------ |
| Search (advanced filtering) | 1 per result |
| Search (standard)           | 5 flat       |
| Deep Research               | 1 per result |
| Contact Info (email)        | 4 if found   |
| Contact Info (phone)        | 10 if found  |
| Scrape LinkedIn             | 2            |
| Get LinkedIn (database)     | 1            |
| Post Reactions              | 1            |
| Get Credits                 | Free         |

## Rate Limits

| Tier | Search  | Contact | Scrape  | Deep Research |
| ---- | ------- | ------- | ------- | ------------- |
| Free | 20/min  | 0/min   | 15/min  | 5/min         |
| $50  | 200/min | 60/min  | 150/min | 50/min        |
| $250 | 400/min | 120/min | 300/min | 100/min       |

## Types

All types are exported for use in your application:

```typescript
import type {
  ContactInfoOptions,
  ContactInfoResponse,
  CreditsResponse,
  DeepResearchOptions,
  DeepResearchStatusResponse,
  Education,
  Experience,
  Post,
  Profile,
  SearchPeopleOptions,
  SearchPeopleResponse,
  SearchResult,
} from "@yigitkonur/clado-sdk";
```

## Running Examples

```bash
# Basic usage
CLADO_API_KEY=lk_xxx deno run --allow-env --allow-net examples/basic_usage.ts

# Pagination
CLADO_API_KEY=lk_xxx deno run --allow-env --allow-net examples/pagination.ts

# Deep research
CLADO_API_KEY=lk_xxx deno run --allow-env --allow-net examples/deep_research.ts
```

## Development

```bash
# Type check
deno task check

# Run tests
deno task test

# Format code
deno task fmt

# Lint
deno task lint

# All checks
deno task all
```

## License

MIT

## Links

- [Clado API Documentation](https://docs.clado.ai)
- [API Pricing](https://docs.clado.ai/api-reference/pricing)
- [Rate Limits](https://docs.clado.ai/api-reference/rate-limits)
- [Discord Community](https://discord.gg/EVZu85Pc5t)
