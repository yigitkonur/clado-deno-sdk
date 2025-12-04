/**
 * Working with profile data example for Clado SDK.
 * Demonstrates how to work with rich profile data from search results.
 *
 * Run with:
 * CLADO_API_KEY=lk_xxx deno run --allow-env --allow-net examples/working_with_profiles.ts
 */

import { CladoClient } from "../mod.ts";
import type { Education, Experience, Post, SearchResult } from "../mod.ts";

const client = new CladoClient();

// =============================================================================
// Search and Process Profile Data
// =============================================================================

console.log("=== Working with Rich Profile Data ===\n");

const results = await client.searchPeople({
  query: "senior software engineers in San Francisco",
  limit: 5,
  advancedFiltering: true,
});

console.log(`Found ${results.total} profiles. Processing first ${results.results.length}...\n`);

// =============================================================================
// Helper Functions for Profile Analysis
// =============================================================================

/**
 * Calculate total years of experience from work history
 */
function calculateTotalExperience(experience: Experience[] | undefined): number {
  if (!experience || experience.length === 0) return 0;

  let totalMonths = 0;
  for (const exp of experience) {
    if (exp.duration_months) {
      totalMonths += exp.duration_months;
    }
  }
  return Math.round(totalMonths / 12);
}

/**
 * Get current position from experience
 */
function getCurrentPosition(experience: Experience[] | undefined): Experience | undefined {
  if (!experience) return undefined;
  return experience.find((e) => e.is_current);
}

/**
 * Extract company history
 */
function getCompanyHistory(experience: Experience[] | undefined): string[] {
  if (!experience) return [];
  return [...new Set(experience.map((e) => e.company_name).filter(Boolean) as string[])];
}

/**
 * Get highest degree from education
 */
function getHighestDegree(education: Education[] | undefined): Education | undefined {
  if (!education || education.length === 0) return undefined;

  const degreeRank: Record<string, number> = {
    "Doctor": 5,
    "PhD": 5,
    "Master": 4,
    "MBA": 4,
    "Bachelor": 3,
    "Associate": 2,
  };

  return education.reduce((highest, current) => {
    const currentRank = Object.entries(degreeRank).find(([key]) =>
      current.degree?.includes(key)
    )?.[1] ?? 0;

    const highestRank =
      Object.entries(degreeRank).find(([key]) => highest?.degree?.includes(key))?.[1] ?? 0;

    return currentRank > highestRank ? current : (highest ?? current);
  }, education[0]);
}

/**
 * Analyze post engagement
 */
function analyzePostEngagement(posts: Post[] | undefined): {
  totalPosts: number;
  avgReactions: number;
  avgComments: number;
  topPost: Post | undefined;
} {
  if (!posts || posts.length === 0) {
    return { totalPosts: 0, avgReactions: 0, avgComments: 0, topPost: undefined };
  }

  const totalReactions = posts.reduce((sum, p) => sum + (p.totalReactionCount ?? 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.commentsCount ?? 0), 0);

  const topPost = posts.reduce(
    (top, current) =>
      (current.totalReactionCount ?? 0) > (top?.totalReactionCount ?? 0) ? current : top,
    posts[0] as Post | undefined,
  );

  return {
    totalPosts: posts.length,
    avgReactions: Math.round(totalReactions / posts.length),
    avgComments: Math.round(totalComments / posts.length),
    topPost,
  };
}

/**
 * Create a profile summary
 */
function createProfileSummary(result: SearchResult): string {
  const { profile, experience, education, posts } = result;

  const currentPos = getCurrentPosition(experience);
  const totalYears = calculateTotalExperience(experience);
  const highestDegree = getHighestDegree(education);
  const engagement = analyzePostEngagement(posts);
  const companies = getCompanyHistory(experience);

  return `
╔══════════════════════════════════════════════════════════════════╗
║ ${profile.name.padEnd(62)} ║
╠══════════════════════════════════════════════════════════════════╣
║ CURRENT: ${(currentPos?.title ?? "Unknown").padEnd(52)} ║
║ COMPANY: ${(currentPos?.company_name ?? "Unknown").padEnd(52)} ║
║ LOCATION: ${(profile.location ?? "Unknown").padEnd(51)} ║
╠══════════════════════════════════════════════════════════════════╣
║ EXPERIENCE: ${String(totalYears).padEnd(5)} years across ${
    String(companies.length).padEnd(3)
  } companies                  ║
║ EDUCATION: ${(highestDegree?.degree ?? "Unknown").substring(0, 50).padEnd(51)} ║
║ SCHOOL: ${(highestDegree?.school_name ?? "Unknown").substring(0, 53).padEnd(54)} ║
╠══════════════════════════════════════════════════════════════════╣
║ CONNECTIONS: ${String(profile.connections_count ?? 0).padEnd(10)} FOLLOWERS: ${
    String(profile.followers_count ?? 0).padEnd(20)
  } ║
║ POSTS: ${String(engagement.totalPosts).padEnd(15)} AVG REACTIONS: ${
    String(engagement.avgReactions).padEnd(18)
  } ║
╚══════════════════════════════════════════════════════════════════╝
`.trim();
}

