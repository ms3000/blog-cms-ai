/**
 * 업로드된 HTML 의 원본 <style> CSS 를 특정 스코프(.post-content) 안으로 한정시킨다.
 * - `body` / `html` 선택자는 스코프 루트로 치환
 * - 나머지 선택자는 스코프를 접두사로 붙임
 * - @media 등 중첩 at-rule 은 내부를 재귀적으로 스코프
 * - @import / @charset 같은 문장형 at-rule 은 최상단에 그대로 보존
 */
export function scopeCss(css: string, scope = ".post-content"): string {
  if (!css) return "";
  // 주석 제거
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");

  let out = "";
  let i = 0;
  const n = css.length;

  while (i < n) {
    // 공백 스킵 (그대로 출력)
    const ch = css[i];

    if (ch === "@") {
      // at-rule: 다음 '{' 또는 ';' 중 먼저 오는 것 찾기
      const braceIdx = css.indexOf("{", i);
      const semiIdx = css.indexOf(";", i);

      // 문장형 at-rule (@import, @charset 등): ; 로 끝나고 블록 없음
      if (semiIdx !== -1 && (braceIdx === -1 || semiIdx < braceIdx)) {
        out += css.slice(i, semiIdx + 1) + "\n";
        i = semiIdx + 1;
        continue;
      }

      if (braceIdx === -1) {
        out += css.slice(i);
        break;
      }
      const prelude = css.slice(i, braceIdx).trim();
      const end = matchBrace(css, braceIdx);
      const inner = css.slice(braceIdx + 1, end);
      out += prelude + "{" + scopeCss(inner, scope) + "}\n";
      i = end + 1;
      continue;
    }

    // 일반 규칙
    const braceIdx = css.indexOf("{", i);
    if (braceIdx === -1) {
      out += css.slice(i);
      break;
    }
    const selectors = css.slice(i, braceIdx);
    const end = matchBrace(css, braceIdx);
    const body = css.slice(braceIdx + 1, end);

    const scoped = selectors
      .split(",")
      .map((sRaw) => {
        const s = sRaw.trim();
        if (!s) return "";
        if (s === "body" || s === "html" || s === ":root") return scope;
        return `${scope} ${s}`;
      })
      .filter(Boolean)
      .join(", ");

    out += `${scoped}{${body}}\n`;
    i = end + 1;
  }

  return out;
}

function matchBrace(css: string, openIdx: number): number {
  let depth = 1;
  let k = openIdx + 1;
  while (k < css.length && depth > 0) {
    const c = css[k];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    k++;
  }
  return k - 1; // 닫는 '}' 위치
}
