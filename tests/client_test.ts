/**
 * Unit tests for CladoClient.
 * Following Deno SDK Guide: monkey-patch globalThis.fetch for mocking.
 */

import { assertEquals, assertThrows } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { CladoClient } from "../client.ts";
import { CladoAuthError, CladoError } from "../errors.ts";

// Store original fetch for restoration
const originalFetch = globalThis.fetch;

// Helper to restore fetch after each test
function restoreFetch() {
  globalThis.fetch = originalFetch;
}

// =============================================================================
// Constructor Tests
// =============================================================================

Deno.test("CladoClient constructor accepts API key directly", () => {
  const client = new CladoClient({ apiKey: "lk_test123" });
  // Client should be created without throwing
  assertEquals(typeof client, "object");
});

Deno.test("CladoClient constructor uses custom baseUrl", () => {
  const client = new CladoClient({
    apiKey: "lk_test123",
    baseUrl: "https://custom.api.com",
  });
  assertEquals(typeof client, "object");
});

Deno.test("CladoClient constructor throws when no API key and no env var", () => {
  // Clear any existing env var
  const existing = Deno.env.get("CLADO_API_KEY");
  if (existing) {
    Deno.env.delete("CLADO_API_KEY");
  }

  assertThrows(
    () => new CladoClient(),
    Error,
    "API key not provided",
  );

  // Restore if it existed
  if (existing) {
    Deno.env.set("CLADO_API_KEY", existing);
  }
});

Deno.test({
  name: "CladoClient constructor reads from CLADO_API_KEY env var",
  fn() {
    Deno.env.set("CLADO_API_KEY", "lk_from_env");
    try {
      const client = new CladoClient();
      assertEquals(typeof client, "object");
    } finally {
      Deno.env.delete("CLADO_API_KEY");
    }
  },
  permissions: { env: true },
});

// =============================================================================
// Search Tests with Mocked Fetch
// =============================================================================

Deno.test("searchPeople() returns typed response on success", async () => {
  globalThis.fetch = () =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          results: [
            {
              profile: {
                id: "123",
                name: "John Doe",
                headline: "Software Engineer",
              },
            },
          ],
          total: 1,
          query: "engineers",
          search_id: "abc-123",
        }),
        { status: 200 },
      ),
    );

  try {
    const client = new CladoClient({ apiKey: "lk_test" });
    const result = await client.searchPeople({ query: "engineers" });

    assertEquals(result.total, 1);
    assertEquals(result.search_id, "abc-123");
    assertEquals(result.results[0]?.profile.name, "John Doe");
  } finally {
    restoreFetch();
  }
});

Deno.test("searchPeople() handles pagination with searchId", async () => {
  let callCount = 0;

  globalThis.fetch = (input: RequestInfo | URL) => {
    callCount++;
    const url = typeof input === "string" ? input : input.toString();

    if (url.includes("search_id=abc-123") && url.includes("offset=30")) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            results: [{ profile: { id: "456", name: "Jane Doe" } }],
            total: 31,
            query: "engineers",
            search_id: "abc-123",
          }),
          { status: 200 },
        ),
      );
    }

    return Promise.resolve(
      new Response(
        JSON.stringify({
          results: [{ profile: { id: "123", name: "John Doe" } }],
          total: 31,
          query: "engineers",
          search_id: "abc-123",
        }),
        { status: 200 },
      ),
    );
  };

  try {
    const client = new CladoClient({ apiKey: "lk_test" });

    // First page
    const page1 = await client.searchPeople({ query: "engineers", limit: 30 });
    assertEquals(page1.search_id, "abc-123");

    // Second page using searchId
    const page2 = await client.searchPeople({
      searchId: page1.search_id,
      offset: 30,
    });
    assertEquals(page2.results[0]?.profile.name, "Jane Doe");
    assertEquals(callCount, 2);
  } finally {
    restoreFetch();
  }
});

// =============================================================================
// Error Handling Tests
// =============================================================================

Deno.test("searchPeople() throws CladoAuthError on 401", async () => {
  globalThis.fetch = () =>
    Promise.resolve(
      new Response(
        JSON.stringify({ detail: "Invalid API key" }),
        { status: 401 },
      ),
    );

  try {
    const client = new CladoClient({ apiKey: "lk_invalid" });

    let error: Error | null = null;
    try {
      await client.searchPeople({ query: "test" });
    } catch (e) {
      error = e as Error;
    }

    assertEquals(error instanceof CladoAuthError, true);
    assertEquals((error as CladoAuthError).status, 401);
  } finally {
    restoreFetch();
  }
});

