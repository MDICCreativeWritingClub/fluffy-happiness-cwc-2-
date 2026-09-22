"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseRealtime } from "@/lib/useSupabaseRealtime";
import { articles as initialArticles } from "@/data/articles";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { getHardwareSignature } from "@/lib/hardwareFingerprint";
import { getSessionId } from "@/lib/session";

interface VoteContextType {
  votes: Record<string, number>;
  voted: Record<string, boolean>;
  castVote: (id: string) => Promise<void>;
}

const VoteContext = createContext<VoteContextType | null>(null);

export function VoteProvider({ children }: { children: ReactNode }) {
  const sessionId = useRef<string>("");
  const fingerprint = useRef<string>("");
  const hardwareSignature = useRef<string>("");

  const [votes, setVotes] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialArticles.map((a) => [a.id, a.votes ?? 0]))
  );

  const [voted, setVoted] = useState<Record<string, boolean>>({});

  // Load votes + voter history from Supabase
  useEffect(() => {
    sessionId.current = getSessionId();

    async function load() {
      [fingerprint.current, hardwareSignature.current] = await Promise.all([
        getDeviceFingerprint(),
        getHardwareSignature(),
      ]);

      // All vote counts
      const { data: voteData } = await supabase.from("votes").select("article_id, count");
      if (voteData) {
        const map: Record<string, number> = Object.fromEntries(
          initialArticles.map((a) => [a.id, a.votes ?? 0])
        );
        for (const row of voteData) {
          map[row.article_id] = Number(row.count);
        }
        setVotes(map);
      }

      // Which articles this machine has already voted on. Goes through
      // the API route (not a direct Supabase query) because the
      // machine key depends on the real client IP, which is only known
      // server-side.
      try {
        const params = new URLSearchParams({
          hardwareSignature: hardwareSignature.current,
          sessionId: sessionId.current,
          fingerprint: fingerprint.current || "",
        });
        const res = await fetch(`/api/vote?${params.toString()}`);
        if (res.ok) {
          const { articleIds } = await res.json();
          const votedMap: Record<string, boolean> = {};
          for (const id of articleIds as string[]) votedMap[id] = true;
          setVoted(votedMap);
        }
      } catch {
        // Network hiccup — voted state just stays empty until next load;
        // the server-side check on actual vote attempts still protects
        // against duplicates either way.
      }
    }

    load();
  }, []);

  // Real-time vote updates
  useSupabaseRealtime("votes_realtime", "votes", (payload) => {
    const row = payload.new as Record<string, unknown>;
    const articleId = row?.article_id as string | undefined;
    if (articleId) {
      setVotes((prev) => ({ ...prev, [articleId]: Number(row.count) }));
    }
  });

  const castVote = useCallback(async (id: string) => {
    if (voted[id]) return;

    // Optimistic update — reverted below if the server rejects the vote.
    setVotes((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    setVoted((prev) => ({ ...prev, [id]: true }));

    // Goes through the API route so the de-duplication key can include
    // the real client IP (only available server-side) combined with the
    // device's hardware signature — this is what makes switching
    // browsers on the same device still count as one vote, not two.
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: id,
          hardwareSignature: hardwareSignature.current,
          sessionId: sessionId.current,
          fingerprint: fingerprint.current || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error === "ALREADY_VOTED") {
          // Keep it marked as voted, just undo the optimistic increment.
          setVotes((prev) => ({ ...prev, [id]: Math.max((prev[id] ?? 1) - 1, 0) }));
          return;
        }
        // Any other failure — fully revert.
        setVotes((prev) => ({ ...prev, [id]: Math.max((prev[id] ?? 1) - 1, 0) }));
        setVoted((prev) => ({ ...prev, [id]: false }));
        return;
      }

      const { count } = await res.json();
      if (typeof count === "number") {
        setVotes((prev) => ({ ...prev, [id]: count }));
      }
    } catch {
      // Network failure — revert the optimistic update rather than
      // leave the UI claiming a vote that never reached the server.
      setVotes((prev) => ({ ...prev, [id]: Math.max((prev[id] ?? 1) - 1, 0) }));
      setVoted((prev) => ({ ...prev, [id]: false }));
    }
  }, [voted]);

  return (
    <VoteContext.Provider value={{ votes, voted, castVote }}>
      {children}
    </VoteContext.Provider>
  );
}

export function useVotes() {
  const ctx = useContext(VoteContext);
  if (!ctx) throw new Error("useVotes must be used inside VoteProvider");
  return ctx;
}
