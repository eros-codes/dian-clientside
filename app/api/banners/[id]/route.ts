import { NextResponse, NextRequest } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

async function resolveIdParam(params: any) {
  // params can be a plain object or a Promise depending on Next internals
  const p = params && typeof params.then === 'function' ? await params : params;
  return p?.id as string | undefined;
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const id = (await context.params)?.id;
  if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 });
  const res = await fetch(`${BACKEND}/banners/${id}`);
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const id = (await context.params)?.id;
  if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 });
  const url = `${BACKEND}/banners/${id}`;
  const headers: any = {};
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const body = await req.arrayBuffer();
    const res = await fetch(url, { method: 'PATCH', headers, body });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } else {
    const json = await req.json();
    const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) }, body: JSON.stringify(json) });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const id = (await context.params)?.id;
  if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 });
  const res = await fetch(`${BACKEND}/banners/${id}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
