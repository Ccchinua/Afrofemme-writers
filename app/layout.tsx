import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Afrofemme — African Creativity Finds Its Voice", template: "%s | Afrofemme" },
  description: "An inclusive African creative community for writers, artists, photographers, designers, filmmakers and musicians. Discover work, find collaborators and grow your creative voice.",
  applicationName: "Afrofemme",
  keywords: ["African creatives", "African writers", "African artists", "creative community", "photographers", "designers", "filmmakers", "musicians"]
};
export const viewport: Viewport = { themeColor: "#252B52", width: "device-width", initialScale: 1 };

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
