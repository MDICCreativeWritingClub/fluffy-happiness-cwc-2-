import type { Notice } from "@/context/SiteConfigContext";

/** A temporary notice is active until 23:59:59 on its expiry date. Permanent notices are always active. */
export function isNoticeActive(notice: Notice): boolean {
  if (notice.isPermanent) return true;
  if (!notice.expiryDate) return true;
  const expiry = new Date(notice.expiryDate + "T23:59:59");
  return expiry.getTime() >= Date.now();
}

/** Active notices, newest first. */
export function getActiveNotices(notices: Notice[]): Notice[] {
  return notices.filter(isNoticeActive).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const headingSizeStyles: Record<Notice["headingSize"], { fontSize: string; lineHeight: string }> = {
  sm: { fontSize: "clamp(1.15rem, 3vw, 1.5rem)", lineHeight: "1.3" },
  md: { fontSize: "clamp(1.5rem, 4.5vw, 2.1rem)", lineHeight: "1.2" },
  lg: { fontSize: "clamp(1.9rem, 6vw, 3rem)", lineHeight: "1.12" },
};

export function newNoticeId(): string {
  return `notice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newButtonId(): string {
  return `btn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyNotice(): Notice {
  return {
    id: newNoticeId(),
    heading: "",
    headingSize: "md",
    body: "",
    imageUrl: "",
    isPermanent: true,
    expiryDate: "",
    buttons: [],
    openDetailPage: false,
    detailContent: "",
    createdAt: new Date().toISOString(),
  };
}
