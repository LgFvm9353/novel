import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import AuthProvider from "@/components/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "在线小说连载网站",
    template: "%s | 在线小说连载网站",
  },
  description: "在线小说连载平台，提供精彩的小说阅读体验",
  keywords: ["小说", "连载", "阅读", "在线阅读", "小说平台"],
  authors: [{ name: "Novel Website" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://your-domain.com",
    title: "在线小说连载网站",
    description: "在线小说连载平台，提供精彩的小说阅读体验",
    siteName: "在线小说连载网站",
  },
  twitter: {
    card: "summary_large_image",
    title: "在线小说连载网站",
    description: "在线小说连载平台，提供精彩的小说阅读体验",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
