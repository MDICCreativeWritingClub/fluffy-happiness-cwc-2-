/**
 * Returns a persistent anonymous session ID for this browser, used to
 * de-duplicate votes and comment reactions (alongside a device fingerprint
 * for the "cleared storage, same device" case). Shared between features so
 * they identify the same visitor consistently.
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("cwc_session_id");
  if (!id) {
    id = `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("cwc_session_id", id);
  }
  return id;
}
