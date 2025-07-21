"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HamburgerMenu from "../../components/HamburgerMenu";

interface LoudnessResult {
  rms: string;
  rmsDb: string;
  peak: string;
  peakDb: string;
  integratedLufs: string;
  duration: string;
  sampleRate: number;
  channels: number;
}

export default function LoudnessPage() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [loudnessResult, setLoudnessResult] = useState<LoudnessResult | null>(null);
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawWaveform = useCallback((channelData: Float32Array) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      // canvasがまだ利用できない場合、少し待ってから再試行
      requestAnimationFrame(() => {
        const retryCanvas = canvasRef.current;
        if (retryCanvas) {
          const ctx = retryCanvas.getContext('2d');
          if (ctx) {
            // canvasのサイズを明示的に設定
            const width = retryCanvas.width = 600;
            const height = retryCanvas.height = 200;

            ctx.clearRect(0, 0, width, height);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.beginPath();

            const samplesPerPixel = Math.floor(channelData.length / width);
            
            for (let x = 0; x < width; x++) {
              const start = x * samplesPerPixel;
              const end = start + samplesPerPixel;
              let min = 1;
              let max = -1;
              
              for (let i = start; i < end && i < channelData.length; i++) {
                min = Math.min(min, channelData[i]);
                max = Math.max(max, channelData[i]);
              }
              
              const y1 = ((min + 1) / 2) * height;
              const y2 = ((max + 1) / 2) * height;
              
              if (x === 0) {
                ctx.moveTo(x, y1);
              } else {
                ctx.lineTo(x, y1);
              }
              ctx.lineTo(x, y2);
            }
            ctx.stroke();
          }
        }
      });
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // canvasのサイズを明示的に設定
    const width = canvas.width = 600;
    const height = canvas.height = 200;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.beginPath();

    const samplesPerPixel = Math.floor(channelData.length / width);
    
    for (let x = 0; x < width; x++) {
      const start = x * samplesPerPixel;
      const end = start + samplesPerPixel;
      let min = 1;
      let max = -1;
      
      for (let i = start; i < end && i < channelData.length; i++) {
        min = Math.min(min, channelData[i]);
        max = Math.max(max, channelData[i]);
      }
      
      const y1 = ((min + 1) / 2) * height;
      const y2 = ((max + 1) / 2) * height;
      
      if (x === 0) {
        ctx.moveTo(x, y1);
      } else {
        ctx.lineTo(x, y1);
      }
      ctx.lineTo(x, y2);
    }
    
    ctx.stroke();
  }, []);

  // 波形データが更新されたら描画を実行
  useEffect(() => {
    if (waveformData && loudnessResult) {
      // 少し遅延を入れてcanvasの準備を待つ
      setTimeout(() => {
        drawWaveform(waveformData);
      }, 100);
    }
  }, [waveformData, loudnessResult, drawWaveform]);
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      setLoudnessResult(null);
      setWaveformData(null); // 波形データもクリア
      toast.success("音声ファイルが選択されました！");
    } else {
      toast.error("音声ファイルを選択してください。");
    }
  };

  const calculateIntegratedLufs = (audioBuffer: AudioBuffer): number => {
    // Simplified LUFS calculation (ITU-R BS.1770-4 approximation)
    // Note: This is a basic implementation. Professional LUFS measurement requires more complex filtering
    
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;
    
    // K-weighting filter (simplified pre-filter)
    const preFilterGain = 1.0; // Simplified - actual implementation would use shelf filters
    
    let totalMeanSquare = 0;
    let validSamples = 0;
    
    // Process each channel
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      let channelMeanSquare = 0;
      
      // Apply gating window (400ms blocks with 75% overlap)
      const blockSize = Math.floor(0.4 * sampleRate); // 400ms block
      const hopSize = Math.floor(blockSize * 0.25); // 75% overlap
      
      const blocks: number[] = [];
      
      for (let start = 0; start + blockSize < channelData.length; start += hopSize) {
        let blockSum = 0;
        for (let i = start; i < start + blockSize; i++) {
          const sample = channelData[i] * preFilterGain;
          blockSum += sample * sample;
        }
        const blockMeanSquare = blockSum / blockSize;
        blocks.push(blockMeanSquare);
      }
      
      // Absolute gating (-70 LUFS)
      const absoluteThreshold = Math.pow(10, -70/10);
      const gatedBlocks = blocks.filter(block => block > absoluteThreshold);
      
      if (gatedBlocks.length > 0) {
        // Relative gating (-10 LU below ungated average)
        const ungatedMean = gatedBlocks.reduce((sum, block) => sum + block, 0) / gatedBlocks.length;
        const relativeThreshold = ungatedMean * Math.pow(10, -10/10);
        const finalGatedBlocks = gatedBlocks.filter(block => block > relativeThreshold);
        
        if (finalGatedBlocks.length > 0) {
          channelMeanSquare = finalGatedBlocks.reduce((sum, block) => sum + block, 0) / finalGatedBlocks.length;
          totalMeanSquare += channelMeanSquare;
          validSamples++;
        }
      }
    }
    
    if (validSamples === 0) {
      return -Infinity; // Below measurement threshold
    }
    
    // Average across channels and convert to LUFS
    const averageMeanSquare = totalMeanSquare / validSamples;
    const lufs = -0.691 + 10 * Math.log10(averageMeanSquare);
    
    return lufs;
  };

  const analyzeLoudness = async () => {
    if (!audioFile) {
      toast.error("音声ファイルを選択してください。");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Web Audio API を使用して音声を解析
      const audioContext = new AudioContext();
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // 音声データを取得
      const channelData = audioBuffer.getChannelData(0);
      
      // RMS (Root Mean Square) を計算
      let sum = 0;
      for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i];
      }
      const rms = Math.sqrt(sum / channelData.length);
      
      // dB に変換
      const dB = 20 * Math.log10(rms);
      
      // ピーク値を計算
      let peak = 0;
      for (let i = 0; i < channelData.length; i++) {
        peak = Math.max(peak, Math.abs(channelData[i]));      }
      const peakDb = 20 * Math.log10(peak);

      // Calculate integrated LUFS
      const integratedLufs = calculateIntegratedLufs(audioBuffer);      setLoudnessResult({
        rms: rms.toFixed(6),
        rmsDb: isFinite(dB) ? dB.toFixed(2) : "無音",
        peak: peak.toFixed(6),
        peakDb: isFinite(peakDb) ? peakDb.toFixed(2) : "無音",
        integratedLufs: isFinite(integratedLufs) ? integratedLufs.toFixed(1) : "測定不可",
        duration: audioBuffer.duration.toFixed(2),
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels
      });

      // 波形データを保存（useEffectで描画される）
      setWaveformData(channelData);
      
      toast.success("音量解析が完了しました！");
    } catch (error) {
      console.error("解析エラー:", error);
      toast.error("音声ファイルの解析に失敗しました。");
    } finally {
      setIsAnalyzing(false);    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-8 relative">
      
      {/* ハンバーガーメニュー */}
      <HamburgerMenu />
      
      <ToastContainer position="bottom-center" />
      
      <h1 className="text-center text-5xl text-gray-700 dark:text-gray-300 font-bold mb-0">
        音量測定器❗🔊📊
      </h1>
        <div className="mt-8 text-center">
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
          音声ファイルの音量レベルを解析します❗🎵
        </p>
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-6">
          RMS、ピーク値、Integrated LUFS、波形を表示して音質をチェック❗📈
        </p>
      </div>

      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">

        {/* ファイル選択 */}
        <div className="mb-4">
          <label className="w-full">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="cursor-pointer w-full bg-blue-500 dark:bg-blue-600 text-white py-2 px-4 rounded-sm text-center hover:bg-blue-600 dark:hover:bg-blue-700 transition">
              音声ファイル選択
            </div>
          </label>
        </div>

        {/* 選択されたファイル情報 */}
        {audioFile && (
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-sm">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">ファイル名:</span> {audioFile.name}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">サイズ:</span> {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">タイプ:</span> {audioFile.type}
            </p>
          </div>
        )}

        {/* 音声プレイヤー */}
        {audioFile && (
          <div className="mb-4">
            <audio
              ref={audioRef}
              controls
              className="w-full"
              src={URL.createObjectURL(audioFile)}
            />
          </div>
        )}

        {/* 解析ボタン */}
        <div className="mb-4">
          <button
            onClick={analyzeLoudness}
            className="w-full bg-green-500 dark:bg-green-600 text-white py-2 px-4 rounded-sm hover:bg-green-600 dark:hover:bg-green-700 transition"
            disabled={!audioFile || isAnalyzing}
          >
            {isAnalyzing ? "解析中..." : "音量解析開始"}
          </button>
        </div>

        {/* 波形表示 */}
        {loudnessResult && (
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              波形
            </h3>
            <canvas
              ref={canvasRef}
              width="600"
              height="200"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-sm"
            />
          </div>
        )}

        {/* 解析結果 */}
        {loudnessResult && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900 rounded-sm">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
              解析結果 ✨
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">RMS:</span> {loudnessResult.rms}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">RMS (dB):</span> {loudnessResult.rmsDb} dB
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">ピーク:</span> {loudnessResult.peak}
                </p>                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">ピーク (dB):</span> {loudnessResult.peakDb} dB
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Integrated LUFS:</span> {loudnessResult.integratedLufs} LUFS
                </p>
              </div>
              <div>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">再生時間:</span> {loudnessResult.duration} 秒
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">サンプルレート:</span> {loudnessResult.sampleRate} Hz
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">チャンネル数:</span> {loudnessResult.channels}
                </p>
              </div>            </div>
            
            {/* LUFS説明 */}
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900 rounded-sm">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                📊 LUFS について
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                LUFS (Loudness Units relative to Full Scale) は国際標準の音量測定単位です。
                <br />
                • -23 LUFS: TV放送標準
                • -16 LUFS: 音楽ストリーミング推奨
                • -14 LUFS: 一般的な音楽マスタリング
                • -6 LUFS: ダンスミュージックやエレクトロニカ
              </p>
            </div>
          </div>
        )}

        {/* 音楽ページへのリンク */}
        <div className="mt-8 text-center">
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
            俺の曲もチェックしてみて❗🎵
          </p>
          <a
            href="https://www.tunecore.co.jp/artists/R1cefarm"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-500 transition"
          >
            俺の曲を聞く❗👊💥🎶
          </a>
        </div>

      </div>
    </div>
  );
}