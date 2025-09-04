import { NextRequest, NextResponse } from 'next/server';

// 許可されたオリジンリスト
export const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://dev.popism.info',
  'https://popism.info',
  'http://193.186.4.181',
  'https://193.186.4.181',
  'http://files.gekiyaba.party',
  'https://files.gekiyaba.party',
  // 本番環境のドメインを追加（適宜修正してください）
  'https://geki-file-bin.vercel.app',
  'https://geki-file-bin-git-main-nutraloxides-projects.vercel.app',
  'https://geki-file-bin-nutraloxides-projects.vercel.app',
];

// CORSヘッダーを設定する共通関数
export function setCorsHeaders(response: NextResponse, origin: string | null) {
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// プリフライトリクエスト対応の共通関数
export function createOptionsResponse(request: NextRequest, allowedMethods: string[] = ['GET', 'POST', 'DELETE', 'OPTIONS']) {
  const origin = request.headers.get('origin');
  
  const response = new NextResponse(null, { status: 200 });
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', allowedMethods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Max-Age', '86400');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

// CORS違反チェックの共通関数
export function checkCorsOrigin(origin: string | null): boolean {
  return origin !== null && allowedOrigins.includes(origin);
}

// CORS違反時のレスポンス生成
export function createCorsViolationResponse(origin: string | null): NextResponse {
  // デバッグ用ログ
  console.log('CORS violation - Origin:', origin);
  console.log('Allowed origins:', allowedOrigins);
  
  return setCorsHeaders(
    new NextResponse('CORS policy violation', { status: 403 }),
    origin
  );
}
