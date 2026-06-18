import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChatwayWidget } from "@/components/ChatwayWidget";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  return (
    <>
      <Navbar nav={settings.nav} announcement={settings.announcement} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <ChatwayWidget />
    </>
  );
}
