import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Afrofemme Writers — Her voice. Her story. Her world.", template: "%s | Afrofemme Writers" },
  description: "A literary home for Kenyan women. Discover stories, poetry, essays and the voices shaping Kenya's literary future.",
  applicationName: "Afrofemme Writers",
  keywords: ["Kenyan women writers", "Kenyan literature", "Kenyan poetry", "stories", "essays", "women writers Kenya"]
};
export const viewport: Viewport = { themeColor: "#252B52", width: "device-width", initialScale: 1 };

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}