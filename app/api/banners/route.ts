import { NextResponse, NextRequest } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export async function GET() {
  const res = await fetch(`${BACKEND}/banners`);
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  // Forward multipart/form-data directly to backend
  const url = `${BACKEND}/banners`;
  const headers: any = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  const body = await req.arrayBuffer();
  const res = await fetch(url, { method: 'POST', headers, body });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
