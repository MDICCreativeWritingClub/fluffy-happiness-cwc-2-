import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabase } from "@/lib/supabase";

/**
 * Extracts the real client IP from proxy headers. Works behind Vercel,
 * Cloudflare, or most standard reverse proxies. Falls back to a constant
 * if nothing is present (e.g. local dev) -- this just means the
 * IP-component of the machine key won't vary locally, which is fine
 * since hardware signature still does the real work there.
 */
function getClientIp(req: NextRequest): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown-ip";
}

export async function GET(req: NextRequest) {
  const hardwareSignature = req.nextUrl.searchParams.get("hardwareSignature");
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const fingerprint = req.nextUrl.searchParams.get("fingerprint");

  if (!hardwareSignature) {
    return NextResponse.json({ error: "Missing hardwareSignature." }, { status: 400 });
  }

  const clientIp = getClientIp(req);
  const machineKey = createHash("sha256").update(`${clientIp}::${hardwareSignature}`).digest("hex");

  // Returns which articles THIS machine has already voted on, so the
  // client can mark those as voted without ever needing to know its own
  // machine key (which depends on server-known IP, not just hardware).
  const { data, error } = await supabase
    .from("voter_log")
    .select("article_id")
    .or(
      [
        `machine_key.eq.${machineKey}`,
        sessionId ? `session_id.eq.${sessionId}` : null,
        fingerprint ? `fingerprint.eq.${fingerprint}` : null,
      ]
        .filter(Boolean)
        .join(",")
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ articleIds: (data ?? []).map((r) => r.article_id) });
}

export async function POST(req: NextRequest) {
  let body: { articleId?: string; hardwareSignature?: string; sessionId?: string; fingerprint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { articleId, hardwareSignature, sessionId, fingerprint } = body;

  if (!articleId || !hardwareSignature) {
    return NextResponse.json({ error: "Missing articleId or hardwareSignature." }, { status: 400 });
  }

  const clientIp = getClientIp(req);

  // The actual de-duplication key: real client IP (only available here,
  // server-side -- a browser script calling Supabase directly can't fake
  // this the way it could a self-reported value) combined with the
  // hardware signature the client computed.
  const machineKey = createHash("sha256").update(`${clientIp}::${hardwareSignature}`).digest("hex");

  const { data: newCount, error } = await supabase.rpc("cast_vote_v2", {
    p_article_id: articleId,
    p_machine_key: machineKey,
    p_session_id: sessionId ?? null,
    p_fingerprint: fingerprint ?? null,
  });

  if (error) {
    if (error.message?.includes("ALREADY_VOTED")) {
      return NextResponse.json({ error: "ALREADY_VOTED" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ count: newCount });
}
