import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AuthProvider } from "@/lib/auth/context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "StudySpot",
  description:
    "Discover, share, and rate study spots on and around Chapman University campus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-bg text-primary font-sans antialiased">
        <AuthProvider>
          <Header />
          <main className="flex-1 pb-20">{children}</main>
          <footer className="pb-20 py-4 text-center">
            <span className="text-xs uppercase tracking-widest text-[#555]">
              by Chapman CEO
            </span>
          </footer>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
