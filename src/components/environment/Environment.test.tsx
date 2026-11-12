import assert from "node:assert/strict";
import { after, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
const globalForDom = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };
for (const [key, value] of Object.entries({
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  localStorage: dom.window.localStorage,
})) {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
}
globalForDom.IS_REACT_ACT_ENVIRONMENT = true;
Object.assign(globalThis, {
  HTMLElement: dom.window.HTMLElement,
  Node: dom.window.Node,
  MutationObserver: dom.window.MutationObserver,
  getComputedStyle: dom.window.getComputedStyle,
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => undefined,
});
after(() => dom.window.close());

test("reduced-motion particles redraw their still frame after resize", async (t) => {
  let paths = 0;
  const context = {
    clearRect: () => undefined,
    beginPath: () => { paths += 1; },
    arc: () => undefined,
    fill: () => undefined,
    fillRect: () => undefined,
    globalAlpha: 1,
  };
  Object.defineProperty(dom.window.HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: (kind: string) => kind === "2d" ? context : null,
  });

  const [{ act, cleanup, render }, { Environment }, { useAlter }] = await Promise.all([
    import("@testing-library/react"),
    import("./Environment"),
    import("@/lib/store"),
  ]);
  t.after(() => cleanup());
  useAlter.setState((state) => ({ settings: { ...state.settings, reducedMotion: true, particleIntensity: 50 } }));
  render(<Environment />);
  const initialPaths = paths;
  assert.ok(initialPaths > 0);

  Object.defineProperty(dom.window, "innerWidth", { configurable: true, value: 390 });
  Object.defineProperty(dom.window, "innerHeight", { configurable: true, value: 844 });
  act(() => dom.window.dispatchEvent(new dom.window.Event("resize")));
  assert.ok(paths > initialPaths, "resize must paint a new still frame after canvas sizing clears the old one");
  const canvas = document.querySelector("canvas");
  assert.equal(canvas?.width, 390);
  assert.equal(canvas?.height, 844);
});
