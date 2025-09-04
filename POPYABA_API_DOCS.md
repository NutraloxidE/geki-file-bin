# Popyaba MP3管理システム API仕様書

## 概要
PopyabaはMP3ファイルのアップロード、管理、削除を行うWebAPIシステムです。管理者認証機能付きのWebインターフェースも提供します。

## 基本情報
- **ベースURL**: `http://localhost:3000/api/popyaba`
- **認証**: パスワード認証（フロントエンド）
- **CORS**: 指定オリジンのみ許可
- **ファイル形式**: MP3のみ対応
- **最大ファイルサイズ**: 50MB

---

## 🔐 認証・セキュリティ

### 許可されたオリジン
```
http://localhost:3000
http://localhost:3001
https://dev.popism.info
https://popism.info
http://193.186.4.181
https://193.186.4.181
```

### フロントエンド認証
- **パスワード**: `popyaba2024`
- **セッション**: localStorage使用
- **認証キー**: `popyaba-auth`

---

## 📤 1. MP3ファイルアップロード

### エンドポイント
```
POST /api/popyaba/mp3upload
```

### リクエスト
```typescript
Content-Type: multipart/form-data

FormData:
  file: File (MP3ファイル)
```

### レスポンス
```json
{
  "success": true,
  "fileName": "My_Song_1699123456789.mp3",
  "originalName": "My Song.mp3",
  "duration": 180,
  "message": "MP3ファイルが正常にアップロードされました"
}
```

### 使用例

#### JavaScript
```javascript
const formData = new FormData();
formData.append('file', mp3File);

const response = await fetch('/api/popyaba/mp3upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

#### cURL
```bash
curl -X POST \
  -F "file=@/path/to/song.mp3" \
  http://localhost:3000/api/popyaba/mp3upload
```

### エラーレスポンス
```json
{
  "error": "MP3ファイルのみアップロード可能です"
}
```

### 制限事項
- MP3ファイルのみ対応
- 最大ファイルサイズ: 50MB
- ファイル名のスペースは自動的にアンダースコアに変換
- タイムスタンプが自動追加される

---

## 📁 2. MP3ファイル一覧取得

### エンドポイント
```
GET /api/popyaba/mp3getlist
```

### クエリパラメータ
| パラメータ | 型 | 説明 | 例 |
|-----------|---|------|---|
| `minDuration` | number | 最小再生時間（秒） | `120` |
| `maxDuration` | number | 最大再生時間（秒） | `300` |
| `sortBy` | string | ソート項目 | `uploadDate`, `duration`, `originalName` |
| `sortOrder` | string | ソート順 | `asc`, `desc` |
| `limit` | number | 取得件数制限 | `10` |
| `offset` | number | 取得開始位置 | `0` |

### レスポンス
```json
{
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
}
```

### 使用例

#### 基本取得
```javascript
const response = await fetch('/api/popyaba/mp3getlist');
const result = await response.json();
```

#### フィルタリング
```javascript
// 3分以上の曲を再生時間順で取得
const response = await fetch(
  '/api/popyaba/mp3getlist?minDuration=180&sortBy=duration&sortOrder=asc'
);
```

#### ページネーション
```javascript
// 10件ずつ取得（2ページ目）
const response = await fetch(
  '/api/popyaba/mp3getlist?limit=10&offset=10'
);
```

#### cURL
```bash
# 全件取得
curl "http://localhost:3000/api/popyaba/mp3getlist"

# 2-5分の曲のみ、最新順で10件
curl "http://localhost:3000/api/popyaba/mp3getlist?minDuration=120&maxDuration=300&limit=10"
```

---

## 🗑️ 3. MP3ファイル削除

### エンドポイント
```
DELETE /api/popyaba/mp3deletebyname
```

### リクエスト方法

#### 方法1: クエリパラメータ
```
DELETE /api/popyaba/mp3deletebyname?fileName=My_Song_1699123456789.mp3
```

#### 方法2: JSONボディ
```typescript
Content-Type: application/json

{
  "fileName": "My_Song_1699123456789.mp3"
}
```

### レスポンス
```json
{
  "success": true,
  "message": "MP3ファイルが正常に削除されました",
  "deletedFile": {
    "fileName": "My_Song_1699123456789.mp3",
    "originalName": "My Song.mp3",
    "duration": 180,
    "uploadDate": "2023-11-04T12:30:56.789Z"
  },
  "remainingCount": 0
}
```

### 使用例

#### JavaScript（クエリパラメータ）
```javascript
const fileName = 'My_Song_1699123456789.mp3';
const response = await fetch(
  `/api/popyaba/mp3deletebyname?fileName=${encodeURIComponent(fileName)}`,
  { method: 'DELETE' }
);

