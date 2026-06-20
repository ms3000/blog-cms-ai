/**
 * 업로드된 HTML 의 원본 <style> CSS 를 특정 스코프 안으로 한정시킨다.
 * - `@import` / `@charset` 같은 문장형 at-rule 은 (url() 내부의 ; 포함) 그대로 최상단 보존
 * - `body` / `html` / `:root` 선택자는 스코프 루트로 치환
 * - 나머지 선택자는 스코프를 접두사로 붙임
 * - `@media` 등 블록 at-rule 은 내부를 재귀적으로 스코프
 *
 * scope 를 `.post-content.post-content` 처럼 주면 specificity 가 높아져
 * 전역 기본 CSS(.post-content ...) 를 항상 덮어쓴다.
 */
export function scopeCss(css: string, scope = ".post-content"): string {
  if (!css) return "";

  // 주석 제거
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // 문장형 at-rule(@import/@charset) 추출 — url() 안의 ; 까지 안전하게 포함
  const statements: string[] = [];
  css = css.replace(
    /@(?:import|charset)\s+(?:url\([^)]*\)|"[^"]*"|'[^']*')[^;]*;/gi,
    (m) => {
      statements.push(m.trim());
      return "";
    }
  );

  const body = scopeBlock(css, scope);
  return (statements.length ? statements.join("\n") + "\n" : "") + body;
}

function scopeBlock(css: string, scope: string): string {
  let out = "";
  let i = 0;
  const n = css.length;

  while (i < n) {
    const braceIdx = css.indexOf("{", i);
    if (braceIdx === -1) {
      out += css.slice(i);
      break;
    }

    const prelude = css.slice(i, braceIdx);
    const end = matchBrace(css, braceIdx);
    const inner = css.slice(braceIdx + 1, end);

    const trimmed = prelude.trim();
    if (trimmed.startsWith("@")) {
      // 블록 at-rule (@media, @supports 등): 내부를 재귀 스코프
      out += trimmed + "{" + scopeBlock(inner, scope) + "}\n";
    } else {
      const scoped = trimmed
        .split(",")
        .map((sRaw) => {
          const s = sRaw.trim();
          if (!s) return "";
          if (s === "body" || s === "html" || s === ":root") return scope;
          return `${scope} ${s}`;
        })
        .filter(Boolean)
        .join(", ");
      out += `${scoped}{${inner}}\n`;
    }
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
