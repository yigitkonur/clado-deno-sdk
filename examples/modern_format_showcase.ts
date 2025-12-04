/**
 * Modern API Format Showcase
 * Demonstrates the 97+ profile fields available in the modern format.
 *
 * Run with:
 * CLADO_API_KEY=lk_xxx deno run --allow-env --allow-net examples/modern_format_showcase.ts
 */

import { CladoClient } from "../mod.ts";

const client = new CladoClient();

console.log("=== Modern API Format Showcase (97+ Profile Fields) ===\n");
console.log("The SDK uses modern format by default (legacy=false)\n");

const results = await client.searchPeople({
  query: "senior software engineers at tech companies",
  limit: 2,
  advancedFiltering: true,
});

console.log(`Found ${results.total} profiles. Showing detailed data for first result:\n`);

if (results.results.length === 0) {
  console.log("No results found. Try a different query.");
  Deno.exit(0);
}

const result = results.results[0]!; // Safe after length check
const { profile, experience, education } = result;

// =============================================================================
// BASIC IDENTITY (10 fields)
// =============================================================================

console.log("╔═══════════════════════════════════════════════════════════════╗");
console.log("║ BASIC IDENTITY (10 fields)                                    ║");
console.log("╠═══════════════════════════════════════════════════════════════╣");
console.log(`║ ID: ${profile.id?.padEnd(57)}║`);
console.log(`║ Name: ${profile.name?.padEnd(55)}║`);
console.log(`║ Full Name: ${(profile.full_name ?? "N/A").padEnd(50)}║`);
console.log(
  `║ First: ${(profile.first_name ?? "N/A").padEnd(20)} Last: ${
    (profile.last_name ?? "N/A").padEnd(20)
  }║`,
);
console.log("╚═══════════════════════════════════════════════════════════════╝\n");

// =============================================================================
// PROFESSIONAL INFO (3 fields)
// =============================================================================

console.log("╔═══════════════════════════════════════════════════════════════╗");
console.log("║ PROFESSIONAL INFO (3 fields)                                  ║");
console.log("╠═══════════════════════════════════════════════════════════════╣");
console.log(`║ Headline: ${(profile.headline ?? "N/A").substring(0, 51).padEnd(51)}║`);
if (profile.description) {
  console.log(`║ Summary: ${profile.description.substring(0, 52).padEnd(52)}║`);
}
console.log("╚═══════════════════════════════════════════════════════════════╝\n");

// =============================================================================
// LOCATION BREAKDOWN (8 fields)
// =============================================================================

console.log("╔═══════════════════════════════════════════════════════════════╗");
console.log("║ LOCATION BREAKDOWN (8 fields)                                 ║");
console.log("╠═══════════════════════════════════════════════════════════════╣");
console.log(
  `║ Full: ${(profile.location_full ?? profile.location ?? "N/A").substring(0, 55).padEnd(55)}║`,
);
console.log(
  `║ City: ${(profile.location_city ?? "N/A").padEnd(20)} State: ${
    (profile.location_state ?? "N/A").padEnd(20)
  }║`,
);
console.log(
  `║ Country: ${(profile.location_country ?? "N/A").padEnd(25)} ISO: ${
    (profile.location_country_iso2 ?? "N/A").padEnd(15)
  }║`,
);
if (profile.location_regions) {
  console.log(`║ Regions: ${profile.location_regions.join(", ").substring(0, 51).padEnd(51)}║`);
}
console.log("╚═══════════════════════════════════════════════════════════════╝\n");

// =============================================================================
// ENGAGEMENT METRICS (7 fields)
// =============================================================================

