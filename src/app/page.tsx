"use client";

import { useState } from "react";
import JSZip from "jszip"; // JSZipライブラリをインポート

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number>(0); // プログレスバーの進行状況
  const [isUploading, setIsUploading] = useState<boolean>(false); // アップロード中かどうか
  const [expiry, setExpiry] = useState<string>("1日"); // 保存期間の選択状態

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
      alert("ファイルまたはフォルダを選択してください。");
      return;
    }

    setIsUploading(true); // アップロード開始
    setProgress(0); // プログレスバーをリセット

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

      const formData = new FormData();
      formData.append("file", zipBlob, "files.zip"); // ZIPファイルをFormDataに追加
      formData.append("expiry", expiry); // 保存期間を追加

      // アップロード中の進行状況を更新
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setProgress(100); // アップロード完了 (100%)
        alert("アップロードが成功しました！");
        setFiles([]);
      } else {
        alert("アップロードに失敗しました。");
      }
    } catch (error) {
      console.error("アップロードエラー:", error);
      alert("エラーが発生しました。");
    } finally {
      setIsUploading(false); // アップロード終了
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">激ファイル便❗😁👊💥</h1>
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        {/* ファイル選択ボタン */}
        <div className="flex justify-between mb-4">
          <label className="w-full mr-2">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="cursor-pointer w-full bg-blue-500 text-white py-2 px-4 rounded-lg text-center hover:bg-blue-600 transition">
              ファイル選択
            </div>
          </label>

          {/* フォルダ選択ボタン */}
          <label className="w-full ml-2">
            <input
              type="file"
              multiple
              {...{ webkitdirectory: "true" }}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="cursor-pointer w-full bg-green-500 text-white py-2 px-4 rounded-lg text-center hover:bg-green-600 transition">
              フォルダ選択
            </div>
          </label>
        </div>

        {/* 保存期間選択 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            保存期間を選択してください:
          </label>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            できるだけ短い期間に設定していただけると、サーバーがパンクしにくくて助かります。
          </label>
          <select
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg shadow-sm p-2"
          >
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
        <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
          <ul>
            {files.map((file, index) => (
              <li
                key={index}
                className="relative text-sm text-gray-700 bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition group"
              >
                {file.name}
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-lg hover:bg-red-600 transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* プログレスバー */}
        {isUploading && (
          <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
            <div
              className="bg-blue-500 h-4 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {/* アップロードボタン */}
        <div className="mt-4">
          <button
            onClick={handleUpload}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
            disabled={isUploading} // アップロード中はボタンを無効化
          >
            {isUploading ? "アップロード中..." : "アップロード"}
          </button>
        </div>
      </div>
    </div>
  );
}