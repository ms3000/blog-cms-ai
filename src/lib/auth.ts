import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "admin_session";

function expectedToken(): string {
  const pw = process.env.ADMIN_PASSWORD || "change-me";
  return crypto.createHash("sha256").update("blog-cms:" + pw).digest("hex");
}

export function checkPassword(pw: string): boolean {
  const a = Buffer.from(
    crypto.createHash("sha256").update("blog-cms:" + (pw || "")).digest("hex")
  );
  const b = Buffer.from(expectedToken());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function setSessionCookie() {
  cookies().set(COOKIE, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE);
}

export function isAuthed(): boolean {
  const v = cookies().get(COOKIE)?.value;
  if (!v) return false;
  const a = Buffer.from(v);
  const b = Buffer.from(expectedToken());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
