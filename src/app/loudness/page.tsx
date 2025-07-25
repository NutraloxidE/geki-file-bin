"use client";

import Link from "next/link";
import HamburgerMenu from "../../components/HamburgerMenu";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import React, { useState } from "react";
import 'react-toastify/dist/ReactToastify.css';

interface LoudnessResult {
  isCalculated: boolean;
  integratedLufs: number;
}

// ITU-R BS.1770-4準拠のフィルタ係数計算
function preFilterCoefficients(sampleRate: number) {
  const Q = 0.7071752369554196;
  const fc = 1681.974450955533;
  const K = Math.tan((fc * Math.PI) / sampleRate);
  const Vh = Math.pow(10, 0.19999219269866736); // 10^(3.999219269866736/20)
  const Vb = Math.pow(Vh, 0.4996667741545416);
  const denominator = 1 + K / Q + K * K;
  
  return {
    numerators: [
      (Vh + Vb * K / Q + K * K) / denominator,
      2 * (K * K - Vh) / denominator,
      (Vh - Vb * K / Q + K * K) / denominator
    ],
    denominators: [
      1,
      2 * (K * K - 1) / denominator,
      (1 - K / Q + K * K) / denominator
    ]
  };
}

function weightingFilterCoefficients(sampleRate: number) {
  const Q = 0.5003270373238773;
  const fc = 38.13547087602444;
  const K = Math.tan((fc * Math.PI) / sampleRate);
  const denominator = 1 + K / Q + K * K;
  
  return {
    numerators: [1, -2, 1],
    denominators: [
      1,
      2 * (K * K - 1) / denominator,
      (1 - K / Q + K * K) / denominator
    ]
  };
}

// ラウドネス計算クラス（ITU-R BS.1770-4厳密準拠）
class LoudnessMeter {
  private sampleRate: number = 48000;
  private blockSize: number; // 400ms in samples
  private stepSize: number; // 100ms step
  private rmsBuffer: number[] = [];

  constructor() {
    // 重要：参考ライブラリに合わせて、初期値は仮の値とし、実際のサンプルレートで後から更新
    this.sampleRate = 48000; // 仮の値
    this.blockSize = Math.floor(this.sampleRate * 0.4); // 400ms = 19200 samples at 48kHz
    this.stepSize = Math.floor(this.sampleRate * 0.1); // 100ms = 4800 samples
    
    console.log(`LoudnessMeter initialized (temporary): blockSize=${this.blockSize}, stepSize=${this.stepSize}`);
  }

  private updateBlockSizes(actualSampleRate: number): void {
    // 実際のサンプルレートに基づいてブロックサイズを再計算
    this.sampleRate = actualSampleRate;
    this.blockSize = Math.floor(actualSampleRate * 0.4); // 400ms
    this.stepSize = Math.floor(actualSampleRate * 0.1); // 100ms
    
    console.log(`Block sizes updated for ${actualSampleRate}Hz: blockSize=${this.blockSize}, stepSize=${this.stepSize}`);
  }

