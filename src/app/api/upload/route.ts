import fs from "fs";
import path from "path";
import { pipeline } from "stream";
import { promisify } from "util";
import { Readable } from "stream";
import { ReadableStream as NodeReadableStream } from "stream/web"; // 追加

const pipelineAsync = promisify(pipeline);

// 保存先ディレクトリ
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

// ディレクトリが存在しない場合は作成
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  try {
    // タイムスタンプを生成
    const timestamp = Date.now().toString();
    const zipFileName = `${timestamp}.zip`;
    const jsonFileName = `${timestamp}.json`;

    // 保存期間を取得
    const expiry = req.headers.get("expiry");
    if (!expiry) {
      return new Response(JSON.stringify({ error: "保存期間が指定されていません。" }), {
        status: 400,
      });
    }

    // ZIPファイルの保存パス
    const zipFilePath = path.join(UPLOAD_DIR, zipFileName);

    // Web標準のReadableStreamをNode.jsのReadableに変換
    if (!req.body) {
      return new Response(JSON.stringify({ error: "リクエストボディが空です。" }), {
        status: 400,
      });
    }

    // 型アサーションを NodeReadableStream に変更
    const readableStream = Readable.fromWeb(req.body as NodeReadableStream);

    // ストリーミングでZIPファイルを保存
    const writeStream = fs.createWriteStream(zipFilePath);
    await pipelineAsync(readableStream, writeStream);

    // JSONファイルの内容を作成
    const metadata = {
      expiry,
      uploadedAt: new Date().toISOString(),
    };

    // JSONファイルを保存
    const jsonFilePath = path.join(UPLOAD_DIR, jsonFileName);
    fs.writeFileSync(jsonFilePath, JSON.stringify(metadata, null, 2));

    // ダウンロードリンクを生成
    const host = req.headers.get("host"); // リクエストヘッダーからホストを取得
    const protocol = req.headers.get("x-forwarded-proto") || "http"; // プロトコルを推測 (http/https)
    const downloadLink = `${protocol}://${host}/dl?id=${timestamp}`;

    // レスポンスを返す
    return new Response(JSON.stringify({ message: "アップロード成功", downloadLink }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("アップロードエラー:", error);
    return new Response(JSON.stringify({ error: "サーバーエラーが発生しました。" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}