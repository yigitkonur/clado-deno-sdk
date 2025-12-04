/**
 * Profile enrichment example for Clado SDK.
 * Demonstrates contact info, profile scraping, and post reactions.
 *
 * Run with:
 * CLADO_API_KEY=lk_xxx deno run --allow-env --allow-net examples/profile_enrichment.ts
 */

import { CladoClient } from "../mod.ts";

const client = new CladoClient();

// Example LinkedIn URL (replace with real URL for testing)
const linkedinUrl = "https://linkedin.com/in/johndoe";

// =============================================================================
// Get Contact Information
// =============================================================================

console.log("=== Contact Information Enrichment ===\n");

try {
  // Get email only (4 credits if found)
  const emailOnly = await client.getContactInfo({
    linkedinUrl,
    enrichEmail: true,
    enrichPhone: false,
  });

  console.log("Email enrichment result:");
  console.log(`  Email: ${emailOnly.email ?? "Not found"}`);
  console.log(`  Status: ${emailOnly.email_status}`);
  console.log(`  Credits used: ${emailOnly.credits_used}`);
  console.log();

  // Get both email and phone (4 + 10 credits if found)
  const fullContact = await client.getContactInfo({
    linkedinUrl,
    enrichEmail: true,
    enrichPhone: true,
  });

  console.log("Full contact enrichment:");
  console.log(`  Email: ${fullContact.email ?? "Not found"} (${fullContact.email_status})`);
  console.log(`  Phone: ${fullContact.phone ?? "Not found"} (${fullContact.phone_status})`);
  console.log(`  Credits used: ${fullContact.credits_used}`);
} catch (error) {
  console.log(`Contact enrichment failed: ${error}`);
}

// =============================================================================
// Scrape LinkedIn Profile (Live Data)
// =============================================================================

console.log("\n=== Live Profile Scraping (2 credits) ===\n");

try {
  const liveProfile = await client.scrapeLinkedInProfile({
    linkedinUrl,
    includePosts: true,
    includeExperience: true,
    includeEducation: true,
  });

  console.log(`Profile: ${liveProfile.profile.name}`);
  console.log(`Headline: ${liveProfile.profile.headline}`);
  console.log(`Location: ${liveProfile.profile.location}`);
  console.log(`Connections: ${liveProfile.profile.connections_count}`);
  console.log(`Followers: ${liveProfile.profile.followers_count}`);

  // Experience
  if (liveProfile.experience && liveProfile.experience.length > 0) {
    console.log("\nWork Experience:");
    for (const exp of liveProfile.experience.slice(0, 3)) {
      console.log(`  - ${exp.title} at ${exp.company_name}`);
      console.log(`    ${exp.is_current ? "Current" : `${exp.start_date} - ${exp.end_date}`}`);
    }
  }

  // Education
  if (liveProfile.education && liveProfile.education.length > 0) {
    console.log("\nEducation:");
    for (const edu of liveProfile.education) {
      console.log(`  - ${edu.degree} in ${edu.field_of_study}`);
      console.log(`    ${edu.school_name}`);
    }
  }

  // Recent posts
  if (liveProfile.posts && liveProfile.posts.length > 0) {
    console.log("\nRecent Posts:");
    for (const post of liveProfile.posts.slice(0, 2)) {
      const preview = post.text?.substring(0, 100) + "...";
      console.log(`  - ${preview}`);
      console.log(`    Reactions: ${post.totalReactionCount}, Comments: ${post.commentsCount}`);
    }
  }

  // Skills
  if (liveProfile.skills_details && liveProfile.skills_details.length > 0) {
    console.log("\nTop Skills:");
    for (const skill of liveProfile.skills_details.slice(0, 5)) {
      console.log(`  - ${skill.name} (${skill.endorsement_count ?? 0} endorsements)`);
    }
  }
} catch (error) {
  console.log(`Profile scraping failed: ${error}`);
}

// =============================================================================
// Get Profile from Database (Cached Data)
// =============================================================================

console.log("\n=== Database Profile Lookup (1 credit) ===\n");

try {
  const cachedProfile = await client.getLinkedInProfile({
    linkedinUrl,
  });

  console.log(`Cached profile: ${cachedProfile.profile.name}`);
  console.log(`Data may be older but costs less credits.`);
} catch (error) {
  console.log(`Database lookup failed: ${error}`);
}

// =============================================================================
// Get Post Reactions
// =============================================================================

console.log("\n=== Post Reactions Analysis ===\n");

const postUrl = "https://linkedin.com/posts/example-post-123";

try {
  const reactions = await client.getPostReactions({
    postUrl,
    limit: 50,
    reactionType: "all", // or "like", "appreciation", "empathy", etc.
  });

  console.log(`Post: ${reactions.post_url}`);
  console.log(`Total reactions: ${reactions.total_reactions}`);
  console.log("\nTop reactors:");

  for (const reaction of reactions.reactions.slice(0, 10)) {
    console.log(`  - ${reaction.user.name} (${reaction.type})`);
    console.log(`    ${reaction.user.headline}`);
  }

  // Analyze reaction types
  const reactionCounts: Record<string, number> = {};
  for (const r of reactions.reactions) {
    reactionCounts[r.type] = (reactionCounts[r.type] ?? 0) + 1;
  }

  console.log("\nReaction breakdown:");
  for (const [type, count] of Object.entries(reactionCounts)) {
    console.log(`  ${type}: ${count}`);
  }
} catch (error) {
  console.log(`Post reactions failed: ${error}`);
}

// =============================================================================
// Check Final Credit Balance
// =============================================================================

console.log("\n=== Credit Summary ===\n");

const credits = await client.getCredits();
console.log(`Credits remaining: ${credits.credits_remaining}`);
console.log(`Credits used: ${credits.credits_used}`);
console.log(`Rate limit tier: ${credits.rate_limit_tier}`);
