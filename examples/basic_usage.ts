/**
 * Basic usage example for Clado SDK.
 *
 * Run with:
 * CLADO_API_KEY=lk_xxx deno run --allow-env --allow-net examples/basic_usage.ts
 */

import { CladoClient } from "../mod.ts";

// Create client (uses CLADO_API_KEY env var)
const client = new CladoClient();

// Search for profiles
console.log("Searching for software engineers in San Francisco...\n");

const results = await client.searchPeople({
  query: "software engineers in San Francisco",
  limit: 5,
  advancedFiltering: true,
});

console.log(`Found ${results.total} profiles (showing first ${results.results.length}):\n`);

for (const result of results.results) {
  console.log(`- ${result.profile.name}`);
  console.log(`  ${result.profile.headline}`);
  console.log(`  ${result.profile.location}`);
  console.log(`  LinkedIn: ${result.profile.linkedin_url}`);
  console.log();
}

// Check remaining credits
const credits = await client.getCredits();
console.log(`\nCredits remaining: ${credits.credits_remaining}`);
console.log(`Rate limit tier: ${credits.rate_limit_tier}`);
