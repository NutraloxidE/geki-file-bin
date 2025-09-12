"use client";

import { useState } from "react";
import HamburgerMenu from "../../../components/HamburgerMenu";
import ShowAd from "../../../components/ShowAd";

// ヨーロピアンルーレット（37区分）の正しい配列
// ルーレットホイールの時計回りの順番
const EUROPEAN_ROULETTE_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// 各番号の色を定義
const ROULETTE_COLORS: { [key: number]: 'red' | 'black' | 'green' } = {
  0: 'green',
  1: 'red', 2: 'black', 3: 'red', 4: 'black', 5: 'red', 6: 'black', 7: 'red', 8: 'black', 9: 'red',
  10: 'black', 11: 'black', 12: 'red', 13: 'black', 14: 'red', 15: 'black', 16: 'red', 17: 'black', 18: 'red',
  19: 'red', 20: 'black', 21: 'red', 22: 'black', 23: 'red', 24: 'black', 25: 'red', 26: 'black', 27: 'red',
  28: 'black', 29: 'black', 30: 'red', 31: 'black', 32: 'red', 33: 'black', 34: 'red', 35: 'black', 36: 'red'
};

// 色をCSSクラスに変換
const getColorClass = (color: 'red' | 'black' | 'green') => {
  switch (color) {
    case 'red': return '#dc2626'; // red-600
    case 'black': return '#1f2937'; // gray-800
    case 'green': return '#16a34a'; // green-600
    default: return '#6b7280'; // gray-500
  }
};

