"use server";

import { redirect } from "next/navigation";
import { checkPassword, setSessionCookie, clearSessionCookie } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const pw = String(formData.get("password") || "");
  if (!checkPassword(pw)) {
    redirect("/admin?error=1");
  }
  setSessionCookie();
  redirect("/admin");
}

export async function logoutAction() {
  clearSessionCookie();
  redirect("/admin");
}
