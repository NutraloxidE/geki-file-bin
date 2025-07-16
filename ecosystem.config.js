const dotenv = require("dotenv"); // dotenvをrequireでインポート
dotenv.config({ path: ".env.local" }); // .env.local を読み込む

module.exports = {
  apps: [
    {
      name: "geki-file-bin", // アプリケーション名
      script: "npm", // 実行するコマンド
      args: "start", // npm start を実行
      env: {
        NODE_ENV: "production",
        ADMIN_ID: process.env.ADMIN_ID, // .env.local から読み込む
        JWT_SECRET: process.env.JWT_SECRET, // .env.local から読み込む
        ADMIN_AUTHENTICATOR_SETUP_KEY: process.env.ADMIN_AUTHENTICATOR_SETUP_KEY, // .env.local から読み込む
      },
    },
  ],
};