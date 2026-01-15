import type { Metadata } from "next";
import "./globals.css"; // Ensure this file exists for Tailwind

export const metadata: Metadata = {
  title: "Safeguard AI | Industrial Compliance",
  description: "Real-time AI monitoring for laboratory safety",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-industrial-900 text-slate-100">
        {children}
      </body>
    </html>
  );
}