/**
 * Supabase Edge Function example for Clado SDK.
 *
 * This file demonstrates how to use the SDK in a Supabase Edge Function.
 * Deploy to Supabase with:
 *   supabase functions deploy my-function
 *
 * Set the secret:
 *   supabase secrets set CLADO_API_KEY=lk_xxx
 */

import { CladoClient, CladoError, CladoRateLimitError } from "../mod.ts";
import type { Profile } from "../mod.ts";

// Initialize client outside handler for reuse across invocations
// This improves performance by avoiding re-initialization on every request
const apiKey = Deno.env.get("CLADO_API_KEY");
if (!apiKey) {
  throw new Error("Missing CLADO_API_KEY in environment");
}
const client = new CladoClient({ apiKey });

/**
 * Edge Function handler for searching LinkedIn profiles.
 *
 * Example request:
 * POST /search
 * { "query": "software engineers in NYC", "limit": 10 }
 */
export default async function handler(req: Request): Promise<Response> {
  // CORS headers for browser requests
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { query, limit = 10 } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Missing 'query' in request body" }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Search for profiles
    const results = await client.searchPeople({
      query,
      limit: Math.min(limit, 50), // Cap at 50
      advancedFiltering: true,
    });

    // Transform response (optional - return only what frontend needs)
    const profiles: Partial<Profile>[] = results.results.map((r) => ({
      id: r.profile.id,
      name: r.profile.name,
      headline: r.profile.headline,
      location: r.profile.location,
      linkedin_url: r.profile.linkedin_url,
      picture_url: r.profile.picture_url,
    }));

    return new Response(
      JSON.stringify({
        profiles,
        total: results.total,
        searchId: results.search_id,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    // Handle Clado-specific errors
    if (error instanceof CladoRateLimitError) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          retryAfter: error.retryAfter,
        }),
        { status: 429, headers: corsHeaders },
      );
    }

    if (error instanceof CladoError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.status, headers: corsHeaders },
      );
    }

    // Log unexpected errors
    console.error("Unexpected error:", error);

    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: corsHeaders },
    );
  }
}

// =============================================================================
// Additional endpoint examples
// =============================================================================

/**
 * Example: Enrich a LinkedIn profile
 * POST /enrich
 * { "linkedinUrl": "https://linkedin.com/in/johndoe" }
 */
export async function enrichHandler(req: Request): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const { linkedinUrl, includeContact = false } = await req.json();

    if (!linkedinUrl) {
      return new Response(
        JSON.stringify({ error: "Missing 'linkedinUrl'" }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Get profile data
    const profile = await client.scrapeLinkedInProfile({
      linkedinUrl,
      includePosts: true,
    });

    // Optionally get contact info
    let contact = null;
    if (includeContact) {
      contact = await client.getContactInfo({
        linkedinUrl,
        enrichEmail: true,
        enrichPhone: true,
      });
    }

    return new Response(
      JSON.stringify({
        profile: profile.profile,
        experience: profile.experience,
        education: profile.education,
        contact,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    if (error instanceof CladoError) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: error.status, headers: corsHeaders },
      );
    }
    throw error;
  }
}
