/**
 * window/Application.ts — High-level singleton wrapping native app lifecycle + utilities.
 */

import {
  clipboardReadText,
  clipboardWriteText,
  getApplicationSupportDir,
  openLink,
  winLib,
} from "./binding.ts";

export class Application {
  static readonly shared = new Application();

  private constructor() {}

  get metalDevice(): Deno.PointerValue {
    return winLib.symbols.app_get_metal_device();
  }

  get metalQueue(): Deno.PointerValue {
    return winLib.symbols.app_get_metal_queue();
  }

  applicationSupportDir(): string {
    return getApplicationSupportDir();
  }

  private _running = false;
  get running(): boolean {
    return this._running;
  }

  async run(): Promise<void> {
    this._running = true;
    while (this._running) {
      winLib.symbols.app_poll_events(1.0 / 60.0);
      await new Promise<void>((r) => setTimeout(r, 0));
    }
  }

  quit(): void {
    this._running = false;
  }

  setAppearance(mode: "auto" | "light" | "dark"): void {
    const value = mode === "light" ? 1 : mode === "dark" ? 2 : 0;
    winLib.symbols.app_set_appearance(value);
  }

  openLink(href: string): void {
    openLink(href);
  }

  clipboardWriteText(text: string): Promise<void> {
    return clipboardWriteText(text);
  }

  clipboardReadText(): Promise<string> {
    return clipboardReadText();
  }
}
