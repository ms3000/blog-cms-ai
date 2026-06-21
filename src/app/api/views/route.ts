import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let slug = "";
  try {
    const body = await req.json();
    slug = String(body.slug || "").trim();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!slug) return NextResponse.json({ ok: false }, { status: 400 });

  const sb = createPublicClient();
  const { error } = await sb.rpc("increment_view", { p_slug: slug });
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true });
}
