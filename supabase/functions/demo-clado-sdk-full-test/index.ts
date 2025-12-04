/**
 * Demo: Full Integration Test
 * Tests complete workflow: search -> enrich -> get contact.
 */

import { CladoClient, CladoError, CladoRateLimitError } from "jsr:@yigitkonur/clado-sdk@0.1.1";

const client = new CladoClient({
  apiKey: Deno.env.get("DENO_SDK_TEST_CLADO_API_KEY")!,
});

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const results: Record<string, unknown> = {
    success: true,
    timestamp: new Date().toISOString(),
    tests: {},
  };

  try {
    // Test 1: Check Credits
    console.log("Test 1: Checking credits...");
    try {
      const credits = await client.getCredits();
      results.tests = {
        ...results.tests as object,
        credits: {
          passed: true,
          remaining: credits.credits_remaining,
          tier: credits.rate_limit_tier,
        },
      };
    } catch (error) {
      results.tests = {
        ...results.tests as object,
        credits: { passed: false, error: String(error) },
      };
    }

    // Test 2: Search People
    console.log("Test 2: Searching people...");
    let searchResult;
    try {
      searchResult = await client.searchPeople({
        query: "software engineers in San Francisco",
        limit: 3,
        advancedFiltering: true,
      });
      results.tests = {
        ...results.tests as object,
        search: {
          passed: true,
          total_found: searchResult.total,
          returned: searchResult.results.length,
          search_id: searchResult.search_id,
          first_profile: searchResult.results.find((r) => r.profile)?.profile.name,
        },
      };
    } catch (error) {
      results.tests = {
        ...results.tests as object,
        search: { passed: false, error: String(error) },
      };
    }

    // Test 3: Pagination (if search succeeded)
    if (searchResult && searchResult.total > 3) {
      console.log("Test 3: Testing pagination...");
      try {
        const page2 = await client.searchPeople({
          searchId: searchResult.search_id,
          offset: 3,
          limit: 2,
        });
        results.tests = {
          ...results.tests as object,
          pagination: {
            passed: true,
            page2_returned: page2.results.length,
            same_search_id: page2.search_id === searchResult.search_id,
          },
        };
      } catch (error) {
        results.tests = {
          ...results.tests as object,
          pagination: { passed: false, error: String(error) },
        };
      }
    } else {
      results.tests = {
        ...results.tests as object,
        pagination: { passed: true, skipped: "Not enough results to test pagination" },
      };
    }

    // Test 4: Get first profile's contact info (if search returned results)
    if (searchResult && searchResult.results.length > 0) {
      const firstProfile = searchResult.results.find((r) => r.profile);
      const linkedinUrl = firstProfile?.profile?.linkedin_url;

      if (linkedinUrl) {
        console.log("Test 4: Getting contact info...");
        try {
          const contact = await client.getContactInfo({
            linkedinUrl,
            enrichEmail: true,
            enrichPhone: false, // Don't spend 10 credits
          });
          results.tests = {
            ...results.tests as object,
            contact_info: {
              passed: true,
              email_found: !!contact.email,
              email_status: contact.email_status,
              credits_used: contact.credits_used,
            },
          };
        } catch (error) {
          if (error instanceof CladoRateLimitError) {
            results.tests = {
              ...results.tests as object,
              contact_info: {
                passed: true,
                skipped: "Rate limited",
                retry_after: error.retryAfter,
              },
            };
          } else {
            results.tests = {
              ...results.tests as object,
              contact_info: { passed: false, error: String(error) },
            };
          }
        }
      }
    }

    // Test 5: Error handling (intentionally bad request)
    console.log("Test 5: Testing error handling...");
    try {
      await client.searchPeople({ limit: 999 }); // Invalid limit
      results.tests = {
        ...results.tests as object,
        error_handling: { passed: false, error: "Should have thrown validation error" },
      };
    } catch (error) {
      if (error instanceof CladoError) {
        results.tests = {
          ...results.tests as object,
          error_handling: {
            passed: true,
            caught_error_type: error.name,
            status: error.status,
          },
        };
      } else {
        results.tests = {
          ...results.tests as object,
          error_handling: { passed: false, error: String(error) },
        };
      }
    }

    // Summary
    const tests = results.tests as Record<string, { passed: boolean }>;
    const testNames = Object.keys(tests);
    const passed = testNames.filter((t) => tests[t]?.passed).length;
    results.summary = {
      total_tests: testNames.length,
      passed,
      failed: testNames.length - passed,
      all_passed: passed === testNames.length,
    };

    return new Response(JSON.stringify(results, null, 2), {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Full test error:", error);

    return new Response(
      JSON.stringify(
        {
          success: false,
          error: String(error),
          tests: results.tests,
        },
        null,
        2,
      ),
      { status: 500, headers: corsHeaders },
    );
  }
});
