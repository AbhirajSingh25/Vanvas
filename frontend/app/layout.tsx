import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { DensityProvider } from "@/context/DensityContext";
import { AskVanvasProvider } from "@/context/AskVanvasContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { AskVanvasModal } from "@/components/copilot/AskVanvasModal";
import { FloatingCopilotTrigger } from "@/components/copilot/FloatingCopilotTrigger";
import { Analytics } from "@vercel/analytics/next";

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
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${playfairDisplay.variable} ${notoSerifDevanagari.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('vanvas_theme');
                  var isDark = false;
                  if (storedTheme === 'dark') {
                    isDark = true;
                  } else if (storedTheme === 'system') {
                    isDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  } else {
                    isDark = false;
                  }
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                    document.documentElement.setAttribute('data-theme', 'dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    document.documentElement.setAttribute('data-theme', 'light');
                    document.documentElement.style.colorScheme = 'light';
                  }

                  var storedDensity = localStorage.getItem('vanvas_density') || localStorage.getItem('vanvas-density');
                  var isCompact = storedDensity === 'compact';
                  if (isCompact) {
                    document.documentElement.setAttribute('data-density', 'compact');
                    document.documentElement.classList.add('density-compact');
                    document.documentElement.classList.remove('density-original');
                  } else {
                    document.documentElement.setAttribute('data-density', 'original');
                    document.documentElement.classList.add('density-original');
                    document.documentElement.classList.remove('density-compact');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] antialiased selection:bg-[#B65E3C] selection:text-[#FAF7F0]"
      >
        <AuthProvider>
          <ThemeProvider>
            <DensityProvider>
              <AskVanvasProvider>
                <Header />
                <main className="flex-1 pb-16 md:pb-0">{children}</main>
                <Footer />
                <MobileNav />
                <FloatingCopilotTrigger />
                <AskVanvasModal />
                <Analytics />
              </AskVanvasProvider>
            </DensityProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
