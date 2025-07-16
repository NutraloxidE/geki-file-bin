"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Next.jsのルーター

const LoginPage: React.FC = () => {
  const [id, setId] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter(); // ルーターを初期化

  const handleLogin = async () => {
    try {
      const response = await fetch("/manage/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, token }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTPエラー: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.success) {
        // JWTをlocalStorageに保存
        localStorage.setItem("token", data.token);

        // ログイン成功メッセージを表示
        setMessage("ログイン成功！");

        // /manage/homeにリダイレクト
        router.push("/manage/home");
      } else {
        // 1.5秒待機してからエラーメッセージを表示
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setMessage(data.message || "ログインに失敗しました。");
      }
    } catch (error) {
      console.error("エラー:", error);
      // 1.5秒待機してからエラーメッセージを表示
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setMessage("サーバーエラーが発生しました。");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-gray-100"
      onKeyDown={handleKeyDown} // キーボードイベントを追加
    >
      <div className="bg-white p-6 rounded-sm shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">管理者ログイン</h1>
        <div className="mb-4">
          <label htmlFor="id" className="block text-sm font-medium text-gray-700">
            管理者ID
          </label>
          <input
            type="text"
            id="id"
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="token" className="block text-sm font-medium text-gray-700">
            パスワード (超長すぎて解析不可能、ハッキングは諦めてください)
          </label>
          <input
            type="password"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-sm hover:bg-blue-600 transition"
        >
          ログイン
        </button>
        {message && (
          <p className="mt-4 text-center text-sm text-red-500">{message}</p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;