import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Đào Sâu Ước Mơ | AI Hướng nghiệp",
  description:
    "Công cụ AI giúp bạn bóc tách thực tế ngành nghề, nhận diện thiên lệch sống sót và kiểm chứng lựa chọn nghề nghiệp.",
  applicationName: "Đào Sâu Ước Mơ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#060a17",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full bg-[#060a17] font-sans text-slate-100"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}