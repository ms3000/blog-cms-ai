import { parse } from "node-html-parser";
import { slugify } from "@/lib/format";

export type TocItem = { id: string; text: string };

/**
 * 본문 HTML 의 소제목(.bp-h, h2)에 앵커 id 를 부여하고 목차 항목을 추출한다.
 * 반환된 html 을 렌더링하면 목차 링크(#id)로 이동 가능.
 */
export function addHeadingIds(html: string): { html: string; toc: TocItem[] } {
  if (!html) return { html, toc: [] };
  const root = parse(html, { comment: false });
  const heads = root.querySelectorAll(".bp-h, h2.bp-h, h2");
  const toc: TocItem[] = [];
  const used = new Set<string>();

  for (const h of heads) {
    const text = (h.text || "").trim().replace(/\s+/g, " ");
    if (!text) continue;
    let base = slugify(text).slice(0, 40) || "section";
    let id = base;
    let i = 2;
    while (used.has(id)) id = `${base}-${i++}`;
    used.add(id);
    h.setAttribute("id", id);
    // 앵커 이동 시 사이드바/상단에 가리지 않도록 여백 확보
    const style = h.getAttribute("style") || "";
    h.setAttribute("style", `${style};scroll-margin-top:90px`);
    toc.push({ id, text });
  }

  return { html: root.toString(), toc };
}
