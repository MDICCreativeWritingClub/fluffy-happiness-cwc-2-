"use client";

import { colors } from "@/lib/theme";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, CornerDownRight, Send, CheckCircle2 } from "lucide-react";
import { useComments, type Comment } from "@/context/CommentsContext";
import { getInitials, getAvatarColor } from "@/lib/avatar";

const REACTION_EMOJIS = ["❤️", "😂", "👏", "😮", "😢"];

/**
 * Row of emoji reaction buttons under a comment. Anyone can react (no
 * account needed, same trust level as posting a comment itself), but only
 * ONE reaction total per visitor per comment — enforced server-side via
 * comment_reaction_log (session_id + device fingerprint), not just a
 * client-side restriction. The picker opens on click/tap (not hover, which
 * didn't work reliably on mobile OR desktop) and closes on an outside
 * click or after picking.
 */
function ReactionBar({ comment }: { comment: Comment }) {
  const { reactToComment, myReactions } = useComments();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [justReacted, setJustReacted] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const myEmoji = myReactions[comment.id];
  const hasReacted = Boolean(myEmoji);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    if (pickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [pickerOpen]);

  async function handleReact(emoji: string) {
    if (hasReacted || pending) return;
    setPending(true);
    setPickerOpen(false);
    try {
      await reactToComment(comment.id, emoji);
      setJustReacted(emoji);
      setTimeout(() => setJustReacted(null), 500);
    } catch {
      // Already reacted server-side (e.g. same device, different tab/cleared
      // storage) — myReactions will be out of sync until next load, but the
      // button state will correct itself; nothing else to do here.
    } finally {
      setPending(false);
    }
  }

  // Show every emoji that has at least one reaction, plus the visitor's
  // own pick if it's not already in that set (so their choice is always
  // visible even if they were the only one to react with it).
  const visibleEmojis = REACTION_EMOJIS.filter(
    (e) => (comment.reactions[e] ?? 0) > 0 || e === myEmoji
  );

  return (
    <div ref={wrapperRef} className="relative flex items-center gap-1 mt-2 flex-wrap">
      {visibleEmojis.map((emoji) => {
        const isMine = emoji === myEmoji;
        const count = comment.reactions[emoji] ?? 0;
        return (
          <span
            key={emoji}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${justReacted === emoji ? "animate-vote-pulse" : ""}`}
            style={{
              backgroundColor: isMine ? colors.badgeBg : colors.gray50,
              border: `1px solid ${isMine ? colors.badgeBorder : colors.gray200}`,
            }}
          >
            <span>{emoji}</span>
            <span style={{ color: colors.gray500, fontWeight: 500 }}>{count}</span>
          </span>
        );
      })}

      {!hasReacted && (
        <button
          onClick={() => setPickerOpen((v) => !v)}
          disabled={pending}
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs active:scale-90 transition-transform disabled:opacity-50"
          style={{ backgroundColor: colors.gray50, border: `1px solid ${colors.gray200}`, color: colors.gray400 }}
          title="React"
        >
          +
        </button>
      )}

      {pickerOpen && !hasReacted && (
        <div
          className="absolute left-0 bottom-full mb-1 flex items-center gap-0.5 px-1.5 py-1 rounded-full shadow-lg z-20 animate-fade-slide-in"
          style={{ backgroundColor: colors.white, border: `1px solid ${colors.gray200}` }}
        >
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:scale-125 active:scale-95 transition-transform text-sm"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Format an ISO timestamp as "5 Jun 2026" */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Avatar({ name }: { name: string }) {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 text-sm"
      style={{ backgroundColor: getAvatarColor(name), fontFamily: "var(--font-display)", fontWeight: 600 }}
    >
      {getInitials(name)}
    </div>
  );
}

/**
 * Shared form for both a fresh top-level comment and a reply. Every new
 * comment is saved as "pending" and only becomes visible once a reviewer
 * approves it in the Review Panel, so submitting here shows a lightweight
 * confirmation rather than injecting the comment into the list right away.
 */
function CommentForm({
  articleId,
  parentId,
  autoFocus,
  onDone,
}: {
  articleId: string;
  parentId?: string | null;
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const { addComment } = useComments();
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await addComment({ articleId, parentId: parentId ?? null, authorName: name.trim(), content: content.trim() });
      setName("");
      setContent("");
      setSubmitted(true);
    } catch {
      setError("Couldn't post your comment — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="flex items-center gap-2 rounded-xl px-4 py-3"
        style={{ backgroundColor: colors.badgeBg, color: colors.badgeText, border: `1px solid ${colors.badgeBorder}`, fontSize: "0.85rem" }}
      >
        <CheckCircle2 size={16} />
        <span>
          {parentId ? "Reply" : "Comment"} submitted — it'll appear here once a reviewer approves it.
        </span>
        {parentId && onDone && (
          <button
            type="button"
            onClick={onDone}
            className="ml-auto underline hover:opacity-80"
            style={{ color: colors.badgeText }}
          >
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        autoFocus={autoFocus}
        maxLength={60}
        style={{
          width: "100%",
          padding: "0.6rem 0.9rem",
          borderRadius: "0.75rem",
          border: `1px solid ${colors.gray200}`,
          fontSize: "0.85rem",
          outline: "none",
          color: colors.gray900,
          backgroundColor: colors.surface,
        }}
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? "Write a reply..." : "Share your thoughts on this piece..."}
        rows={parentId ? 2 : 3}
        maxLength={1000}
        style={{
          width: "100%",
          padding: "0.7rem 0.9rem",
          borderRadius: "0.75rem",
          border: `1px solid ${colors.gray200}`,
          fontSize: "0.85rem",
          outline: "none",
          resize: "vertical",
          color: colors.gray900,
          backgroundColor: colors.surface,
          fontFamily: "inherit",
        }}
      />
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p style={{ color: colors.gray400, fontSize: "0.72rem", lineHeight: "1.5", flex: 1, minWidth: "12rem" }}>
          Once posted, comments can&apos;t be deleted unless an admin steps in.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {error && <span style={{ color: colors.red600, fontSize: "0.75rem" }}>{error}</span>}
          {parentId && onDone && (
            <button
              type="button"
              onClick={onDone}
              className="px-3 py-1.5 rounded-full text-sm hover:opacity-80"
              style={{ color: colors.gray500 }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || !name.trim() || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: colors.green600 }}
          >
            <Send size={13} />
            {submitting ? "Posting..." : parentId ? "Post Reply" : "Post Comment"}
          </button>
        </div>
      </div>
    </form>
  );
}

function CommentThread({ comment, replies, articleId }: { comment: Comment; replies: Comment[]; articleId: string }) {
  const [replying, setReplying] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Avatar name={comment.authorName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span style={{ color: colors.heading, fontWeight: 600, fontSize: "0.88rem" }}>{comment.authorName}</span>
            <span style={{ color: colors.gray400, fontSize: "0.72rem" }}>{formatDate(comment.submittedAt)}</span>
          </div>
          <p style={{ color: colors.gray700, fontSize: "0.9rem", lineHeight: "1.65", marginTop: "0.2rem", whiteSpace: "pre-wrap" }}>
            {comment.content}
          </p>
          <ReactionBar comment={comment} />
          <button
            onClick={() => setReplying((v) => !v)}
            className="flex items-center gap-1 mt-1.5 hover:opacity-75"
            style={{ color: colors.green600, fontSize: "0.78rem", fontWeight: 500 }}
          >
            <CornerDownRight size={13} /> Reply
          </button>

          {replying && (
            <div className="mt-3">
              <CommentForm articleId={articleId} parentId={comment.id} autoFocus onDone={() => setReplying(false)} />
            </div>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className="flex flex-col gap-3 pl-6 ml-4" style={{ borderLeft: `2px solid ${colors.gray200}` }}>
          {replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-3">
              <Avatar name={reply.authorName} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span style={{ color: colors.heading, fontWeight: 600, fontSize: "0.85rem" }}>{reply.authorName}</span>
                  <span style={{ color: colors.gray400, fontSize: "0.7rem" }}>{formatDate(reply.submittedAt)}</span>
                </div>
                <p style={{ color: colors.gray700, fontSize: "0.87rem", lineHeight: "1.6", marginTop: "0.2rem", whiteSpace: "pre-wrap" }}>
                  {reply.content}
                </p>
                <ReactionBar comment={reply} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentSection({ articleId }: { articleId: string }) {
  const { comments } = useComments();

  const { topLevel, repliesByParent } = useMemo(() => {
    const approved = comments.filter((c) => c.articleId === articleId && c.status === "approved");
    const top = approved
      .filter((c) => !c.parentId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    const byParent = new Map<string, Comment[]>();
    for (const c of approved) {
      if (!c.parentId) continue;
      const list = byParent.get(c.parentId) ?? [];
      list.push(c);
      byParent.set(c.parentId, list);
    }
    for (const list of byParent.values()) {
      list.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
    }
    return { topLevel: top, repliesByParent: byParent };
  }, [comments, articleId]);

  return (
    <div className="mt-14 pt-10 border-t" style={{ borderColor: colors.gray200 }}>
      <div className="flex items-center gap-2.5 mb-6">
        <MessageCircle size={20} style={{ color: colors.green600 }} />
        <h2 style={{ fontFamily: "var(--font-display)", color: colors.heading, fontWeight: 600, fontSize: "1.25rem" }}>
          Comments {topLevel.length > 0 && `(${topLevel.length})`}
        </h2>
      </div>

      <div
        className="rounded-2xl border p-5 mb-8"
        style={{ borderColor: colors.gray200, backgroundColor: colors.surface }}
      >
        <CommentForm articleId={articleId} />
      </div>

      {topLevel.length === 0 ? (
        <p style={{ color: colors.gray400, fontSize: "0.88rem" }}>Be the first to share your thoughts on this piece.</p>
      ) : (
        <div className="flex flex-col gap-7">
          {topLevel.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              replies={repliesByParent.get(comment.id) ?? []}
              articleId={articleId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
