import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ACE MCQ - Master Your Exams",
  description: "Professional MCQ testing platform with detailed analytics and practice modes.",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ACE MCQ",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-[#09090b] text-zinc-100 selection:bg-blue-500/30 min-h-screen min-h-dvh">
        {children}
      </body>
    </html>
  );
}