  async processAudioFile(file: File): Promise<LoudnessResult> {
    try {
      // AudioContextを一度だけ作成
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      
      // ファイルをArrayBufferとして読み込み
      const arrayBuffer = await file.arrayBuffer();
      
      // AudioContextでデコード
      const originalBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log(`Original: ${originalBuffer.sampleRate}Hz, ${originalBuffer.numberOfChannels}ch, ${originalBuffer.duration.toFixed(2)}s`);
      
      // 重要：参考ライブラリは元のサンプルレートで処理している！
      // 48kHzリサンプリングを無効化して、元のサンプルレートで処理する
      console.log('🔍 参考ライブラリに合わせて元のサンプルレートで処理します');
      const processBuffer = originalBuffer; // リサンプリングをスキップ
      
      console.log(`Processing: ${processBuffer.sampleRate}Hz, ${processBuffer.numberOfChannels}ch, ${processBuffer.duration.toFixed(2)}s`);
      
      // K-Weightingフィルタを適用
      const filteredBuffer = await this.applyKWeighting(processBuffer);
      
      console.log(`Filtered: ${filteredBuffer.sampleRate}Hz, ${filteredBuffer.numberOfChannels}ch, ${filteredBuffer.duration.toFixed(2)}s`);
      
      // フィルタ後のオーディオデータの健全性チェック
      let validSamples = 0;
      let totalSamples = 0;
      for (let ch = 0; ch < filteredBuffer.numberOfChannels; ch++) {
        const channelData = filteredBuffer.getChannelData(ch);
        for (let i = 0; i < Math.min(1000, channelData.length); i++) { // 最初の1000サンプルをチェック
          totalSamples++;
          if (isFinite(channelData[i]) && !isNaN(channelData[i])) {
            validSamples++;
          }
        }
      }
      console.log(`🔍 フィルタ後データチェック: ${validSamples}/${totalSamples} 有効サンプル`);
      
      if (validSamples === 0) {
        throw new Error('フィルタ処理後のオーディオデータが無効です');
      }
      
      // 実際のサンプルレートでブロックサイズを更新
      this.updateBlockSizes(filteredBuffer.sampleRate);
      
      // RMSブロック計算
      this.calculateRMSBlocks(filteredBuffer);
      
      // 絶対ゲーティング（-70 LUFS）
      const absoluteGatedRMS = this.applyAbsoluteGating();
      
      // 相対ゲーティング（-10dB below relative threshold）
      const relativeGatedRMS = this.applyRelativeGating(absoluteGatedRMS);
      
      // 統合ラウドネス計算
      let integratedLoudness = this.calculateIntegratedLoudness(relativeGatedRMS);
      // 小数点1桁に丸め、0なら0を返すが、-0は0にする
      integratedLoudness = Math.round(integratedLoudness * 10) / 10;
      if (Object.is(integratedLoudness, -0)) integratedLoudness = 0;
      
      // デバッグ情報を出力
      this.debugMeasurement();
      
      // リソースクリーンアップ
      await audioContext.close();
      
      return {
        isCalculated: true,
        integratedLufs: integratedLoudness
      };
    } catch (error) {
      console.error('ラウドネス計測エラー:', error);
      throw error;
    }
  }

