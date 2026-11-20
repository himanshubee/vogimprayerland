import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChatwayWidget } from "@/components/ChatwayWidget";
import { ConsentManager } from "@/components/ConsentManager";
import { ServiceBar } from "@/components/ServiceBar";
import { StickyPrayerBar } from "@/components/StickyPrayerBar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AnalyticsEvents } from "@/components/AnalyticsEvents";
import { CartProvider } from "@/components/shop/CartProvider";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <CartProvider>
      <ServiceBar />
      <Navbar />
      <Breadcrumbs />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
      <ConsentManager />
      <AnalyticsEvents />
      <StickyPrayerBar />
      <ChatwayWidget />
    </CartProvider>
  );
}
