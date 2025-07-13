import os from "os";

export async function GET() {
  try {
    // CPU使用率を計算 (0から1の間で表現)
    const cpus = os.cpus();
    const totalCpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
      const idle = cpu.times.idle;
      const usage = (total - idle) / total; // 0から1の間で計算
      return acc + usage;
    }, 0);
    const averageCpuUsage = totalCpuUsage / cpus.length;

    // メモリ使用量を計算 (0から1の間で表現)
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = (totalMemory - freeMemory) / totalMemory;

    // CPU使用率とメモリ使用率の平均を計算
    const overallLoad = (averageCpuUsage + memoryUsage) / 2;

    // 負荷状況を1つのfloat値として返す
    return new Response(JSON.stringify({ load: parseFloat(overallLoad.toFixed(2)) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("サーバー負荷状況取得エラー:", error);
    return new Response(JSON.stringify({ error: "サーバーエラーが発生しました。" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}