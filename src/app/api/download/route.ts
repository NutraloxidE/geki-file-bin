import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

export async function GET(req: Request) {
  try {
    // クエリパラメータからタイムスタンプを取得
    const url = new URL(req.url);
    const timestamp = url.searchParams.get("timestamp");

    if (!timestamp) {
      return new Response(JSON.stringify({ error: "タイムスタンプが指定されていません。" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ZIPファイルのパスを構築
    const zipFilePath = path.join(UPLOAD_DIR, `${timestamp}.zip`);

    // ファイルが存在するか確認
    if (!fs.existsSync(zipFilePath)) {
      return new Response(JSON.stringify({ error: "指定されたファイルが見つかりません。" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ファイルを読み込んでレスポンスとして返す
    const fileStream = fs.createReadStream(zipFilePath);

    // Web標準のReadableStreamを手動で生成
    const readableStream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      },
    });

    return new Response(readableStream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${timestamp}.zip"`,
      },
    });
  } catch (error) {
    console.error("ダウンロードエラー:", error);
    return new Response(JSON.stringify({ error: "サーバーエラーが発生しました。" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}