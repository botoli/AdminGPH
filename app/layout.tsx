import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "./layout.module.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Contractor Dashboard",
  description: "Personal productivity and accounting dashboard for contractors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${styles.html}`}
    >
      <body className={styles.body}>{children}</body>
    </html>
  );
}
