import test from "node:test";
import assert from "node:assert/strict";
import {
  getPasswordPolicyError,
  getPasswordRequirementResults,
  isPasswordValid,
} from "../shared/passwordPolicy.js";

test("accepts a password that meets every OrbitalAI requirement", () => {
  assert.equal(isPasswordValid("Orbit@lAI2026"), true);
  assert.equal(getPasswordPolicyError("Orbit@lAI2026"), "");
});

test("requires a number without requiring letter case or symbols", () => {
  const results = getPasswordRequirementResults("alllowercase");
  const unmetRequirementIds = results
    .filter((requirement) => !requirement.met)
    .map((requirement) => requirement.id);

  assert.deepEqual(unmetRequirementIds, ["number"]);
  assert.equal(isPasswordValid("alllowercase"), false);
  assert.equal(isPasswordValid("password1"), true);
});

test("rejects passwords containing spaces or exceeding 128 characters", () => {
  assert.equal(isPasswordValid("Valid Pass1!"), false);
  assert.equal(isPasswordValid(`Aa1!${"x".repeat(125)}`), false);
});
