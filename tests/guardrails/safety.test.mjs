// Unit tests for src/lib/safety.ts. Run with: npm run test:unit
// Node 22.18+ / 24 strips TypeScript types natively, so the .ts module imports directly.
import { test } from "node:test";
import assert from "node:assert/strict";
import { isCrisis, maskPII } from "../../src/lib/safety.ts";

test("crisis phrases trigger the 988 banner", () => {
  for (const s of [
    "I've been feeling suicidal since the funeral",
    "I keep thinking about suicide",
    "I want to kill myself",
    "I'm thinking about ending it",
    "I just want to end it all",
    "I don't want to live anymore without him",
    "I don't want to be here",
    "I can't go on like this",
    "there's no reason to live now",
    "everyone would be better off without me",
    "I've been hurting myself",
    "I want to die",
  ]) {
    assert.equal(isCrisis(s), true, s);
  }
});

test("ordinary estate language does not trigger the banner", () => {
  for (const s of [
    "My dad died yesterday. What do I do first?",
    "How do I end the lease on mom's apartment?",
    "When does the estate end probate?",
    "Should I put my house in a trust?",
    "She wanted to be cremated",
  ]) {
    assert.equal(isCrisis(s), false, s);
  }
});

test("SSNs are masked", () => {
  assert.equal(maskPII("his SSN is 123-45-6789"), "his SSN is [redacted SSN]");
  assert.equal(maskPII("ssn 123 45 6789"), "ssn [redacted SSN]");
  assert.match(maskPII("ssn 123456789"), /\[redacted number\]/);
});

test("account, routing and card numbers are masked", () => {
  assert.doesNotMatch(maskPII("account 0012345678 routing 021000021"), /\d{8,}/);
  assert.doesNotMatch(maskPII("card 4111 1111 1111 1111"), /4111/);
  assert.doesNotMatch(maskPII("card 4111-1111-1111-1111"), /1111/);
});

test("written-out passwords are masked", () => {
  assert.equal(maskPII("her password is Sunflower#22"), "her password is [redacted]");
  assert.equal(maskPII("PIN: 4821"), "PIN: [redacted]");
});

test("dates, years, phone numbers and dollar amounts are left alone", () => {
  for (const s of [
    "He died on 09/14/2026",
    "the house is worth $450,000",
    "call the funeral home at 555-123-4567",
    "we married in 1998",
  ]) {
    assert.equal(maskPII(s), s);
  }
});
