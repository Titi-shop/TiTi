import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

/**
 * 🧾 TiTi Shop - API Đơn hàng (MongoDB)
 * -------------------------------------
 * ✅ Giữ nguyên toàn bộ logic cũ
 * ✅ Dùng MongoDB để lưu thật
 * ✅ Không cần @vercel/kv nữa
 */

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("muasam_titi");
    const orders = await db.collection("orders").find().sort({ _id: -1 }).toArray();
    return NextResponse.json(orders);
  } catch (err) {
    console.error("❌ GET /orders:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const order = await req.json();

    const newOrder = {
      id: order.id ?? `ORD-${Date.now()}`,
      buyer: order.buyer || "unknown",
      items: order.items ?? [],
      total: Number(order.total ?? 0),
      status: order.status ?? "Chờ xác nhận",
      note: order.note ?? "",
      shipping: order.shipping ?? {},
      paymentId: order.paymentId ?? "",
      txid: order.txid ?? "",
      createdAt: order.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const client = await clientPromise;
    const db = client.db("muasam_titi");
    await db.collection("orders").insertOne(newOrder);

    console.log("🧾 [ORDER CREATED]:", newOrder);
    return NextResponse.json({ success: true, order: newOrder });
  } catch (err) {
    console.error("❌ POST /orders:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, status, txid } = await req.json();

    const client = await clientPromise;
    const db = client.db("muasam_titi");

    const existing = await db.collection("orders").findOne({ id });
    if (!existing)
      return NextResponse.json(
        { success: false, message: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );

    const updated = {
      ...existing,
      status: status || existing.status,
      txid: txid || existing.txid,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("orders").updateOne({ id }, { $set: updated });

    console.log("🔄 [ORDER UPDATED]:", updated);
    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error("❌ PUT /orders:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
