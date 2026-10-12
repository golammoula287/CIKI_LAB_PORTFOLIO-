import type { MetadataRoute } from "next";
import { siteOrigin } from "@/server/services/seo";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/login",
        "/accept-invite",
        "/api/auth",
        "/api/uploads",
      ],
    },
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