const result = await response.json();
```

#### JavaScript（JSON）
```javascript
const response = await fetch('/api/popyaba/mp3deletebyname', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fileName: 'My_Song_1699123456789.mp3'
  })
});
```

#### cURL
```bash
curl -X DELETE \
  "http://localhost:3000/api/popyaba/mp3deletebyname?fileName=My_Song_1699123456789.mp3"
```

### エラーレスポンス
```json
{
  "success": false,
  "error": "ファイルが見つかりません",
  "fileName": "nonexistent.mp3"
}
```

---

## 🖥️ 4. 管理画面

### URL
```
http://localhost:3000/popyaba-test
```

### 機能
- **パスワード認証**: `popyaba2024`
- **ファイルアップロード**: ドラッグ&ドロップ対応
- **ファイル一覧表示**: リアルタイム更新
- **ファイル削除**: ワンクリック削除
- **セッション管理**: ログイン状態保持

### 認証フロー
1. パスワード入力画面表示
2. `popyaba2024` 入力でログイン
3. 認証状態をlocalStorageに保存
4. 管理画面へリダイレクト
5. ログアウトボタンで認証解除

---

## 📊 5. データ構造

### Mp3Item
```typescript
interface Mp3Item {
  fileName: string;        // 保存ファイル名（タイムスタンプ付き）
  originalName: string;    // 元のファイル名
  duration: number;        // 再生時間（秒）
  uploadDate: string;      // アップロード日時（ISO形式）
}
```

### ファイル保存場所
```
プロジェクトルート/
├── uploads-popyaba/
│   └── mp3/
│       ├── mp3list.json    # ファイル一覧JSON
│       ├── Song_1699123456789.mp3
│       └── Music_1699123456790.mp3
```

---

## ⚠️ 6. セキュリティ考慮事項

### 現在の脆弱性
1. **認証不足**: APIに直接認証がない
2. **CORS回避可能**: originヘッダーなしでアクセス可能
3. **Rate Limiting未実装**: 大量リクエスト可能
4. **タイミング攻撃**: レスポンス時間でファイル存在を推測可能

### 推奨セキュリティ対策
```typescript
// 1. 厳格なCORSチェック
if (!origin || !allowedOrigins.includes(origin)) {
  return new NextResponse('CORS policy violation', { status: 403 });
}

// 2. Rate Limiting
const rateLimit = await checkRateLimit(clientIP, 'upload', 10, 3600);
if (!rateLimit.allowed) {
  return new NextResponse('Too Many Requests', { status: 429 });
}

// 3. API Key認証
const apiKey = request.headers.get('x-api-key');
if (!apiKey || apiKey !== process.env.POPYABA_API_KEY) {
  return new NextResponse('Unauthorized', { status: 401 });
}
```

---

## 🚀 7. 開発・デプロイ

### 開発環境起動
```bash
npm run dev
```

### 環境変数設定
```env
POPYABA_API_KEY=your-secret-key
ADMIN_PASSWORD=your-admin-password
```

### 本番環境での注意点
1. パスワードを環境変数に移行
2. HTTPS必須
3. Rate Limiting実装
4. ログ監視設定
5. ファイルサイズ監視

---

## 📝 8. エラーコード一覧

| コード | 説明 | 対処法 |
|--------|------|--------|
| 400 | 不正なリクエスト | パラメータを確認 |
| 401 | 認証失敗 | API Keyを確認 |
| 403 | CORS違反 | オリジンを確認 |
| 404 | ファイル未発見 | ファイル名を確認 |
| 405 | メソッド不許可 | HTTPメソッドを確認 |
| 413 | ファイルサイズ超過 | 50MB以下にする |
| 429 | リクエスト過多 | しばらく待つ |
| 500 | サーバーエラー | ログを確認 |

---

## 📞 9. サポート

### トラブルシューティング
1. **アップロード失敗**: ファイル形式とサイズを確認
2. **削除失敗**: ファイル名の正確性を確認
3. **CORS エラー**: オリジンの許可設定を確認
4. **認証失敗**: パスワードとセッション状態を確認

### ログ確認
```bash
# サーバーログ
npm run dev

# ブラウザコンソール
F12 → Console
```

## 🔧 10. 実装詳細

### ファイル命名規則
- 元のファイル名のスペースはアンダースコアに自動変換
- ファイル名の末尾にタイムスタンプが自動追加
- 例: `My Song.mp3` → `My_Song_1699123456789.mp3`

### メタデータ取得
- `music-metadata` ライブラリを使用してMP3の再生時間を取得
- 取得に失敗した場合は0秒として処理

### CORS設定
- プリフライトリクエスト（OPTIONS）に対応
- レスポンスヘッダーに適切なCORS設定を追加
- `Access-Control-Allow-Credentials: true` を設定

### エラーハンドリング
- すべてのAPIエンドポイントで統一されたエラーレスポンス形式
- ファイルシステムエラーの適切な処理
- JSON解析エラーの考慮

この仕様書により、Popyaba MP3管理システムを安全かつ効率的に利用できます。
