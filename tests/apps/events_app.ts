/**
 * tests/apps/events_app.ts — Test fixture for event logging.
 *
 * Creates a window and logs every input event as a JSON line to a file
 * (path taken from Deno.args[0]) and to stdout.
 */

import { Application, Window } from "../../window/Window.ts";

const logPath = Deno.args[0];
if (!logPath) {
  console.error("Usage: events_app.ts <log-file-path>");
  Deno.exit(1);
}

Deno.writeTextFileSync(logPath, "");

let lastLine = "";

function log(entry: Record<string, unknown>): void {
  const line = JSON.stringify(entry);
  if (entry.type === "mousemove" && line === lastLine) return;
  lastLine = line;
  console.log(line);
  Deno.writeTextFileSync(logPath, line + "\n", { append: true });
}

function roundMouse(detail: {
  x: number;
  y: number;
  button: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}) {
  return { ...detail, x: Math.round(detail.x), y: Math.round(detail.y) };
}

const app = Application.shared;
const win = new Window(400, 300, "Events App");

win.addEventListener("mousedown", (e) => {
  log({ type: "mousedown", detail: roundMouse(e.detail) });
});

win.addEventListener("mouseup", (e) => {
  log({ type: "mouseup", detail: roundMouse(e.detail) });
});

win.addEventListener("mousemove", (e) => {
  log({ type: "mousemove", detail: roundMouse(e.detail) });
});

win.addEventListener("wheel", (e) => {
  const d = e.detail;
  log({
    type: "wheel",
    detail: {
      ...roundMouse(d),
      deltaX: Math.round(d.deltaX * 10) / 10,
      deltaY: Math.round(d.deltaY * 10) / 10,
    },
  });
});

win.addEventListener("keydown", (e) => {
  log({ type: "keydown", detail: e.detail });
});

win.addEventListener("keyup", (e) => {
  log({ type: "keyup", detail: e.detail });
});

win.addEventListener("resize", (e) => {
  log({ type: "resize", detail: e.detail });
});

win.addEventListener("focus", () => {
  log({ type: "focus" });
});

win.addEventListener("blur", () => {
  log({ type: "blur" });
});

win.addEventListener("close", () => {
  app.quit();
});

win.show();
await app.run();

win.destroy();
