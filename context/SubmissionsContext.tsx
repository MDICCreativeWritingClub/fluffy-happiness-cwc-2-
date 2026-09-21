"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseRealtime } from "@/lib/useSupabaseRealtime";

export interface Submission {
  id: string;
  name: string;
  studentCode: string;
  phone: string;
  grade: string;
  category: string;
  theme: string;
  title: string;
  content: string;
  submittedAt: string;
  status: "unverified" | "pending" | "waiting_confirmation" | "writing_confirmation" | "approved" | "rejected";
  writerId?: string;
  /** Free-text notes an editor leaves when editing at the Pending, Waiting for Confirmation, or
   *  Writing for Confirmation stage — what they changed, and any instructions for whoever
   *  reviews it next. A single box that gets overwritten on each edit, not a running log. */
  editorNotes?: string;
}

interface SubmissionsContextType {
  submissions: Submission[];
  addSubmission: (sub: Omit<Submission, "id" | "submittedAt" | "status">) => Promise<string>;
  updateStatus: (id: string, status: Submission["status"]) => void;
  updateSubmission: (
    id: string,
    edits: { title: string; content: string; name: string; studentCode: string; grade: string; editorNotes?: string },
    status: Submission["status"]
  ) => Promise<void>;
  loading: boolean;
}

const SubmissionsContext = createContext<SubmissionsContextType | null>(null);

function getWriterId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cwc_writer_id");
}

function saveWriterId(id: string): void {
  if (typeof window !== "undefined") localStorage.setItem("cwc_writer_id", id);
}

function mapRow(r: Record<string, unknown>): Submission {
  return {
    id: r.id as string,
    name: r.name as string,
    studentCode: r.student_code as string,
    phone: (r.phone as string) ?? "",
    grade: r.grade as string,
    category: r.category as string,
    theme: r.theme as string,
    title: r.title as string,
    content: r.content as string,
    submittedAt: r.submitted_at as string,
    status: r.status as Submission["status"],
    writerId: r.writer_id as string | undefined,
    editorNotes: (r.editor_notes as string | null) ?? undefined,
  };
}

export function SubmissionsProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAll(): Promise<void> {
    const { data } = await supabase
      .from("submissions")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (data) setSubmissions(data.map(mapRow));
  }

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, []);

  // Real-time subscription
  useSupabaseRealtime("submissions_realtime", "submissions", () => {
    fetchAll();
  });

  const addSubmission = useCallback(
    async (sub: Omit<Submission, "id" | "submittedAt" | "status">): Promise<string> => {
      let writerId = getWriterId();

      if (writerId) {
        // The cached writerId may point at a row that's since been
        // deleted (e.g. during cleanup) — localStorage has no way to
        // know that, so confirm it still exists before trusting it.
        const { data: existingWriter } = await supabase
          .from("writers")
          .select("id")
          .eq("id", writerId)
          .maybeSingle();

        if (!existingWriter) {
          writerId = null;
        }
      }

      if (!writerId) {
        const { data: writer, error: writerError } = await supabase
          .from("writers")
          .insert({ name: sub.name, grade: sub.grade, student_code: sub.studentCode, phone: sub.phone })
          .select("id")
          .single();

        if (writerError || !writer) throw new Error("Failed to create writer profile");
        writerId = writer.id as string;
        saveWriterId(writerId);
      } else {
        await supabase
          .from("writers")
          .update({ name: sub.name, grade: sub.grade, phone: sub.phone })
          .eq("id", writerId);
      }

      const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const submittedAt = new Date().toISOString();

      const { error } = await supabase.from("submissions").insert({
        id,
        writer_id: writerId,
        name: sub.name,
        student_code: sub.studentCode,
        phone: sub.phone,
        grade: sub.grade,
        category: sub.category,
        theme: sub.theme,
        title: sub.title,
        content: sub.content,
        submitted_at: submittedAt,
        status: "unverified",
      });

      if (error) {
        if (error.message?.includes("DAILY_SUBMISSION_LIMIT_REACHED")) {
          throw new Error("You've reached the limit of 2 submissions per day. Please try again tomorrow.");
        }
        throw new Error("Failed to save submission");
      }

      const newSub: Submission = { ...sub, id, submittedAt, status: "unverified", writerId };
      setSubmissions((prev) => [newSub, ...prev]);
      return id;
    },
    []
  );

  const updateStatus = useCallback(async (id: string, status: Submission["status"]) => {
    await supabase.from("submissions").update({ status }).eq("id", id);
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }, []);

  const updateSubmission = useCallback(
    async (
      id: string,
      edits: { title: string; content: string; name: string; studentCode: string; grade: string; editorNotes?: string },
      status: Submission["status"]
    ): Promise<void> => {
      const { error } = await supabase
        .from("submissions")
        .update({
          title: edits.title,
          content: edits.content,
          name: edits.name,
          student_code: edits.studentCode,
          grade: edits.grade,
          editor_notes: edits.editorNotes ?? null,
          status,
        })
        .eq("id", id);

      if (error) throw new Error("Failed to save changes");

      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...edits, status } : s))
      );
    },
    []
  );

  return (
    <SubmissionsContext.Provider
      value={{ submissions, addSubmission, updateStatus, updateSubmission, loading }}
    >
      {children}
    </SubmissionsContext.Provider>
  );
}

export function useSubmissions() {
  const ctx = useContext(SubmissionsContext);
  if (!ctx) throw new Error("useSubmissions must be used inside SubmissionsProvider");
  return ctx;
}

export function useWriterIdentity(): string | null {
  const [writerId, setWriterIdState] = useState<string | null>(null);
  useEffect(() => { setWriterIdState(getWriterId()); }, []);
  return writerId;
}
