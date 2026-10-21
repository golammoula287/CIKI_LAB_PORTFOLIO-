import { Header, Footer } from "@/components/site-shell";
import { MobileNavigation } from "@/components/mobile-navigation";
import { getSettings } from "@/server/services/content";
export const dynamic = "force-dynamic";
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: settings } = await getSettings();
  return (
    <>
      <Header settings={settings} />
      <main id="main">{children}</main>
      <Footer settings={settings} />
      <MobileNavigation />
    </>
  );
}
