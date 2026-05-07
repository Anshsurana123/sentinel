import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import MobileSidebar from "@/components/layout/MobileSidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "The Sentinel",
  description: "Autonomous Intelligence Feed",
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sentinel",
  },
  formatDetection: {
    telephone: false,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full bg-black"
        style={{ margin: 0, padding: 0, color: "#fff" }}
      >
        <div style={{ display: "flex", minHeight: "100vh" }}>
          {/* Desktop sidebar */}
          <div className="desktop-sidebar">
            <Sidebar />
          </div>

          {/* Mobile sidebar */}
          <div className="mobile-sidebar-trigger">
            <MobileSidebar />
          </div>

          {/* Main content */}
          <main
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: "100vh",
              background: "#000",
            }}
          >
            {children}
          </main>
        </div>

        <style>{`
          .desktop-sidebar { display: flex; }
          .mobile-sidebar-trigger { display: none; }

          @media (max-width: 768px) {
            .desktop-sidebar { display: none; }
            .mobile-sidebar-trigger { display: block; }
            main { padding-top: 48px; }
          }
        `}</style>
      </body>
    </html>
  );
}
