import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Afrofemme Writers — Her voice. Her story. Her world.", template: "%s | Afrofemme Writers" },
  description: "A literary home for African women. Discover stories, poetry, essays and the voices shaping our worlds.",
  applicationName: "Afrofemme Writers",
  keywords: ["African women writers", "African literature", "poetry", "stories", "essays"]
};
export const viewport: Viewport = { themeColor: "#f7f1e8", width: "device-width", initialScale: 1 };

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}