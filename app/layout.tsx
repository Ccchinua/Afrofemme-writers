import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./afrofemme-foundation.css";

const themeInitScript = `(function(){try{var saved=localStorage.getItem("afrofemme-theme");var theme=saved==="light"||saved==="dark"?saved:(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=theme;}catch(_){document.documentElement.dataset.theme="light";}})();`;

export const metadata: Metadata = {
  title: { default: "Afrofemme Writers — Her voice. Her story. Her world.", template: "%s | Afrofemme Writers" },
  description: "A literary home for Kenyan women. Discover stories, poetry, essays and the voices shaping Kenya's literary future.",
  applicationName: "Afrofemme Writers",
  keywords: ["Kenyan women writers", "Kenyan literature", "Kenyan poetry", "stories", "essays", "women writers Kenya"]
};
export const viewport: Viewport = { themeColor: "#176B50", width: "device-width", initialScale: 1 };

export default function RootLayout({children}:{children:React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script id="afrofemme-theme-init" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
