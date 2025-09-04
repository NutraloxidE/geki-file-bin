import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { setCorsHeaders, createOptionsResponse, checkCorsOrigin, createCorsViolationResponse } from '@/lib/cors';

const readFile = promisify(fs.readFile);

interface Mp3Item {
  fileName: string;
  originalName: string;
  duration: number;
  uploadDate: string;
}

export async function OPTIONS(request: NextRequest) {
  return createOptionsResponse(request, ['GET', 'OPTIONS']);
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // デバッグログを追加
  console.log('GET /api/popyaba/mp3getlist - Origin:', origin);
  console.log('GET /api/popyaba/mp3getlist - Headers:', Object.fromEntries(request.headers.entries()));
  
  // CORSチェック
  if (!checkCorsOrigin(origin)) {
    console.log('CORS violation in mp3getlist - Origin:', origin);
    return createCorsViolationResponse(origin);
  }

  try {
    // クエリパラメータを取得
    const { searchParams } = new URL(request.url);
    const minDuration = searchParams.get('minDuration');
    const maxDuration = searchParams.get('maxDuration');
    const sortBy = searchParams.get('sortBy') || 'uploadDate'; // uploadDate, duration, originalName
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // asc, desc
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset') || '0';

    // mp3list.jsonを読み込み
    const listPath = path.join(process.cwd(), 'uploads-popyaba', 'mp3', 'mp3list.json');
    
    if (!fs.existsSync(listPath)) {
      const response = NextResponse.json({
        success: true,
        data: [],
        total: 0,
        message: 'MP3リストが見つかりません'
      });

      return setCorsHeaders(response, origin);
    }

    const listData = await readFile(listPath, 'utf-8');
    let mp3List: Mp3Item[] = JSON.parse(listData);

    // 時間でのフィルタリング
    if (minDuration !== null) {
      const minDur = parseInt(minDuration);
      if (!isNaN(minDur)) {
        mp3List = mp3List.filter(item => item.duration >= minDur);
      }
    }

    if (maxDuration !== null) {
      const maxDur = parseInt(maxDuration);
      if (!isNaN(maxDur)) {
        mp3List = mp3List.filter(item => item.duration <= maxDur);
      }
    }

    // ソート
    mp3List.sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      switch (sortBy) {
        case 'duration':
          valueA = a.duration;
          valueB = b.duration;
          break;
        case 'originalName':
          valueA = a.originalName.toLowerCase();
          valueB = b.originalName.toLowerCase();
          break;
        case 'uploadDate':
        default:
          valueA = new Date(a.uploadDate).getTime();
          valueB = new Date(b.uploadDate).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });

    // ページネーション
    const offsetNum = parseInt(offset);
    const limitNum = limit ? parseInt(limit) : undefined;
    const total = mp3List.length;
    
    if (limitNum) {
      mp3List = mp3List.slice(offsetNum, offsetNum + limitNum);
    } else if (offsetNum > 0) {
      mp3List = mp3List.slice(offsetNum);
    }

    // レスポンス作成
    const response = NextResponse.json({
      success: true,
      data: mp3List,
      total: total,
      returned: mp3List.length,
      filters: {
        minDuration: minDuration ? parseInt(minDuration) : null,
        maxDuration: maxDuration ? parseInt(maxDuration) : null,
        sortBy,
        sortOrder,
        limit: limitNum || null,
        offset: offsetNum
      },
      message: 'MP3リストを正常に取得しました'
    });

    return setCorsHeaders(response, origin);

  } catch (error) {
    console.error('MP3リスト取得エラー:', error);
    
    const response = NextResponse.json(
      { 
        success: false,
        error: 'MP3リスト取得中にエラーが発生しました',
        data: [],
        total: 0
      },
      { status: 500 }
    );

    return setCorsHeaders(response, origin);
  }
}