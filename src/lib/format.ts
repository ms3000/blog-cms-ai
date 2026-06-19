export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** 한글/영문 혼용 슬러그 생성 */
export function slugify(input: string): string {
  const base = (input || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "post";
}

/** 본문 텍스트로 대략적인 읽기 시간(분) 계산 */
export function readingMinutes(text: string): number {
  const chars = (text || "").replace(/\s+/g, "").length;
  // 한국어 분당 ~500자 기준
  return Math.max(1, Math.round(chars / 500));
}
