"use client";

import Header from "@/components/Header";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    // Check if admin is authenticated (client-side only)
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("adminAuthenticated") === "true";
      if (!isAuth) {
        router.push("/admin/login");
      } else {
        setAuthenticated(true);
        loadStats();
      }
    }
  }, [router]);

  const loadStats = () => {
    if (typeof window !== "undefined") {
      const bookings = JSON.parse(localStorage.getItem("pendingBookings") || "[]");
      setTotalBookings(bookings.length);
      
      const pending = bookings.filter((b: any) => b.status === "pending_approval");
      setPendingCount(pending.length);
      
      // Count today's bookings
      const today = new Date().toDateString();
      const todayBookings = bookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt).toDateString();
        return bookingDate === today;
      });
      setTodayCount(todayBookings.length);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminAuthenticated");
      localStorage.removeItem("adminEmail");
    }
    router.push("/admin/login");
  };

  if (!authenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-800">
      <Header />
      <main className="w-full px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <div className="flex gap-4">
              <button
                onClick={() => router.push("/admin/booking-slots")}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Manage Booking Slots
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-black mb-2">
                Total Bookings
              </h3>
              <p className="text-3xl font-bold text-blue-600">{totalBookings}</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-black mb-2">
                Today's Bookings
              </h3>
              <p className="text-3xl font-bold text-green-600">{todayCount}</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg cursor-pointer" onClick={() => router.push("/admin/bookings")}>
              <h3 className="text-lg font-semibold text-black mb-2">
                Pending Approvals
              </h3>
              <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
              {pendingCount > 0 && (
                <p className="text-sm text-orange-600 mt-2">Click to review →</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold text-black mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => router.push("/admin/bookings")}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded transition-colors text-left"
              >
                <div className="font-bold text-lg mb-1">Approve Bookings</div>
                <div className="text-sm opacity-90">
                  Review and approve pending bookings
                </div>
              </button>
              <button
                onClick={() => router.push("/admin/booking-slots")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded transition-colors text-left"
              >
                <div className="font-bold text-lg mb-1">Manage Booking Slots</div>
                <div className="text-sm opacity-90">
                  Configure available time slots
                </div>
              </button>
              <button
                onClick={() => router.push("/admin/pricing")}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded transition-colors text-left"
              >
                <div className="font-bold text-lg mb-1">Manage Pricing</div>
                <div className="text-sm opacity-90">
                  Set prices for rooms and services
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

