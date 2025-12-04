/**
 * Advanced search example for Clado SDK.
 * Demonstrates filtering by companies, schools, and advanced options.
 *
 * Run with:
 * CLADO_API_KEY=lk_xxx deno run --allow-env --allow-net examples/advanced_search.ts
 */

import { CladoClient } from "../mod.ts";

const client = new CladoClient();

// =============================================================================
// Filter by Companies
// =============================================================================

console.log("=== Search with Company Filter ===\n");

const techResults = await client.searchPeople({
  query: "software engineers",
  companies: ["Google", "Meta", "Apple"],
  limit: 10,
  advancedFiltering: true, // AI-powered filtering for better relevance
});

console.log(`Found ${techResults.total} engineers at FAANG companies:\n`);
for (const result of techResults.results) {
  const currentJob = result.experience?.find((e) => e.is_current);
  console.log(`- ${result.profile.name}`);
  console.log(`  ${currentJob?.title ?? result.profile.headline}`);
  console.log(`  ${currentJob?.company_name ?? "Unknown company"}`);
  console.log();
}

// =============================================================================
// Filter by Schools
// =============================================================================

console.log("=== Search with School Filter ===\n");

const ivyResults = await client.searchPeople({
  query: "product managers",
  schools: ["Harvard", "Stanford", "MIT"],
  limit: 10,
});

console.log(`Found ${ivyResults.total} PMs from top schools:\n`);
for (const result of ivyResults.results) {
  const degree = result.education?.[0];
  console.log(`- ${result.profile.name}`);
  console.log(`  ${result.profile.headline}`);
  if (degree) {
    console.log(`  ${degree.degree} from ${degree.school_name}`);
  }
  console.log();
}

// =============================================================================
// Combine Company and School Filters
// =============================================================================

console.log("=== Combined Company + School Filter ===\n");

const eliteResults = await client.searchPeople({
  query: "executives",
  companies: ["Microsoft", "Amazon"],
  schools: ["Harvard Business School", "Wharton"],
  limit: 5,
  advancedFiltering: true,
});

console.log(`Found ${eliteResults.total} elite executives:\n`);
for (const result of eliteResults.results) {
  console.log(`- ${result.profile.name}`);
  console.log(`  ${result.profile.headline}`);
  console.log(`  Location: ${result.profile.location}`);
  console.log(`  Connections: ${result.profile.connections_count}`);
  console.log();
}

// =============================================================================
// Standard vs Advanced Filtering
// =============================================================================

console.log("=== Standard vs Advanced Filtering ===\n");

// Standard filtering (5 credits flat)
const standardResults = await client.searchPeople({
  query: "data scientists in NYC",
  limit: 20,
  advancedFiltering: false,
});

console.log(`Standard search: ${standardResults.results.length} results (5 credits)`);

// Advanced filtering (1 credit per result, higher quality)
const advancedResults = await client.searchPeople({
  query: "data scientists in NYC",
  limit: 20,
  advancedFiltering: true,
});

console.log(
  `Advanced search: ${advancedResults.results.length} results (${advancedResults.results.length} credits)`,
);
console.log("\nAdvanced filtering may return fewer results but with higher relevance.");

// =============================================================================
// Check Credits After Searches
// =============================================================================

const credits = await client.getCredits();
console.log(`\nCredits remaining: ${credits.credits_remaining}`);
