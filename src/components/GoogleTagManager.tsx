// GTM container ID (GTM-XXXXXXX). Set via NEXT_PUBLIC_GTM_ID; nothing
// renders until it's set. Used for Google Search Console's "Google Tag
// Manager" ownership check, which requires the standard container snippet.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

// Goes inside <head>.
export function GoogleTagManagerHead() {
  if (process.env.NODE_ENV !== "production") return null;
  if (!GTM_ID) return null;

  return (
    <script
      id="gtm-init"
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
      }}
    />
  );
}

// Goes immediately after the opening <body> tag.
export function GoogleTagManagerBody() {
  if (process.env.NODE_ENV !== "production") return null;
  if (!GTM_ID) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
