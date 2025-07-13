import React, { useState, useEffect } from "react";

const ServerStatus: React.FC = () => {
  const [serverLoad, setServerLoad] = useState<number>(0); // サーバー頑張り度 (0~1)
  const [storageUsage, setStorageUsage] = useState<number>(0); // サーバー容量使用率 (0~1)

  useEffect(() => {
    // サーバー頑張り度と容量使用率を取得
    const fetchServerStatus = async () => {
      try {
        // サーバー頑張り度を取得
        const overloadResponse = await fetch("/api/server-status/overload");
        if (overloadResponse.ok) {
          const overloadData = await overloadResponse.json();
          setServerLoad(overloadData.load); // サーバー頑張り度を設定
        } else {
          console.error("サーバー頑張り度の取得に失敗しました。");
        }

        // サーバー容量使用率を取得
        const usageResponse = await fetch("/api/server-status/usage");
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          setStorageUsage(usageData.usage); // サーバー容量使用率を設定
        } else {
          console.error("サーバー容量使用率の取得に失敗しました。");
        }
      } catch (error) {
        console.error("サーバーステータス取得エラー:", error);
      }
    };

    fetchServerStatus();
  }, []); // コンポーネントがマウントされたときに一度だけ実行

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 mb-6">
      <p className="text-base text-gray-700 mb-4">サーバーを壊さないように使ってください❗</p>

      {/* サーバー頑張り度ゲージ */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-1">サーバー頑張り度</p>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-red-500 h-3 rounded-full transition-all"
            style={{ width: `${serverLoad * 100}%` }}
          ></div>
        </div>
      </div>

      {/* サーバー容量ゲージ */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">サーバー容量使用率</p>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all"
            style={{ width: `${storageUsage * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ServerStatus;