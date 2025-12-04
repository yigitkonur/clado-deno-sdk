/**
 * Demo: Enrichment API
 * Tests contact info, profile scraping, and post reactions.
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
    const action = url.searchParams.get("action") || "contact";
    const linkedinUrl = url.searchParams.get("linkedin_url");
    const postUrl = url.searchParams.get("post_url");

    switch (action) {
      case "contact": {
        if (!linkedinUrl) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "linkedin_url required",
              example: "?action=contact&linkedin_url=https://linkedin.com/in/username",
            }),
            { status: 400, headers: corsHeaders },
          );
        }

        console.log(`Getting contact info for: ${linkedinUrl}`);
        const enrichEmail = url.searchParams.get("email") !== "false";
        const enrichPhone = url.searchParams.get("phone") === "true";

        const contact = await client.getContactInfo({
          linkedinUrl,
          enrichEmail,
          enrichPhone,
        });

        return new Response(
          JSON.stringify({
            success: true,
            action: "contact",
            linkedin_url: contact.linkedin_url,
            email: contact.email,
            email_status: contact.email_status,
            phone: contact.phone,
            phone_status: contact.phone_status,
            credits_used: contact.credits_used,
          }, null, 2),
          { headers: corsHeaders },
        );
      }

      case "scrape": {
        if (!linkedinUrl) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "linkedin_url required",
              example: "?action=scrape&linkedin_url=https://linkedin.com/in/username",
            }),
            { status: 400, headers: corsHeaders },
          );
        }

        console.log(`Scraping profile: ${linkedinUrl}`);
        const includePosts = url.searchParams.get("posts") !== "false";

        const profile = await client.scrapeLinkedInProfile({
          linkedinUrl,
          includePosts,
          includeExperience: true,
          includeEducation: true,
        });

        return new Response(
          JSON.stringify({
            success: true,
            action: "scrape",
            profile: {
              id: profile.profile.id,
              name: profile.profile.name,
              headline: profile.profile.headline,
              location: profile.profile.location,
              connections: profile.profile.connections_count,
              followers: profile.profile.followers_count,
              skills: profile.profile.skills?.slice(0, 10),
            },
            experience_count: profile.experience?.length || 0,
            experience: profile.experience?.slice(0, 3).map((e) => ({
              title: e.title,
              company: e.company_name,
              is_current: e.is_current,
            })),
            education_count: profile.education?.length || 0,
            education: profile.education?.slice(0, 2).map((e) => ({
              degree: e.degree,
              school: e.school_name,
            })),
            posts_count: profile.posts?.length || 0,
          }, null, 2),
          { headers: corsHeaders },
        );
      }

      case "database": {
        if (!linkedinUrl) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "linkedin_url required",
              example: "?action=database&linkedin_url=https://linkedin.com/in/username",
            }),
            { status: 400, headers: corsHeaders },
          );
        }

        console.log(`Getting cached profile: ${linkedinUrl}`);
        const profile = await client.getLinkedInProfile({ linkedinUrl });

        return new Response(
          JSON.stringify({
            success: true,
            action: "database",
            note: "This is cached data (1 credit vs 2 for live scrape)",
            profile: {
              name: profile.profile.name,
              headline: profile.profile.headline,
              location: profile.profile.location,
            },
          }, null, 2),
          { headers: corsHeaders },
        );
      }

      case "reactions": {
        if (!postUrl) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "post_url required",
              example: "?action=reactions&post_url=https://linkedin.com/posts/...",
            }),
            { status: 400, headers: corsHeaders },
          );
        }

        console.log(`Getting post reactions: ${postUrl}`);
        const limit = parseInt(url.searchParams.get("limit") || "50");

        const reactions = await client.getPostReactions({
          postUrl,
          limit,
        });

        return new Response(
          JSON.stringify({
            success: true,
            action: "reactions",
            post_url: reactions.post_url,
            total_reactions: reactions.total_reactions,
            returned: reactions.reactions.length,
            reactions: reactions.reactions.slice(0, 10).map((r) => ({
              type: r.type,
              user_name: r.user.name,
              user_headline: r.user.headline,
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
            available_actions: ["contact", "scrape", "database", "reactions"],
          }),
          { status: 400, headers: corsHeaders },
        );
    }
  } catch (error) {
    console.error("Enrichment error:", error);

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
