"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface FileMetadata {
  id: string;
  expiry: string;
  uploadedAt: string;
  contents: string[]; // ZIPファイルの中身
}

const HomePage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // 認証状態を管理
  const [files, setFiles] = useState<FileMetadata[]>([]); // ファイルリストを管理
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // エラーメッセージを管理
  const [page, setPage] = useState<number>(1); // 現在のページ
  const [total, setTotal] = useState<number>(0); // ファイルの総数
  const [limit] = useState<number>(10); // 1ページあたりのファイル数
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      // トークンがない場合はログインページにリダイレクト
      router.push("/manage/login");
      return;
    }

    // トークンが存在する場合は認証状態をtrueに設定
    setIsAuthenticated(true);

    // ファイルリストを取得
    const fetchFiles = async () => {
      try {
        const response = await fetch(`/manage/api/files?page=${page}&limit=${limit}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // JWTをヘッダーに追加
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "ファイルリストの取得に失敗しました。");
        }

        const data = await response.json();
        setFiles(data.files); // ファイルリストをステートに設定
        setTotal(data.total); // ファイルの総数を設定
      } catch (error) {
        console.error("ファイルリスト取得エラー:", error);
        setErrorMessage("ファイルリストの取得に失敗しました。");
      }
    };

    fetchFiles();
  }, [router, page, limit]);

  // 認証状態が確認されるまでローディングを表示
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg font-medium">読み込み中...</p>
      </div>
    );
  }

  // ページ変更ハンドラー
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= Math.ceil(total / limit)) {
      setPage(newPage);
    }
  };

  // 認証済みの場合に管理者ホームページを表示
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">管理者ページ</h1>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">アップロードされたファイルリスト</h2>
        {errorMessage ? (
          <p className="text-red-500">{errorMessage}</p>
        ) : files.length === 0 ? (
          <p className="text-gray-500">ファイルがありません。</p>
        ) : (
          <ul className="space-y-4">
            {files.map((file) => (
              <li
                key={file.id}
                className="p-4 border border-gray-300 rounded-md shadow-sm"
              >
                <div>
                  <p className="font-medium">ID: {file.id}</p>
                  <p className="text-sm text-gray-500">アップロード日時: {file.uploadedAt}</p>
                  <p className="text-sm text-gray-500">有効期限: {file.expiry}</p>
                  <p className="text-sm text-gray-500">ZIP内容:</p>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {file.contents.map((content, index) => (
                      <li key={index}>{content}</li>
                    ))}
                  </ul>
                </div>
                <a
                  href={`/dl?id=${file.id}`}
                  className="text-blue-500 hover:underline mt-2 block"
                >
                  ダウンロード
                </a>
              </li>
            ))}
          </ul>
        )}
        {/* ペジネーション */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className={`px-4 py-2 rounded-md ${
              page === 1 ? "bg-gray-300" : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            前へ
          </button>
          <p className="text-sm text-gray-700">
            ページ {page} / {Math.ceil(total / limit)}
          </p>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === Math.ceil(total / limit)}
            className={`px-4 py-2 rounded-md ${
              page === Math.ceil(total / limit)
                ? "bg-gray-300"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;