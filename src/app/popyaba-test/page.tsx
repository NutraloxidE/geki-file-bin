"use client";

import { useState, useEffect } from 'react';

interface Mp3Item {
  fileName: string;
  originalName: string;
  duration: number;
  uploadDate: string;
}

interface UploadResult {
  success: boolean;
  fileName: string;
  originalName: string;
  duration: number;
  message: string;
}

export default function PopyabaTestPage() {
  // 認証関連のstate
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  // 既存のstate
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string>('');
  const [mp3List, setMp3List] = useState<Mp3Item[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // 正しいパスワード（本番環境では環境変数等を使用）
  const ADMIN_PASSWORD = 'nohack1337'; // ここを適切なパスワードに変更

  // ページ読み込み時に認証状態をチェック
  useEffect(() => {
    const savedAuth = localStorage.getItem('popyaba-auth');
    if (savedAuth === 'authenticated') {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  // パスワード認証
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError('');
      localStorage.setItem('popyaba-auth', 'authenticated');
    } else {
      setAuthError('パスワードが間違っています');
      setPassword('');
    }
  };

  // ログアウト
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    localStorage.removeItem('popyaba-auth');
  };

  // ファイル一覧を取得
  const fetchMp3List = async () => {
    setLoadingList(true);
    try {
      const response = await fetch('/api/popyaba/mp3getlist');
      const data = await response.json();
      if (data.success) {
        setMp3List(data.data);
      }
    } catch (error) {
      console.error('ファイル一覧取得エラー:', error);
    } finally {
      setLoadingList(false);
    }
  };

  // ファイル削除
  const handleDeleteFile = async (fileName: string) => {
    if (!confirm(`ファイル "${fileName}" を削除しますか？`)) {
      return;
    }

    setDeleting(fileName);
    try {
      const response = await fetch(`/api/popyaba/mp3deletebyname?fileName=${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        fetchMp3List();
      } else {
        setError(data.error || 'ファイル削除に失敗しました');
      }
    } catch (error) {
      setError('ファイル削除中にエラーが発生しました');
      console.error('Delete error:', error);
    } finally {
      setDeleting(null);
    }
  };

  // 認証済みの場合のみファイル一覧を取得
  useEffect(() => {
    if (isAuthenticated) {
      fetchMp3List();
    }
  }, [isAuthenticated]);

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
        fetchMp3List();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  // 認証状態をチェック中
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 未認証の場合はログイン画面を表示
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              🔒 Popyaba 管理画面
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              管理者パスワードを入力してください
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                  rounded-md shadow-sm bg-white dark:bg-gray-700 
                  text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="パスワードを入力"
                required
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-red-700 dark:text-red-300 text-sm">❌ {authError}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 
                text-white font-medium rounded-md transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              ログイン
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              このページは管理者専用です
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 認証済みの場合は元のページを表示
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダーにログアウトボタンを追加 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            🎵 Popyaba MP3アップロードテスト
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-md transition-colors"
          >
            🔓 ログアウト
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* アップロード部分 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">📤 ファイルアップロード</h2>
            
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

          {/* ファイル一覧部分 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">📁 アップロード済みファイル</h2>
              <button
                onClick={fetchMp3List}
                disabled={loadingList}
                className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-md transition-colors"
              >
                {loadingList ? '更新中...' : '更新'}
              </button>
            </div>

            {loadingList ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">読み込み中...</p>
              </div>
            ) : mp3List.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>アップロードされたファイルはありません</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mp3List.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {item.originalName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDuration(item.duration)} | {formatDate(item.uploadDate)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        {item.fileName}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteFile(item.fileName)}
                      disabled={deleting === item.fileName}
                      className="ml-3 px-3 py-1 bg-red-500 hover:bg-red-600 
                        disabled:bg-red-300 disabled:cursor-not-allowed
                        text-white text-sm rounded-md transition-colors"
                    >
                      {deleting === item.fileName ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          削除中
                        </span>
                      ) : (
                        '🗑️ 削除'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}