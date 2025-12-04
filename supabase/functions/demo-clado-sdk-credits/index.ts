/**
 * Demo: Credits API
 * Tests credit balance and rate limit info.
 */

import { CladoClient, CladoError } from "jsr:@yigitkonur/clado-sdk@0.1.1";

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
    console.log("Fetching credit information...");
    const credits = await client.getCredits();

    const response = {
      success: true,
      credits: {
        remaining: credits.credits_remaining,
        used: credits.credits_used,
        plan: credits.plan,
        rate_limit_tier: credits.rate_limit_tier,
      },
      rate_limits_info: {
        tier1: "20/min search, 0/min contact, 15/min scrape",
        tier2: "200/min search, 60/min contact, 150/min scrape",
        tier3: "400/min search, 120/min contact, 300/min scrape",
      },
      pricing_reminder: {
        search_advanced: "1 credit per result",
        search_standard: "5 credits flat",
        contact_email: "4 credits if found",
        contact_phone: "10 credits if found",
        scrape_live: "2 credits",
        scrape_database: "1 credit",
      },
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Credits error:", error);

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
