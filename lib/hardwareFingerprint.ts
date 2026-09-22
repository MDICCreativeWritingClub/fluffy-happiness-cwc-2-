/**
 * Collects a "pure hardware" signature for this device -- deliberately
 * excludes anything that identifies the BROWSER rather than the physical
 * device (no user agent, no language, no installed fonts list), so
 * switching from Chrome to Firefox on the same machine still produces
 * the same signature. This is combined server-side with the request's
 * IP address to form the final de-duplication key (see app/api/vote).
 *
 * Signals used: CPU core count, device memory, screen dimensions +
 * pixel ratio, GPU renderer string (via WebGL), and a WebAudio
 * processing signature (varies slightly by audio hardware/drivers).
 *
 * This is a "probably the same device" heuristic, not a guarantee --
 * privacy-hardened browsers (Brave, Firefox resistFingerprinting, Tor)
 * deliberately randomize or mask several of these signals, and
 * identical hardware (e.g. a school computer lab with the same laptop
 * model) can legitimately collide.
 */
export async function getHardwareSignature(): Promise<string> {
  if (typeof window === "undefined") return "ssr";

  const signals: (string | number)[] = [];

  signals.push(navigator.hardwareConcurrency || "cpu_unknown");
  signals.push((navigator as any).deviceMemory || "mem_unknown");
  signals.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
  signals.push(window.devicePixelRatio || 1);

  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        signals.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
        signals.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
      } else {
        signals.push("no_gpu_debug");
      }
    } else {
      signals.push("no_webgl");
    }
  } catch {
    signals.push("webgl_error");
  }

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const comp = ctx.createDynamicsCompressor();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(10000, ctx.currentTime);
      osc.connect(comp);
      comp.connect(ctx.destination);
      osc.start(0);
      signals.push(comp.reduction ?? 0);
      await ctx.close();
    } else {
      signals.push("no_webaudio");
    }
  } catch {
    signals.push("webaudio_error");
  }

  return signals.join("||");
}
