import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { list } from "@vercel/blob";

export async function GET() {
  try {
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === "products.json");
    if (!file) return NextResponse.json({ message: "Không có file products.json" });

    const res = await fetch(file.url);
    const products = await res.json();

    const client = await clientPromise;
    const db = client.db("muasam_titi");

    await db.collection("products").deleteMany({});
    await db.collection("products").insertMany(products);

    return NextResponse.json({ success: true, imported: products.length });
  } catch (err) {
    console.error("❌ Lỗi migrate:", err);
    return NextResponse.json({ success: false, error: String(err) });
  }
}