console.log("╔═══════════════════════════════════════════════════════════════╗");
console.log("║ ENGAGEMENT METRICS (7 fields)                                 ║");
console.log("╠═══════════════════════════════════════════════════════════════╣");
console.log(
  `║ Connections: ${String(profile.connections_count ?? 0).padEnd(10)} Followers: ${
    String(profile.followers_count ?? 0).padEnd(25)
  }║`,
);
console.log(
  `║ Posts: ${String(profile.post_count ?? 0).padEnd(15)} Recommendations: ${
    String(profile.recommendations_count ?? 0).padEnd(20)
  }║`,
);
console.log("╚═══════════════════════════════════════════════════════════════╝\n");

// =============================================================================
// WORK STATUS & EXPERIENCE (3 + breakdown fields)
// =============================================================================

console.log("╔═══════════════════════════════════════════════════════════════╗");
console.log("║ WORK STATUS & EXPERIENCE                                      ║");
console.log("╠═══════════════════════════════════════════════════════════════╣");
console.log(
  `║ Currently Working: ${
    profile.is_working ? "Yes" : "No"
  }                                      ║`,
);
console.log(
  `║ Decision Maker: ${
    profile.is_decision_maker ? "Yes" : "No"
  }                                         ║`,
);
if (profile.total_experience_duration_months) {
  const years = Math.floor(profile.total_experience_duration_months / 12);
  const months = profile.total_experience_duration_months % 12;
  console.log(`║ Total Experience: ${years} years ${months} months                              ║`);
}

// Show department breakdown
if (profile.total_experience_duration_months_breakdown_department) {
  console.log("║                                                               ║");
  console.log("║ Experience by Department:                                     ║");
  for (const dept of profile.total_experience_duration_months_breakdown_department.slice(0, 3)) {
    const deptYears = Math.floor(dept.total_experience_duration_months / 12);
    console.log(
      `║   - ${dept.department?.substring(0, 30).padEnd(30)} ${
        String(deptYears).padEnd(2)
      }y           ║`,
    );
  }
}

// Show management level breakdown
if (profile.total_experience_duration_months_breakdown_management_level) {
  console.log("║                                                               ║");
  console.log("║ Experience by Management Level:                               ║");
  for (
    const mgmt of profile.total_experience_duration_months_breakdown_management_level.slice(0, 3)
  ) {
    const mgmtYears = Math.floor(mgmt.total_experience_duration_months / 12);
    console.log(
      `║   - ${(mgmt.management_level ?? "N/A").padEnd(30)} ${
        String(mgmtYears).padEnd(2)
      }y           ║`,
    );
  }
}

console.log("╚═══════════════════════════════════════════════════════════════╝\n");

// =============================================================================
// ACTIVE EXPERIENCE (5 fields)
// =============================================================================

if (profile.active_experience_title) {
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║ ACTIVE EXPERIENCE (5 fields)                                  ║");
  console.log("╠═══════════════════════════════════════════════════════════════╣");
  console.log(
    `║ Title: ${(profile.active_experience_title ?? "N/A").substring(0, 54).padEnd(54)}║`,
  );
  console.log(`║ Department: ${(profile.active_experience_department ?? "N/A").padEnd(48)}║`);
  console.log(`║ Management: ${(profile.active_experience_management_level ?? "N/A").padEnd(48)}║`);
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");
}

// =============================================================================
// SKILLS (5 categories)
// =============================================================================

console.log("╔═══════════════════════════════════════════════════════════════╗");
console.log("║ SKILLS (5 categories)                                         ║");
console.log("╠═══════════════════════════════════════════════════════════════╣");
if (profile.skills && profile.skills.length > 0) {
  console.log(`║ Skills: ${profile.skills.slice(0, 5).join(", ").substring(0, 52).padEnd(52)}║`);
}
if (profile.inferred_skills && profile.inferred_skills.length > 0) {
  console.log(
    `║ Inferred: ${profile.inferred_skills.slice(0, 5).join(", ").substring(0, 50).padEnd(50)}║`,
  );
}
if (profile.interests && profile.interests.length > 0) {
  console.log(
    `║ Interests: ${profile.interests.slice(0, 3).join(", ").substring(0, 49).padEnd(49)}║`,
  );
}
console.log("╚═══════════════════════════════════════════════════════════════╝\n");

