import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import RootLayoutWrapper from "@/components/layout/RootLayoutWrapper";

export const metadata: Metadata = {
  title: "EcoEquity AI — Urban Heat Island Intelligence",
  description:
    "AI-powered urban heat island visualization for climate equity in European cities",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EcoEquity AI",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/ecoequity-ai.png",
  },
};

export const viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="font-sans antialiased bg-obsidian-950 text-white overflow-hidden">
        <AppProvider>
          <RootLayoutWrapper>{children}</RootLayoutWrapper>
        </AppProvider>
      </body>
    </html>
  );
}
