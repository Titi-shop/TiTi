import { NextResponse } from "next/server";
import { MongoClient, ServerApiVersion } from "mongodb";

export async function GET() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    return NextResponse.json({ success: false, error: "Missing MONGODB_URI" });
  }

  try {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    await client.connect();
    const admin = client.db("admin");
    const info = await admin.command({ ping: 1 });

    await client.close();

    return NextResponse.json({
      success: true,
      message: "✅ MongoDB connected successfully!",
      info,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
