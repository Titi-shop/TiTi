"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Không thể tải sản phẩm");
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (e: any) {
        console.error("❌ Lỗi tải sản phẩm:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  if (loading)
    return <p className="text-center mt-10 text-gray-500">⏳ Đang tải sản phẩm...</p>;

  if (error)
    return (
      <p className="text-center mt-10 text-red-500">
        ⚠️ Lỗi: {error} <br /> Hãy kiểm tra API /api/products.
      </p>
    );

  return (
    <main className="bg-gray-100 min-h-screen pb-20">
      {/* ❌ Bỏ tiêu đề “Sản phẩm” để giao diện giống Shopee */}

      {products.length === 0 ? (
        <p className="text-center text-gray-500 mt-4">Chưa có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 bg-gray-100">
          {products.map((p: any) => (
            <div
              key={p.id}
              onClick={() => router.push(`/product/${p.id}`)}
              className="bg-white cursor-pointer border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              {p.images?.[0] ? (
                <img
                  src={p.images[0]}
                  alt={p.name}
                  loading="lazy"
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                  Không có ảnh
                </div>
              )}
              <div className="p-2">
                <h2 className="text-[13px] font-medium text-gray-800 line-clamp-2 leading-tight">
                  {p.name}
                </h2>
                <p className="text-orange-600 font-bold text-[13px] mt-1">
                  {p.price} Pi
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
