"use client";

import { useEffect, useState } from "react";
import HamburgerMenu from "../../components/HamburgerMenu";

type UploadHistoryItem = {
  files: string[];
  downloadLink: string;
  expiry: string;
  timestamp: string;
};

const FileHistoryPage: React.FC = () => {
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);

  useEffect(() => {
    // localStorageから履歴を取得
    const history = JSON.parse(localStorage.getItem("uploadHistory") || "[]");
    setUploadHistory(history);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-8 relative">
      {/* ハンバーガーメニュー */}
      <HamburgerMenu />

      <h1 className="text-center text-5xl text-gray-700 dark:text-gray-300 font-bold mb-8">
        アップロード履歴
      </h1>

      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
        {uploadHistory.length === 0 ? (
          <p className="text-center text-gray-700 dark:text-gray-300">
            アップロード履歴がありません。
          </p>
        ) : (
          <ul className="space-y-4">
            {uploadHistory.map((item, index) => (
              <li
                key={index}
                className="p-4 bg-gray-100 dark:bg-gray-700 rounded-sm shadow-sm"
              >
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>ファイル:</strong> {item.files.join(", ")}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>リンク:</strong>{" "}
                  <a
                    href={item.downloadLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-500"
                  >
                    {item.downloadLink}
                  </a>
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>保存期間:</strong> {item.expiry}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>アップロード日時:</strong>{" "}
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FileHistoryPage;