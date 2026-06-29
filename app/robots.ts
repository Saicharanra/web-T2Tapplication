import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/sign-in", "/sign-up"],
      disallow: ["/dashboard/", "/owner/", "/api/"],
    },
    sitemap: "https://trash2treasure.co.in/sitemap.xml",
  };
}
