"use client";

import { useState, useEffect } from 'react';

interface Mp3Item {
  fileName: string;
  originalName: string;
  duration: number;
  uploadDate: string;
}

export default function PopyabaTestPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [mp3List, setMp3List] = useState<Mp3Item[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

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
        // ファイル一覧を再取得
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

  // コンポーネント初期化時にファイル一覧を取得
  useEffect(() => {
    fetchMp3List();
  }, []);

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
        // アップロード成功後にファイル一覧を再取得
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
          🎵 Popyaba MP3アップロードテスト
        </h1>

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

        {/* API情報 */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">📡 API仕様・使用方法</h2>
          
          <div className="space-y-6">
            {/* MP3アップロードAPI */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">1. MP3ファイルアップロード</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <p className="text-sm mb-2"><strong>エンドポイント:</strong> <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">/api/popyaba/mp3upload</code></p>
                <p className="text-sm mb-2"><strong>メソッド:</strong> POST</p>
                <p className="text-sm mb-2"><strong>Content-Type:</strong> multipart/form-data</p>
                <p className="text-sm mb-4"><strong>パラメータ:</strong> file (MP3ファイル)</p>
                
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">JavaScript例:</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`const formData = new FormData();
formData.append('file', mp3File);

const response = await fetch('/api/popyaba/mp3upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);`}
                  </pre>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">cURL例:</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`curl -X POST \\
  -F "file=@/path/to/your/song.mp3" \\
  http://localhost:3000/api/popyaba/mp3upload`}
                  </pre>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">レスポンス例:</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "fileName": "My_Song_1699123456789.mp3",
  "originalName": "My Song.mp3",
  "duration": 180,
  "message": "MP3ファイルが正常にアップロードされました"
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* MP3リスト取得API */}
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">2. MP3ファイル一覧取得</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <p className="text-sm mb-2"><strong>エンドポイント:</strong> <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">/api/popyaba/mp3getlist</code></p>
                <p className="text-sm mb-2"><strong>メソッド:</strong> GET</p>
                <p className="text-sm mb-4"><strong>クエリパラメータ:</strong></p>
                
                <div className="mb-4 ml-4">
                  <ul className="text-sm space-y-1 list-disc">
                    <li><code>minDuration</code> - 最小再生時間（秒）</li>
                    <li><code>maxDuration</code> - 最大再生時間（秒）</li>
                    <li><code>sortBy</code> - ソート項目 (uploadDate | duration | originalName)</li>
                    <li><code>sortOrder</code> - ソート順 (asc | desc)</li>
                    <li><code>limit</code> - 取得件数制限</li>
                    <li><code>offset</code> - 取得開始位置</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">JavaScript例:</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`// 基本的な取得
const response = await fetch('/api/popyaba/mp3getlist');

// フィルタリング付き取得（3分以上の曲、再生時間順）
const response = await fetch(
  '/api/popyaba/mp3getlist?minDuration=180&sortBy=duration&sortOrder=asc'
);

const result = await response.json();`}
                  </pre>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">cURL例:</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`# 全件取得
curl http://localhost:3000/api/popyaba/mp3getlist

# 2-5分の曲のみ、最新順で10件
curl "http://localhost:3000/api/popyaba/mp3getlist?minDuration=120&maxDuration=300&limit=10"`}
                  </pre>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">レスポンス例:</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "data": [
    {
      "fileName": "My_Song_1699123456789.mp3",
      "originalName": "My Song.mp3",
      "duration": 180,
      "uploadDate": "2023-11-04T12:30:56.789Z"
    }
  ],
  "total": 1,
  "returned": 1,
  "filters": {
    "minDuration": null,
    "maxDuration": null,
    "sortBy": "uploadDate",
    "sortOrder": "desc",
    "limit": null,
    "offset": 0
  }
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* MP3削除API */}
            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">3. MP3ファイル削除</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <p className="text-sm mb-2"><strong>エンドポイント:</strong> <code className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">/api/popyaba/mp3deletebyname</code></p>
                <p className="text-sm mb-2"><strong>メソッド:</strong> DELETE</p>
                <p className="text-sm mb-4"><strong>パラメータ:</strong> fileName (クエリまたはJSON)</p>
                
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">JavaScript例（クエリパラメータ）:</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`const fileName = 'My_Song_1699123456789.mp3';
const response = await fetch(
  \`/api/popyaba/mp3deletebyname?fileName=\${encodeURIComponent(fileName)}\`,
  { method: 'DELETE' }
);

const result = await response.json();`}
                  </pre>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">JavaScript例（JSON）:</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`const response = await fetch('/api/popyaba/mp3deletebyname', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: 'My_Song_1699123456789.mp3'
  })
});`}
                  </pre>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">cURL例:</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`curl -X DELETE \\
  "http://localhost:3000/api/popyaba/mp3deletebyname?fileName=My_Song_1699123456789.mp3"`}
                  </pre>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">レスポンス例:</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "message": "MP3ファイルが正常に削除されました",
  "deletedFile": {
    "fileName": "My_Song_1699123456789.mp3",
    "originalName": "My Song.mp3",
    "duration": 180,
    "uploadDate": "2023-11-04T12:30:56.789Z"
  },
  "remainingCount": 0
}`}
                  </pre>
                </div>
              </div>
            </div>

            {/* CORS設定 */}
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">4. CORS設定</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <p className="text-sm mb-2"><strong>許可されたオリジン:</strong></p>
                <ul className="text-sm space-y-1 list-disc ml-4 mb-4">
                  <li>http://localhost:3000</li>
                  <li>http://localhost:3001</li>
                  <li>https://dev.popism.info</li>
                  <li>https://popism.info</li>
                  <li>http://193.186.4.181</li>
                  <li>https://193.186.4.181</li>
                </ul>
                <p className="text-sm"><strong>制限事項:</strong></p>
                <ul className="text-sm space-y-1 list-disc ml-4">
                  <li>最大ファイルサイズ: 50MB</li>
                  <li>対応形式: MP3ファイルのみ</li>
                  <li>ファイル名のスペースは自動的にアンダースコアに変換</li>
                  <li>同名ファイルは日時スタンプで区別</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}