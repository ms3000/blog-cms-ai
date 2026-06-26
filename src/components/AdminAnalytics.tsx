"use client";

import { useEffect, useState, useCallback } from "react";

type Summary = {
  sessions: number;
  users: number;
  newUsers: number;
  pageviews: number;
  bounceRate: number;
  avgSessionSec: number;
};
type Channel = { channel: string; channelKo: string; sessions: number; users: number; pageviews: number };
type Page = { path: string; title: string; pageviews: number; sessions: number };
type AnalyticsData = { summary: Summary; channels: Channel[]; pages: Page[]; days: number };

function fmt(n: number) {
  return n.toLocaleString("ko-KR");
}
function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}
function dur(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

const DAYS_OPTIONS = [
  { label: "7일", value: 7 },
  { label: "30일", value: 30 },
  { label: "90일", value: 90 },
];

export function AdminAnalytics({ hasConfig }: { hasConfig: boolean }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/analytics?days=${d}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasConfig) load(days);
  }, [hasConfig, days, load]);

  if (!hasConfig) {
    return (
      <div className="rounded-2xl border border-line p-5">
        <h2 className="text-lg font-bold">유입 분석</h2>
        <p className="mt-3 text-sm text-ink-muted">
          사이트 설정에서 <strong>GA4 Property ID</strong>와 <strong>서비스 계정 JSON</strong>을 입력하면 여기에 분석 데이터가 표시됩니다.
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-4 text-sm text-ink-muted">
          <li>Google Analytics 4 속성 생성 후 Property ID 확인 (숫자, 예: 123456789)</li>
          <li>Google Cloud Console → 서비스 계정 생성 → JSON 키 다운로드</li>
          <li>GA4 속성 → 관리 → 속성 액세스 관리 → 서비스 계정 이메일 추가 (뷰어 권한)</li>
          <li>아래 사이트 설정에 Measurement ID·Property ID·서비스 계정 JSON 입력 후 저장</li>
        </ol>
      </div>
    );
  }

  const maxSessions = data?.channels?.[0]?.sessions ?? 1;

  return (
    <div className="rounded-2xl border border-line p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">유입 분석</h2>
        <div className="flex items-center gap-2">
          {DAYS_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setDays(o.value)}
              className={[
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                days === o.value
                  ? "bg-accent text-white"
                  : "border border-line hover:bg-surface",
              ].join(" ")}
            >
              {o.label}
            </button>
          ))}
          <button
            onClick={() => load(days)}
            disabled={loading}
            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface disabled:opacity-50"
          >
            {loading ? "로딩…" : "새로고침"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="mt-8 text-center text-sm text-ink-muted">분석 데이터 불러오는 중…</div>
      )}

      {data && (
        <>
          {/* 요약 카드 */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "세션", value: fmt(data.summary.sessions) },
              { label: "사용자", value: fmt(data.summary.users) },
              { label: "신규 사용자", value: fmt(data.summary.newUsers) },
              { label: "페이지뷰", value: fmt(data.summary.pageviews) },
              { label: "이탈률", value: pct(data.summary.bounceRate) },
              { label: "평균 세션", value: dur(data.summary.avgSessionSec) },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-line bg-surface p-3 text-center">
                <div className="text-xl font-extrabold text-ink">{c.value}</div>
                <div className="mt-0.5 text-xs text-ink-muted">{c.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* 채널 분석 */}
            <div>
              <h3 className="mb-3 text-sm font-bold text-ink-muted uppercase tracking-wide">유입 채널</h3>
              <div className="space-y-2.5">
                {data.channels.length === 0 && (
                  <p className="text-sm text-ink-muted">데이터 없음</p>
                )}
                {data.channels.map((ch) => {
                  const ratio = maxSessions > 0 ? (ch.sessions / maxSessions) * 100 : 0;
                  return (
                    <div key={ch.channel}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{ch.channelKo || ch.channel}</span>
                        <span className="text-ink-muted">
                          {fmt(ch.sessions)} 세션 · {fmt(ch.users)} 명
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-line">
                        <div
                          className="h-1.5 rounded-full bg-accent transition-all"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 인기 페이지 */}
            <div>
              <h3 className="mb-3 text-sm font-bold text-ink-muted uppercase tracking-wide">인기 페이지</h3>
              <div className="space-y-2">
                {data.pages.length === 0 && (
                  <p className="text-sm text-ink-muted">데이터 없음</p>
                )}
                {data.pages.map((pg, i) => (
                  <div key={pg.path} className="flex items-start gap-2.5 text-sm">
                    <span className="w-5 shrink-0 font-bold text-accent">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium" title={pg.title || pg.path}>
                        {pg.title || pg.path}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {fmt(pg.pageviews)} 뷰 · {pg.path}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
