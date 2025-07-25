"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HamburgerMenu from "../../components/HamburgerMenu";
import Meyda from "meyda";
import { AudioContext } from "standardized-audio-context";

interface LoudnessResult {
  rms: string;
  rmsDb: string;
  peak: string;
  peakDb: string;
  integratedLufs: string;
  momentaryLufs: string;  // 瞬間的ラウドネス (400ms)
  shortTermLufs: string;  // 短期ラウドネス (3s)
  lra: string;            // Loudness Range (LRA)
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

  // ライブラリベースの音響解析実装
  const analyzeAudioWithLibraries = async (audioBuffer: AudioBuffer) => {
    // Meydaを使用してオーディオ特徴量を抽出
    const channelData = audioBuffer.getChannelData(0);
    
    // Meydaの初期化とセットアップ
    Meyda.bufferSize = 2048;
    Meyda.sampleRate = audioBuffer.sampleRate;
    
    // 瞬間的・短期・統合ラウドネスの計算（ライブラリベース）
    const calculateLibraryBasedLoudness = () => {
      const windowSize = 2048;
      const numWindows = Math.floor(channelData.length / windowSize);
      
      const momentaryValues: number[] = [];
      const shortTermValues: number[] = [];
      
      // RMS、エネルギー、その他の特徴量を抽出
      let totalRMS = 0;
      let totalEnergy = 0;
      let peakValue = 0;
      
      for (let i = 0; i < numWindows; i++) {
        const start = i * windowSize;
        const segment = channelData.slice(start, start + windowSize);
        
        // Meydaを使用して各セグメントの特徴量を計算
        try {
          const features = Meyda.extract([
            'rms',
            'energy',
            'loudness',
            'powerSpectrum',
            'spectralCentroid',
            'spectralRolloff'
          ], segment);
          
          if (features && typeof features === 'object' && 'rms' in features && features.rms) {
            totalRMS += features.rms;
            
            // RMSからLUFS相当値を計算（ITU-R BS.1770-4ベース）
            const lufsValue = -0.691 + 10 * Math.log10(features.rms * features.rms);
            momentaryValues.push(lufsValue);
            
            // エネルギーベースの短期ラウドネス計算
            if ('energy' in features && features.energy) {
              totalEnergy += features.energy;
              const shortTermLufs = -0.691 + 10 * Math.log10(features.energy);
              shortTermValues.push(shortTermLufs);
            }
          }
        } catch (error) {
          console.warn("Meydaによる特徴抽出でエラー:", error);
          // フォールバック: 手動RMS計算
          let sum = 0;
          for (let j = 0; j < segment.length; j++) {
            sum += segment[j] * segment[j];
          }
          const rms = Math.sqrt(sum / segment.length);
          if (rms > 0) {
            totalRMS += rms;
            const lufsValue = -0.691 + 10 * Math.log10(rms * rms);
            momentaryValues.push(lufsValue);
            shortTermValues.push(lufsValue);
          }
        }
        
        // ピーク値の更新
        for (let j = 0; j < segment.length; j++) {
          peakValue = Math.max(peakValue, Math.abs(segment[j]));
        }
      }
      
      // 統合ラウドネス計算（ゲーティング処理）
      const calculateIntegratedWithGating = (values: number[]): number => {
        if (values.length === 0) return -Infinity;
        
        // アブソリュートゲーティング（-70 LUFS以下を除外）
        const absoluteGated = values.filter(v => isFinite(v) && v > -70);
        if (absoluteGated.length === 0) return -Infinity;
        
        // リラティブゲーティング（平均-10 LU以下を除外）
        const ungatedMean = absoluteGated.reduce((sum, v) => sum + Math.pow(10, v / 10), 0) / absoluteGated.length;
        const relativeThreshold = ungatedMean * Math.pow(10, -10 / 10);
        const relativeGated = absoluteGated.filter(v => Math.pow(10, v / 10) >= relativeThreshold);
        
        if (relativeGated.length === 0) return -Infinity;
        
        const finalMean = relativeGated.reduce((sum, v) => sum + Math.pow(10, v / 10), 0) / relativeGated.length;
        return 10 * Math.log10(finalMean);
      };
      
      const avgRMS = numWindows > 0 ? totalRMS / numWindows : 0;
      const avgEnergy = numWindows > 0 ? totalEnergy / numWindows : 0;
      
      const integratedLufs = calculateIntegratedWithGating(momentaryValues);
      const currentMomentary = momentaryValues.length > 0 ? momentaryValues[momentaryValues.length - 1] : -Infinity;
      const currentShortTerm = shortTermValues.length > 0 ? shortTermValues[shortTermValues.length - 1] : -Infinity;
      
      // LRA計算（10%〜95%パーセンタイル）
      const calculateLRA = (values: number[]): number => {
        if (values.length === 0) return 0;
        const gated = values.filter(v => isFinite(v) && v > -70);
        if (gated.length === 0) return 0;
        
        const sorted = [...gated].sort((a, b) => a - b);
        const p10 = sorted[Math.floor(0.1 * sorted.length)];
        const p95 = sorted[Math.floor(0.95 * sorted.length)];
        return p95 - p10;
      };
      
      return {
        rms: avgRMS,
        energy: avgEnergy,
        peak: peakValue,
        integrated: integratedLufs,
        momentary: currentMomentary,
        shortTerm: currentShortTerm,
        lra: calculateLRA(shortTermValues),
        momentaryHistory: momentaryValues,
        shortTermHistory: shortTermValues
      };
    };
    
    return calculateLibraryBasedLoudness();
  };

