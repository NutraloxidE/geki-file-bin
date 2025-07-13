"use client";

import { useState } from "react";
import HamburgerMenu from "../../components/HamburgerMenu";
import Image from "next/image";


export default function GekiyabaGekiKawaPage() {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = () => {
    setIsPressed(true);
    const audio = new Audio("/GekiyabaLoungeWEB.mp3"); // 再生する音声ファイルのパス
    audio.play();
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      {/* ハンバーガーメニュー */}
      <HamburgerMenu />

      <button
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className={`focus:outline-none transition-transform ${
          isPressed ? "scale-90" : "scale-100"
        }`}
      >
        <Image
          src="/gekiyabagekikawalogo_4.png"
          alt="Gekiyaba GekiKawa Logo"
          width={400}
          height={400}
          className="w-full h-auto max-w-md"
        />
      </button>
    </div>
  );
}