import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://verra.app"; // Fallback URL for SEO sitemap
  const routes = ["", "/history", "/about", "/settings"];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === "" ? "monthly" : "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));
}
