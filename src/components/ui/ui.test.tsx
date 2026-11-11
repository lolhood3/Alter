import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { useState } from "react";
import { Modal } from "./ui";

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
  t.after(() => {
    cleanup();
    dom.window.close();
  });
  const user = userEvent.setup();
  render(<ModalHarness />);
  const input = screen.getByLabelText<HTMLInputElement>("Message");

  await user.type(input, "hello");
  assert.equal(input.value, "hello");
  assert.equal(document.activeElement, input);

  await user.keyboard("{Escape}");
  assert.equal(screen.queryByRole("dialog"), null);
});
