import type { Metadata } from "next";
import { getSettings } from "./content";
import type { ContentData } from "@/features/content/schema";
export function siteOrigin() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.BETTER_AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
export async function contentMetadata(
  path: string,
  fallback: string,
  data?: ContentData | null,
): Promise<Metadata> {
  const { data: settings } = await getSettings();
  const title = data?.seoTitle || data?.title || fallback;
  const description =
    data?.seoDescription || data?.summary || settings.description;
  return {
    title,
    description,
    alternates: { canonical: `${siteOrigin()}${path}` },
    openGraph: {
      title,
      description,
      url: `${siteOrigin()}${path}`,
      siteName: settings.labName,
      type: "website",
      ...(data?.coverId
        ? { images: [`${siteOrigin()}/api/media/${data.coverId}`] }
        : {}),
    },
    twitter: {
      card: data?.coverId ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}
