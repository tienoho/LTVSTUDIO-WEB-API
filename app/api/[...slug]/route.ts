import { NextRequest, NextResponse } from 'next/server';
import { handleNextApiRequest } from '@/lib/http/next-adapter';

export async function GET(req: NextRequest, props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;
  return handleNextApiRequest(req, params);
}

export async function POST(req: NextRequest, props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;
  return handleNextApiRequest(req, params);
}

export async function PUT(req: NextRequest, props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;
  return handleNextApiRequest(req, params);
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ slug: string[] }> }) {
  const params = await props.params;
  return handleNextApiRequest(req, params);
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
