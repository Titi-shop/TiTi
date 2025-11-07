"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, ArrowLeft } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // ✅ Lấy thông tin user khi mở trang
  useEffect(() => {
    const stored =
      localStorage.getItem("pi_user") || localStorage.getItem("user_info");

    if (!stored) {
      setError("❌ Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(stored);
      const pi_uid = user?.user?.uid || user?.pi_uid || null;
      const username = user?.user?.username || user?.username || "guest_user";

      if (!pi_uid && !username) {
        setError("Không tìm thấy thông tin tài khoản.");
        setLoading(false);
        return;
      }

      fetch(`/api/profile?pi_uid=${pi_uid || ""}&username=${username || ""}`)
        .then(async (res) => {
          if (!res.ok) throw new Error("Lỗi kết nối đến máy chủ");
          const data = await res.json();
          setProfile(data || {});
          setAvatar(data?.avatar || null);
        })
        .catch(() => setError("Không tải được hồ sơ."))
        .finally(() => setLoading(false));
    } catch (err) {
      console.error("Lỗi parse user:", err);
      setError("Dữ liệu người dùng không hợp lệ.");
      setLoading(false);
    }
  }, []);

  // 📸 Xử lý upload ảnh đại diện
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewURL = URL.createObjectURL(file);
    setPreview(previewURL);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await fetch("/api/uploadAvatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setAvatar(data.url);
        setProfile((prev: any) => ({ ...prev, avatar: data.url }));
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

  if (loading) return <p className="p-4 text-center">⏳ Đang tải...</p>;
  if (error)
    return (
      <main className="p-4 text-center text-red-500">
        <p>{error}</p>
        <button
          onClick={() => router.replace("/pilogin")}
          className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
        >
          🔐 Đăng nhập lại
        </button>
      </main>
    );

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
          Thông tin tài khoản
        </h1>
      </div>

      {/* ===== Avatar ===== */}
      <div className="flex flex-col items-center mt-8">
        <div className="relative w-28 h-28">
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
            <div className="w-28 h-28 rounded-full bg-orange-200 text-orange-600 flex items-center justify-center text-4xl font-bold border-4 border-orange-500">
              {profile?.username?.charAt(0).toUpperCase()}
            </div>
          )}

          {/* 📤 Nút đổi ảnh */}
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

        <p className="mt-4 text-lg font-semibold text-gray-800">
          {profile?.displayName || profile?.username}
        </p>
        {uploading && <p className="text-sm text-gray-500 mt-2">Đang tải ảnh...</p>}
      </div>

      {/* ===== Thông tin khác ===== */}
      <div className="bg-white mt-6 mx-4 p-4 rounded-lg shadow">
        <p>
          <strong>Email:</strong> {profile.email || "(chưa có)"}
        </p>
        <p className="mt-2">
          <strong>Điện thoại:</strong> {profile.phone || "(chưa có)"}
        </p>
        <p className="mt-2">
          <strong>Địa chỉ:</strong> {profile.address || "(chưa có)"}
        </p>
      </div>
    </main>
  );
}
