/**
 * Unit tests for utility functions.
 */

import { assertEquals } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { buildUrl, calculateBackoff, toSnakeCase } from "../utils.ts";

// =============================================================================
// buildUrl Tests
// =============================================================================

Deno.test("buildUrl creates URL with no params", () => {
  const url = buildUrl("https://api.example.com", "/api/search");
  assertEquals(url, "https://api.example.com/api/search");
});

Deno.test("buildUrl creates URL with simple params", () => {
  const url = buildUrl("https://api.example.com", "/api/search", {
    query: "test",
    limit: 10,
  });
  assertEquals(url, "https://api.example.com/api/search?query=test&limit=10");
});

Deno.test("buildUrl handles array params", () => {
  const url = buildUrl("https://api.example.com", "/api/search", {
    companies: ["Google", "Meta"],
  });
  assertEquals(
    url,
    "https://api.example.com/api/search?companies=Google&companies=Meta",
  );
});

Deno.test("buildUrl ignores undefined params", () => {
  const url = buildUrl("https://api.example.com", "/api/search", {
    query: "test",
    limit: undefined,
    offset: null as unknown as undefined,
  });
  assertEquals(url, "https://api.example.com/api/search?query=test");
});

Deno.test("buildUrl handles boolean params", () => {
  const url = buildUrl("https://api.example.com", "/api/search", {
    advanced_filtering: true,
    legacy: false,
  });
  assertEquals(
    url,
    "https://api.example.com/api/search?advanced_filtering=true&legacy=false",
  );
});

// =============================================================================
// toSnakeCase Tests
// =============================================================================

Deno.test("toSnakeCase converts known camelCase keys", () => {
  const result = toSnakeCase({
    searchId: "abc",
    advancedFiltering: true,
    linkedinUrl: "https://example.com",
  });

  assertEquals(result.search_id, "abc");
  assertEquals(result.advanced_filtering, true);
  assertEquals(result.linkedin_url, "https://example.com");
});

Deno.test("toSnakeCase passes through unknown keys unchanged", () => {
  const result = toSnakeCase({
    query: "test",
    limit: 10,
    customField: "value",
  });

  assertEquals(result.query, "test");
  assertEquals(result.limit, 10);
  assertEquals(result.customField, "value");
});

// =============================================================================
// calculateBackoff Tests
// =============================================================================

Deno.test("calculateBackoff increases exponentially", () => {
  const delay0 = calculateBackoff(0, 1000, 30000);
  const delay1 = calculateBackoff(1, 1000, 30000);
  const delay2 = calculateBackoff(2, 1000, 30000);

  // With jitter, exact values vary, but should be roughly exponential
  assertEquals(delay0 >= 900 && delay0 <= 1100, true);
  assertEquals(delay1 >= 1800 && delay1 <= 2200, true);
  assertEquals(delay2 >= 3600 && delay2 <= 4400, true);
});

Deno.test("calculateBackoff respects maxDelay", () => {
  const delay = calculateBackoff(10, 1000, 5000);
  assertEquals(delay <= 5500, true); // Max + jitter
});
