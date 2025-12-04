/**
 * Unit tests for error classes.
 */

import { assertEquals } from "https://deno.land/std@0.220.1/assert/mod.ts";
import {
  CladoAuthError,
  CladoError,
  CladoNotFoundError,
  CladoRateLimitError,
  CladoValidationError,
} from "../errors.ts";

Deno.test("CladoError has correct status and message", () => {
  const error = new CladoError(500, "Server error");

  assertEquals(error.name, "CladoError");
  assertEquals(error.status, 500);
  assertEquals(error.message.includes("500"), true);
  assertEquals(error.message.includes("Server error"), true);
  assertEquals(error instanceof Error, true);
});

Deno.test("CladoAuthError defaults to 401", () => {
  const error = new CladoAuthError();

  assertEquals(error.name, "CladoAuthError");
  assertEquals(error.status, 401);
  assertEquals(error instanceof CladoError, true);
});

Deno.test("CladoAuthError accepts custom message", () => {
  const error = new CladoAuthError("Custom auth error");

  assertEquals(error.message.includes("Custom auth error"), true);
});

Deno.test("CladoRateLimitError has retryAfter", () => {
  const error = new CladoRateLimitError(60);

  assertEquals(error.name, "CladoRateLimitError");
  assertEquals(error.status, 429);
  assertEquals(error.retryAfter, 60);
  assertEquals(error instanceof CladoError, true);
});

Deno.test("CladoNotFoundError defaults to 404", () => {
  const error = new CladoNotFoundError("Job not found");

  assertEquals(error.name, "CladoNotFoundError");
  assertEquals(error.status, 404);
  assertEquals(error instanceof CladoError, true);
});

Deno.test("CladoValidationError has 422 status", () => {
  const error = new CladoValidationError("Invalid limit parameter");

  assertEquals(error.name, "CladoValidationError");
  assertEquals(error.status, 422);
  assertEquals(error.message.includes("Invalid limit"), true);
});

Deno.test("Error inheritance works with instanceof", () => {
  const authError = new CladoAuthError();
  const rateLimitError = new CladoRateLimitError(60);

  // All should be instances of CladoError
  assertEquals(authError instanceof CladoError, true);
  assertEquals(rateLimitError instanceof CladoError, true);

  // All should be instances of Error
  assertEquals(authError instanceof Error, true);
  assertEquals(rateLimitError instanceof Error, true);

  // Specific type checks
  assertEquals(authError instanceof CladoAuthError, true);
  assertEquals(rateLimitError instanceof CladoRateLimitError, true);

  // Cross-type checks should fail
  assertEquals(authError instanceof CladoRateLimitError, false);
  assertEquals(rateLimitError instanceof CladoAuthError, false);
});
