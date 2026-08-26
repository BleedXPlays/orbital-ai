import test from "node:test";
import assert from "node:assert/strict";
import {
  getNextNewChatName,
  getNextNewProjectName,
} from "../src/utils/defaultItemNames.js";

test("restarts chat numbering when all default chat names were renamed", () => {
  assert.equal(
    getNextNewChatName(["Research", "Website", "Energy Notes"]),
    "New Chat 1"
  );
});

test("uses the first available default chat number", () => {
  assert.equal(
    getNextNewChatName(["New Chat 1", "Renamed Chat", "New Chat 3"]),
    "New Chat 2"
  );
});

test("applies the same numbering rule to projects", () => {
  assert.equal(
    getNextNewProjectName(["New Project 1", "Science Exhibition"]),
    "New Project 2"
  );
  assert.equal(
    getNextNewProjectName(["Science Exhibition", "Solar Website"]),
    "New Project 1"
  );
});
