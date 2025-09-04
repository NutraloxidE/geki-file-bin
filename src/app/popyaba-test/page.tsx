"use client";

import { useState } from 'react';

export default function PopyabaTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('ファイルを選択してください');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/popyaba/mp3upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'アップロードに失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
          🎵 Popyaba MP3アップロードテスト
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {/* ファイル選択 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              MP3ファイルを選択してください:
            </label>
            <input
              type="file"
              accept=".mp3,audio/mpeg"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                dark:file:bg-blue-900 dark:file:text-blue-300"
            />
          </div>

          {/* 選択されたファイル情報 */}
          {selectedFile && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
              <h3 className="font-medium text-gray-800 dark:text-gray-200 mb-2">選択されたファイル:</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>ファイル名:</strong> {selectedFile.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>サイズ:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>タイプ:</strong> {selectedFile.type}
              </p>
            </div>
          )}

          {/* アップロードボタン */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 
              disabled:bg-gray-400 disabled:cursor-not-allowed
              text-white font-medium rounded-md transition-colors duration-200"
          >
            {uploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                アップロード中...
              </span>
            ) : (
              'アップロード'
            )}
          </button>

          {/* エラー表示 */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-red-700 dark:text-red-300">❌ {error}</p>
            </div>
          )}

          {/* 成功結果表示 */}
          {result && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-md">
              <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">✅ アップロード成功!</h3>
              <div className="text-sm text-green-700 dark:text-green-400 space-y-1">
                <p><strong>保存ファイル名:</strong> {result.fileName}</p>
                <p><strong>元のファイル名:</strong> {result.originalName}</p>
                <p><strong>再生時間:</strong> {formatDuration(result.duration)}</p>
                <p><strong>メッセージ:</strong> {result.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* API情報 */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">📡 API情報</h2>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p><strong>エンドポイント:</strong> <code>/api/popyaba/mp3upload</code></p>
            <p><strong>メソッド:</strong> POST</p>
            <p><strong>対応形式:</strong> MP3ファイル (.mp3)</p>
            <p><strong>最大サイズ:</strong> 50MB</p>
            <p><strong>保存先:</strong> uploads-popyaba/mp3/</p>
            <p><strong>CORS許可:</strong> localhost:3000/3001, dev.popism.info, popism.info, 193.186.4.181</p>
          </div>
        </div>
      </div>
    </div>
  );
}