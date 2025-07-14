import React, { useState, useEffect } from "react";

const ServerStatus: React.FC = () => {
  const [serverLoad, setServerLoad] = useState<number>(0); // サーバー頑張り度 (0~1)
  const [storageUsage, setStorageUsage] = useState<number>(0); // サーバー容量使用率 (0~1)

  useEffect(() => {
    const fetchServerStatus = async () => {
      try {
        const overloadResponse = await fetch("/api/server-status/overload");
        if (overloadResponse.ok) {
          const overloadData = await overloadResponse.json();
          setServerLoad(overloadData.load);
        } else {
          console.error("サーバー頑張り度の取得に失敗しました。");
        }

        const usageResponse = await fetch("/api/server-status/usage");
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          setStorageUsage(usageData.usage);
        } else {
          console.error("サーバー容量使用率の取得に失敗しました。");
        }
      } catch (error) {
        console.error("サーバーステータス取得エラー:", error);
      }
    };

    fetchServerStatus();
  }, []);

  return (
    <div className="w-full max-w-md bg-white rounded-sm shadow-md p-6 mb-6">
      <p className="text-base text-center text-gray-700 mb-2">サーバーを壊さないように使ってください❗</p>

      {/* サーバー頑張り度と容量使用率を横並びに */}
      <div className="flex justify-between gap-2">
        {/* サーバー頑張り度ゲージ */}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 mb-1">サーバー頑張り度</p>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-red-500 h-3 rounded-full transition-all"
              style={{ width: `${serverLoad * 100}%` }}
            ></div>
          </div>
        </div>

        {/* サーバー容量ゲージ */}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 mb-1">容量使用率</p>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all"
              style={{ width: `${storageUsage * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerStatus;