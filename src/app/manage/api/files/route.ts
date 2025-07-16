import fs from "fs/promises";
import path from "path";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export async function GET(req: NextRequest) {
  try {
    // AuthorizationヘッダーからJWTを取得
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "認証トークンが必要です。" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    // JWTを検証
    try {
      jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { success: false, message: "無効なトークンです。" },
        { status: 401 }
      );
    }

    // ペジネーションのクエリパラメータを取得
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // アップロードディレクトリ内のファイルを取得
    const files = await fs.readdir(UPLOAD_DIR);

    // JSONファイルを読み込み、メタデータを取得
    const fileList = await Promise.all(
      files
        .filter((file) => file.endsWith(".json"))
        .map(async (file) => {
          const filePath = path.join(UPLOAD_DIR, file);
          const metadata = JSON.parse(await fs.readFile(filePath, "utf-8"));

          // ZIPファイルの中身を取得
          const zipFilePath = path.join(UPLOAD_DIR, file.replace(".json", ".zip"));
          let zipContents: string[] = [];
          if (await fileExists(zipFilePath)) {
            const zip = new AdmZip(zipFilePath);
            zipContents = zip.getEntries().map((entry) => entry.entryName);
          }

          return {
            id: file.replace(".json", ""),
            ...metadata,
            contents: zipContents, // ZIPファイルの中身を追加
          };
        })
    );

    // ペジネーション処理
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedFiles = fileList.slice(startIndex, endIndex);

    return NextResponse.json(
      {
        success: true,
        files: paginatedFiles,
        total: fileList.length,
        page,
        limit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ファイルリスト取得エラー:", error);
    return NextResponse.json(
      { success: false, message: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}

// ファイルが存在するか確認するヘルパー関数
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}