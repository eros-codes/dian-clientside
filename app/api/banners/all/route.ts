import { NextResponse } from 'next/server';

const BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/banners/all`);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    // If backend is unreachable during SSG, return a safe empty response
    return NextResponse.json([], { status: 200 });
  }
}