// =============================================================================
// Process Each Profile
// =============================================================================

for (const result of results.results) {
  console.log(createProfileSummary(result));
  console.log();
}

// =============================================================================
// Filtering and Sorting Results
// =============================================================================

console.log("=== Filtering Results ===\n");

// Filter: Only profiles with 10+ years experience
const experiencedProfiles = results.results.filter((r) => {
  const years = calculateTotalExperience(r.experience);
  return years >= 10;
});

console.log(`Profiles with 10+ years experience: ${experiencedProfiles.length}`);

// Filter: Only profiles currently at FAANG
const faangCompanies = ["Google", "Meta", "Amazon", "Apple", "Netflix", "Microsoft"];
const faangProfiles = results.results.filter((r) => {
  const current = getCurrentPosition(r.experience);
  return faangCompanies.some((c) => current?.company_name?.includes(c));
});

console.log(`Profiles currently at FAANG: ${faangProfiles.length}`);

// Filter: Profiles with graduate degrees
const graduateProfiles = results.results.filter((r) => {
  const highest = getHighestDegree(r.education);
  return highest?.degree?.includes("Master") || highest?.degree?.includes("PhD");
});

console.log(`Profiles with graduate degrees: ${graduateProfiles.length}`);

// =============================================================================
// Sorting Results
// =============================================================================

console.log("\n=== Sorted Results ===\n");

// Sort by experience (most experienced first)
const sortedByExperience = [...results.results].sort((a, b) => {
  return calculateTotalExperience(b.experience) - calculateTotalExperience(a.experience);
});

console.log("Top 3 by experience:");
for (const r of sortedByExperience.slice(0, 3)) {
  const years = calculateTotalExperience(r.experience);
  console.log(`  - ${r.profile.name}: ${years} years`);
}

// Sort by connections (most connected first)
const sortedByConnections = [...results.results].sort((a, b) => {
  return (b.profile.connections_count ?? 0) - (a.profile.connections_count ?? 0);
});

console.log("\nTop 3 by connections:");
for (const r of sortedByConnections.slice(0, 3)) {
  console.log(`  - ${r.profile.name}: ${r.profile.connections_count} connections`);
}

// =============================================================================
// Aggregating Data Across Results
// =============================================================================

console.log("\n=== Aggregate Statistics ===\n");

// Average experience
const avgExperience =
  results.results.reduce((sum, r) => sum + calculateTotalExperience(r.experience), 0) /
  results.results.length;
console.log(`Average experience: ${avgExperience.toFixed(1)} years`);

// Most common companies
const allCompanies: string[] = [];
for (const r of results.results) {
  allCompanies.push(...getCompanyHistory(r.experience));
}

const companyCount: Record<string, number> = {};
for (const company of allCompanies) {
  companyCount[company] = (companyCount[company] ?? 0) + 1;
}

const topCompanies = Object.entries(companyCount)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5);

console.log("\nMost common companies:");
for (const [company, count] of topCompanies) {
  console.log(`  - ${company}: ${count} people`);
}

// Most common skills
const allSkills: string[] = [];
for (const r of results.results) {
  if (r.profile.skills) {
    allSkills.push(...r.profile.skills);
  }
}

const skillCount: Record<string, number> = {};
for (const skill of allSkills) {
  skillCount[skill] = (skillCount[skill] ?? 0) + 1;
}

const topSkills = Object.entries(skillCount)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10);

console.log("\nMost common skills:");
for (const [skill, count] of topSkills) {
  console.log(`  - ${skill}: ${count} people`);
}

// =============================================================================
// Export Data
// =============================================================================

console.log("\n=== Export Options ===\n");

// Export as JSON
const exportData = results.results.map((r) => ({
  name: r.profile.name,
  headline: r.profile.headline,
  location: r.profile.location,
  linkedin_url: r.profile.linkedin_url,
  experience_years: calculateTotalExperience(r.experience),
  current_company: getCurrentPosition(r.experience)?.company_name,
  current_title: getCurrentPosition(r.experience)?.title,
  highest_degree: getHighestDegree(r.education)?.degree,
  school: getHighestDegree(r.education)?.school_name,
  connections: r.profile.connections_count,
  followers: r.profile.followers_count,
}));

console.log("JSON Export Preview:");
console.log(JSON.stringify(exportData.slice(0, 2), null, 2));

// CSV format
const csvHeaders = Object.keys(exportData[0] ?? {}).join(",");
const csvRows = exportData.map((row) => Object.values(row).map((v) => `"${v ?? ""}"`).join(","));

console.log("\nCSV Export Preview:");
console.log(csvHeaders);
console.log(csvRows.slice(0, 2).join("\n"));

console.log("\n=== Profile Processing Complete ===");
