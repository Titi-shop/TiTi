import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { put } from "@vercel/blob";
import { Redis } from "@upstash/redis";

const avatarRedis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});


const redis = new Redis({ url: process.env.KV_URL! });
const client = new MongoClient(process.env.MONGODB_URI!);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file) return NextResponse.json({ error: "Không có file" }, { status: 400 });

    // Upload lên Blob Storage
    const blob = new R2Blob(process.env.BLOB_READ_WRITE_TOKEN!);
    const blobResult = await blob.upload(file.name, file);

    const avatarUrl = blobResult.url;

    // Cập nhật KV
    await redis.set(`avatar:${userId}`, avatarUrl);

    // Cập nhật MongoDB
    await client.connect();
    const db = client.db("titimall");
    await db.collection("users").updateOne(
      { uid: userId },
      { $set: { avatar: avatarUrl } },
      { upsert: true }
    );

    return NextResponse.json({ url: avatarUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}
