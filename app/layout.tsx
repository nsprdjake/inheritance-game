import type { Metadata } from "next";
import "./globals.css";
import "./design-system.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ThemeParticles from "@/components/ui/ThemeParticles";

export const metadata: Metadata = {
  title: "LYNE - Build Your Financial Legacy",
  description: "A fun and engaging way to manage kids' allowance and rewards through a point-based system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <ThemeProvider>
          <ThemeParticles />
          <div className="relative z-10">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