  private async resampleTo48kHz(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    // 既に48kHzの場合はそのまま返す
    if (Math.abs(audioBuffer.sampleRate - 48000) < 1) {
      console.log('Audio is already at 48kHz, skipping resample');
      return audioBuffer;
    }

    console.log(`Resampling from ${audioBuffer.sampleRate}Hz to 48000Hz`);
    
    // 正確なリサンプリング比率計算
    const resampleRatio = 48000 / audioBuffer.sampleRate;
    const targetLength = Math.floor(audioBuffer.length * resampleRatio);
    
    const offlineContext = new (window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext)(
      audioBuffer.numberOfChannels,
      targetLength,
      48000
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // 参考ライブラリでは、リサンプリング時にフィルタを適用しない場合もある
    // シンプルな接続を試す
    source.connect(offlineContext.destination);
    source.start();

    const result = await offlineContext.startRendering();
    console.log(`Resampling completed: ${result.sampleRate}Hz, ${result.length} samples`);
    return result;
  }

  private async applyKWeighting(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    const offlineContext = new (window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext)(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // 参考ライブラリに基づくK-Weightingフィルタの実装
    // 重要：参考ライブラリの正確な順序（Pre-filter -> Weighting filter）
    if ('createIIRFilter' in offlineContext) {
      // Stage 1: Pre-filter (RLB filter) を最初に適用
      const preCoeffs = preFilterCoefficients(audioBuffer.sampleRate);
      const preFilter = offlineContext.createIIRFilter(preCoeffs.numerators, preCoeffs.denominators);
      
      // Stage 2: Weighting filter (High-pass) を次に適用
      const weightCoeffs = weightingFilterCoefficients(audioBuffer.sampleRate);
      const weightingFilter = offlineContext.createIIRFilter(weightCoeffs.numerators, weightCoeffs.denominators);
      
      // フィルタチェーンの接続（参考ライブラリと同じ順序）
      source.connect(preFilter);
      preFilter.connect(weightingFilter);
      weightingFilter.connect(offlineContext.destination);
      
      console.log('Using IIR filters for K-weighting (Pre-filter -> Weighting filter)');
    } else {
      // IIRフィルタがサポートされていない場合のフォールバック
      const context = offlineContext as unknown as BaseAudioContext & { 
        createBiquadFilter: () => BiquadFilterNode;
        destination: AudioDestinationNode;
      };
      
      // フォールバック：Biquad フィルタで近似（参考ライブラリと同じ設定）
      const preFilter = context.createBiquadFilter();
      preFilter.type = 'highshelf';
      preFilter.frequency.value = 1500;
      preFilter.gain.value = 4;
      
      const weightingFilter = context.createBiquadFilter();
      weightingFilter.type = 'highpass';
      weightingFilter.frequency.value = 38;
      weightingFilter.Q.value = 0.5; // 参考ライブラリでは -6 となっているが、これは誤記の可能性
      
      // 参考ライブラリと同じ順序で接続
      source.connect(preFilter);
      preFilter.connect(weightingFilter);
      weightingFilter.connect(context.destination);
      
      console.log('Using Biquad filters for K-weighting (fallback, Pre-filter -> Weighting filter)');
    }
    
    source.start();
    return await offlineContext.startRendering();
  }

  private calculateRMSBlocks(audioBuffer: AudioBuffer): void {
    this.rmsBuffer = [];
    const channels = audioBuffer.numberOfChannels;
    
    // ITU-R BS.1770-4のチャンネルゲイン定義（厳密版）
    const getChannelGain = (channelIndex: number, totalChannels: number): number => {
      // ステレオ (L, R)
      if (totalChannels <= 2) {
        return 1.0; // L/R = 1.0
      }
      
      // 5.1 サラウンド (L, R, C, LFE, LS, RS)  
      if (totalChannels === 6) {
        switch (channelIndex) {
          case 0: return 1.0; // L
          case 1: return 1.0; // R  
          case 2: return 1.0; // C
          case 3: return 0.0; // LFE (ignored)
          case 4: return Math.sqrt(2); // LS (1.41421356...)
          case 5: return Math.sqrt(2); // RS (1.41421356...)
          default: return 1.0;
        }
      }
      
      // その他のマルチチャンネル
      if (channelIndex < 2) return 1.0; // L/R
      if (channelIndex === 3) return 0.0; // LFE
      return Math.sqrt(2); // サラウンド
    };
    
    // 重要：参考ライブラリと完全に同じ処理（16384サンプルのチャンク処理）
    const chunkSize = 16384; // 参考ライブラリと同じチャンクサイズ
    const blockSizeSamples = this.blockSize;
    const stepSizeSamples = this.stepSize;
    
    console.log(`🔍 チャンク処理開始: chunkSize=${chunkSize}, blockSize=${blockSizeSamples}, stepSize=${stepSizeSamples}`);
    
    // 修正：チャンク処理を無効化してシンプルな方式に戻す
    // チャンク処理が原因でブロックが生成されない可能性がある
    for (let blockStart = 0; blockStart + blockSizeSamples <= audioBuffer.length; blockStart += stepSizeSamples) {
      let totalPower = 0;
      let validChannelCount = 0;

      for (let ch = 0; ch < channels; ch++) {
        const channelGain = getChannelGain(ch, channels);
        if (channelGain === 0) continue; // LFEチャンネルをスキップ
        
        const channelData = audioBuffer.getChannelData(ch);
        let channelPower = 0;
        
        // チャンネル内の400msブロックでパワー（二乗の合計）を計算
        for (let i = blockStart; i < blockStart + blockSizeSamples; i++) {
          const sample = channelData[i];
          if (isNaN(sample) || !isFinite(sample)) {
            console.warn(`⚠️ 無効なサンプル値: ch=${ch}, i=${i}, value=${sample}`);
            continue;
          }
          const weightedSample = sample * channelGain;
          channelPower += weightedSample * weightedSample;
        }
        
        // ブロックサイズで割って平均化（meanSquare）してから合計
        const meanSquare = channelPower / blockSizeSamples;
        if (isNaN(meanSquare) || !isFinite(meanSquare)) {
          console.warn(`⚠️ 無効なmeanSquare: ch=${ch}, value=${meanSquare}`);
          continue;
        }
        
        totalPower += meanSquare;
        validChannelCount++;
      }

      // チャンネル数で割らずに合計パワーをそのまま使用
      if (validChannelCount > 0 && isFinite(totalPower) && totalPower > 0) {
        const rms = Math.sqrt(totalPower);
        if (isFinite(rms) && rms > 0) {
          this.rmsBuffer.push(rms);
        } else {
          console.warn(`⚠️ 無効なRMS値: ${rms}, totalPower=${totalPower}`);
        }
      }
    }
    
    console.log(`Generated ${this.rmsBuffer.length} RMS blocks from ${audioBuffer.length} samples`);
    if (this.rmsBuffer.length > 0) {
      console.log(`First block RMS: ${this.rmsBuffer[0]}, LUFS: ${this.rmsToLufs(this.rmsBuffer[0]).toFixed(2)}`);
    }
  }

  private applyAbsoluteGating(): number[] {
    // -70 LUFS絶対ゲーティング（ITU-R BS.1770-4準拠）
    const absoluteThreshold = -70.0; // LUFS
    
    const gatedRMS = this.rmsBuffer.filter(rms => {
      const lufs = this.rmsToLufs(rms);
      return lufs >= absoluteThreshold; // >= を使用（標準準拠）
    });
    
    console.log(`Total blocks: ${this.rmsBuffer.length}`);
    console.log(`Blocks after absolute gating (-70 LUFS): ${gatedRMS.length}`);
    
    return gatedRMS;
  }

  private applyRelativeGating(absoluteGatedRMS: number[]): number[] {
    if (absoluteGatedRMS.length === 0) return [];
    
    // Step 1: 絶対ゲーティング後のブロックから平均ラウドネスを計算
    const meanSquareSum = absoluteGatedRMS.reduce((sum, rms) => sum + rms * rms, 0);
    const meanSquare = meanSquareSum / absoluteGatedRMS.length;
    const meanLoudness = -0.691 + 10 * Math.log10(meanSquare);
    
    // Step 2: 相対閾値 = 平均ラウドネス - 10dB
    const relativeThreshold = meanLoudness - 10.0;
    
    console.log(`Mean loudness after absolute gating: ${meanLoudness.toFixed(2)} LUFS`);
    console.log(`Relative threshold: ${relativeThreshold.toFixed(2)} LUFS`);
    
    // Step 3: 相対閾値より大きいブロックのみを残す
    const relativeGatedRMS = absoluteGatedRMS.filter(rms => {
      const blockLoudness = this.rmsToLufs(rms);
      return blockLoudness >= relativeThreshold;
    });
    
    console.log(`Blocks after relative gating: ${relativeGatedRMS.length}/${absoluteGatedRMS.length}`);
    
    return relativeGatedRMS;
  }

  private calculateIntegratedLoudness(gatedRMS: number[]): number {
    if (gatedRMS.length === 0) {
      console.log('No blocks remain after gating - returning -Infinity');
      return -Infinity;
    }

    // 最終的な統合ラウドネス計算
    const meanSquareSum = gatedRMS.reduce((sum, rms) => sum + rms * rms, 0);
    const meanSquare = meanSquareSum / gatedRMS.length;
    const integratedLoudness = -0.691 + 10 * Math.log10(meanSquare);
    
    console.log(`Final gated blocks: ${gatedRMS.length}`);
    console.log(`Final mean square: ${meanSquare}`);
    console.log(`Integrated loudness: ${integratedLoudness.toFixed(2)} LUFS`);
    
    return integratedLoudness;
  }

  private rmsToLufs(rms: number): number {
    // ITU-R BS.1770-4: LUFS = -0.691 + 10 * log10(meanSquare)
    // 但し、meanSquare は RMS^2 なので、実際は RMS の二乗を使用
    if (rms <= 0) return -Infinity;
    const meanSquare = rms * rms;
    return -0.691 + 10 * Math.log10(meanSquare);
  }

  // デバッグ用：計測過程の詳細を出力
  private debugMeasurement(): void {
    console.log('=== Loudness Measurement Debug ===');
    console.log(`Sample rate: ${this.sampleRate}Hz`);
    console.log(`Block size: ${this.blockSize} samples (${(this.blockSize / this.sampleRate * 1000).toFixed(1)}ms)`);
    console.log(`Step size: ${this.stepSize} samples (${(this.stepSize / this.sampleRate * 1000).toFixed(1)}ms)`);
    console.log(`Total RMS blocks: ${this.rmsBuffer.length}`);
    
    if (this.rmsBuffer.length > 0) {
      // 最初の数ブロックのLUFS値を表示
      const sampleBlocks = this.rmsBuffer.slice(0, 10);
      console.log('First 10 blocks RMS:', sampleBlocks.map(rms => rms.toExponential(3)));
      console.log('First 10 blocks LUFS:', sampleBlocks.map(rms => this.rmsToLufs(rms).toFixed(2)));
      
      // 統計情報
      const allLufs = this.rmsBuffer.map(rms => this.rmsToLufs(rms)).filter(lufs => lufs > -Infinity);
      if (allLufs.length > 0) {
        const minLufs = Math.min(...allLufs);
        const maxLufs = Math.max(...allLufs);
        const avgLufs = allLufs.reduce((sum, lufs) => sum + lufs, 0) / allLufs.length;
        console.log(`LUFS range: ${minLufs.toFixed(2)} to ${maxLufs.toFixed(2)}, average: ${avgLufs.toFixed(2)}`);
      } else {
        console.error('❌ 全てのブロックが -Infinity LUFS です！RMSが0またはNaNの可能性があります');
        console.log('RMS値サンプル:', this.rmsBuffer.slice(0, 5));
      }
      
      const absoluteGated = this.applyAbsoluteGating();
      console.log(`Blocks after absolute gating (-70 LUFS): ${absoluteGated.length}/${this.rmsBuffer.length}`);
      
      if (absoluteGated.length > 0) {
        const relativeGated = this.applyRelativeGating(absoluteGated);
        console.log(`Blocks after relative gating: ${relativeGated.length}/${absoluteGated.length}`);
        
        if (relativeGated.length === 0) {
          console.error('❌ 相対ゲーティング後にブロックが0個になりました！');
          console.log('絶対ゲーティング後の最初の5ブロックのLUFS:', 
            absoluteGated.slice(0, 5).map(rms => this.rmsToLufs(rms).toFixed(2)));
        }
      } else {
        console.error('❌ 絶対ゲーティング後にブロックが0個になりました！');
        console.log('全ブロックが -70 LUFS 未満です');
      }
    } else {
      console.error('❌ RMSブロックが生成されていません！');
    }
    console.log('=================================');
  }


}

export default function Loudness() {

  const [files, setFiles] = useState<File[]>([]);
  const [loudnessResult, setLoudnessResult] = useState<LoudnessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleMeasureLoudness = async () => {
    if (files.length === 0) {
      toast.error("ファイルが選択されていません");
      return;
    }

    setIsProcessing(true);
    toast.info("ラウドネス計測を開始: " + files[0].name);

    try {
      const loudnessMeter = new LoudnessMeter();
      const result = await loudnessMeter.processAudioFile(files[0]);
      
      setLoudnessResult(result);
      toast.success(`ラウドネス計測完了: ${result.integratedLufs.toFixed(2)} LUFS`);
    } catch (error) {
      console.error('ラウドネス計測エラー:', error);
      toast.error("ラウドネス計測に失敗しました");
      setLoudnessResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-8">
      
      {/* ハンバーガーメニュー */}
      <HamburgerMenu />

      <ToastContainer position="bottom-center" /> {/* Toastコンテナを追加 */}
      
      <h1 className="text-4xl font-bold text-gray-700 dark:text-gray-300 mb-6">
        ラウドネスメーター
      </h1>

      <div className="mt-8 text-center">
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
          音声ファイルのラウドネスを測定し、正確な音量を把握するためのツールです❗🔊
        </p>
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-6">
          ファイルをアップロードして、ラウドネスをチェックしましょう❗📊
        </p>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
        {/* ドラッグアンドドロップ＆クリックでファイル選択 */}
        <label htmlFor="file-upload" className="block cursor-pointer">
          <input
            id="file-upload"
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setFiles(files.length > 0 ? [files[0]] : []);
            }}
          />
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-4 text-center transition-colors duration-300 ease-in-out hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const files = Array.from(e.dataTransfer.files);
              setFiles(files.length > 0 ? [files[0]] : []);
            }}
          >
            <p className="text-gray-500 dark:text-gray-400">
              ここに音声ファイルをドラッグ＆ドロップ、またはクリックして選択してください❗
            </p>
          </div>
        </label>

