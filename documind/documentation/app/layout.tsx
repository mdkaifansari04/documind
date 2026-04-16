import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const satoshiSans = localFont({
  variable: "--font-dm-sans",
  src: [
    {
      path: "../public/fonts/Satoshi-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Satoshi-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/Satoshi-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
});

const satoshiMono = localFont({
  variable: "--font-dm-mono",
  src: "../public/fonts/Satoshi-Medium.otf",
  weight: "500",
  style: "normal",
});

export const metadata: Metadata = {
  title: "DocuMind Documentation",
  description: "Architecture, components, DCLI, and MCP reference for DocuMind.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${satoshiSans.variable} ${satoshiMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
