"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function DownloadPage() {
  const searchParams = useSearchParams();
  const timestamp = searchParams.get("id"); // クエリパラメータからタイムスタンプを取得
  const [status, setStatus] = useState("準備中...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!timestamp) {
      setStatus("無効なリクエストです。");
      return;
    }

    const simulateServerLoad = async () => {
      setStatus("サーバーの負荷状況を確認中...");
      const waitTime = Math.random() * (6 - 2) + 2; // 2秒から6秒のランダムな待機時間
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
        a.download = `GEKI-FILE-${timestamp}.zip`; // ダウンロードするファイル名
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-2xl font-bold text-gray-700 mb-4">ダウンロードページ</h1>
      <p className="text-gray-600 mb-4">{status}</p>
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-500 h-4 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}