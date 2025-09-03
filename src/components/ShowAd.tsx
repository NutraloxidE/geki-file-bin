import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function ShowAd() {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [comment, setComment] = useState<string>("");

  useEffect(() => {
    fetch("/api/ads/getadimage")
      .then(async res => {
        if (!res.ok) throw new Error("画像取得失敗");
        const blob = await res.blob();
        setImgUrl(URL.createObjectURL(blob));
        const adLink = res.headers.get("X-Ad-Link");
        setLink(adLink && adLink !== "" ? adLink : null);
        const adComment = res.headers.get("X-Ad-Comment");
        setComment(adComment ? decodeURIComponent(adComment) : "");
      })
      .catch(err => {
        console.error("広告取得エラー:", err);
        setImgUrl(null);
        setLink(null);
        setComment("");
      });
  }, []);

  if (!imgUrl) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
      <div style={{
        width: 48,
        height: 48,
        border: "6px solid #ddd",
        borderTop: "6px solid #3b82f6",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }} />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}</style>
    </div>
  );

  const img = (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "300px",
        maxWidth: "600px",
        transition: "transform 0.3s cubic-bezier(.4,2,.3,1)",
      }}
      className="ad-image-hover"
    >
      {/* 背景の半透明四角 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(59,130,246,0.10)", // 青系の半透明
          borderRadius: "4px",
          zIndex: 1,
        }}
      />
      {/* 右上ラベル */}
      <div
        style={{
          position: "absolute",
          top: "5px",
          right: "5px",
          background: "rgba(59, 131, 246, 0.53)",
          color: "#fff",
          padding: "2px 8px",
          borderRadius: "4px",
          fontWeight: "bold",
          fontSize: "0.75rem", // 文字を小さく
          zIndex: 5,
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          letterSpacing: "0.05em"
        }}
      >
        広告❗😁👊💥
      </div>
        {comment && (
            <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: "100%",
              background: "rgba(72, 80, 107, 0.56)",
              color: "#fff",
              padding: "8px 16px",
              fontSize: "0.95rem",
              fontWeight: "bold",
              borderBottomLeftRadius: "4px",
              borderBottomRightRadius: "4px",
              zIndex: 6,
              textAlign: "center",
              boxShadow: "0 -2px 12px rgba(0,0,0,0.12)",
              textShadow: "0 4px 12px rgba(0,0,0,0.35)", // 文字に影を大きく
            }}
            >
            {comment}
            </div>
        )}
        <Image
          src={imgUrl}
          alt="広告画像"
          fill
          style={{
            objectFit: "contain",
            cursor: link ? "pointer" : "default",
            zIndex: 3,
          }}
          unoptimized
        />
      <style>{`
        .ad-image-hover:hover {
          transform: scale(1.08);
          z-index: 2;
        }
      `}</style>
    </div>
  );

  return link
    ? <a href={link} target="_blank" rel="noopener noreferrer">{img}</a>
    : img;
}