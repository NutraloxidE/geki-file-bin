"use client";

import { useEffect, useState } from "react";
import HamburgerMenu from "../../components/HamburgerMenu";
import DownloadLink from "../../components/DownloadLink";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type UploadHistoryItem = {
  files: string[];
  downloadLink: string;
  expiry: string;
  mappedExpiry: string; // 保存期間の秒数
  timestamp: string; // アップロード日時 (ISO文字列)
};

const FileHistoryPage: React.FC = () => {
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null); // 削除確認用の状態

  useEffect(() => {
    // localStorageから履歴を取得
    const history: UploadHistoryItem[] = JSON.parse(localStorage.getItem("uploadHistory") || "[]");

    // 現在の時刻を取得
    const now = new Date().getTime();

    // 有効期限を過ぎた履歴を削除
    const filteredHistory = history.filter((item) => {
      const uploadTime = new Date(item.timestamp).getTime();
      const expiryTime = uploadTime + parseInt(item.mappedExpiry) * 1000; // 有効期限を計算
      return expiryTime > now; // 現在時刻より後のものを残す
    });

    // フィルタリング後の履歴をlocalStorageに保存
    localStorage.setItem("uploadHistory", JSON.stringify(filteredHistory));

    // フィルタリング後の履歴を状態に設定
    setUploadHistory(filteredHistory);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".delete-button")) {
        setConfirmDelete(null); // 他の場所がクリックされたらリセット
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleDelete = (index: number) => {
    if (confirmDelete === index) {
      // 履歴を削除
      const updatedHistory = uploadHistory.filter((_, i) => i !== index);
      setUploadHistory(updatedHistory);
      localStorage.setItem("uploadHistory", JSON.stringify(updatedHistory));
      toast.success("履歴を削除しました！");
      setConfirmDelete(null); // 削除確認状態をリセット
    } else {
      setConfirmDelete(index); // 削除確認状態を設定
      toast.info("もう一度クリックして履歴を削除してください。");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-8 relative">
      {/* ハンバーガーメニュー */}
      <HamburgerMenu />

      <ToastContainer position="bottom-center" />

      <h1 className="text-center text-5xl text-gray-700 dark:text-gray-300 font-bold mb-8">
        アップロード履歴
      </h1>

      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {uploadHistory.length === 0 ? (
          <p className="text-center text-gray-700 dark:text-gray-300">
            アップロード履歴がありません。
          </p>
        ) : (
          <ul className="space-y-6">
            {uploadHistory.map((item, index) => (
              <li
                key={index}
                className="relative p-6 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="flex justify-between items-center">
                  {/* ファイル名 */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-0">
                    <strong>ファイル:</strong> {item.files.join(", ")}
                  </p>

                  {/* ×ボタン */}
                  <button
                    onClick={() => handleDelete(index)}
                    className="delete-button bg-red-300 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-500 active:bg-red-700 transition"
                    aria-label="削除"
                  >
                    ×
                  </button>
                </div>

                {/* リンク */}
                <div className="mt-4">
                  <DownloadLink downloadLink={item.downloadLink} />
                </div>

                <div className="sm:flex sm:justify-between mt-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>アップロード日時:</strong>{" "}
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>保存期間:</strong> {item.expiry}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FileHistoryPage;