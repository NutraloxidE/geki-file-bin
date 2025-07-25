"use client";

import Link from "next/link";
import HamburgerMenu from "../../components/HamburgerMenu";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import React, { useState } from "react";

interface LoudnessResult {
  isCalculated: boolean;
  integratedLufs: number;
}

export default function Loudness() {

  const [files, setFiles] = useState<File[]>([]);
  const [loudnessResult, setLoudnessResult] = useState<LoudnessResult | null>(null);

  const handleMeasureLoudness = () => {
    if (files.length === 0) {
      return 0;
    }

    toast.success("ラウドネス計測を開始" + files[0]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-8">
      
      {/* ハンバーガーメニュー */}
      <HamburgerMenu />

      <ToastContainer position="bottom-center" /> {/* Toastコンテナを追加 */}
      
      <h1 className="text-4xl font-bold text-gray-700 dark:text-gray-300 mb-6">
        ラウドネスメーター
      </h1>

      <div className="mt-8 text-center">
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
          音声ファイルのラウドネスを測定し、正確な音量を把握するためのツールです❗🔊
        </p>
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-6">
          ファイルをアップロードして、ラウドネスをチェックしましょう❗📊
        </p>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
        {/* ドラッグアンドドロップ＆クリックでファイル選択 */}
        <label htmlFor="file-upload" className="block cursor-pointer">
          <input
            id="file-upload"
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setFiles(files.length > 0 ? [files[0]] : []);
            }}
          />
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 text-center transition-colors duration-300 ease-in-out hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const files = Array.from(e.dataTransfer.files);
              setFiles(files.length > 0 ? [files[0]] : []);
            }}
          >
            <p className="text-gray-500 dark:text-gray-400">
              ここに音声ファイルをドラッグ＆ドロップ、またはクリックして選択してください❗
            </p>
          </div>
        </label>

        {/* 選択されているファイルを表示 */}
        <div className="mt-4 text-center">
          {files.length > 0 ? (
            <ul className="list-none p-0">
              {files.map((file, index) => (
                <li key={index} className="flex items-center justify-center gap-2 py-1 text-gray-700 dark:text-gray-300">
                  <span className="inline-block w-6 h-6 text-blue-300 dark:text-blue-300">
                    {/* 音楽ファイルアイコン（SVG） */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                      <path d="M9 17V5.5a1 1 0 0 1 .757-.97l8-2A1 1 0 0 1 19 3.5V15a3.5 3.5 0 1 1-2-3.163V7.28l-6 1.5V17a3.5 3.5 0 1 1-2-3.163Z" />
                    </svg>
                  </span>
                  <span className="truncate max-w-xs text-left">{file.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              まだファイルが選択されていません
            </p>
          )}
        </div>

        {/* 計測開始ボタン */}
        <div
          className={`mt-4 transition-all duration-300 ${
            files.length > 0 ? "opacity-100 max-h-20" : "opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          {files.length > 0 && (
            <button
              onClick={() => {
                // ラウドネス計測のロジックをここに追加
                handleMeasureLoudness();
                console.log("ラウドネス計測を開始");
              }}
              className="w-full bg-blue-500 dark:bg-blue-600 text-white py-2 px-4 rounded-sm transition-all duration-300 hover:bg-blue-600 dark:hover:bg-blue-700"
            >
              ラウドネス計測を開始
            </button>
          )}
        </div>

        {/* ラウドネス計測結果 */}
        {loudnessResult && (
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-sm">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              ラウドネス計測結果
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              計測済み: {loudnessResult.isCalculated ? "はい" : "いいえ"}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              統合ラウドネス (LUFS): {loudnessResult.integratedLufs.toFixed(2)}
            </p>
          </div>
        )}

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