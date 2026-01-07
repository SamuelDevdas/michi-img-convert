import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Michi Image Converter",
  description: "Professional ARW to JPEG conversion tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
