"use client";

import { useRef, useState } from "react";

export function AdminSettings({
  initialName,
  initialLogo,
  initialFooterDescription,
  initialCopyright,
  initialGaMeasurementId,
  initialGaPropertyId,
  initialGaServiceAccount,
}: {
  initialName: string;
  initialLogo: string | null;
  initialFooterDescription: string;
  initialCopyright: string;
  initialGaMeasurementId: string;
  initialGaPropertyId: string;
  initialGaServiceAccount: string;
}) {
  const [name, setName] = useState(initialName);
  const [footerDesc, setFooterDesc] = useState(initialFooterDescription);
  const [copyright, setCopyright] = useState(initialCopyright);
  const [gaMeasurementId, setGaMeasurementId] = useState(initialGaMeasurementId);
  const [gaPropertyId, setGaPropertyId] = useState(initialGaPropertyId);
  const [gaServiceAccount, setGaServiceAccount] = useState(initialGaServiceAccount);
  const [showSa, setShowSa] = useState(false);
  const [logo, setLogo] = useState<string | null>(initialLogo);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("site_name", name);
      fd.append("footer_description", footerDesc);
      fd.append("copyright", copyright);
      fd.append("ga_measurement_id", gaMeasurementId);
      fd.append("ga_property_id", gaPropertyId);
      fd.append("ga_service_account", gaServiceAccount);
      if (file) fd.append("logo", file);
      const res = await fetch("/api/admin/settings", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "저장 실패");
      if (data.logo_url) setLogo(data.logo_url);
      setFile(null);
      setPreview(null);
      setMsg("저장됐어요. (사이드바에 반영)");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function removeLogo() {
    setBusy(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("site_name", name);
      fd.append("remove_logo", "1");
      const res = await fetch("/api/admin/settings", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "삭제 실패");
      setLogo(null);
      setFile(null);
      setPreview(null);
      setMsg("로고를 기본값으로 되돌렸어요.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  const shown = preview || logo;

  return (
    <div className="rounded-2xl border border-line p-5">
      <h2 className="text-lg font-bold">사이트 설정</h2>
      <p className="mt-1 text-sm text-ink-muted">사이드바 상단의 로고와 사이트 이름을 바꿉니다.</p>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
        <div>
          <div className="mb-2 text-sm font-medium">로고</div>
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">
            {shown ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shown} alt="logo" className="h-full w-full object-contain" />
            ) : (
              <span className="h-7 w-7 rounded-lg bg-accent" />
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:bg-surface"
            >
              이미지 선택
            </button>
            {(logo || preview) && (
              <button
                onClick={removeLogo}
                disabled={busy}
                className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                기본값
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
          />
        </div>

        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium">사이트 이름</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-accent"
            placeholder="사이트 이름"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium">푸터 소개 문구</label>
        <textarea
          value={footerDesc}
          onChange={(e) => setFooterDesc(e.target.value)}
          rows={2}
          className="w-full resize-y rounded-xl border border-line px-4 py-2.5 outline-none focus:border-accent"
          placeholder="푸터 로고 아래에 표시될 소개 문구"
        />
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium">저작권(Copyright)</label>
        <input
          value={copyright}
          onChange={(e) => setCopyright(e.target.value)}
          className="w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-accent"
          placeholder="비우면 자동: © 연도 사이트이름. All rights reserved."
        />
      </div>

      {/* Google Analytics 설정 */}
      <div className="mt-6 border-t border-line pt-5">
        <h3 className="mb-1 text-sm font-bold">Google Analytics 4</h3>
        <p className="mb-3 text-xs text-ink-muted">태그 자동 삽입 + 유입 분석 데이터 연동</p>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Measurement ID</label>
            <input
              value={gaMeasurementId}
              onChange={(e) => setGaMeasurementId(e.target.value)}
              className="w-full rounded-xl border border-line px-4 py-2.5 font-mono text-sm outline-none focus:border-accent"
              placeholder="G-XXXXXXXXXX"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Property ID</label>
            <input
              value={gaPropertyId}
              onChange={(e) => setGaPropertyId(e.target.value)}
              className="w-full rounded-xl border border-line px-4 py-2.5 font-mono text-sm outline-none focus:border-accent"
              placeholder="123456789 (숫자만)"
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium">서비스 계정 JSON</label>
              <button
                type="button"
                onClick={() => setShowSa((v) => !v)}
                className="text-xs text-ink-muted underline"
              >
                {showSa ? "숨기기" : "보기"}
              </button>
            </div>
            <textarea
              value={gaServiceAccount}
              onChange={(e) => setGaServiceAccount(e.target.value)}
              rows={showSa ? 6 : 2}
              className="w-full resize-y rounded-xl border border-line px-4 py-2.5 font-mono text-xs outline-none focus:border-accent"
              placeholder='{"type":"service_account","project_id":"...","private_key":"...","client_email":"...",...}'
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={save}
          disabled={busy}
          className="rounded-xl bg-ink px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "저장 중…" : "저장"}
        </button>
        {msg && <span className="text-sm text-ink-muted">{msg}</span>}
      </div>
    </div>
  );
}
