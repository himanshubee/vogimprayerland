"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { ChatCircleDots } from "@phosphor-icons/react";
import { CONSENT_EVENT, readConsent } from "@/lib/consent";

const DEFAULT_CHATWAY_ID = "V4GRvJNlYACn";

export function ChatwayWidget() {
  const [allowed, setAllowed] = useState(false);
  const [load, setLoad] = useState(false);
  const id = process.env.NEXT_PUBLIC_CHATWAY_ID || DEFAULT_CHATWAY_ID;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAllowed(readConsent()?.functional ?? false));
    const update = () => {
      setAllowed(readConsent()?.functional ?? false);
      if (!readConsent()?.functional) setLoad(false);
    };
    window.addEventListener(CONSENT_EVENT, update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener(CONSENT_EVENT, update);
    };
  }, []);

  if (!allowed || !id) return null;

  return (
    <>
      {!load && (
        <button type="button" onClick={() => setLoad(true)} className="chat-launcher" aria-label="Open live chat">
          <ChatCircleDots size={24} weight="duotone" aria-hidden="true" />
          <span>Chat with us</span>
        </button>
      )}
      {load && <Script id="chatway" strategy="lazyOnload" src={`https://cdn.chatway.app/widget.js?id=${id}`} />}
    </>
  );
}
