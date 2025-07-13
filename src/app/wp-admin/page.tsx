"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function WpAdminPage() {
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const router = useRouter();

  useEffect(() => {
    // ウィンドウサイズを取得
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateWindowSize(); // 初期化
    window.addEventListener("resize", updateWindowSize);

    return () => window.removeEventListener("resize", updateWindowSize);
  }, []);

  useEffect(() => {
    // IPアドレスを取得
    fetch("https://api.ipify.org?format=json")
      .then((response) => response.json())
      .then((data) => setIpAddress(data.ip))
      .catch((error) => console.error("IPアドレスの取得に失敗しました:", error));

    // 3秒後にホームページにリダイレクト
    const timeout = setTimeout(() => {
      router.push("/");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="container">
      {/* 背景のグラデーション */}
      <div
        className="background"
        style={{
          width: `${windowSize.width}px`,
          height: `${windowSize.height}px`,
        }}
      ></div>

      {/* コンテンツ */}
      <div className="content">
        <h1 className="title">ハッキングしようとするのやめてください❗😡👊💥</h1>
        <p className="ip">
          あなたのIPアドレス: <span>{ipAddress || "取得中..."}</span>
        </p>
        <p className="redirect">このページは存在しません。3秒後にホームに戻ります。</p>
      </div>

      <style jsx>{`
        .container {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: black;
          color: white;
          overflow: hidden;
        }

        .background {
          position: absolute;
          top: 0;
          left: 0;
          background: linear-gradient(90deg, red, yellow, blue);
          animation: hue-rotate 0.5s linear infinite;
          z-index: 0;
        }

        .content {
          position: relative;
          z-index: 1;
          text-align: center;
        }

        .title {
          font-size: 2rem;
          font-weight: bold;
          color: red;
          animation: pulse 1s infinite;
        }

        .ip {
          font-size: 1.25rem;
          margin-bottom: 1rem;
        }

        .ip span {
          color: yellow;
          font-family: monospace;
        }

        .redirect {
          font-size: 1.25rem;
          animation: bounce 1s infinite;
        }

        @keyframes hue-rotate {
          0% {
            filter: hue-rotate(0deg);
          }
          100% {
            filter: hue-rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}