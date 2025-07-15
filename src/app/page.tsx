//stable build 0.0.1

"use client";

import { useState} from "react";
import JSZip from "jszip"; // JSZipライブラリをインポート
import { ToastContainer, toast } from "react-toastify"; // Toastifyをインポート
import "react-toastify/dist/ReactToastify.css"; // Toastifyのスタイルをインポート
import ServerStatus from "../components/ServerStatus";
import HamburgerMenu from "../components/HamburgerMenu";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number>(0); // プログレスバーの進行状況
  const [isUploading, setIsUploading] = useState<boolean>(false); // アップロード中かどうか
  const [expiry, setExpiry] = useState<string>("1日"); // 保存期間の選択状態
  const [downloadLink, setDownloadLink] = useState<string | null>(null); // ダウンロードリンク

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files; // FileList | null
    if (files) {
      setFiles((prevFiles) => [...prevFiles, ...Array.from(files)]); // null チェック後に処理
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("ファイルまたはフォルダを選択してください。");
      return;
    }

    setIsUploading(true); // アップロード開始
    setProgress(0); // プログレスバーをリセット
    setDownloadLink(null); // ダウンロードリンクをリセット

    const zip = new JSZip(); // ZIPインスタンスを作成
    files.forEach((file) => {
      zip.file(file.name, file); // ZIPにファイルを追加
    });

    try {
      // ZIPファイルを生成しながら進行状況を更新
      const zipBlob = await zip.generateAsync(
        { type: "blob", compression: "DEFLATE", compressionOptions: { level: 7 } },
        (metadata) => {
          setProgress(Math.floor((metadata.percent * 50) / 100)); // 圧縮進行状況 (0-50%)
        }
      );

      const expiryMapping: Record<string, string> = {
        "1分": "60",
        "30分": "1800",
        "半日": "43200",
        "1日": "86400",
        "3日": "259200",
        "1週間": "604800",
        "2週間": "1209600",
        "1か月": "2592000",
      };

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/zip",
          expiry: expiryMapping[expiry], // ヘッダーに保存期間を追加
        },
        body: zipBlob,
      });

      if (response.ok) {
        const result = await response.json();
        setProgress(100); // アップロード完了 (100%)
        setDownloadLink(result.downloadLink); // ダウンロードリンクを設定
        toast.success("アップロードが成功しました！");
        setFiles([]);

        // アップロード履歴を保存
        const newHistory = {
          files: files.map((file) => file.name),
          downloadLink: result.downloadLink,
          expiry,
          timestamp: new Date().toISOString(),
        };

        const existingHistory = JSON.parse(localStorage.getItem("uploadHistory") || "[]");
        localStorage.setItem("uploadHistory", JSON.stringify([newHistory, ...existingHistory]));
      } else {
        toast.error("アップロードに失敗しました。");
      }
    } catch (error) {
      console.error("アップロードエラー:", error);
      toast.error("エラーが発生しました。");
    } finally {
      setIsUploading(false); // アップロード終了
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-8 relative">
      
        {/* ハンバーガーメニュー */}
        <HamburgerMenu />
      
      <ToastContainer position="bottom-center" /> {/* Toastコンテナを追加 */}
      <h1 className="text-center text-5xl text-gray-700 dark:text-gray-300 font-bold mb-0">激ファイル便❗😁👊💥</h1>
      <div className="mt-8 text-center">
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
          このサービスは、(今の所)目にうるさい広告が無く、
          シンプルで、そして超高速です❗🚀
        </p>
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-6">
          ファイルをアップロードして、リンクを共有するだけ。これ以上簡単な方法はありません❗😎
        </p>
      </div>
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">

        {/* サーバーステータス */}
        <ServerStatus />

        {/* ファイル選択ボタン */}
        <div className="flex justify-between mb-4">
          <label className="w-full mr-2">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="cursor-pointer w-full bg-blue-500 dark:bg-blue-600 text-white py-2 px-4 rounded-sm text-center hover:bg-blue-600 dark:hover:bg-blue-700 transition">
              ファイル選択
            </div>
          </label>

          <label className="w-full ml-2">
            <input
              type="file"
              multiple
              {...{ webkitdirectory: "true" }}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="cursor-pointer w-full bg-green-500 dark:bg-green-600 text-white py-2 px-4 rounded-sm text-center hover:bg-green-600 dark:hover:bg-green-700 transition">
              フォルダ選択
            </div>
          </label>
        </div>

        {/* 保存期間選択 */}
        <div className="mb-0">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            保存期間を選択してください:
          </label>
          <select
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-sm shadow-sm p-2 text-gray-700 dark:text-gray-300"
          > 
            <option value="1分">1分(テスト用)</option>
            <option value="30分">30分</option>
            <option value="半日">半日</option>
            <option value="1日">1日</option>
            <option value="3日">3日</option>
            <option value="1週間">1週間</option>
            <option value="2週間">2週間</option>
            <option value="1か月">1か月</option>
          </select>
        </div>

        {/* 選択されたファイルリスト */}
        <div className="mt-1 max-h-80 overflow-y-auto space-y-2">
          <ul>
            {files.map((file, index) => (
              <li
                key={index}
                className="mt-1 relative text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition group"
              >
                {file.name}
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-red-500 dark:bg-red-600 text-white text-xs px-2 py-1 rounded-sm hover:bg-red-600 dark:hover:bg-red-700 transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* プログレスバー */}
        {isUploading && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-sm h-4 mt-4">
            <div
              className="bg-blue-500 dark:bg-blue-600 h-4 rounded-sm transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {/* ダウンロードリンク */}
        {downloadLink && (
          <div className="mt-4 text-center">
            <p className="text-green-600 dark:text-green-400 font-bold mb-2">アップロード完了！</p>
            <p className="text-green-600 dark:text-green-400 font-bold mb-2">以下のリンクを共有してください！</p>
            <div className="flex items-center justify-center space-x-2">
              <input
                type="text"
                value={downloadLink}
                readOnly
                className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-sm p-2 text-sm text-gray-700 dark:text-gray-300"
                onClick={(e) => e.currentTarget.select()} // クリック時に全選択
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(downloadLink);
                  toast.success("URLをクリップボードにコピーしました！");
                }}
                className="bg-blue-500 dark:bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition flex items-center justify-center"
                aria-label="コピー"
              >
                {/* Heroiconsのコピーアイコンを使用 */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 15H6a2.25 2.25 0 01-2.25-2.25V6A2.25 2.25 0 016 3.75h6.75A2.25 2.25 0 0115 6v2.25M15.75 9H18a2.25 2.25 0 012.25 2.25v6.75A2.25 2.25 0 0118 20.25h-6.75A2.25 2.25 0 019 18v-2.25"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* アップロードボタン */}
        <div className="mt-4">
          <button
            onClick={handleUpload}
            className="w-full bg-blue-500 dark:bg-blue-600 text-white py-2 px-4 rounded-sm hover:bg-blue-600 dark:hover:bg-blue-700 transition"
            disabled={isUploading} // アップロード中はボタンを無効化
          >
            {isUploading ? "アップロード中..." : "アップロード"}
          </button>
        </div>

        {/* サービス維持のためのリンク */}
        <div className="mt-8 text-center">
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
            俺の曲を聞いて
            このサービスを
            維持してください❗🎵
          </p>
          <a
            href="https://www.tunecore.co.jp/artists/R1cefarm" // ここに音楽ページのリンクを挿入
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-500 transition"
          >
            俺の曲を聞く❗👊💥🎶
          </a>
        </div>

      </div>
    </div>
  );
}
