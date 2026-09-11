// Next.js dynamic robots.txt — see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
export default function robots() {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/features", "/pricing", "/terms", "/privacy", "/disclaimer", "/login", "/signup"],
      // Every authenticated area, the admin panel, and internal API routes
      // must never be indexed — these all require a login and have no
      // business appearing in search results.
      disallow: [
        "/dashboard", "/scanner", "/research", "/token", "/watchlist", "/alerts",
        "/portfolio", "/smart-money", "/market", "/settings", "/subscription",
        "/admin", "/api", "/offline"
      ]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