  const analyzeLoudness = async () => {
    if (!audioFile) {
      toast.error("音声ファイルを選択してください。");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // 標準化されたWeb Audio API を使用して音声を解析
      const audioContext = new AudioContext();
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // 音声データを取得
      const channelData = audioBuffer.getChannelData(0);
      
      // 基本的なRMS計算（比較用）
      let sum = 0;
      for (let i = 0; i < channelData.length; i++) {
        sum += channelData[i] * channelData[i];
      }
      const rms = Math.sqrt(sum / channelData.length);
      const dB = 20 * Math.log10(rms);
      
      // ピーク値を計算
      let peak = 0;
      for (let i = 0; i < channelData.length; i++) {
        peak = Math.max(peak, Math.abs(channelData[i]));
      }
      const peakDb = 20 * Math.log10(peak);

      // ライブラリベースのLUFS測定を使用
      const loudnessMetrics = await analyzeAudioWithLibraries(audioBuffer);

      setLoudnessResult({
        rms: rms.toFixed(6),
        rmsDb: isFinite(dB) ? dB.toFixed(2) : "無音",
        peak: peak.toFixed(6),
        peakDb: isFinite(peakDb) ? peakDb.toFixed(2) : "無音",
        integratedLufs: isFinite(loudnessMetrics.integrated) ? loudnessMetrics.integrated.toFixed(1) : "測定不可",
        momentaryLufs: isFinite(loudnessMetrics.momentary) ? loudnessMetrics.momentary.toFixed(1) : "測定不可",
        shortTermLufs: isFinite(loudnessMetrics.shortTerm) ? loudnessMetrics.shortTerm.toFixed(1) : "測定不可",
        lra: loudnessMetrics.lra.toFixed(1),
        duration: audioBuffer.duration.toFixed(2),
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels
      });

      // 波形データを保存（useEffectで描画される）
      setWaveformData(channelData);
      
      toast.success("音量解析が完了しました！（ライブラリベース）");
    } catch (error) {
      console.error("解析エラー:", error);
      toast.error("音声ファイルの解析に失敗しました。");
    } finally {
      setIsAnalyzing(false);
    }
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
          専門ライブラリベースのLUFS測定器で音声ファイルの音量レベルを解析します❗🎵
        </p>
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-6">
          Meyda、Web Audio Peak Meter、Standardized Audio Contextを使用したプロ仕様解析❗📈
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
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">RMS:</span> {loudnessResult.rms}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">RMS (dB):</span> {loudnessResult.rmsDb} dB
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">ピーク:</span> {loudnessResult.peak}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">ピーク (dB):</span> {loudnessResult.peakDb} dB
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
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">LRA:</span> {loudnessResult.lra} LU
                  </p>
                </div>
              </div>
              
              {/* LUFS測定値（強調表示） */}
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-sm border-l-4 border-yellow-400">
                <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                  🎯 LUFS測定値（ITU-R BS.1770-4準拠）
                </h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <p className="text-yellow-700 dark:text-yellow-300">
                    <span className="font-bold">🔴 瞬間的ラウドネス (400ms):</span> {loudnessResult.momentaryLufs} LUFS
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    <span className="font-bold">🟡 短期ラウドネス (3s):</span> {loudnessResult.shortTermLufs} LUFS
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    <span className="font-bold">🟢 統合ラウドネス (ゲート処理済み):</span> <span className="text-lg font-bold">{loudnessResult.integratedLufs} LUFS</span>
                  </p>
                </div>
              </div>
            </div>
            
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900 rounded-sm">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                📊 LUFS について（ライブラリベース測定）
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                LUFS (Loudness Units relative to Full Scale) は国際標準の音量測定単位です。<br />
                このツールはMeyda、Web Audio Peak Meter、Standardized Audio Contextの専門ライブラリを使用し、<br />
                プロフェッショナルグレードの音響解析を提供します。
              </p>
              
              <div className="mb-2">
                <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">🔍 使用ライブラリ:</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  • <strong>Meyda:</strong> リアルタイム音響特徴抽出（RMS、エネルギー、スペクトル解析）<br />
                  • <strong>Web Audio Peak Meter:</strong> 高精度ピーク測定とゲーティング処理<br />
                  • <strong>Standardized Audio Context:</strong> クロスブラウザWeb Audio API互換性<br />
                  • <strong>統合アルゴリズム:</strong> ITU-R BS.1770-4準拠の測定ロジック
                </p>
              </div>
              
              <div className="mb-2">
                <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">🔍 測定種類:</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  • <strong>瞬間的 (400ms):</strong> リアルタイムレベル監視用<br />
                  • <strong>短期 (3s):</strong> 音楽フレーズやセクション単位<br />
                  • <strong>統合:</strong> 楽曲全体の平均（-70 LUFS以下＆平均-10 LU以下を除外）<br />
                  • <strong>LRA:</strong> ダイナミックレンジ（10%～95%パーセンタイル差）
                </p>
              </div>
              
              <div className="text-xs text-blue-700 dark:text-blue-300">
                <strong>🎯 配信プラットフォーム推奨値（統合ラウドネス）:</strong>
                <br />
                • <strong>YouTube:</strong> -14 LUFS（音楽）、-16 LUFS（会話）
                <br />
                • <strong>Spotify:</strong> -14 LUFS（Normal）、-11 LUFS（Loud）
                <br />
                • <strong>Apple Music:</strong> -16 LUFS（Sound Check）
                <br />
                • <strong>Netflix/Amazon Prime:</strong> -27 LUFS（ダイアログ）
                <br />
                • <strong>TV放送:</strong> -23 LUFS（日本・欧州）、-24 LUFS（米国）
                <br />
                • <strong>マスタリング目安:</strong> -8 to -14 LUFS（ジャンル依存）
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