        {/* 選択されているファイルを表示 */}
        <div className="mt-4 text-center">
          {files.length > 0 ? (
            <ul className="list-none p-0">
              {files.map((file, index) => (
                <li key={index} className="flex items-center justify-center gap-2 py-1 text-gray-700 dark:text-gray-300">
                  <span className="inline-block w-6 h-6 text-blue-300 dark:text-blue-300">
                    {/* 音楽ファイルアイコン（SVG） */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="24" height="24">
                      <path d="M9 17V5.5a1 1 0 0 1 .757-.97l8-2A1 1 0 0 1 19 3.5V15a3.5 3.5 0 1 1-2-3.163V7.28l-6 1.5V17a3.5 3.5 0 1 1-2-3.163Z" />
                    </svg>
                  </span>
                  <span className="truncate max-w-xs text-left">{file.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              まだファイルが選択されていません
            </p>
          )}
        </div>

        {/* 計測開始ボタン */}
        <div
          className={`mt-4 transition-all duration-300 ${
            files.length > 0 ? "opacity-100 max-h-20" : "opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          {files.length > 0 && (
            <button
              onClick={() => {
                // ラウドネス計測のロジックをここに追加
                handleMeasureLoudness();
                console.log("ラウドネス計測を開始");
              }}
              disabled={isProcessing}
              className={`w-full py-2 px-4 rounded-sm transition-all duration-300 text-white ${
                isProcessing 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700"
              }`}
            >
              {isProcessing ? "計測中..." : "ラウドネス計測を開始"}
            </button>
          )}
        </div>

        {/* ラウドネス計測結果 */}
        <div
          className={`
            transition-all duration-500 ease-in-out
            ${loudnessResult ? "opacity-100 max-h-[500px] mt-6" : "opacity-0 max-h-0 mt-0 overflow-hidden"}
          `}
        >
          {loudnessResult && (
            <div className="p-6 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900 rounded-lg shadow-lg flex flex-col items-center animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
          {/* Fancy loudness icon */}
          <span className="inline-block text-blue-500 dark:text-blue-300 mr-0">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="url(#loudness-gradient)" />
              <path d="M12 24V12h4l6-4v20l-6-4h-4z" fill="#fff" />
              <path d="M25 13c1.333 2 1.333 8 0 10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              <defs>
                <linearGradient id="loudness-gradient" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#60a5fa"/>
                  <stop offset="0.5" stopColor="#a78bfa"/>
                  <stop offset="1" stopColor="#f472b6"/>
                </linearGradient>
              </defs>
            </svg>
          </span>
          <h2 className="text-xl font-bold text-gray-700 dark:text-gray-100 tracking-wide drop-shadow -ml-0 mr-4">
            ラウドネス計測結果
          </h2>
              </div>
              <div className="flex flex-col items-center">
          <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-300 dark:via-purple-300 dark:to-pink-300 drop-shadow-lg mb-4 -mt-2 select-all">
            {loudnessResult.integratedLufs.toFixed(1)}
            <span className="text-2xl font-bold ml-1 align-super text-gray-500 dark:text-gray-300">LUFS</span>
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-300">
            統合ラウドネス
          </span>
              </div>
            </div>
          )}
        </div>

      </div>

      <div className="mt-8">
        <Link
          href="/"
          className="text-blue-500 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-500 transition"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}