import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChatwayWidget } from "@/components/ChatwayWidget";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatwayWidget />
    </>
  );
}
