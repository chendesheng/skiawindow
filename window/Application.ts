/**
 * window/Application.ts — High-level singleton wrapping native app lifecycle + utilities.
 */

import { openLink, winLib } from "./binding.ts";

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

  openLink(href: string): void {
    openLink(href);
  }
}
