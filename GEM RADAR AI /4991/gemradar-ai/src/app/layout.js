import "./globals.css";
import { Space_Grotesk, Inter } from "next/font/google";
import Providers from "@/components/Providers";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import Footer from "@/components/Footer";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body", weight: ["400", "500", "600"] });

const SITE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "GemRadar AI — Find the Gem. Understand the Gem.", template: "%s | GemRadar AI" },
  description: "AI-powered crypto discovery, research and risk intelligence for traders who want to see what the market is doing before the crowd.",
  manifest: "/manifest.json",
  applicationName: "GemRadar AI",
  icons: {
    icon: "/favicon.png",
    apple: "/icons/apple-touch-icon.png"
  },
  openGraph: {
    type: "website",
    siteName: "GemRadar AI",
    title: "GemRadar AI — Find the Gem. Understand the Gem.",
    description: "AI-powered crypto discovery, research and risk intelligence — before the crowd.",
    url: SITE_URL
  },
  twitter: {
    card: "summary",
    title: "GemRadar AI",
    description: "AI-powered crypto discovery, research and risk intelligence."
  }
};

export const viewport = { themeColor: "#0a0e17", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col font-body bg-base-900 text-ink-100 antialiased">
        <Providers>
          <ServiceWorkerRegistration />
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
