import { createPublicClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";

export type SiteSettings = {
  siteName: string;
  logoUrl: string | null;
  footerDescription: string;
  copyright: string | null; // null 이면 기본 copyright 자동 생성
};

export async function getSettings(): Promise<SiteSettings> {
  try {
    const sb = createPublicClient();
    const { data } = await sb
      .from("site_settings")
      .select("site_name, logo_url, footer_description, copyright")
      .eq("id", 1)
      .maybeSingle();
    return {
      siteName: (data?.site_name as string) || site.name,
      logoUrl: (data?.logo_url as string) || null,
      footerDescription: (data?.footer_description as string) || site.description,
      copyright: (data?.copyright as string) || null,
    };
  } catch {
    return { siteName: site.name, logoUrl: null, footerDescription: site.description, copyright: null };
  }
}
