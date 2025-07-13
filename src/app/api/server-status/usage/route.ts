import { statSync, readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, join } from "path";

const TEMP_DIR = resolve(process.cwd(), "temp");
const CACHE_FILE = join(TEMP_DIR, "folder_usage.json");
const MAX_CAPACITY = 90 * 1024 * 1024 * 1024; // 90GB in bytes
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

function getFolderSize(folderPath: string): number {
  let totalSize = 0;

  const files = readdirSync(folderPath, { withFileTypes: true });

  for (const file of files) {
    const filePath = join(folderPath, file.name);

    if (!file.isDirectory()) {
      // ファイルの場合、サイズを加算
      totalSize += statSync(filePath).size;
    }
  }

  return totalSize;
}

export async function GET() {
  try {
    // 保存ディレクトリのパス
    const UPLOAD_DIR = resolve(process.cwd(), "uploads");

    // キャッシュが存在し、10分以内であればキャッシュを利用
    if (existsSync(CACHE_FILE)) {
      const cacheData = JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
      const cacheTimestamp = new Date(cacheData.timestamp).getTime();
      const now = Date.now();

      if (now - cacheTimestamp < CACHE_DURATION) {
        return new Response(JSON.stringify({ usage: cacheData.usage }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // フォルダーの総容量を取得
    const folderSize = getFolderSize(UPLOAD_DIR);

    // 使用率を計算 (0 ~ 1)
    const usage = folderSize / MAX_CAPACITY;

    // キャッシュを保存
    const cacheData = {
      usage,
      timestamp: new Date().toISOString(),
    };

    if (!existsSync(TEMP_DIR)) {
      // tempディレクトリが存在しない場合は作成
      mkdirSync(TEMP_DIR, { recursive: true });
    }
    writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));

    // JSONレスポンスを返す
    return new Response(JSON.stringify({ usage }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("フォルダー容量取得エラー:", error);
    return new Response(JSON.stringify({ error: "フォルダー容量を取得できませんでした。" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}