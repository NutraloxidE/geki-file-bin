"use client";

import { useState } from "react";
import Link from "next/link";

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* ハンバーガーボタン */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 bg-gray-200 dark:bg-gray-800 text-black dark:text-white p-3 rounded-full shadow-lg focus:outline-none"
        aria-label="メニューを開く"
      >
        <div className="space-y-1">
          <span className="block w-6 h-0.5 bg-black dark:bg-white"></span>
          <span className="block w-6 h-0.5 bg-black dark:bg-white"></span>
          <span className="block w-6 h-0.5 bg-black dark:bg-white"></span>
        </div>
      </button>

      {/* メニュー */}
      <div
        className={`fixed top-0 left-0 w-64 h-full bg-gray-200 dark:bg-gray-900 text-black dark:text-white transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-40`}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">メニュー</h2>
          <ul className="space-y-4">
            <li>
              <Link href="/" className="hover:underline">
                ホーム
              </Link>
            </li>
            <li>
              <Link href="/updates" className="hover:underline">
                アップデートヒストリー
              </Link>
            </li>
            <li>
              <Link href="/gekiyabagekikawagang" className="hover:underline">
                ゲキヤバゲキカワギャング
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* 背景の半透明オーバーレイ */}
      {isOpen && (
        <div
          onClick={toggleMenu}
          className="fixed inset-0 bg-opacity-30 z-30 backdrop-blur-sm"
        ></div>
      )}
    </div>
  );
}