import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "GEKIファイル便 - 超高速でシンプルなファイルアップロードサービス",
  description: "広告なし、超高速、シンプルなファイル共有サービス。ファイルをアップロードしてリンクを共有するだけ！",
  keywords: [
    "ファイルアップロード",
    "ファイル共有",
    "高速アップロード",
    "シンプルなファイル共有",
    "GEKIファイル便",
  ],
  openGraph: {
    title: "GEKIファイル便 - 超高速でシンプルなファイルアップロードサービス",
    description: "広告なし、超高速、シンプルなファイル共有サービス。ファイルをアップロードしてリンクを共有するだけ！",
    url: "https://files.gekikawa.party", // サイトのURLを記載
    siteName: "GEKIファイル便",
    images: [
      {
        url: "https://files.gekikawa.party/og-image.png", // 公開用のOG画像を配置
        width: 1200,
        height: 630,
        alt: "GEKIファイル便のOGイメージ",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GEKIファイル便 - 超高速でシンプルなファイルアップロードサービス",
    description: "広告なし、超高速、シンプルなファイル共有サービス。ファイルをアップロードしてリンクを共有するだけ！",
    images: ["https://files.gekikawa.party/og-image.png"], // Twitter用のOG画像
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