Deno.test("searchPeople() throws CladoError on 500", async () => {
  let callCount = 0;

  globalThis.fetch = () => {
    callCount++;
    return Promise.resolve(
      new Response(
        JSON.stringify({ detail: "Internal server error" }),
        { status: 500 },
      ),
    );
  };

  try {
    const client = new CladoClient({ apiKey: "lk_test" });

    let error: Error | null = null;
    try {
      await client.searchPeople({ query: "test" });
    } catch (e) {
      error = e as Error;
    }

    assertEquals(error instanceof CladoError, true);
    assertEquals((error as CladoError).status, 500);
    // Should have retried (default 3 retries + 1 initial = 4 calls)
    assertEquals(callCount, 4);
  } finally {
    restoreFetch();
  }
});

// =============================================================================
// Deep Research Tests
// =============================================================================

Deno.test("initiateDeepResearch() returns job_id", async () => {
  globalThis.fetch = () =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          job_id: "job-123",
          status: "pending",
          message: "Job started",
        }),
        { status: 200 },
      ),
    );

  try {
    const client = new CladoClient({ apiKey: "lk_test" });
    const job = await client.initiateDeepResearch({ query: "ML engineers" });

    assertEquals(job.job_id, "job-123");
    assertEquals(job.status, "pending");
  } finally {
    restoreFetch();
  }
});

Deno.test("getDeepResearchStatus() returns status", async () => {
  globalThis.fetch = () =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          job_id: "job-123",
          status: "completed",
          progress: 100,
          results: [{ profile: { id: "123", name: "Test User" } }],
          total: 1,
        }),
        { status: 200 },
      ),
    );

  try {
    const client = new CladoClient({ apiKey: "lk_test" });
    const status = await client.getDeepResearchStatus("job-123");

    assertEquals(status.status, "completed");
    assertEquals(status.progress, 100);
    assertEquals(status.total, 1);
  } finally {
    restoreFetch();
  }
});

// =============================================================================
// Enrichment Tests
// =============================================================================

Deno.test("getContactInfo() returns contact data", async () => {
  globalThis.fetch = () =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          linkedin_url: "https://linkedin.com/in/johndoe",
          email: "john@example.com",
          email_status: "verified",
          phone: null,
          phone_status: "not_found",
          credits_used: 4,
        }),
        { status: 200 },
      ),
    );

  try {
    const client = new CladoClient({ apiKey: "lk_test" });
    const contact = await client.getContactInfo({
      linkedinUrl: "https://linkedin.com/in/johndoe",
      enrichEmail: true,
    });

    assertEquals(contact.email, "john@example.com");
    assertEquals(contact.email_status, "verified");
    assertEquals(contact.credits_used, 4);
  } finally {
    restoreFetch();
  }
});

Deno.test("scrapeLinkedInProfile() returns profile data", async () => {
  globalThis.fetch = () =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          profile: {
            id: "123",
            name: "John Doe",
            headline: "Software Engineer",
            location: "San Francisco",
          },
          experience: [
            {
              title: "Senior Engineer",
              company_name: "TechCorp",
              is_current: true,
            },
          ],
          education: [],
          posts: [],
        }),
        { status: 200 },
      ),
    );

  try {
    const client = new CladoClient({ apiKey: "lk_test" });
    const profile = await client.scrapeLinkedInProfile({
      linkedinUrl: "https://linkedin.com/in/johndoe",
    });

    assertEquals(profile.profile.name, "John Doe");
    assertEquals(profile.experience?.[0]?.title, "Senior Engineer");
  } finally {
    restoreFetch();
  }
});

// =============================================================================
// Platform Tests
// =============================================================================

Deno.test("getCredits() returns credit info", async () => {
  globalThis.fetch = () =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          credits_remaining: 1000,
          credits_used: 500,
          plan: "pro",
          rate_limit_tier: "tier2",
        }),
        { status: 200 },
      ),
    );

  try {
    const client = new CladoClient({ apiKey: "lk_test" });
    const credits = await client.getCredits();

    assertEquals(credits.credits_remaining, 1000);
    assertEquals(credits.credits_used, 500);
    assertEquals(credits.rate_limit_tier, "tier2");
  } finally {
    restoreFetch();
  }
});
