/**
 * window/Window.ts — High-level API wrapping the native window FFI bindings.
 */

export { Application } from "./Application.ts";

import {
  createWindow,
  getWindowTitle,
  setOnKeyDown,
  setOnKeyUp,
  setOnMouseDown,
  setOnMouseMove,
  setOnMouseUp,
  setOnRender,
  setOnWheel,
  setOnWindowBlur,
  setOnWindowClose,
  setOnWindowFocus,
  setOnWindowResize,
  setWindowTitle,
  winLib,
} from "./binding.ts";

// ---------------------------------------------------------------------------
// Event detail types
// ---------------------------------------------------------------------------

export type MouseEventDetail = {
  x: number;
  y: number;
  button: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
};

export type KeyEventDetail = {
  key: string;
  keyCode: number;
  isRepeat: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
};

export type WheelEventDetail = MouseEventDetail & {
  deltaX: number;
  deltaY: number;
};

export type ResizeEventDetail = {
  width: number;
  height: number;
};

export type RenderEventDetail = {
  texture: Deno.PointerValue;
  width: number;
  height: number;
  scale: number;
};

// ---------------------------------------------------------------------------
// Typed event map for addEventListener overloads
// ---------------------------------------------------------------------------

export interface WindowEventMap {
  mousedown: CustomEvent<MouseEventDetail>;
  mouseup: CustomEvent<MouseEventDetail>;
  mousemove: CustomEvent<MouseEventDetail>;
  wheel: CustomEvent<WheelEventDetail>;
  contextmenu: CustomEvent<MouseEventDetail>;
  keydown: CustomEvent<KeyEventDetail>;
  keyup: CustomEvent<KeyEventDetail>;
  close: Event;
  focus: Event;
  blur: Event;
  resize: CustomEvent<ResizeEventDetail>;
  render: CustomEvent<RenderEventDetail>;
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

export class Window extends EventTarget {
  #ptr: Deno.PointerValue;
  // deno-lint-ignore no-explicit-any
  #callbacks: any[] = [];

  constructor(width: number, height: number, title: string) {
    super();
    this.#ptr = createWindow(width, height, title);
    this.#setupCallbacks();
  }

  override addEventListener<K extends keyof WindowEventMap>(
    type: K,
    listener: (ev: WindowEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void;
  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, listener as EventListener, options);
  }

  #setupCallbacks(): void {
    const ptr = this.#ptr;
    const sym = winLib.symbols;

    this.#callbacks.push(
      setOnMouseDown(ptr, (mods, button, x, y) => {
        const detail = { ...mods, button, x, y };
        this.dispatchEvent(new CustomEvent("mousedown", { detail }));
        if (button === 1) {
          this.dispatchEvent(new CustomEvent("contextmenu", { detail }));
        }
      }),
      setOnMouseUp(ptr, (mods, button, x, y) => {
        this.dispatchEvent(
          new CustomEvent("mouseup", {
            detail: { ...mods, button, x, y },
          }),
        );
      }),
      setOnMouseMove(ptr, (mods, button, x, y) => {
        this.dispatchEvent(
          new CustomEvent("mousemove", {
            detail: { ...mods, button, x, y },
          }),
        );
      }),
      setOnKeyDown(ptr, (mods, keyCode, isRepeat, key) => {
        this.dispatchEvent(
          new CustomEvent("keydown", {
            detail: { ...mods, key, keyCode, isRepeat },
          }),
        );
      }),
      setOnKeyUp(ptr, (mods, keyCode, isRepeat, key) => {
        this.dispatchEvent(
          new CustomEvent("keyup", {
            detail: { ...mods, key, keyCode, isRepeat },
          }),
        );
      }),
      setOnWindowClose(ptr, () => {
        this.dispatchEvent(new Event("close"));
      }),
      setOnWindowResize(ptr, (width, height) => {
        this.dispatchEvent(
          new CustomEvent("resize", {
            detail: { width, height },
          }),
        );
      }),
      setOnRender(ptr, (width, height, scale) => {
        const texture = sym.window_get_next_drawable_texture(ptr);
        if (!texture) return;
        this.dispatchEvent(
          new CustomEvent("render", {
            detail: { texture, width, height, scale },
          }),
        );
        sym.window_present_drawable(ptr);
      }),
      setOnWheel(ptr, (mods, button, x, y, deltaX, deltaY) => {
        this.dispatchEvent(
          new CustomEvent("wheel", {
            detail: { ...mods, button, x, y, deltaX, deltaY },
          }),
        );
      }),
      setOnWindowFocus(ptr, () => {
        this.dispatchEvent(new Event("focus"));
      }),
      setOnWindowBlur(ptr, () => {
        this.dispatchEvent(new Event("blur"));
      }),
    );
  }

  // --- Lifecycle ---

  show(): void {
    winLib.symbols.window_show(this.#ptr);
  }

  destroy(): void {
    winLib.symbols.window_destroy(this.#ptr);
  }

  // --- Properties ---

  set preserveDrawingBuffer(v: boolean) {
    winLib.symbols.window_set_preserve_drawing_buffer(this.#ptr, v);
  }

  get width(): number {
    return winLib.symbols.window_get_width(this.#ptr) as number;
  }
  set width(v: number) {
    winLib.symbols.window_set_width(this.#ptr, v);
  }

  get height(): number {
    return winLib.symbols.window_get_height(this.#ptr) as number;
  }
  set height(v: number) {
    winLib.symbols.window_set_height(this.#ptr, v);
  }

  get title(): string {
    return getWindowTitle(this.#ptr);
  }
  set title(v: string) {
    setWindowTitle(this.#ptr, v);
  }

  get scale(): number {
    return winLib.symbols.window_get_scale(this.#ptr) as number;
  }

  get resizable(): boolean {
    return winLib.symbols.window_get_resizable(this.#ptr) as boolean;
  }
  set resizable(v: boolean) {
    winLib.symbols.window_set_resizable(this.#ptr, v);
  }

  get closeButtonVisible(): boolean {
    return winLib.symbols.window_get_close_button_visible(
      this.#ptr,
    ) as boolean;
  }
  set closeButtonVisible(v: boolean) {
    winLib.symbols.window_set_close_button_visible(this.#ptr, v);
  }

  get miniaturizeButtonVisible(): boolean {
    return winLib.symbols.window_get_miniaturize_button_visible(
      this.#ptr,
    ) as boolean;
  }
  set miniaturizeButtonVisible(v: boolean) {
    winLib.symbols.window_set_miniaturize_button_visible(this.#ptr, v);
  }

  get zoomButtonVisible(): boolean {
    return winLib.symbols.window_get_zoom_button_visible(
      this.#ptr,
    ) as boolean;
  }
  set zoomButtonVisible(v: boolean) {
    winLib.symbols.window_set_zoom_button_visible(this.#ptr, v);
  }
}
