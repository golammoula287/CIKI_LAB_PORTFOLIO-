import type { Metadata } from "next";
import localFont from "next/font/local";
const inter = localFont({
  src: "./fonts/inter.woff2",
  variable: "--font-inter-local",
  weight: "100 900",
  display: "swap",
});
const jakarta = localFont({
  src: "./fonts/jakarta.woff2",
  variable: "--font-jakarta-local",
  weight: "200 800",
  display: "swap",
  preload: false,
});
const editorial = localFont({
  src: [
    { path: "./fonts/newsreader.woff2", style: "normal", weight: "200 800" },
    {
      path: "./fonts/newsreader-italic.woff2",
      style: "italic",
      weight: "200 800",
    },
  ],
  variable: "--font-editorial-local",
  display: "swap",
  preload: false,
});
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
    <html
      lang="en"
      className={`${inter.variable} ${jakarta.variable} ${editorial.variable}`}
    >
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
