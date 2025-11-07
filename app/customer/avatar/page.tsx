"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AvatarPage() {
  const { user, piReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
    }
  }, [piReady, user, router]);

  if (!piReady || !user) {
    return <div className="min-h-screen bg-gray-100"></div>;
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-6 rounded-xl shadow-lg text-center w-80">
        <div className="w-24 h-24 bg-orange-500 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-lg font-semibold text-gray-800 mb-2">
          {user.username}
        </h1>
        <p className="text-gray-600 text-sm mb-4">
          Trang quản lý ảnh đại diện
        </p>

        <button
          onClick={() => alert("📸 Tính năng tải ảnh sẽ được thêm sau")}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
        >
          📸 Thay đổi ảnh đại diện
        </button>

        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:underline text-sm block mx-auto"
        >
          ← Quay lại
        </button>
      </div>
    </main>
  );
}
