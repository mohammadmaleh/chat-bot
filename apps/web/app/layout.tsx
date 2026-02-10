import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "../providers/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Shopping Assistant",
  description: "Find dsakdjlsadthe best prices across German stores with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
  /*  */
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
