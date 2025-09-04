import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import * as mm from 'music-metadata';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

// 許可されたオリジンリスト
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://dev.popism.info',
  'https://popism.info',
  'http://193.186.4.181',
  'https://193.186.4.181'
];

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
  const origin = request.headers.get('origin');
  
  const response = new NextResponse(null, { status: 200 });
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Content-Disposition');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // CORSチェック
  if (origin && !allowedOrigins.includes(origin)) {
    return new NextResponse('CORS policy violation', { status: 403 });
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

    // ファイル名の処理（重複回避のためタイムスタンプを追加）
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const fileName = `${baseName}_${timestamp}${extension}`;
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

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;

  } catch (error) {
    console.error('アップロードエラー:', error);
    
    const response = NextResponse.json(
      { error: 'アップロード中にエラーが発生しました' },
      { status: 500 }
    );

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    return response;
  }
}