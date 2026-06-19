import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let email = "";
  try {
    const body = await req.json();
    email = String(body.email || "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "올바른 이메일을 입력해주세요." }, { status: 400 });
  }

  const sb = createPublicClient();
  const { error } = await sb.from("newsletter_subscribers").insert({ email });

  if (error && !/duplicate|unique/i.test(error.message)) {
    return NextResponse.json({ error: "구독 처리에 실패했습니다." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
