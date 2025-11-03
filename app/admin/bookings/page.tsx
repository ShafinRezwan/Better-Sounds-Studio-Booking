"use client";

import Header from "@/components/Header";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Booking {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  staff?: string;
  services?: string[];
  date?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  status: "pending_approval" | "approved" | "rejected";
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  adminNote?: string;
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [notificationMethod, setNotificationMethod] = useState<"email" | "sms" | "both">("both");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("adminAuthenticated") === "true";
      if (!isAuth) {
        router.push("/admin/login");
      } else {
        setAuthenticated(true);
        loadBookings();
      }
    }
  }, [router]);

  const loadBookings = () => {
    if (typeof window !== "undefined") {
      const savedBookings = localStorage.getItem("pendingBookings");
      if (savedBookings) {
        try {
          setBookings(JSON.parse(savedBookings));
        } catch (e) {
          console.error("Failed to load bookings", e);
        }
      }
    }
  };

  const sendNotification = (booking: Booking, type: "approved" | "rejected") => {
    // Mock notification sending - in production, this would call an API
    const message = type === "approved"
      ? `Booking ${booking.bookingId} approved! Your session is confirmed for ${booking.date} at ${booking.startTime}.`
      : `Booking ${booking.bookingId} was not approved. ${adminNote || "Please contact us for more information."}`;

    console.log(`Sending notification to ${booking.customerName}:`);
    
    if (notificationMethod === "email" || notificationMethod === "both") {
      console.log(`Email to ${booking.customerEmail}: ${message}`);
      // In production: call email API (Resend, SendGrid, etc.)
    }
    
    if (notificationMethod === "sms" || notificationMethod === "both") {
      console.log(`SMS to ${booking.customerPhone}: ${message}`);
      // In production: call SMS API (Twilio, etc.)
    }

    // Show alert to admin
    alert(`Notification sent via ${notificationMethod} to ${booking.customerName}!`);
  };

  const handleApprove = (booking: Booking) => {
    if (typeof window !== "undefined") {
      const updatedBookings = bookings.map((b) =>
        b.bookingId === booking.bookingId
          ? {
              ...b,
              status: "approved" as const,
              approvedAt: new Date().toISOString(),
              adminNote: adminNote,
            }
          : b
      );
      
      localStorage.setItem("pendingBookings", JSON.stringify(updatedBookings));
      setBookings(updatedBookings);
      
      // Send notification
      sendNotification(booking, "approved");
      
      // Close modal
      setSelectedBooking(null);
      setAdminNote("");
    }
  };

  const handleReject = (booking: Booking) => {
    if (!adminNote.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    if (typeof window !== "undefined") {
      const updatedBookings = bookings.map((b) =>
        b.bookingId === booking.bookingId
          ? {
              ...b,
              status: "rejected" as const,
              rejectedAt: new Date().toISOString(),
              adminNote: adminNote,
            }
          : b
      );
      
      localStorage.setItem("pendingBookings", JSON.stringify(updatedBookings));
      setBookings(updatedBookings);
      
      // Send notification
      sendNotification(booking, "rejected");
      
      // Close modal
      setSelectedBooking(null);
      setAdminNote("");
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === "all") return true;
    if (filter === "pending") return booking.status === "pending_approval";
    if (filter === "approved") return booking.status === "approved";
    if (filter === "rejected") return booking.status === "rejected";
    return true;
  });

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-800">
      <Header />
      <main className="w-full px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Manage Bookings</h1>
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6 bg-white rounded-lg p-4 shadow-lg">
            <div className="flex gap-4">
              {["all", "pending", "approved", "rejected"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as typeof filter)}
                  className={`px-4 py-2 rounded font-semibold transition-colors ${
                    filter === f
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-black hover:bg-gray-300"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === "pending" && (
                    <span className="ml-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs">
                      {bookings.filter((b) => b.status === "pending_approval").length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bookings List */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {filteredBookings.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No bookings found for this filter.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <div key={booking.bookingId} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-black">
                            {booking.bookingId}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              booking.status === "pending_approval"
                                ? "bg-orange-100 text-orange-700"
                                : booking.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {booking.status === "pending_approval"
                              ? "Pending Approval"
                              : booking.status === "approved"
                              ? "Approved"
                              : "Rejected"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-black">
                          <div>
                            <span className="text-gray-600">Customer:</span> {booking.customerName}
                          </div>
                          <div>
                            <span className="text-gray-600">Email:</span> {booking.customerEmail}
                          </div>
                          <div>
                            <span className="text-gray-600">Phone:</span> {booking.customerPhone}
                          </div>
                          <div>
                            <span className="text-gray-600">Staff:</span> {booking.staff || "N/A"}
                          </div>
                          <div>
                            <span className="text-gray-600">Room:</span> {booking.room || "N/A"}
                          </div>
                          <div>
                            <span className="text-gray-600">Date:</span> {booking.date || "N/A"}
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600">Time:</span> {booking.startTime} - {booking.endTime}
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600">Services:</span> {booking.services?.join(", ") || "N/A"}
                          </div>
                        </div>
                      </div>
                      {booking.status === "pending_approval" && (
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="ml-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Approval Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-black mb-4">Review Booking</h2>
            
            {/* Booking Details */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm text-black">
                <div><strong>Booking ID:</strong> {selectedBooking.bookingId}</div>
                <div><strong>Customer:</strong> {selectedBooking.customerName}</div>
                <div><strong>Email:</strong> {selectedBooking.customerEmail}</div>
                <div><strong>Phone:</strong> {selectedBooking.customerPhone}</div>
                <div><strong>Staff:</strong> {selectedBooking.staff}</div>
                <div><strong>Room:</strong> {selectedBooking.room}</div>
                <div className="col-span-2"><strong>Date:</strong> {selectedBooking.date}</div>
                <div className="col-span-2">
                  <strong>Time:</strong> {selectedBooking.startTime} - {selectedBooking.endTime}
                </div>
                <div className="col-span-2">
                  <strong>Services:</strong> {selectedBooking.services?.join(", ")}
                </div>
              </div>
            </div>

            {/* Notification Method */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-black mb-2">
                Send notification via
              </label>
              <select
                value={notificationMethod}
                onChange={(e) => setNotificationMethod(e.target.value as typeof notificationMethod)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-black"
              >
                <option value="both">Email & SMS</option>
                <option value="email">Email only</option>
                <option value="sms">SMS only</option>
              </select>
            </div>

            {/* Admin Note */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-black mb-2">
                Admin Note (optional for approval, required for rejection)
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                rows={3}
                placeholder="Add any notes or reasons here..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(selectedBooking)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded transition-colors"
              >
                Approve & Send Notification
              </button>
              <button
                onClick={() => handleReject(selectedBooking)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setAdminNote("");
                }}
                className="px-6 bg-gray-300 hover:bg-gray-400 text-black font-semibold py-3 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