export default function Roulette() {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);

  // 角度に基づいて選ばれている番号を取得
  const getSelectedNumber = (currentRotation: number): number => {
    const segments = EUROPEAN_ROULETTE_ORDER.length; // 37
    const anglePerSegment = 360 / segments; // 約9.73度
    
    // 正規化された角度（0-360度の範囲に収める）
    const normalizedAngle = ((currentRotation % 360) + 360) % 360;
    
    // ポインターは上（12時方向）にあり、ルーレットが時計回りに回転
    // 最初のセグメント（0）は12時から始まる
    // セグメントインデックスを計算（時計回りなので逆向きに計算）
    const segmentIndex = Math.floor((360 - normalizedAngle) / anglePerSegment) % segments;
    
    // EUROPEAN_ROULETTE_ORDER配列から対応する番号を取得
    return EUROPEAN_ROULETTE_ORDER[segmentIndex];
  };

  // ルーレットスピン機能
  const spinRoulette = () => {
    if (spinning) return;
    
    setSpinning(true);
    setResult(null); // 結果をリセット
    const randomRotation = Math.random() * 360 + (2160); // 最低6回転 + ランダム（よりじらす）
    const finalRotation = rotation + randomRotation;
    setRotation(finalRotation);
    
    setTimeout(() => {
      setSpinning(false);
      // スピン終了時に結果を設定
      setResult(getSelectedNumber(finalRotation));
    }, 10000); 
  };

  // SVGでルーレットホイールを描画
  const renderRouletteWheel = () => {
    const centerX = 200;
    const centerY = 200;
    const radius = 180;
    const segments = EUROPEAN_ROULETTE_ORDER.length;
    const anglePerSegment = 360 / segments;

    return (
      <div className="relative">
        <svg width="400" height="400" className="mx-auto">
          {/* 外枠 */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius + 10}
            fill="#8B4513"
            stroke="#654321"
            strokeWidth="4"
          />
          
          {/* ルーレット区分 */}
          <g 
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transformOrigin: `${centerX}px ${centerY}px`,
              transition: spinning ? 'transform 10s cubic-bezier(0.33, 1, 0.68, 1)' : 'none'
            }}
          >
            {EUROPEAN_ROULETTE_ORDER.map((number, index) => {
              const startAngle = (index * anglePerSegment - 90) * (Math.PI / 180);
              const endAngle = ((index + 1) * anglePerSegment - 90) * (Math.PI / 180);
              
              const x1 = centerX + Math.cos(startAngle) * radius;
              const y1 = centerY + Math.sin(startAngle) * radius;
              const x2 = centerX + Math.cos(endAngle) * radius;
              const y2 = centerY + Math.sin(endAngle) * radius;
              
              const largeArcFlag = anglePerSegment <= 180 ? "0" : "1";
              
              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');

              // テキスト位置
              const textAngle = (index * anglePerSegment + anglePerSegment / 2 - 90) * (Math.PI / 180);
              const textX = centerX + Math.cos(textAngle) * (radius * 0.8);
              const textY = centerY + Math.sin(textAngle) * (radius * 0.8);
              
              // テキストの回転角度（数字が常に下向きになるように調整）
              const textRotation = index * anglePerSegment + anglePerSegment / 2;

              return (
                <g key={number}>
                  {/* セグメント */}
                  <path
                    d={pathData}
                    fill={getColorClass(ROULETTE_COLORS[number])}
                    stroke="white"
                    strokeWidth="2"
                  />
                  {/* 番号テキスト */}
                  <text
                    x={textX}
                    y={textY}
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                  >
                    {number}
                  </text>
                </g>
              );
            })}
          </g>
          
          {/* 中央の円 */}
          <circle
            cx={centerX}
            cy={centerY}
            r="20"
            fill="#8B4513"
            stroke="white"
            strokeWidth="2"
          />
          
          {/* ポインター（上側、中心向き） */}
          <polygon
            points={`${centerX},${centerY - radius + 5} ${centerX - 10},${centerY - radius - 15} ${centerX + 10},${centerY - radius - 15}`}
            fill="#FFD700"
            stroke="#FFA500"
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  };
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-8 relative"
      style={{
        background: "linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)",
        backgroundSize: "400% 400%",
        animation: "rainbow 8s ease infinite"
      }}
    >
      <style>
        {`
          @keyframes rainbow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
      <HamburgerMenu />

      {/* 両脇広告と中央コンテンツ */}
      <div className="w-full flex flex-row justify-center items-start">
        {/* 左広告 */}
        <div className="hidden lg:block mr-4" style={{ width: 320 }}>
          <ShowAd />
        </div>

        {/* 中央コンテンツ */}
        <div className="flex-1 max-w-3xl">
          <div className="text-center">
            <h1
              className="text-4xl font-bold text-gray-800 dark:text-white mb-8 animate-flash"
              style={{
              textShadow: "0 0 8px #fff, 0 0 16px #f00, 0 0 24px #0ff, 0 0 32px #ff0",
              background: "linear-gradient(90deg, #ff0000, #00ffea, #fff700, #ff0000)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              }}
            >
              ルーレットゲーム
            </h1>
            <style>
              {`
              @keyframes flash {
                0%, 100% { filter: brightness(1.5) drop-shadow(0 0 8px #fff); }
                20% { filter: brightness(2) drop-shadow(0 0 16px #f00); }
                40% { filter: brightness(2) drop-shadow(0 0 16px #0ff); }
                60% { filter: brightness(2) drop-shadow(0 0 16px #ff0); }
                80% { filter: brightness(2.5) drop-shadow(0 0 24px #fff); }
              }
              .animate-flash {
                animation: flash 1.2s infinite;
              }
              `}
            </style>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
                  ヨーロピアンルーレット
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  37区分（0-36）のヨーロピアンスタイルルーレットです
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  外れたらショットを飲んだりするのに使ってください❗🤩🍻🎰
                </p>
              </div>
              
              {/* 結果表示（常に枠を表示） */}
              <div className="mb-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-700 min-h-[120px] flex flex-col justify-center">
                
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  {spinning
                  ? "スピン中...🎰"
                  : result === null
                    ? "🎲"
                    : "結果🎯"}
                </h3>
                
                {result !== null ? (
                  <>
                    <div className="flex items-center justify-center space-x-4">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                        style={{ backgroundColor: getColorClass(ROULETTE_COLORS[result]) }}
                      >
                        {result}
                      </div>
                      <div className="text-lg text-gray-700 dark:text-gray-300">
                        色: <span className="font-semibold">
                          {ROULETTE_COLORS[result] === 'red' ? '赤' : 
                          ROULETTE_COLORS[result] === 'black' ? '黒' : '緑'}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center space-x-4">
                    {/* プレースホルダーの円（結果がない時も同じサイズを維持） */}
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-400 dark:border-gray-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-400 dark:text-gray-500 text-sm">?</span>
                    </div>
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      {spinning ? 'スピン中...' : 'スピンボタンを押してください'}
                    </div>
                  </div>
                )}
              </div>
              
              {/* ルーレットホイール */}
              <div className="mb-8">
                {renderRouletteWheel()}
              </div>
              
              <button 
                onClick={spinRoulette}
                disabled={spinning}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {spinning ? 'スピン中...' : 'スピン！'}
              </button>
            </div>
          </div>
        </div>

        {/* 右広告 */}
        <div className="hidden lg:block ml-4" style={{ width: 320 }}>
          <ShowAd />
        </div>
      </div>

      {/* スマホのみ表示の広告 */}
      <div className="mt-6 block lg:hidden mr-4" style={{ width: 300 }}>
        <ShowAd />
      </div>

    </div>
  );
}