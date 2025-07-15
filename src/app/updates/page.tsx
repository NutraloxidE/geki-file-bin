"use client";

import Link from "next/link";
import HamburgerMenu from "../../components/HamburgerMenu";

const updates = [

  {
    version: "0.0.1.a2",
    date: "2025-07-15",
    changes: [
      "サーバーの頑張り度や使用量が低い場合は、サーバー頑張り度を表示しないようにしました。これでサーバーの負荷が低いときは、無駄な表示がなくなります！😊",
    ],
  },

  {
    version: "0.0.1.a1",
    date: "2025-07-14",
    changes: [
      "UIを若干クールにしました😎✨",
    ],
  },

  {
    version: "0.0.1.a",
    date: "2025-07-13",
    changes: [
      "性善説に基づいたセキュリティ & 可用性強化😁",
      "ダークモードの追加🌙",
    ],
  },
  {
    version: "0.0.1",
    date: "2025-07-12",
    changes: [
      "初期リリース❗😁👊💥",
      "ファイルとフォルダのアップロード機能を実装📁",
      "ダウンロードリンクの生成機能を追加🔗",
    ],
  },
];

export default function UpdatesPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-8">
      
      {/* ハンバーガーメニュー */}
      <HamburgerMenu />
      
      <h1 className="text-4xl font-bold text-gray-700 dark:text-gray-300 mb-6">
        アップデートヒストリー
      </h1>
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
        {updates.map((update, index) => (
          <div key={index} className="mb-6">
            <h2 className="text-2xl font-bold text-blue-500 dark:text-blue-400">
              バージョン {update.version}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              リリース日: {update.date}
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
              {update.changes.map((change, idx) => (
                <li key={idx}>{change}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <Link
          href="/"
          className="text-blue-500 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-500 transition"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}