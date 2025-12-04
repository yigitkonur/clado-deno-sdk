/**
 * Demo: Deep Research API
 * Tests async job initiation, status polling, and cancellation.
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
    const action = url.searchParams.get("action") || "start";
    const jobId = url.searchParams.get("job_id");
    const query = url.searchParams.get("query") || "machine learning engineers at startups";
    const limit = parseInt(url.searchParams.get("limit") || "10");

    switch (action) {
      case "start": {
        // Initiate a new deep research job
        console.log(`Starting deep research: "${query}" with limit ${limit}`);
        const job = await client.initiateDeepResearch({ query, limit });

        return new Response(
          JSON.stringify({
            success: true,
            action: "started",
            job_id: job.job_id,
            status: job.status,
            message: job.message,
            next_steps: {
              check_status: `?action=status&job_id=${job.job_id}`,
              cancel: `?action=cancel&job_id=${job.job_id}`,
              wait: `?action=wait&job_id=${job.job_id}`,
            },
          }, null, 2),
          { headers: corsHeaders },
        );
      }

      case "status": {
        if (!jobId) {
          return new Response(
            JSON.stringify({ success: false, error: "job_id required for status check" }),
            { status: 400, headers: corsHeaders },
          );
        }

        console.log(`Checking status for job: ${jobId}`);
        const status = await client.getDeepResearchStatus(jobId);

        const response: Record<string, unknown> = {
          success: true,
          action: "status",
          job_id: status.job_id,
          status: status.status,
          progress: status.progress,
        };

        if (status.status === "completed") {
          response.total = status.total;
          response.results_preview = status.results?.slice(0, 3).map((r) => ({
            name: r.profile.name,
            headline: r.profile.headline,
          }));
        }

        if (status.status === "failed") {
          response.error = status.error;
        }

        return new Response(JSON.stringify(response, null, 2), {
          headers: corsHeaders,
        });
      }

      case "cancel": {
        if (!jobId) {
          return new Response(
            JSON.stringify({ success: false, error: "job_id required for cancel" }),
            { status: 400, headers: corsHeaders },
          );
        }

        console.log(`Cancelling job: ${jobId}`);
        const result = await client.cancelDeepResearch(jobId);

        return new Response(
          JSON.stringify({
            success: result.success,
            action: "cancelled",
            job_id: jobId,
            message: result.message,
          }, null, 2),
          { headers: corsHeaders },
        );
      }

      case "wait": {
        if (!jobId) {
          return new Response(
            JSON.stringify({ success: false, error: "job_id required for wait" }),
            { status: 400, headers: corsHeaders },
          );
        }

        console.log(`Waiting for job completion: ${jobId}`);
        // Use shorter timeout for edge function (max 60 seconds)
        const result = await client.waitForDeepResearch(jobId, {
          pollInterval: 2000,
          timeout: 55000, // 55 seconds to leave buffer
        });

        return new Response(
          JSON.stringify({
            success: true,
            action: "completed",
            job_id: result.job_id,
            status: result.status,
            total: result.total,
            profiles: result.results?.map((r) => ({
              name: r.profile.name,
              headline: r.profile.headline,
              location: r.profile.location,
            })),
          }, null, 2),
          { headers: corsHeaders },
        );
      }

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: `Unknown action: ${action}`,
            available_actions: ["start", "status", "cancel", "wait"],
          }),
          { status: 400, headers: corsHeaders },
        );
    }
  } catch (error) {
    console.error("Deep research error:", error);

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
