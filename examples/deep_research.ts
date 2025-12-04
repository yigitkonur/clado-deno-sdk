/**
 * Deep Research example for Clado SDK.
 * Demonstrates async job pattern with polling.
 *
 * Run with:
 * CLADO_API_KEY=lk_xxx deno run --allow-env --allow-net examples/deep_research.ts
 */

import { CladoClient, CladoError } from "../mod.ts";

const client = new CladoClient();

console.log("Initiating deep research job...\n");

// Start the job
const job = await client.initiateDeepResearch({
  query: "machine learning engineers at startups",
  limit: 20,
});

console.log(`Job ID: ${job.job_id}`);
console.log(`Initial status: ${job.status}\n`);

// =============================================================================
// Method 1: Manual Polling
// =============================================================================

console.log("=== Manual Polling ===\n");

let status = await client.getDeepResearchStatus(job.job_id);
console.log(`Status: ${status.status}, Progress: ${status.progress ?? 0}%`);

while (status.status === "pending" || status.status === "in_progress") {
  await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds
  status = await client.getDeepResearchStatus(job.job_id);
  console.log(`Status: ${status.status}, Progress: ${status.progress ?? 0}%`);
}

if (status.status === "completed") {
  console.log(`\nCompleted! Found ${status.total} profiles`);
} else {
  console.log(`\nJob failed: ${status.error}`);
}

// =============================================================================
// Method 2: Using waitForDeepResearch Helper
// =============================================================================

console.log("\n=== Using waitForDeepResearch Helper ===\n");

// Start a new job
const job2 = await client.initiateDeepResearch({
  query: "frontend developers React",
  limit: 10,
});

console.log(`Job ID: ${job2.job_id}`);

try {
  // This will poll automatically until complete
  const result = await client.waitForDeepResearch(job2.job_id, {
    pollInterval: 2000, // Poll every 2 seconds
    timeout: 300000, // 5 minute timeout
  });

  console.log(`\nCompleted! Found ${result.total} profiles:`);
  for (const r of result.results ?? []) {
    console.log(`- ${r.profile.name}: ${r.profile.headline}`);
  }
} catch (error) {
  if (error instanceof CladoError) {
    console.log(`Error: ${error.message}`);
  }
}

// =============================================================================
// Cancel a Job
// =============================================================================

console.log("\n=== Cancelling a Job ===\n");

const job3 = await client.initiateDeepResearch({
  query: "test query to cancel",
  limit: 5,
});

console.log(`Started job: ${job3.job_id}`);
const cancelResult = await client.cancelDeepResearch(job3.job_id);
console.log(`Job cancelled: ${cancelResult.success}`);
if (cancelResult.message) {
  console.log(`Message: ${cancelResult.message}`);
}
