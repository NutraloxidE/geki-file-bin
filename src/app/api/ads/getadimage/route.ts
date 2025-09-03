import fs from "fs";
import path from "path";

const ADS_DIR = path.resolve(process.cwd(), "uploads-ads");

export async function GET(req: Request) {
  try {
    // クエリパラメータからファイル名を取得（なければランダム）
    const url = new URL(req.url);
    let filename = url.searchParams.get("filename");

    const files = fs.readdirSync(ADS_DIR);
    const images = files.filter(f => /\.(jpg|jpeg|png|gif)$/i.test(f));
    if (images.length === 0) {
      return new Response(JSON.stringify({ error: "画像がありません" }), { status: 404 });
    }

    if (!filename || !images.includes(filename)) {
      filename = images[Math.floor(Math.random() * images.length)];
    }

    const imagePath = path.join(ADS_DIR, filename);
    if (!fs.existsSync(imagePath)) {
      return new Response(JSON.stringify({ error: "画像が見つかりません" }), { status: 404 });
    }

    // JSONファイルのリンク情報取得
    const jsonPath = path.join(ADS_DIR, filename.replace(/\.[^.]+$/, ".json"));
    let link = null;
    let comment = "";
    if (fs.existsSync(jsonPath)) {
      try {
        const json = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
        link = json.link ?? null;
        comment = json.comment ?? "";
      } catch {
        link = null;
        comment = "";
      }
    }

    // 画像ファイルをストリームで返す
    const fileStream = fs.createReadStream(imagePath);
    const readableStream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      },
    });

    // Content-Type判定
    const ext = path.extname(filename).toLowerCase();
    const mime =
      ext === ".jpg" || ext === ".jpeg" ? "image/jpeg"
      : ext === ".png" ? "image/png"
      : ext === ".gif" ? "image/gif"
      : "application/octet-stream";

    // link情報はヘッダーで返す
    return new Response(readableStream, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "X-Ad-Link": link ?? "",
        "X-Ad-Comment": encodeURIComponent(comment), // ← ここ
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("広告画像取得エラー:", error);
    return new Response(JSON.stringify({ error: "サーバーエラー" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}