import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { setCorsHeaders, createOptionsResponse, checkCorsOrigin, createCorsViolationResponse } from '@/lib/cors';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

interface Mp3Item {
  fileName: string;
  originalName: string;
  duration: number;
  uploadDate: string;
}

// プリフライトリクエスト対応
export async function OPTIONS(request: NextRequest) {
  return createOptionsResponse(request, ['DELETE', 'OPTIONS']);
}

// MP3ファイル削除エンドポイント
export async function DELETE(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // CORSチェック
  if (!checkCorsOrigin(origin)) {
    return createCorsViolationResponse(origin);
  }

  try {
    const { searchParams } = new URL(request.url);
    let fileName = searchParams.get('fileName');
    
    // クエリパラメータにない場合はリクエストボディから取得
    if (!fileName) {
      try {
        const body = await request.json();
        fileName = body.fileName;
      } catch {
        // JSON解析失敗時は無視
      }
    }

    // ファイル名の検証
    if (!fileName || typeof fileName !== 'string' || fileName.trim() === '') {
      return setCorsHeaders(
        NextResponse.json({
          success: false,
          error: 'ファイル名が指定されていません',
          message: 'fileNameパラメータまたはリクエストボディにfileNameを指定してください'
        }, { status: 400 }),
        origin
      );
    }

    // セキュリティ: パストラバーサル攻撃を防ぐ
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return setCorsHeaders(
        NextResponse.json({
          success: false,
          error: '無効なファイル名です',
          message: 'ファイル名に無効な文字が含まれています'
        }, { status: 400 }),
        origin
      );
    }

    const uploadDir = path.join(process.cwd(), 'uploads-popyaba', 'mp3');
    const filePath = path.join(uploadDir, fileName);
    const listPath = path.join(uploadDir, 'mp3list.json');

    // ファイルが存在するかチェック
    if (!fs.existsSync(filePath)) {
      return setCorsHeaders(
        NextResponse.json({
          success: false,
          error: 'ファイルが見つかりません',
          fileName: fileName,
          message: '指定されたファイルは存在しません'
        }, { status: 404 }),
        origin
      );
    }

    // mp3list.jsonの読み込みと更新
    let mp3List: Mp3Item[] = [];
    let deletedItem: Mp3Item | null = null;
    
    if (fs.existsSync(listPath)) {
      try {
        const listData = await readFile(listPath, 'utf-8');
        mp3List = JSON.parse(listData);
        
        // 削除対象のアイテムを検索
        const itemIndex = mp3List.findIndex(item => item.fileName === fileName);
        if (itemIndex !== -1) {
          deletedItem = mp3List[itemIndex];
          mp3List.splice(itemIndex, 1);
        }
      } catch (error) {
        console.error('mp3list.json読み込みエラー:', error);
        // JSONファイルの破損がある場合でもファイル削除は続行
      }
    }

    // 物理ファイルを削除
    try {
      await unlink(filePath);
    } catch (error) {
      console.error('ファイル削除エラー:', error);
      return setCorsHeaders(
        NextResponse.json({
          success: false,
          error: 'ファイルの削除に失敗しました',
          details: error instanceof Error ? error.message : '不明なエラー'
        }, { status: 500 }),
        origin
      );
    }

    // mp3list.jsonを更新
    try {
      await writeFile(listPath, JSON.stringify(mp3List, null, 2), 'utf-8');
    } catch (error) {
      console.error('mp3list.json更新エラー:', error);
      // ファイルは削除されたが、リストの更新に失敗した場合の警告
    }

    // 成功レスポンス
    return setCorsHeaders(
      NextResponse.json({
        success: true,
        message: 'MP3ファイルが正常に削除されました',
        deletedFile: {
          fileName: fileName,
          originalName: deletedItem?.originalName || '不明',
          duration: deletedItem?.duration || 0,
          uploadDate: deletedItem?.uploadDate || '不明'
        },
        remainingCount: mp3List.length
      }),
      origin
    );

  } catch (error) {
    console.error('MP3削除処理エラー:', error);
    
    return setCorsHeaders(
      NextResponse.json({
        success: false,
        error: 'サーバー内部エラーが発生しました',
        details: error instanceof Error ? error.message : '不明なエラー'
      }, { status: 500 }),
      origin
    );
  }
}

// 他のHTTPメソッドに対する405エラー
export async function GET() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}

export async function POST() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}

export async function PUT() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}

export async function PATCH() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}