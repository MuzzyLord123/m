/**
 * Visual editor postMessage protocol between the admin shell (parent window)
 * and the marketing site iframe (child window with ?__edit=1).
 */

export type VEMsg =
  | { type: "ve:ready" }
  | {
      type: "ve:select";
      sectionKey: string;
      field: string;
      value: string;
      kind: "text" | "textarea";
      label?: string;
      rect: { x: number; y: number; width: number; height: number };
    }
  | { type: "ve:hover"; sectionKey: string; field: string; rect: { x: number; y: number; width: number; height: number } }
  | { type: "ve:hover:end" }
  | { type: "ve:refresh"; sectionKey: string }
  | { type: "ve:navigate"; path: string };

export const VE_EDIT_PARAM = "__edit";

export function isInVisualEditor(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.parent === window) return false;
    return new URLSearchParams(window.location.search).get(VE_EDIT_PARAM) === "1";
  } catch {
    return false;
  }
}

export function postToParent(msg: VEMsg) {
  if (typeof window === "undefined" || window.parent === window) return;
  window.parent.postMessage(msg, window.location.origin);
}

export function postToIframe(iframe: HTMLIFrameElement | null, msg: VEMsg) {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(msg, window.location.origin);
}
