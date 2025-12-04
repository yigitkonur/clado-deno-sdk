/**
 * Demo: Search People API
 * Tests basic search functionality with various filters.
 */

import { CladoClient, CladoError } from "jsr:@yigitkonur/clado-sdk@0.1.0";

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

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("query") || "software engineers in San Francisco";
    const limit = parseInt(url.searchParams.get("limit") || "5");
    const companies = url.searchParams.get("companies")?.split(",").filter(Boolean);
    const schools = url.searchParams.get("schools")?.split(",").filter(Boolean);
    const advancedFiltering = url.searchParams.get("advanced") !== "false";

    console.log(`Searching: "${query}" with limit=${limit}, advanced=${advancedFiltering}`);

    const results = await client.searchPeople({
      query,
      limit,
      companies,
      schools,
      advancedFiltering,
    });

    const response = {
      success: true,
      query: results.query,
      total: results.total,
      returned: results.results.length,
      search_id: results.search_id,
      profiles: results.results.map((r) => ({
        id: r.profile.id,
        name: r.profile.name,
        headline: r.profile.headline,
        location: r.profile.location,
        linkedin_url: r.profile.linkedin_url,
        connections: r.profile.connections_count,
        current_company: r.experience?.find((e) => e.is_current)?.company_name,
      })),
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Search error:", error);

    if (error instanceof CladoError) {
      return new Response(
        JSON.stringify({ success: false, error: error.message, status: error.status }),
        { status: error.status, headers: corsHeaders },
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: corsHeaders },
    );
  }
});
