import assert from "node:assert/strict";
import { test } from "node:test";
import { DIRECTION_LIST, MOODS, directionEnvironment, proposeFromCheckin } from "./flows";
import { MODE_IDS, MODES } from "./modes";

test("all seven modes and SHIFT directions remain configured", () => {
  assert.equal(MODE_IDS.length, 7);
  assert.equal(DIRECTION_LIST.length, 7);
  assert.deepEqual(
    DIRECTION_LIST.map((direction) => directionEnvironment(direction.id).modeId),
    MODE_IDS,
  );
});

test("an empty MATCH check-in leaves the current environment unchanged", () => {
  const result = proposeFromCheckin({ mood: null, energy: null, note: "" }, "moon-knight");
  assert.equal(result.neutral, true);
  assert.equal(result.env.modeId, "moon-knight");
  assert.equal(result.env.motionScale, 1);
});

test("energy-only MATCH adjusts pace without changing mode", () => {
  const result = proposeFromCheckin({ mood: null, energy: "Very low", note: "" }, "iron-man");
  assert.equal(result.neutral, false);
  assert.equal(result.env.modeId, "iron-man");
  assert.equal(result.env.motionScale, 0.55);
});

test("every mood maps to a valid mode and energy alternatives remain valid", () => {
  for (const mood of MOODS) {
    for (const energy of [null, "Very high"] as const) {
      const result = proposeFromCheckin({ mood, energy, note: "" }, "peter-parker");
      assert.ok(MODES[result.env.modeId]);
      assert.equal(result.neutral, false);
      assert.ok(result.env.name.length > 0);
    }
  }
});
