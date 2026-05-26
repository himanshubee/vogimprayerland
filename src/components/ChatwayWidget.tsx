import Script from "next/script";

// Chatway live chat widget — https://chatway.app/
// Widget ID is taken from the existing vogimprayerland.org installation.
// To override, set NEXT_PUBLIC_CHATWAY_ID in .env.local.
const DEFAULT_CHATWAY_ID = "V4GRvJNlYACn";

export function ChatwayWidget() {
  const id = process.env.NEXT_PUBLIC_CHATWAY_ID || DEFAULT_CHATWAY_ID;
  return (
    <Script
      id="chatway"
      strategy="afterInteractive"
      src={`https://cdn.chatway.app/widget.js?id=${id}`}
    />
  );
}
