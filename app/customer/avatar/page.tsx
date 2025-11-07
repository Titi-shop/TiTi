"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { Upload, ArrowLeft } from "lucide-react";

export default function AvatarPage() {
  const router = useRouter();
  const { user, piReady } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Khi đã sẵn sàng Pi & user, load avatar hiện tại
  useEffect(() => {
    if (piReady && !user) {
      router.replace("/pilogin");
      return;
    }
    if (!user) return;

    const loadAvatar = async () => {
      try {
        const res = await fetch(`/api/getAvatar?userId=${user.uid}`);
        if (!res.ok) throw new Error("Không tải được ảnh đại diện");
        const data = await res.json();
        setAvatar(data.url || null);
      } catch (err: any) {
        console.error("⚠️ Lỗi tải avatar:", err);
      }
    };
    loadAvatar();
  }, [piReady, user, router]);

  // 📤 Hàm xử lý khi người dùng chọn ảnh mới
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const previewURL = URL.createObjectURL(file);
    setPreview(previewURL);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", user.uid);

    try {
      setUploading(true);
      const res = await fetch("/api/uploadAvatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setAvatar(data.url);
        setPreview(null);
        alert("✅ Ảnh đại diện đã được cập nhật!");
      } else {
        alert("❌ Lỗi tải ảnh: " + data.error);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("⚠️ Không thể tải ảnh lên máy chủ.");
    } finally {
      setUploading(false);
    }
  };

  if (!piReady || !user)
    return <div className="min-h-screen bg-gray-100"></div>;

  return (
    <main className="min-h-screen bg-gray-50 pb-10">
      {/* ===== Thanh tiêu đề ===== */}
      <div className="flex items-center bg-white p-4 shadow-sm">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-orange-500"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 mx-auto">
          Ảnh đại diện
        </h1>
      </div>

      {/* ===== Khu vực avatar ===== */}
      <div className="flex flex-col items-center mt-8">
        <div className="relative w-32 h-32">
          {preview ? (
            <Image
              src={preview}
              alt="Preview"
              fill
              className="rounded-full object-cover border-4 border-orange-500"
            />
          ) : avatar ? (
            <Image
              src={avatar}
              alt="Avatar"
              fill
              className="rounded-full object-cover border-4 border-orange-500"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-orange-400 text-white flex items-center justify-center text-4xl font-bold border-4 border-orange-500">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Nút upload */}
          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 bg-orange-500 p-2 rounded-full cursor-pointer hover:bg-orange-600 transition"
          >
            <Upload size={18} className="text-white" />
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-gray-800">
          {user.username}
        </h2>

        {uploading && (
          <p className="text-sm text-gray-500 mt-2">⏳ Đang tải ảnh lên...</p>
        )}

        <button
          onClick={() => router.back()}
          className="mt-6 text-blue-600 hover:underline text-sm"
        >
          ← Quay lại
        </button>
      </div>
    </main>
  );
}
