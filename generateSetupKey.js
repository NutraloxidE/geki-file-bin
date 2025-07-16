import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import speakeasy from "speakeasy";
import dotenv from "dotenv";

// 現在のファイルのディレクトリを取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env.localをロード
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

/**
 * セットアップキーを生成し、.env.localに書き込む
 */
const generateSetupKey = () => {
  const secret = speakeasy.generateSecret({
    name: "YourAppName", // アプリ名を指定
  });

  const setupKey = secret.base32;

  // .env.localファイルのパス
  const envPath = path.resolve(__dirname, ".env.local");

  // .env.localにセットアップキーを追記
  const envContent = `ADMIN_AUTHENTICATOR_SETUP_KEY=${setupKey}\n`;

  try {
    if (fs.existsSync(envPath)) {
      // 既存の.env.localに追記
      fs.appendFileSync(envPath, envContent);
    } else {
      // 新規に.env.localを作成
      fs.writeFileSync(envPath, envContent);
    }
    console.log("セットアップキーが生成され、.env.localに保存されました:");
    console.log(`ADMIN_AUTHENTICATOR_SETUP_KEY=${setupKey}`);
  } catch (error) {
    console.error(".env.localの書き込み中にエラーが発生しました:", error);
  }
};

generateSetupKey();