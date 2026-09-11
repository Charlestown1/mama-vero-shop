// Next.js dynamic sitemap.xml — only public, indexable marketing pages belong
// here. Anything requiring authentication is intentionally excluded, matching
// robots.js.
export default function sitemap() {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const routes = ["", "/about", "/features", "/pricing", "/terms", "/privacy", "/disclaimer", "/login", "/signup"];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "monthly",
    priority: route === "" ? 1 : 0.6
  }));
}
