"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  buyer: string;
  total: number;
  status: string;
  note?: string;
  createdAt: string;
  items: OrderItem[];
}

export default function PendingOrdersPage() {
  const { translate } = useLanguage();
  const { user, piReady } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState<number | null>(null);

  // ✅ Tải đơn hàng chờ xác nhận
  useEffect(() => {
    if (!piReady) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", { cache: "no-store" });
        const data: Order[] = await res.json();
        const filtered = data.filter(
          (o) =>
            o.buyer?.toLowerCase() === user.username.toLowerCase() &&
            ["Chờ xác nhận", "pending", "wait", "Đã thanh toán", "Chờ xác minh"].includes(
              o.status
            )
        );
        setOrders(filtered);
      } catch (err: any) {
        console.error("❌ Lỗi tải đơn hàng:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [piReady, user]);

  // ✅ Hủy đơn hàng
  const handleCancel = async (orderId: number) => {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này không?")) return;
    try {
      setProcessing(orderId);
      const res = await fetch(`/api/orders/cancel?id=${orderId}`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Hủy thất bại");
      alert("✅ Đã hủy đơn hàng thành công!");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (!piReady || loading)
    return (
      <main className="flex items-center justify-center min-h-screen text-gray-500">
        ⏳ Đang tải đơn hàng...
      </main>
    );

  if (error)
    return (
      <main className="text-center py-10 text-red-600">
        ❌ {error}
      </main>
    );

  if (!user)
    return (
      <main className="text-center py-10 text-gray-500">
        ⚠️ Vui lòng đăng nhập để xem đơn hàng của bạn.
      </main>
    );

  return (
    <main className="p-5 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-3">
        ⏳ {translate("waiting_confirm") || "Đơn hàng chờ xác nhận"}
      </h1>
      <p className="mb-3 text-gray-700">
        👤 Người dùng: <b>{user.username}</b>
      </p>

      {!orders.length ? (
        <p className="text-center text-gray-500">Không có đơn hàng chờ xác nhận.</p>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg p-4 bg-white shadow hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-semibold text-lg">🧾 Mã đơn: #{order.id}</h2>
                <button
                  onClick={() => handleCancel(order.id)}
                  disabled={processing === order.id}
                  className={`px-3 py-1 text-white rounded-md text-sm ${
                    processing === order.id
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {processing === order.id ? "Đang hủy..." : "❌ Hủy đơn"}
                </button>
              </div>

              <p>
                💰 Tổng tiền: <b>{order.total}</b> Pi
              </p>
              <p>📅 Ngày tạo: {new Date(order.createdAt).toLocaleString()}</p>

              {order.items?.length > 0 && (
                <ul className="list-disc ml-6 mt-2 text-gray-700">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.name} — {item.price} Pi × {item.quantity}
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-3 text-yellow-600 font-medium">
                Trạng thái: {order.status}
              </p>
              {order.note && (
                <p className="text-gray-500 italic text-sm mt-1">📝 {order.note}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
