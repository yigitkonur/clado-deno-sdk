typed Deno client for the Clado LinkedIn search & enrichment API. search profiles with natural
language, run async deep research jobs across large result sets, enrich profiles with live-scraped
data and contact info. zero dependencies — just `fetch()` and `Deno.*` built-ins.

```typescript
import { CladoClient } from "@yigitkonur/sdk-deno-clado";

const client = new CladoClient();
const results = await client.searchPeople({ query: "ML engineers in Berlin", limit: 10 });
```

[![JSR](https://jsr.io/badges/@yigitkonur/sdk-deno-clado)](https://jsr.io/@yigitkonur/sdk-deno-clado)
[![deno](https://img.shields.io/badge/deno-2.0+-93450a.svg?style=flat-square)](https://deno.land/)
[![license](https://img.shields.io/badge/license-MIT-grey.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## what it does

- **natural language search** — find LinkedIn profiles by description, filter by companies/schools
- **async deep research** — kick off large-scale search jobs, poll or await completion
- **profile enrichment** — live scrape or cached lookup, with posts, experience, education
- **contact info** — email and phone enrichment with verification status
- **post reactions** — get reaction details on any LinkedIn post
- **auto-pagination** — async generator that walks through all result pages
- **retry with backoff** — handles 429s and 5xx automatically, 3 retries with jitter

## install

```bash
deno add jsr:@yigitkonur/sdk-deno-clado
```

or import directly:

```typescript
import { CladoClient } from "jsr:@yigitkonur/sdk-deno-clado";
```

## auth

pass an API key directly or set the `CLADO_API_KEY` env var:

```typescript
// from env (reads CLADO_API_KEY)
const client = new CladoClient();

// explicit
const client = new CladoClient({ apiKey: "lk_..." });
```

## usage

### search

```typescript
const results = await client.searchPeople({
  query: "software engineers in San Francisco",
  limit: 30,
  advancedFiltering: true,
  companies: ["Google", "Meta"],
});

for (const result of results.results) {
  console.log(result.profile.name, result.profile.headline);
}
```

### paginate through all results

```typescript
// auto-pagination via async generator
for await (const result of client.searchPeopleAll({ query: "engineers", limit: 10 })) {
  console.log(result.profile.name);
}

// or manually with search_id
const page1 = await client.searchPeople({ query: "engineers", limit: 30 });
const page2 = await client.searchPeople({ searchId: page1.search_id, offset: 30, limit: 30 });
```

### deep research

async job pattern for large result sets:

```typescript
const job = await client.initiateDeepResearch({
  query: "ML engineers at YC startups",
  limit: 50,
});

// built-in polling (default: 2s interval, 5min timeout)
const result = await client.waitForDeepResearch(job.job_id);

// or poll manually
let status = await client.getDeepResearchStatus(job.job_id);

// cancel if needed
await client.cancelDeepResearch(job.job_id);

// continue a completed job with new params
await client.continueDeepResearch(job.job_id, { limit: 100 });
```

### enrich profiles

```typescript
// live scrape with posts (2 credits)
const profile = await client.scrapeLinkedInProfile({
  linkedinUrl: "https://linkedin.com/in/johndoe",
  includePosts: true,
});

// cached database lookup (1 credit)
const cached = await client.getLinkedInProfile({
  linkedinUrl: "https://linkedin.com/in/johndoe",
});
```

### contact info

```typescript
const contact = await client.getContactInfo({
  linkedinUrl: "https://linkedin.com/in/johndoe",
  enrichEmail: true,
  enrichPhone: false,
});

console.log(contact.email, contact.email_status, contact.credits_used);
```

### post reactions

```typescript
const reactions = await client.getPostReactions({
  postUrl: "https://linkedin.com/posts/...",
  limit: 100,
  reactionType: "all",
});
```

### check credits

```typescript
const credits = await client.getCredits();
console.log(credits.remaining, credits.plan, credits.rate_limit_tier);
```

## error handling

typed error classes with automatic retry built in:

```typescript
import {
  CladoAuthError,
  CladoError,
  CladoNotFoundError,
  CladoRateLimitError,
  CladoValidationError,
} from "@yigitkonur/sdk-deno-clado";

try {
  await client.searchPeople({ query: "engineers" });
} catch (error) {
  if (error instanceof CladoRateLimitError) {
    console.log(`retry after ${error.retryAfter}s`);
  } else if (error instanceof CladoAuthError) {
    console.error("invalid API key");
  } else if (error instanceof CladoValidationError) {
    console.error("bad params:", error.message);
  } else if (error instanceof CladoError) {
    console.error(`API error ${error.status}:`, error.message);
  }
}
```

the HTTP layer retries 429s (respects `Retry-After` header) and 5xx errors with exponential
backoff + jitter. 401, 404, 422 fail immediately.

## credit costs

| operation                                     | cost            |
| :-------------------------------------------- | :-------------- |
| search (advanced filtering)                   | 1 credit/result |
| search (standard)                             | 5 credits flat  |
| live profile scrape                           | 2 credits       |
| database profile lookup                       | 1 credit        |
| contact — email                               | 4 credits       |
| contact — phone                               | 10 credits      |
| contact — both                                | 14 credits      |
| post reactions                                | 1 credit        |
| credits check / deep research status / cancel | free            |

## edge functions

works on Supabase Edge Functions and Deno Deploy out of the box:

```typescript
import { CladoClient } from "jsr:@yigitkonur/sdk-deno-clado";

Deno.serve(async (req) => {
  const client = new CladoClient({ apiKey: Deno.env.get("CLADO_API_KEY")! });
  const { query } = await req.json();
  const results = await client.searchPeople({ query, limit: 10 });
  return Response.json({ profiles: results.results, total: results.total });
});
```

## API methods

| method                    | endpoint                                       | description                      |
| :------------------------ | :--------------------------------------------- | :------------------------------- |
| `searchPeople()`          | `GET /api/search`                              | search LinkedIn profiles         |
| `searchPeopleAll()`       | `GET /api/search`                              | async generator, auto-paginates  |
| `initiateDeepResearch()`  | `POST /api/search/deep_research`               | start async research job         |
| `getDeepResearchStatus()` | `GET /api/search/deep_research/{id}`           | poll job status                  |
| `cancelDeepResearch()`    | `POST /api/search/deep_research/{id}/cancel`   | cancel running job               |
| `continueDeepResearch()`  | `POST /api/search/deep_research/{id}/continue` | extend a job                     |
| `waitForDeepResearch()`   | polling wrapper                                | wait for completion with timeout |
| `scrapeLinkedInProfile()` | `GET /api/enrich/scrape` or `/linkedin`        | live profile scrape              |
| `getLinkedInProfile()`    | `GET /api/enrich/linkedin`                     | cached database lookup           |
| `getContactInfo()`        | `GET /api/enrich/contact`                      | email/phone enrichment           |
| `getPostReactions()`      | `GET /api/enrich/reactions`                    | post reaction details            |
| `getCredits()`            | `GET /api/credits`                             | remaining credits and plan info  |

## development

```bash
deno task all        # fmt + lint + check + test
deno task test       # run tests (needs --allow-env --allow-net)
deno task test:unit  # unit tests only (no network)
deno task check      # type check
deno task fmt        # format
deno task lint       # lint
```

## project structure

```
mod.ts        — public entry point, re-exports everything
client.ts     — CladoClient class (all 12 methods)
types.ts      — all TypeScript interfaces and type aliases
errors.ts     — error class hierarchy
utils.ts      — HTTP transport, URL builder, retry logic
tests/
  client_test.ts   — 13 tests
  errors_test.ts   — 7 tests
  utils_test.ts    — 9 tests
examples/          — usage examples and Supabase edge functions
```

## license

MIT
