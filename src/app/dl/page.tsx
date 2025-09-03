"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import HamburgerMenu from "../../components/HamburgerMenu";
import ShowAd from "../../components/ShowAd";

function DownloadContent() {
  const searchParams = useSearchParams();
  const timestamp = searchParams.get("id");
  const [status, setStatus] = useState("準備中...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!timestamp) {
      setStatus("無効なリクエストです。");
      return;
    }

    const simulateServerLoad = async () => {
      setStatus("サーバーの負荷状況を確認中...");
      const waitTime = Math.random() * (2 - 1) + 1;
      for (let i = 0; i <= 100; i++) {
        setProgress(i);
        await new Promise((resolve) => setTimeout(resolve, (waitTime * 1000) / 100));
      }

      setStatus("ダウンロードを開始しています...");

      try {
        const response = await fetch(`/api/download?timestamp=${timestamp}`);
        if (!response.ok) {
          throw new Error("ダウンロードに失敗しました。");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `GEKI-FILE-${timestamp}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        setStatus("ダウンロードが完了しました！");
      } catch (error) {
        console.error("ダウンロードエラー:", error);
        setStatus("ダウンロードに失敗しました。");
      }
    };

    simulateServerLoad();
  }, [timestamp]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-8">
      <HamburgerMenu />

      <div className="w-full flex flex-row justify-center items-start">
        {/* 左広告 */}
        <div className="hidden lg:block mr-4" style={{ width: 160 }}>
          <ShowAd />
        </div>

        {/* 中央コンテンツ */}
        <div className="flex-1 max-w-3xl">
          <h1 className="text-6xl font-bold text-gray-700 dark:text-gray-300 mb-4 text-center">激ファイル便❗😁👊💥</h1>
          <div className="text-center mb-2">
            <Link
              href="/"
              className="text-blue-500 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-500 transition"
            >
              あなたも無料でファイルをアップロード！
            </Link>
          </div>
            <div className="flex justify-center mb-4">
            <p className="text-gray-600 dark:text-gray-400">{status}</p>
            </div>
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 mx-auto">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-sm h-4">
              <div
                className="bg-blue-500 dark:bg-blue-600 h-4 rounded-sm transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
              俺の曲を聞いて
              このサービスを
              維持してください❗🎵
            </p>
            <a
              href="https://www.tunecore.co.jp/artists/R1cefarm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-500 transition"
            >
              俺の曲を聞く❗👊💥🎶
            </a>
          </div>
        </div>

        {/* 右広告 */}
        <div className="hidden lg:block ml-4" style={{ width: 160 }}>
          <ShowAd />
        </div>
        
      </div>

      {/* スマホのみ表示の広告 */}
      <div className="block lg:hidden w-full mt-4">
        <ShowAd />
      </div>
      
    </div>
  );
}

export default function DownloadPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <DownloadContent />
    </Suspense>
  );
}