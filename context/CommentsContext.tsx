"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseRealtime } from "@/lib/useSupabaseRealtime";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { getSessionId } from "@/lib/session";

export interface Comment {
  id: string;
  articleId: string;
  parentId: string | null;
  authorName: string;
  content: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  reactions: Record<string, number>;
}

interface CommentsContextType {
  comments: Comment[];
  myReactions: Record<string, string>; // commentId -> emoji this visitor already picked
  addComment: (input: { articleId: string; authorName: string; content: string; parentId?: string | null }) => Promise<void>;
  updateStatus: (id: string, status: "approved" | "rejected") => Promise<void>;
  reactToComment: (commentId: string, emoji: string) => Promise<void>;
  loading: boolean;
}

const CommentsContext = createContext<CommentsContextType | null>(null);

function mapRow(r: Record<string, unknown>): Comment {
  return {
    id: r.id as string,
    articleId: r.article_id as string,
    parentId: (r.parent_id as string | null) ?? null,
    authorName: r.author_name as string,
    content: r.content as string,
    submittedAt: r.created_at as string,
    status: r.status as "pending" | "approved" | "rejected",
    reactions: (r.reactions as Record<string, number>) ?? {},
  };
}

export function CommentsProvider({ children }: { children: ReactNode }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [myReactions, setMyReactions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const sessionId = useRef<string>("");
  const fingerprint = useRef<string>("");

  useEffect(() => {
    sessionId.current = getSessionId();
    getDeviceFingerprint().then(async (fp) => {
      fingerprint.current = fp;

      // Mirrors how voting determines "already voted": check by session_id
      // OR fingerprint, so this is accurate even if localStorage was
      // cleared (e.g. incognito) but it's the same device.
      const { data } = await supabase
        .from("comment_reaction_log")
        .select("comment_id, emoji")
        .or(`session_id.eq.${sessionId.current},fingerprint.eq.${fp}`);

      if (data) {
        const map: Record<string, string> = {};
        for (const row of data as { comment_id: string; emoji: string }[]) {
          map[row.comment_id] = row.emoji;
        }
        setMyReactions(map);
      }
    });
  }, []);

  async function fetchAll(): Promise<void> {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setComments(data.map(mapRow));
  }

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, []);

  useSupabaseRealtime("comments_realtime", "comments", () => {
    fetchAll();
  });

  const addComment = useCallback(
    async (input: { articleId: string; authorName: string; content: string; parentId?: string | null }): Promise<void> => {
      const id = `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const createdAt = new Date().toISOString();

      const { error } = await supabase.from("comments").insert({
        id,
        article_id: input.articleId,
        parent_id: input.parentId ?? null,
        author_name: input.authorName,
        content: input.content,
        created_at: createdAt,
        status: "pending",
      });

      if (error) throw new Error("Failed to post comment");

      const newComment: Comment = {
        id,
        articleId: input.articleId,
        parentId: input.parentId ?? null,
        authorName: input.authorName,
        content: input.content,
        submittedAt: createdAt,
        status: "pending",
        reactions: {},
      };
      setComments((prev) => [newComment, ...prev]);
    },
    []
  );

  const updateStatus = useCallback(async (id: string, status: "approved" | "rejected") => {
    await supabase.from("comments").update({ status }).eq("id", id);
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }, []);

  const reactToComment = useCallback(async (commentId: string, emoji: string) => {
    const { data, error } = await supabase.rpc("react_to_comment", {
      p_comment_id: commentId,
      p_emoji: emoji,
      p_session_id: sessionId.current || getSessionId(),
      p_fingerprint: fingerprint.current || null,
    });

    if (error) {
      if (error.message?.includes("ALREADY_REACTED")) {
        throw new Error("ALREADY_REACTED");
      }
      throw error;
    }

    if (data) {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, reactions: data as Record<string, number> } : c))
      );
      setMyReactions((prev) => ({ ...prev, [commentId]: emoji }));
    }
  }, []);

  return (
    <CommentsContext.Provider value={{ comments, myReactions, addComment, updateStatus, reactToComment, loading }}>
      {children}
    </CommentsContext.Provider>
  );
}

export function useComments() {
  const ctx = useContext(CommentsContext);
  if (!ctx) throw new Error("useComments must be used inside CommentsProvider");
  return ctx;
}
