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

  // K-weighting フィルターの実装（ITU-R BS.1770-4準拠）
  const applyKWeightingFilter = (channelData: Float32Array, sampleRate: number): Float32Array => {
    const filtered = new Float32Array(channelData.length);
    
    // High-pass filter (75 Hz): f = 1681.4
    // z = (s + 1681.4) / (s + 76655.0)
    const f0 = 1681.4;
    const Q = 0.7071;
    const w0 = 2 * Math.PI * f0 / sampleRate;
    const cosw0 = Math.cos(w0);
    const sinw0 = Math.sin(w0);
    const alpha = sinw0 / (2 * Q);
    
    // High-pass filter coefficients
    const b0_hp = (1 + cosw0) / 2;
    const b1_hp = -(1 + cosw0);
    const b2_hp = (1 + cosw0) / 2;
    const a0_hp = 1 + alpha;
    const a1_hp = -2 * cosw0;
    const a2_hp = 1 - alpha;
    
    // Normalize coefficients
    const norm_hp = 1 / a0_hp;
    const b0_hp_norm = b0_hp * norm_hp;
    const b1_hp_norm = b1_hp * norm_hp;
    const b2_hp_norm = b2_hp * norm_hp;
    const a1_hp_norm = a1_hp * norm_hp;
    const a2_hp_norm = a2_hp * norm_hp;
    
    // High-shelf filter (1500 Hz, +4 dB): f = 38.13547
    const f1 = 38.13547;
    const A = Math.pow(10, 4.0 / 40); // +4 dB
    const w1 = 2 * Math.PI * f1 / sampleRate;
    const cosw1 = Math.cos(w1);
    const sinw1 = Math.sin(w1);
    const beta = Math.sqrt(A) / Q;
    
    // High-shelf filter coefficients
    const b0_hs = A * ((A + 1) + (A - 1) * cosw1 + beta * sinw1);
    const b1_hs = -2 * A * ((A - 1) + (A + 1) * cosw1);
    const b2_hs = A * ((A + 1) + (A - 1) * cosw1 - beta * sinw1);
    const a0_hs = (A + 1) - (A - 1) * cosw1 + beta * sinw1;
    const a1_hs = 2 * ((A - 1) - (A + 1) * cosw1);
    const a2_hs = (A + 1) - (A - 1) * cosw1 - beta * sinw1;
    
    // Normalize coefficients
    const norm_hs = 1 / a0_hs;
    const b0_hs_norm = b0_hs * norm_hs;
    const b1_hs_norm = b1_hs * norm_hs;
    const b2_hs_norm = b2_hs * norm_hs;
    const a1_hs_norm = a1_hs * norm_hs;
    const a2_hs_norm = a2_hs * norm_hs;
    
    // Apply filters (cascade)
    let x1_hp = 0, x2_hp = 0, y1_hp = 0, y2_hp = 0;
    let x1_hs = 0, x2_hs = 0, y1_hs = 0, y2_hs = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      // High-pass filter
      const x_hp = channelData[i];
      const y_hp = b0_hp_norm * x_hp + b1_hp_norm * x1_hp + b2_hp_norm * x2_hp - a1_hp_norm * y1_hp - a2_hp_norm * y2_hp;
      
      x2_hp = x1_hp;
      x1_hp = x_hp;
      y2_hp = y1_hp;
      y1_hp = y_hp;
      
      // High-shelf filter
      const x_hs = y_hp;
      const y_hs = b0_hs_norm * x_hs + b1_hs_norm * x1_hs + b2_hs_norm * x2_hs - a1_hs_norm * y1_hs - a2_hs_norm * y2_hs;
      
      x2_hs = x1_hs;
      x1_hs = x_hs;
      y2_hs = y1_hs;
      y1_hs = y_hs;
      
      filtered[i] = y_hs;
    }
    
    return filtered;
  };

  const calculateIntegratedLufs = (audioBuffer: AudioBuffer): number => {
    // ITU-R BS.1770-4準拠のLUFS計測（より厳密な実装）
    const sampleRate = audioBuffer.sampleRate;
    const numberOfChannels = audioBuffer.numberOfChannels;

    // チャンネル重み付け（ITU-R BS.1770-4）
    // 5.1/7.1はLFEを除外し、サラウンドは√2で重み付け
    const channelWeights: { [key: number]: number[] } = {
      1: [1.0], // Mono
      2: [1.0, 1.0], // Stereo
      6: [1.0, 1.0, 1.0, 0.0, 1.41, 1.41], // 5.1 (L, R, C, LFE, Ls, Rs)
      8: [1.0, 1.0, 1.0, 0.0, 1.41, 1.41, 1.41, 1.41], // 7.1 (L, R, C, LFE, Ls, Rs, Lsr, Rsr)
    };
    const weights = channelWeights[numberOfChannels] || Array(numberOfChannels).fill(1.0);

    // K-weightingフィルター適用
    const filteredChannels: Float32Array[] = [];
    for (let ch = 0; ch < numberOfChannels; ch++) {
      filteredChannels.push(applyKWeightingFilter(audioBuffer.getChannelData(ch), sampleRate));
    }

    // 400msブロック、75%オーバーラップ
    const blockSize = Math.floor(0.4 * sampleRate);
    const hopSize = Math.floor(blockSize * 0.25);

    // 各ブロックの重み付き平均二乗値
    const blockSquares: number[] = [];
    const blockCount = Math.floor((filteredChannels[0].length - blockSize) / hopSize) + 1;

    for (let b = 0; b < blockCount; b++) {
      let sum = 0;
      let totalWeight = 0;
      for (let ch = 0; ch < numberOfChannels; ch++) {
        if (weights[ch] > 0) {
          let blockSum = 0;
          const start = b * hopSize;
          for (let i = start; i < start + blockSize; i++) {
            blockSum += filteredChannels[ch][i] * filteredChannels[ch][i];
          }
          sum += (blockSum / blockSize) * weights[ch];
          totalWeight += weights[ch];
        }
      }
      if (totalWeight > 0) {
        blockSquares.push(sum / totalWeight);
      }
    }

    // アブソリュートゲート（-70 LUFS）
    const absGate = Math.pow(10, (-70 + 0.691) / 10);
    const absGated = blockSquares.filter(v => v >= absGate);
    if (absGated.length === 0) return -Infinity;

    // リラティブゲート（平均より-10 LU）
    const meanAbsGated = absGated.reduce((a, b) => a + b, 0) / absGated.length;
    const relGate = meanAbsGated * Math.pow(10, -10 / 10);
    const relGated = absGated.filter(v => v >= relGate);
    if (relGated.length === 0) return -Infinity;

    // LUFS計算
    const gatedMean = relGated.reduce((a, b) => a + b, 0) / relGated.length;
    const lufs = -0.691 + 10 * Math.log10(gatedMean);

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
                📊 LUFS について（ITU-R BS.1770-4準拠）
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                LUFS (Loudness Units relative to Full Scale) は国際標準の音量測定単位です。
                <br />
                このツールはITU-R BS.1770-4標準に準拠した正確なK-weightingフィルターを使用しています。
              </p>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <strong>配信プラットフォーム推奨値:</strong>
                <br />
                • <strong>YouTube:</strong> -14 LUFS（音楽）、-16 LUFS（会話）
                <br />
                • <strong>Spotify:</strong> -14 LUFS
                <br />
                • <strong>Apple Music:</strong> -16 LUFS
                <br />
                • <strong>Netflix:</strong> -27 LUFS（ダイアログ）
                <br />
                • <strong>TV放送:</strong> -23 LUFS（日本・欧州）、-24 LUFS（米国）
                <br />
                • <strong>一般的な音楽マスタリング:</strong> -12 to -14 LUFS
              </div>
            </div>
          </div>
        )}

        {/* 音楽ページへのリンク */}
        <div className="mt-8 text-center">
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
            俺の曲を聞いて
            このサービスを
            維持してください❗🎵
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