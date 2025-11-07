import { NextResponse } from "next/server";
import { headers } from "next/headers";
import clientPromise from "@/lib/mongodb";

/**
 * ====================================
 * 🧩 TiTi Shop - API Quản lý sản phẩm
 * ------------------------------------
 * ✅ Sử dụng MongoDB
 * ✅ Giữ nguyên tính năng gốc
 * ✅ Ổn định trên Pi Browser + Vercel
 * ====================================
 */

/** Kiểm tra role người dùng có phải seller không */
async function isSeller(username: string): Promise<boolean> {
  try {
    const host = headers().get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/users/role?username=${username}`, {
      cache: "no-store",
    });

    if (!res.ok) return false;
    const data = await res.json();
    return data.role === "seller";
  } catch (err) {
    console.error("❌ Lỗi xác minh role seller:", err);
    return false;
  }
}

/** 🔹 GET - Lấy toàn bộ sản phẩm */
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("muasam_titi");
    const products = await db.collection("products").find().sort({ _id: -1 }).toArray();
    return NextResponse.json(products);
  } catch (err) {
    console.error("❌ Lỗi đọc sản phẩm:", err);
    return NextResponse.json([], { status: 500 });
  }
}

/** 🔹 POST - Tạo sản phẩm mới (chỉ seller được phép) */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, description, images, seller } = body;

    if (!name || !price || !seller) {
      return NextResponse.json(
        { success: false, message: "Thiếu tên, giá hoặc người bán" },
        { status: 400 }
      );
    }

    const sellerLower = seller.trim().toLowerCase();
    const canPost = await isSeller(sellerLower);

    if (!canPost) {
      return NextResponse.json(
        { success: false, message: "Tài khoản không có quyền đăng sản phẩm" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db("muasam_titi");

    const newProduct = {
      name,
      price,
      description: description || "",
      images: images?.map((img: any) => img.url || img) || [],
      seller: sellerLower,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("products").insertOne(newProduct);
    return NextResponse.json({ success: true, product: { ...newProduct, _id: result.insertedId } });
  } catch (err) {
    console.error("❌ POST error:", err);
    return NextResponse.json(
      { success: false, message: "Lỗi khi thêm sản phẩm" },
      { status: 500 }
    );
  }
}

/** 🔹 PUT - Cập nhật sản phẩm (chỉ chính chủ seller) */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, price, description, images, seller } = body;

    if (!id || !seller || !name || !price) {
      return NextResponse.json(
        { success: false, message: "Thiếu dữ liệu sản phẩm" },
        { status: 400 }
      );
    }

    const sellerLower = seller.trim().toLowerCase();
    const canEdit = await isSeller(sellerLower);
    if (!canEdit)
      return NextResponse.json(
        { success: false, message: "Không có quyền sửa sản phẩm" },
        { status: 403 }
      );

    const client = await clientPromise;
    const db = client.db("muasam_titi");

    const existing = await db.collection("products").findOne({ _id: new ObjectId(id) });
    if (!existing)
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );

    if (existing.seller.toLowerCase() !== sellerLower)
      return NextResponse.json(
        { success: false, message: "Không được sửa sản phẩm người khác" },
        { status: 403 }
      );

    const updated = {
      ...existing,
      name,
      price,
      description,
      images,
      updatedAt: new Date().toISOString(),
    };

    await db.collection("products").updateOne({ _id: existing._id }, { $set: updated });

    return NextResponse.json({ success: true, product: updated });
  } catch (err) {
    console.error("❌ PUT error:", err);
    return NextResponse.json(
      { success: false, message: "Không thể cập nhật sản phẩm" },
      { status: 500 }
    );
  }
}

/** 🔹 DELETE - Xóa sản phẩm (chỉ chính chủ seller) */
import { ObjectId } from "mongodb";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body = await req.json();
    const seller = (body?.seller || "").toLowerCase();

    if (!id || !seller)
      return NextResponse.json(
        { success: false, message: "Thiếu ID hoặc seller" },
        { status: 400 }
      );

    const canDelete = await isSeller(seller);
    if (!canDelete)
      return NextResponse.json(
        { success: false, message: "Không có quyền xóa sản phẩm" },
        { status: 403 }
      );

    const client = await clientPromise;
    const db = client.db("muasam_titi");

    const product = await db.collection("products").findOne({ _id: new ObjectId(id) });
    if (!product)
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );

    if (product.seller.toLowerCase() !== seller)
      return NextResponse.json(
        { success: false, message: "Không được xóa sản phẩm của người khác" },
        { status: 403 }
      );

    await db.collection("products").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE error:", err);
    return NextResponse.json(
      { success: false, message: "Lỗi khi xóa sản phẩm" },
      { status: 500 }
    );
  }
}
