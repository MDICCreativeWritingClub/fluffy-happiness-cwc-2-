"use client";

/**
 * A lightweight, self-contained device fingerprint used only to catch
 * "same device, cleared storage" repeat votes (e.g. incognito windows).
 *
 * This is NOT a tracking/analytics fingerprint — it never leaves the
 * browser except as an opaque hash stored alongside a vote, and it's not
 * sent anywhere else. It's also not foolproof: privacy-hardened browsers
 * (Brave, Firefox with resistFingerprinting, CanvasBlocker, etc.)
 * deliberately randomize some of these signals, which is by design on
 * their end. That's an acceptable tradeoff here — it just means those
 * visitors fall back to the normal session-based check.
 */

function canvasSignal(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 220;
    canvas.height = 30;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no-canvas";
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 220, 30);
    ctx.fillStyle = "#069";
    ctx.fillText("cwc-fp-" + navigator.userAgent.slice(0, 20), 2, 2);
    return canvas.toDataURL();
  } catch {
    return "canvas-error";
  }
}

async function sha256(input: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // Fallback for very old browsers without SubtleCrypto — a simple
    // deterministic string hash. Not cryptographic, but fine for this
    // non-sensitive, de-duplication-only use case.
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (Math.imul(31, hash) + input.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(16);
  }
}

let cached: string | null = null;

export async function getDeviceFingerprint(): Promise<string> {
  if (cached) return cached;
  if (typeof window === "undefined") return "ssr";

  const parts = [
    navigator.userAgent,
    navigator.language,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    String(new Date().getTimezoneOffset()),
    String(navigator.hardwareConcurrency ?? ""),
    canvasSignal(),
  ];

  cached = await sha256(parts.join("|"));
  return cached;
}
