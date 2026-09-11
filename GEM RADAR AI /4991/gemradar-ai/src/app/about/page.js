import Navbar from "@/components/Navbar";

export const metadata = {
  title: "About",
  description: "GemRadar AI combines a deterministic crypto scanner, AI-powered research, and risk intelligence in one platform.",
  robots: { index: true, follow: true }
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="font-display text-2xl font-bold">About GemRadar AI</h1>
        <p className="mt-4 text-sm text-ink-300">
          GemRadar AI pairs a deterministic scoring engine — never AI-guessed — with Gemini-powered
          research to help traders understand tokens faster, while being explicit about what's a
          verified fact from a data provider versus AI interpretation.
        </p>
      </main>
    </>
  );
}
