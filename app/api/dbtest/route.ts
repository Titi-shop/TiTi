import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("muasam_titi");
    const result = await db.command({ ping: 1 });
    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("❌ MongoDB error:", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
