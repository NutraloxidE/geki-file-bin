import React from "react";
import { toast } from "react-toastify";

type DownloadLinkProps = {
  downloadLink: string;
};

const DownloadLink: React.FC<DownloadLinkProps> = ({ downloadLink }) => {
  return (
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
  );
};

export default DownloadLink;