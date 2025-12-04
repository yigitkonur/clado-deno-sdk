/**
 * Demo: Pagination API
 * Tests pagination with search_id and async iterator.
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
    const searchId = url.searchParams.get("search_id");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const query = url.searchParams.get("query") || "engineers";
    const limit = parseInt(url.searchParams.get("limit") || "10");

    // Test pagination
    if (searchId) {
      // Continue existing search
      console.log(`Continuing search ${searchId} at offset ${offset}`);
      const results = await client.searchPeople({
        searchId,
        offset,
        limit,
      });

      return new Response(
        JSON.stringify(
          {
            success: true,
            page: Math.floor(offset / limit) + 1,
            offset,
            returned: results.results.length,
            total: results.total,
            search_id: results.search_id,
            has_more: offset + results.results.length < results.total,
            profiles: results.results.map((r) => ({
              name: r.profile.name,
              headline: r.profile.headline,
            })),
          },
          null,
          2,
        ),
        { headers: corsHeaders },
      );
    }

    // Start new search and show pagination info
    console.log(`Starting new search: "${query}"`);
    const page1 = await client.searchPeople({ query, limit });

    const response = {
      success: true,
      message: "First page retrieved. Use search_id to get more pages.",
      page: 1,
      returned: page1.results.length,
      total: page1.total,
      search_id: page1.search_id,
      has_more: page1.results.length < page1.total,
      next_offset: limit,
      profiles: page1.results.map((r) => ({
        name: r.profile.name,
        headline: r.profile.headline,
      })),
      usage_example: {
        next_page: `?search_id=${page1.search_id}&offset=${limit}&limit=${limit}`,
      },
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Pagination error:", error);

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