// =============================================================================
// SALARY PROJECTIONS (17 fields!)
// =============================================================================

if (profile.projected_total_salary) {
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║ SALARY PROJECTIONS (17 fields)                                ║");
  console.log("╠═══════════════════════════════════════════════════════════════╣");
  console.log(
    `║ Total (Median): $${
      String(profile.projected_total_salary_median ?? profile.projected_total_salary).padEnd(43)
    }║`,
  );
  if (profile.projected_base_salary_p25) {
    console.log(`║ Base Salary Range:                                            ║`);
    console.log(`║   P25: $${String(profile.projected_base_salary_p25).padEnd(51)}║`);
    console.log(`║   P50: $${String(profile.projected_base_salary_median).padEnd(51)}║`);
    console.log(`║   P75: $${String(profile.projected_base_salary_p75).padEnd(51)}║`);
  }
  if (profile.projected_additional_salary && profile.projected_additional_salary.length > 0) {
    console.log(`║ Additional Compensation:                                      ║`);
    for (const add of profile.projected_additional_salary) {
      console.log(
        `║   ${add.projected_additional_salary_type}: $${
          String(add.projected_additional_salary_median).padEnd(40)
        }║`,
      );
    }
  }
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");
}

// =============================================================================
// EXPERIENCE DETAILS (48 fields per job)
// =============================================================================

if (experience && experience.length > 0) {
  const exp = experience[0]!; // Safe after length check
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║ EXPERIENCE DETAILS (48 fields per job - showing first)       ║");
  console.log("╠═══════════════════════════════════════════════════════════════╣");
  console.log(`║ Title: ${(exp.title ?? "N/A").substring(0, 54).padEnd(54)}║`);
  console.log(`║ Company: ${(exp.company_name ?? "N/A").substring(0, 52).padEnd(52)}║`);
  console.log(
    `║ Duration: ${(exp.duration_months ?? 0)} months                                        ║`,
  );

  // Company details (available fields)
  if (exp.company_size) {
    console.log(`║ Company Size: ${exp.company_size.padEnd(46)}║`);
  }
  if (exp.company_industry) {
    console.log(`║ Industry: ${exp.company_industry.substring(0, 50).padEnd(50)}║`);
  }
  if (exp.company_annual_revenue) {
    console.log(`║ Revenue: $${String(exp.company_annual_revenue).padEnd(50)}║`);
  }
  if (exp.company_headquarters) {
    console.log(`║ HQ: ${exp.company_headquarters.substring(0, 56).padEnd(56)}║`);
  }

  // Change tracking
  if (exp.change_detected) {
    console.log(`║ ⚠️  Recent Change: ${(exp.change_type ?? "unknown").padEnd(41)}║`);
  }

  console.log("╚═══════════════════════════════════════════════════════════════╝\n");
}

// =============================================================================
// EDUCATION (15 fields per institution)
// =============================================================================

if (education && education.length > 0) {
  const edu = education[0]!; // Safe after length check
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║ EDUCATION (12 fields per institution)                        ║");
  console.log("╠═══════════════════════════════════════════════════════════════╣");
  console.log(`║ Degree: ${(edu.degree ?? "N/A").substring(0, 54).padEnd(54)}║`);
  console.log(`║ Field: ${(edu.field_of_study ?? "N/A").substring(0, 55).padEnd(55)}║`);
  console.log(`║ School: ${(edu.school_name ?? "N/A").substring(0, 54).padEnd(54)}║`);

  // School details
  if (edu.school_linkedin_url) {
    console.log(`║ LinkedIn: ${edu.school_linkedin_url.substring(0, 50).padEnd(50)}║`);
  }
  if (edu.activities_societies) {
    console.log(`║ Activities: ${edu.activities_societies.substring(0, 48).padEnd(48)}║`);
  }

  console.log("╚═══════════════════════════════════════════════════════════════╝\n");
}

