import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { isAuthed } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const key = JSON.parse(serviceAccountJson) as {
    client_email: string;
    private_key: string;
  };
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claimSet = Buffer.from(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  ).toString("base64url");
  const sigInput = `${header}.${claimSet}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(sigInput);
  const sig = sign.sign(key.private_key, "base64url");
  const jwt = `${sigInput}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token error: ${err}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function runReport(
  propertyId: string,
  token: string,
  body: Record<string, unknown>
) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GA4 API error: ${err}`);
  }
  return res.json();
}

export async function GET(req: Request) {
  if (!isAuthed()) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = Math.min(Number(searchParams.get("days") || "30"), 365);
  const startDate = `${days}daysAgo`;

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("site_settings")
    .select("ga_property_id, ga_service_account")
    .eq("id", 1)
    .maybeSingle();

  const propertyId = row?.ga_property_id as string | null;
  const serviceAccount = row?.ga_service_account as string | null;

  if (!propertyId || !serviceAccount) {
    return NextResponse.json({ ok: false, error: "GA4 설정이 없습니다. 어드민 → 사이트 설정에서 Property ID와 서비스 계정 JSON을 입력하세요." }, { status: 400 });
  }

  try {
    const token = await getAccessToken(serviceAccount);
    const dateRange = { startDate, endDate: "today" };

    const [channelReport, pageReport, totalReport] = await Promise.all([
      // 채널별 분석
      runReport(propertyId, token, {
        dateRanges: [dateRange],
        dimensions: [{ name: "sessionDefaultChannelGrouping" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      }),
      // 인기 페이지
      runReport(propertyId, token, {
        dateRanges: [dateRange],
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics: [{ name: "screenPageViews" }, { name: "sessions" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),
      // 전체 합계
      runReport(propertyId, token, {
        dateRanges: [dateRange],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "newUsers" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
        ],
      }),
    ]);

    // 전체 합계 파싱
    const totalRow = totalReport.rows?.[0]?.metricValues ?? [];
    const summary = {
      sessions: Number(totalRow[0]?.value ?? 0),
      users: Number(totalRow[1]?.value ?? 0),
      newUsers: Number(totalRow[2]?.value ?? 0),
      pageviews: Number(totalRow[3]?.value ?? 0),
      bounceRate: Number(totalRow[4]?.value ?? 0),
      avgSessionSec: Number(totalRow[5]?.value ?? 0),
    };

    // 채널 파싱
    const CHANNEL_KO: Record<string, string> = {
      "Organic Search": "자연 검색",
      Direct: "직접 유입",
      Social: "소셜",
      Referral: "참조 사이트",
      Email: "이메일",
      "Paid Search": "유료 검색",
      "Organic Video": "자연 동영상",
      Display: "디스플레이",
      "Organic Shopping": "자연 쇼핑",
      Unassigned: "미분류",
    };
    const channels = (channelReport.rows ?? []).map(
      (r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
        channel: r.dimensionValues[0]?.value ?? "",
        channelKo: CHANNEL_KO[r.dimensionValues[0]?.value ?? ""] ?? r.dimensionValues[0]?.value ?? "",
        sessions: Number(r.metricValues[0]?.value ?? 0),
        users: Number(r.metricValues[1]?.value ?? 0),
        pageviews: Number(r.metricValues[2]?.value ?? 0),
      })
    );

    // 페이지 파싱
    const pages = (pageReport.rows ?? []).map(
      (r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
        path: r.dimensionValues[0]?.value ?? "",
        title: r.dimensionValues[1]?.value ?? "",
        pageviews: Number(r.metricValues[0]?.value ?? 0),
        sessions: Number(r.metricValues[1]?.value ?? 0),
      })
    );

    return NextResponse.json({ ok: true, days, summary, channels, pages });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "알 수 없는 오류" },
      { status: 500 }
    );
  }
}
