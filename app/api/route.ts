import { NextRequest, NextResponse } from 'next/server';
import { handleNextApiRequest } from '@/lib/http/next-adapter';

export async function GET(req: NextRequest) {
  return handleNextApiRequest(req);
}

export async function POST(req: NextRequest) {
  return handleNextApiRequest(req);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-key'
    }
  });
}