// =============================================================================
// CONTENT STATISTICS (6 fields)
// =============================================================================

const hasContent = profile.patents_count || profile.publications_count || profile.projects_count;

if (hasContent) {
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║ CONTENT STATISTICS (6 fields)                                 ║");
  console.log("╠═══════════════════════════════════════════════════════════════╣");
  console.log(
    `║ Patents: ${String(profile.patents_count ?? 0).padEnd(10)} Publications: ${
      String(profile.publications_count ?? 0).padEnd(25)
    }║`,
  );
  console.log(`║ Projects: ${String(profile.projects_count ?? 0).padEnd(52)}║`);

  if (profile.patents_topics && profile.patents_topics.length > 0) {
    console.log(
      `║ Patent Topics: ${profile.patents_topics.join(", ").substring(0, 45).padEnd(45)}║`,
    );
  }
  if (profile.publications_topics && profile.publications_topics.length > 0) {
    console.log(
      `║ Publication Topics: ${
        profile.publications_topics.join(", ").substring(0, 40).padEnd(40)
      }║`,
    );
  }

  console.log("╚═══════════════════════════════════════════════════════════════╝\n");
}

// =============================================================================
// ADDITIONAL DATA ARRAYS
// =============================================================================

console.log("╔═══════════════════════════════════════════════════════════════╗");
console.log("║ ADDITIONAL DATA ARRAYS                                        ║");
console.log("╠═══════════════════════════════════════════════════════════════╣");
console.log(`║ Awards: ${String(result.awards?.length ?? 0).padEnd(55)}║`);
console.log(`║ Certifications: ${String(result.certifications?.length ?? 0).padEnd(46)}║`);
console.log(`║ Organizations: ${String(result.organizations?.length ?? 0).padEnd(47)}║`);
console.log(`║ Patents: ${String(result.patents?.length ?? 0).padEnd(54)}║`);
console.log(`║ Projects: ${String(result.projects?.length ?? 0).padEnd(53)}║`);
console.log(`║ Publications: ${String(result.publications?.length ?? 0).padEnd(48)}║`);
console.log(`║ GitHub Repos: ${String(result.github_repos?.length ?? 0).padEnd(48)}║`);
console.log(`║ Posts: ${String(result.posts?.length ?? 0).padEnd(55)}║`);
console.log("╚═══════════════════════════════════════════════════════════════╝\n");

// =============================================================================
// FIELD COUNT SUMMARY
// =============================================================================

console.log("╔═══════════════════════════════════════════════════════════════╗");
console.log("║ MODERN FORMAT FIELD SUMMARY                                   ║");
console.log("╠═══════════════════════════════════════════════════════════════╣");
console.log("║ Profile: 97+ fields (identity, location, engagement, salary) ║");
console.log("║ Experience: 48 fields per job (company details, financials)  ║");
console.log("║ Education: 15 fields per institution (location, details)     ║");
console.log("║ Posts: Full engagement metrics and metadata                  ║");
console.log("║ Plus: Awards, Certs, Orgs, Patents, Projects, Publications   ║");
console.log("╚═══════════════════════════════════════════════════════════════╝\n");

console.log("💡 This is the MODERN format (legacy=false by default in SDK)");
console.log("📚 See types.ts for complete field definitions");
console.log("🚀 All fields are strongly typed with TypeScript\n");

// Show JSON preview of first result
console.log("=== JSON Preview (first 50 lines) ===\n");
const jsonPreview = JSON.stringify(result, null, 2).split("\n").slice(0, 50).join("\n");
console.log(jsonPreview);
console.log("\n... (truncated for display)\n");

// Final credits check
const credits = await client.getCredits();
console.log(`Credits remaining: ${credits.credits_remaining}`);
