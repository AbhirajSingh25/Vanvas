import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { Analytics } from "@vercel/analytics/react";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const notoSerifDevanagari = Noto_Serif_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-devanagari",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "VANVAS • चलो निकलते हैं | AI Travel Companion by The Sorted Club",
  description: "Travel should feel spontaneous. The planning shouldn't. An expedition journal and AI travel operating layer across the Himalayas, ghats, deserts, and Indian coastlines.",
  keywords: ["VANVAS", "The Sorted Club", "Indian travel journal", "Himalayan expedition", "spontaneous trips", "Manali", "Rishikesh", "Kasol", "Jaipur", "Goa"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${playfairDisplay.variable} ${notoSerifDevanagari.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-[#EFE5D2] text-[#20211D] antialiased selection:bg-[#B65E3C] selection:text-[#EFE5D2]">
        <AuthProvider>
          <Header />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer />
          <MobileNav />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
