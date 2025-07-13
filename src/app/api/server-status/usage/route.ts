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

function updateCache() {
  try {
    const UPLOAD_DIR = resolve(process.cwd(), "uploads");

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
      mkdirSync(TEMP_DIR, { recursive: true });
    }
    writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
  } catch (error) {
    console.error("キャッシュ更新エラー:", error);
  }
}

export async function GET() {
  try {
    // キャッシュが存在する場合は即座に返す
    if (existsSync(CACHE_FILE)) {
      const cacheData = JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
      const cacheTimestamp = new Date(cacheData.timestamp).getTime();
      const now = Date.now();

      // キャッシュが有効期限内の場合はそのまま返す
      if (now - cacheTimestamp < CACHE_DURATION) {
        return new Response(JSON.stringify({ usage: cacheData.usage }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // キャッシュが古い場合は古い値を返しつつバックグラウンドで更新
    if (existsSync(CACHE_FILE)) {
      const cacheData = JSON.parse(readFileSync(CACHE_FILE, "utf-8"));

      // バックグラウンドでキャッシュを更新
      setTimeout(updateCache, 0);

      return new Response(JSON.stringify({ usage: cacheData.usage }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // キャッシュが存在しない場合はデフォルト値を返しつつバックグラウンドで更新
    setTimeout(updateCache, 0);

    return new Response(JSON.stringify({ usage: 0 }), {
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