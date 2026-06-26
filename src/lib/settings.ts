import { createPublicClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";

export type SiteSettings = {
  siteName: string;
  logoUrl: string | null;
  footerDescription: string;
  copyright: string | null;
  gaMeasurementId: string | null;
  gaPropertyId: string | null;
  gaServiceAccount: string | null;
};

export async function getSettings(): Promise<SiteSettings> {
  try {
    const sb = createPublicClient();
    const { data } = await sb
      .from("site_settings")
      .select("site_name, logo_url, footer_description, copyright, ga_measurement_id, ga_property_id, ga_service_account")
      .eq("id", 1)
      .maybeSingle();
    return {
      siteName: (data?.site_name as string) || site.name,
      logoUrl: (data?.logo_url as string) || null,
      footerDescription: (data?.footer_description as string) || site.description,
      copyright: (data?.copyright as string) || null,
      gaMeasurementId: (data?.ga_measurement_id as string) || null,
      gaPropertyId: (data?.ga_property_id as string) || null,
      gaServiceAccount: (data?.ga_service_account as string) || null,
    };
  } catch {
    return {
      siteName: site.name,
      logoUrl: null,
      footerDescription: site.description,
      copyright: null,
      gaMeasurementId: null,
      gaPropertyId: null,
      gaServiceAccount: null,
    };
  }
}
