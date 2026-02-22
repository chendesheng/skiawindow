/**
 * window/Application.ts — High-level singleton wrapping native app lifecycle + utilities.
 */

import {
  clipboardReadText,
  clipboardWriteText,
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

  run(): void {
    winLib.symbols.app_run();
  }

  quit(): void {
    winLib.symbols.app_quit();
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
