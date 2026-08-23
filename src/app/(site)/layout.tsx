import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChatwayWidget } from "@/components/ChatwayWidget";
import { CartProvider } from "@/components/shop/CartProvider";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  return (
    // The basket wraps the whole site, not just /books, so the header can show
    // its count wherever the reader wanders off to mid-shop.
    <CartProvider>
      <Navbar nav={settings.nav} announcement={settings.announcement} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <ChatwayWidget />
    </CartProvider>
  );
}
