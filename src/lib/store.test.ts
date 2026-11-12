import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEnvironment } from "./flows";

const values = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
};
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: localStorageMock });

let nextTimer = 1;
const timers = new Map<number, TimerHandler>();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    setTimeout: (handler: TimerHandler) => {
      const id = nextTimer++;
      timers.set(id, handler);
      return id;
    },
    clearTimeout: (id?: number) => {
      if (id !== undefined) timers.delete(id);
    },
  },
});

async function loadStore() {
  return import("./store");
}

const validEvent = {
  id: "event-1",
  ts: Date.now(),
  type: "shift",
  title: "Applied Reality Shift",
  detail: "A saved shift",
  modeId: "venom",
  meta: { name: "Venom", motion: "1" },
};

test("persisted state retains valid custom data and repairs invalid fields", async () => {
  const { sanitizePersistedState, useAlter } = await loadStore();
  const current = useAlter.getState();
  const valid = sanitizePersistedState({
    modeId: "venom",
    env: { ...defaultEnvironment("venom"), id: "custom", motionScale: 1.4, source: "match" },
    settings: { reducedMotion: true, coreIntensity: 80 },
    events: [validEvent],
  }, current);
  assert.equal(valid.modeId, "venom");
  assert.equal(valid.env.id, "custom");
  assert.equal(valid.env.motionScale, 1.4);
  assert.equal(valid.settings.reducedMotion, true);
  assert.equal(valid.settings.coreIntensity, 80);
  assert.equal(valid.settings.transitionStyle, "standard");
  assert.deepEqual(valid.events, [validEvent]);

  const repaired = sanitizePersistedState({
    modeId: "venom",
    env: { ...defaultEnvironment("iron-man"), motionScale: 99 },
    settings: { coreIntensity: 500, particleIntensity: Number.NaN, transitionStyle: "invalid", recordEchoes: "yes" },
    events: [
      { ...validEvent, id: "bad-time", ts: "invalid" },
      { ...validEvent, fromModeId: "invalid" },
      { ...validEvent },
    ],
  }, current);
  assert.deepEqual(repaired.env, defaultEnvironment("venom"));
  assert.equal(repaired.settings.coreIntensity, 100);
  assert.equal(repaired.settings.particleIntensity, 50);
  assert.equal(repaired.settings.transitionStyle, "standard");
  assert.equal(repaired.settings.recordEchoes, true);
  assert.equal(repaired.events.length, 1);
  assert.equal(repaired.events[0].fromModeId, undefined);
});

test("safe storage tolerates denied reads, writes and removals", async () => {
  const { createSafeJSONStorage } = await loadStore();
  const denied = {
    getItem: () => { throw new DOMException("Denied", "SecurityError"); },
    setItem: () => { throw new DOMException("Full", "QuotaExceededError"); },
    removeItem: () => { throw new DOMException("Denied", "SecurityError"); },
  } as unknown as Storage;
  const storage = createSafeJSONStorage(() => denied);
  assert.ok(storage);
  assert.doesNotThrow(() => storage.setItem("alter.v1", { state: {}, version: 1 }));
  assert.doesNotThrow(() => storage.removeItem("alter.v1"));
  assert.equal(storage.getItem("alter.v1"), null);
  assert.equal(createSafeJSONStorage(() => { throw new Error("Unavailable"); }), undefined);
});

test("real hydration drops corrupt events and restores a coherent environment", async () => {
  const { useAlter } = await loadStore();
  values.set("alter.v1", JSON.stringify({
    version: 1,
    state: {
      modeId: "venom",
      env: defaultEnvironment("iron-man"),
      settings: { transitionStyle: "invalid" },
      events: [{ ...validEvent, ts: "invalid" }, { ...validEvent, fromModeId: "invalid" }],
    },
  }));
  await useAlter.persist.rehydrate();
  const state = useAlter.getState();
  assert.deepEqual(state.env, defaultEnvironment("venom"));
  assert.equal(state.settings.transitionStyle, "standard");
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0].fromModeId, undefined);
});

test("a persistence quota failure does not interrupt an in-memory mode change", async () => {
  const { useAlter } = await loadStore();
  const original = localStorageMock.setItem;
  localStorageMock.setItem = () => { throw new DOMException("Full", "QuotaExceededError"); };
  try {
    assert.doesNotThrow(() => useAlter.getState().enterMode("red-k"));
    assert.equal(useAlter.getState().modeId, "red-k");
  } finally {
    localStorageMock.setItem = original;
  }
});

test("reset everything cancels pending replies and Core settling", async () => {
  const { useAlter } = await loadStore();
  useAlter.getState().sendMessage("A message awaiting a reply");
  useAlter.getState().enterMode("venom");
  assert.ok(timers.size >= 2);
  useAlter.getState().resetDemo();
  assert.equal(timers.size, 0);
  assert.deepEqual(useAlter.getState().thread, []);
  assert.equal(useAlter.getState().coreLine, null);
  assert.deepEqual(useAlter.getState().events, []);
});
