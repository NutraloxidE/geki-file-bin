import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";

const ADMIN_ID = process.env.ADMIN_ID;
const ADMIN_AUTHENTICATOR_SETUP_KEY = process.env.ADMIN_AUTHENTICATOR_SETUP_KEY;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export async function POST(req: NextRequest) {
  try {
    const { id, token } = await req.json();

    // IDが一致するか確認
    if (id !== ADMIN_ID) {
      return NextResponse.json(
        { success: false, message: "IDが一致しません。" },
        { status: 403 }
      );
    }

    // 認証コードを検証
    const isValid = speakeasy.totp.verify({
      secret: ADMIN_AUTHENTICATOR_SETUP_KEY || "",
      encoding: "base32",
      token,
      window: 1, // 時間の許容範囲
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "認証コードが無効です。" },
        { status: 403 }
      );
    }

    // JWTを生成
    const jwtToken = jwt.sign({ id }, JWT_SECRET, { expiresIn: "1h" });

    // 認証成功
    return NextResponse.json({ success: true, token: jwtToken });
  } catch (error) {
    console.error("エラー:", error);
    return NextResponse.json(
      { success: false, message: "サーバーエラーが発生しました。" },
      { status: 500 }
    );
  }
}