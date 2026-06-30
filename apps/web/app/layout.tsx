import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { ShortcutsModal } from "@/components/layout/ShortcutsModal";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Verra — Premium Neural Text Generation",
    template: "%s | Verra"
  },
  description: "Start writing with a few words and let Verra continue your thoughts using a neural language model trained to predict the next word in context.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "Verra — Premium Neural Text Generation",
    description: "Start writing with a few words and let Verra continue your thoughts.",
    url: "https://verra.app",
    siteName: "Verra",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verra — Premium Neural Text Generation",
    description: "Start writing with a few words and let Verra continue your thoughts.",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable} h-full antialiased`}
      data-theme="dark"
    >
      <head>
        {/* Synchronous script to prevent light/dark theme flash on initial load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var store = localStorage.getItem('verra-theme-store');
                  if (store) {
                    var parsed = JSON.parse(store);
                    if (parsed && parsed.state && parsed.state.theme) {
                      document.documentElement.setAttribute('data-theme', parsed.state.theme);
                      if (parsed.state.theme === 'light') {
                        document.documentElement.classList.add('light');
                      } else {
                        document.documentElement.classList.remove('light');
                      }
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#09090B] text-[#F8FAFC] overflow-x-hidden font-sans">
        <main className="flex-1 flex flex-col relative">{children}</main>
        
        {/* Global Overlays and Modals */}
        <CommandPalette />
        <ShortcutsModal />
      </body>
    </html>
  );
}
