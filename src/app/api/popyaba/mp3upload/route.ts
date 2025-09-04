import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import * as mm from 'music-metadata';
import { setCorsHeaders, createOptionsResponse, checkCorsOrigin, createCorsViolationResponse } from '@/lib/cors';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

// MP3の長さを取得する関数（簡易版）
async function getMp3Duration(buffer: Buffer): Promise<number> {
  try {
    const metadata = await mm.parseBuffer(buffer, 'audio/mpeg');
    return Math.round(metadata.format.duration || 0);
  } catch (error) {
    console.error('メタデータ取得エラー:', error);
    return 0;
  }
}

export async function OPTIONS(request: NextRequest) {
  return createOptionsResponse(request, ['POST', 'OPTIONS']);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // CORSチェック
  if (!checkCorsOrigin(origin)) {
    return createCorsViolationResponse(origin);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 });
    }

    // MP3ファイルかチェック
    if (!file.type.includes('audio/mpeg') && !file.name.toLowerCase().endsWith('.mp3')) {
      return NextResponse.json({ error: 'MP3ファイルのみアップロード可能です' }, { status: 400 });
    }

    // ファイルサイズ制限（例: 50MB）
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'ファイルサイズが大きすぎます（最大50MB）' }, { status: 400 });
    }

    // アップロードディレクトリを作成
    const uploadDir = path.join(process.cwd(), 'uploads-popyaba', 'mp3');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // ファイル名の処理（スペースをアンダースコアに置き換え + タイムスタンプ追加）
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    // スペースをアンダースコアに置き換え
    const sanitizedBaseName = baseName.replace(/\s+/g, '_');
    
    const fileName = `${sanitizedBaseName}_${timestamp}${extension}`;
    const filePath = path.join(uploadDir, fileName);

    // ファイルをバイナリデータとして読み取り
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ファイルを保存
    await writeFile(filePath, buffer);

    // MP3の長さを取得
    const duration = await getMp3Duration(buffer);

    // mp3list.jsonを更新
    const listPath = path.join(uploadDir, 'mp3list.json');
    let mp3List: Array<{fileName: string, originalName: string, duration: number, uploadDate: string}> = [];
    
    try {
      if (fs.existsSync(listPath)) {
        const listData = await readFile(listPath, 'utf-8');
        mp3List = JSON.parse(listData);
      }
    } catch (error) {
      console.error('mp3list.json読み込みエラー:', error);
      mp3List = [];
    }

    // 新しいエントリを追加
    mp3List.push({
      fileName: fileName,
      originalName: originalName,
      duration: duration,
      uploadDate: new Date().toISOString()
    });

    // mp3list.jsonを更新
    await writeFile(listPath, JSON.stringify(mp3List, null, 2), 'utf-8');

    // レスポンスにCORSヘッダーを追加
    const response = NextResponse.json({
      success: true,
      fileName: fileName,
      originalName: originalName,
      duration: duration,
      message: 'MP3ファイルが正常にアップロードされました'
    });

    return setCorsHeaders(response, origin);

  } catch (error) {
    console.error('アップロードエラー:', error);
    
    const response = NextResponse.json(
      { error: 'アップロード中にエラーが発生しました' },
      { status: 500 }
    );

    return setCorsHeaders(response, origin);
  }
}