import type { Metadata, Viewport } from "next";
import { Bai_Jamjuree, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";

const display = Bai_Jamjuree({ subsets: ["thai", "latin"], weight: ["600", "700"], variable: "--font-bai" });
const body = IBM_Plex_Sans_Thai({ subsets: ["thai", "latin"], weight: ["400", "500", "600"], variable: "--font-plex" });

export const metadata: Metadata = {
  title: "C-Arm Radiation Safety Live",
  description: "ห้องกิจกรรมสดสำหรับสัมมนาความปลอดภัยทางรังสีของพยาบาลห้องผ่าตัด",
};

export const viewport: Viewport = { themeColor: "#0e1a2b", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
