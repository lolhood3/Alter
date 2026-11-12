import assert from "node:assert/strict";
import { after, test } from "node:test";
import { JSDOM } from "jsdom";
import { useState } from "react";
import { Modal, Segmented } from "./ui";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost" });
const globalForDom = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean };
for (const [key, value] of Object.entries({
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
})) {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
}
globalForDom.IS_REACT_ACT_ENVIRONMENT = true;
after(() => dom.window.close());
Object.assign(globalThis, {
  HTMLElement: dom.window.HTMLElement,
  Node: dom.window.Node,
  MutationObserver: dom.window.MutationObserver,
  getComputedStyle: dom.window.getComputedStyle,
});

function ModalHarness() {
  const [open, setOpen] = useState(true);
  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Conversation">
      <input aria-label="Message" />
    </Modal>
  );
}

test("modal keeps input focus across renders and closes with the latest callback", async (t) => {
  const { cleanup, render, screen } = await import("@testing-library/react");
  const userEvent = (await import("@testing-library/user-event")).default;
  t.after(() => cleanup());
  const user = userEvent.setup();
  render(<ModalHarness />);
  const input = screen.getByLabelText<HTMLInputElement>("Message");

  await user.type(input, "hello");
  assert.equal(input.value, "hello");
  assert.equal(document.activeElement, input);

  await user.keyboard("{Escape}");
  assert.equal(screen.queryByRole("dialog"), null);
});

function SegmentedHarness() {
  const [value, setValue] = useState("reduced");
  return (
    <Segmented
      label="Transition style"
      value={value}
      options={[{ value: "reduced", label: "Reduced" }, { value: "standard", label: "Standard" }, { value: "immersive", label: "Immersive" }]}
      onChange={setValue}
    />
  );
}

test("segmented radio groups support roving focus and arrow, Home and End keys", async (t) => {
  const { cleanup, render, screen } = await import("@testing-library/react");
  const userEvent = (await import("@testing-library/user-event")).default;
  t.after(() => cleanup());
  const user = userEvent.setup();
  render(<SegmentedHarness />);
  const reduced = screen.getByRole<HTMLButtonElement>("radio", { name: "Reduced" });
  reduced.focus();

  await user.keyboard("{ArrowRight}");
  const standard = screen.getByRole<HTMLButtonElement>("radio", { name: "Standard" });
  assert.equal(standard.getAttribute("aria-checked"), "true");
  assert.equal(document.activeElement, standard);
  assert.equal(reduced.tabIndex, -1);

  await user.keyboard("{End}");
  const immersive = screen.getByRole<HTMLButtonElement>("radio", { name: "Immersive" });
  assert.equal(immersive.getAttribute("aria-checked"), "true");
  assert.equal(document.activeElement, immersive);

  await user.keyboard("{Home}");
  assert.equal(reduced.getAttribute("aria-checked"), "true");
  assert.equal(document.activeElement, reduced);
});
