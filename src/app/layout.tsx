import type { Metadata } from "next";
import "./globals.css";
import { getSettings } from "@/server/services/content";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { data } = await getSettings();
  return {
    title: {
      default: `${data.labName} — ${data.tagline}`,
      template: `%s | ${data.labName}`,
    },
    description: data.description,
    referrer: "strict-origin-when-cross-origin",
  };
}
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
