import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for GemRadar AI.",
  robots: { index: true, follow: true }
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="font-display text-2xl font-bold">Privacy Policy</h1>
        <div className="mt-6 space-y-4 text-sm text-ink-300">
          <p>
            This is placeholder privacy-policy content shipped with the project template. Before
            operating GemRadar AI as a real product, replace this with a policy reviewed by a
            qualified lawyer, accurately describing what this codebase actually stores: account
            details (name, email, hashed password or Google OAuth identity), portfolio and watchlist
            data you enter, research report history, wallet addresses you choose to track, and, if
            you subscribe, billing information handled by Stripe (GemRadar AI's own database never
            stores card numbers — only Stripe customer/subscription IDs).
          </p>
          <p>
            If you connect Telegram, your Telegram chat ID is stored to deliver alerts you configure.
            You can disconnect at any time from Settings.
          </p>
        </div>
      </main>
    </>
  );
}
