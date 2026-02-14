import type { Metadata } from "next";
import "@chatbot/ui/styles";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chatbot",
  description: "AI-powered chatbot application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
