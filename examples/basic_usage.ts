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

  // Modern format: Show additional rich fields
  if (result.profile.connections_count) {
    console.log(`  Connections: ${result.profile.connections_count}`);
  }
  if (result.profile.total_experience_duration_months) {
    const years = Math.floor(result.profile.total_experience_duration_months / 12);
    console.log(`  Experience: ${years} years`);
  }
  if (result.profile.projected_total_salary) {
    console.log(`  Projected Salary: $${result.profile.projected_total_salary.toLocaleString()}`);
  }

  // Show current company from experience
  const currentJob = result.experience?.find((e) => e.is_current);
  if (currentJob) {
    console.log(`  Current: ${currentJob.title} at ${currentJob.company_name}`);
  }

  console.log();
}

// Check remaining credits
const credits = await client.getCredits();
console.log(`\nCredits remaining: ${credits.credits_remaining}`);
console.log(`Rate limit tier: ${credits.rate_limit_tier}`);
