// app/api/test-mail/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: false, error: "mailer disabled" }, { status: 410 });
}
