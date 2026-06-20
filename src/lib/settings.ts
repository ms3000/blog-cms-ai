import { createPublicClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";

export type SiteSettings = {
  siteName: string;
  logoUrl: string | null;
};

export async function getSettings(): Promise<SiteSettings> {
  try {
    const sb = createPublicClient();
    const { data } = await sb
      .from("site_settings")
      .select("site_name, logo_url")
      .eq("id", 1)
      .maybeSingle();
    return {
      siteName: (data?.site_name as string) || site.name,
      logoUrl: (data?.logo_url as string) || null,
    };
  } catch {
    return { siteName: site.name, logoUrl: null };
  }
}
