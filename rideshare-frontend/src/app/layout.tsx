import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RideShare - Поиск попутчиков",
  description: "Сервис поиска попутчиков для совместных поездок",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={`${inter.className} bg-white`}>
        <div className="min-h-screen flex flex-col bg-white">
          <Navbar />
          <main className="flex-grow bg-white">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
