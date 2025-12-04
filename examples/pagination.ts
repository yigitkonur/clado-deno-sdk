/**
 * Pagination example for Clado SDK.
 * Shows both manual pagination and async iterator approaches.
 *
 * Run with:
 * CLADO_API_KEY=lk_xxx deno run --allow-env --allow-net examples/pagination.ts
 */

import { CladoClient } from "../mod.ts";

const client = new CladoClient();

// =============================================================================
// Method 1: Manual Pagination
// =============================================================================

console.log("=== Manual Pagination ===\n");

// First page
const page1 = await client.searchPeople({
  query: "product managers",
  limit: 10,
});

console.log(`Page 1: ${page1.results.length} results (total: ${page1.total})`);
console.log(`Search ID: ${page1.search_id}\n`);

// Second page using search_id
if (page1.total > 10) {
  const page2 = await client.searchPeople({
    searchId: page1.search_id,
    offset: 10,
    limit: 10,
  });

  console.log(`Page 2: ${page2.results.length} results`);
}

// =============================================================================
// Method 2: Async Iterator (searchPeopleAll)
// =============================================================================

console.log("\n=== Async Iterator ===\n");

let count = 0;
const maxResults = 25; // Stop after 25 to avoid using too many credits

for await (
  const result of client.searchPeopleAll({
    query: "data scientists",
    limit: 10, // Fetch 10 per request
  })
) {
  count++;
  console.log(`${count}. ${result.profile.name} - ${result.profile.headline}`);

  if (count >= maxResults) {
    console.log(`\nStopped after ${maxResults} results`);
    break;
  }
}

console.log(`\nTotal profiles iterated: ${count}`);
