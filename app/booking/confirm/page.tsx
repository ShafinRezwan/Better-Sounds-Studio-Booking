"use client";

import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface BookingData {
  staff?: string;
  services?: string[];
  date?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  roomId?: string;
}

interface PriceBreakdown {
  roomPrice: number;
  roomName: string;
  roomPerHour: boolean;
  servicePrices: Array<{ name: string; price: number; perHour: boolean }>;
  durationHours: number;
  subtotal: number;
  total: number;
}

export default function ConfirmPage() {
  const router = useRouter();
  const [bookingData, setBookingData] = useState<BookingData>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    // Load booking data from localStorage
    if (typeof window !== "undefined") {
      const staffData = localStorage.getItem("pendingStaffData");
      const timeData = localStorage.getItem("pendingTimeData");
      const roomData = localStorage.getItem("pendingBookingData");
      
      const data: BookingData = {};
      
      if (staffData) {
        try {
          const parsed = JSON.parse(staffData);
          Object.assign(data, parsed);
        } catch (e) {
          console.error("Failed to parse staff data", e);
        }
      }
      
      if (timeData) {
        try {
          const parsed = JSON.parse(timeData);
          Object.assign(data, parsed);
        } catch (e) {
          console.error("Failed to parse time data", e);
        }
      }
      
      if (roomData) {
        try {
          const parsed = JSON.parse(roomData);
          Object.assign(data, parsed);
        } catch (e) {
          console.error("Failed to parse room data", e);
        }
      }
      
      setBookingData(data);
      
      // Calculate total price
      calculateTotal(data);
    }
  }, []);

  const calculateTotal = (data: BookingData) => {
    if (typeof window === "undefined") return;
    
    let total = 0;
    const breakdown: PriceBreakdown = {
      roomPrice: 0,
      roomName: "",
      roomPerHour: false,
      servicePrices: [],
      durationHours: 1,
      subtotal: 0,
      total: 0,
    };
    
    // Load pricing
    const servicePrices = JSON.parse(localStorage.getItem("servicePrices") || "[]");
    const roomPrices = JSON.parse(localStorage.getItem("roomPrices") || "[]");
    
    // Calculate duration in hours
    let durationHours = 1;
    if (data.startTime && data.endTime) {
      // Calculate actual duration
      const start = parseTime(data.startTime);
      const end = parseTime(data.endTime);
      
      // Handle overnight bookings
      if (end <= start) {
        durationHours = (24 * 60 - start + end) / 60;
      } else {
        durationHours = (end - start) / 60;
      }
      
      durationHours = Math.max(1, durationHours); // Minimum 1 hour
    }
    
    breakdown.durationHours = durationHours;
    
    // Add room price
    if (data.roomId) {
      const roomPrice = roomPrices.find((r: any) => r.id === data.roomId);
      if (roomPrice) {
        const price = roomPrice.perHour ? roomPrice.basePrice * durationHours : roomPrice.basePrice;
        breakdown.roomPrice = price;
        breakdown.roomName = data.room || roomPrice.name;
        breakdown.roomPerHour = roomPrice.perHour;
        total += price;
      }
    }
    
    // Add service prices
    if (data.services && data.services.length > 0) {
      data.services.forEach((serviceName: string) => {
        const servicePrice = servicePrices.find((s: any) => s.name === serviceName);
        if (servicePrice) {
          const price = servicePrice.perHour ? servicePrice.basePrice * durationHours : servicePrice.basePrice;
          breakdown.servicePrices.push({
            name: serviceName,
            price: price,
            perHour: servicePrice.perHour,
          });
          total += price;
        }
      });
    }
    
    breakdown.subtotal = total;
    breakdown.total = total;
    
    setTotalPrice(total);
    setPriceBreakdown(breakdown);
  };

  // Helper function to parse time string to minutes
  const parseTime = (timeStr: string): number => {
    const [time, ampm] = timeStr.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let totalMinutes = hours * 60 + minutes;
    
    if (ampm === "PM" && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (ampm === "AM" && hours === 12) {
      totalMinutes = minutes;
    }
    
    return totalMinutes;
  };

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; phone?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(phone)) {
      newErrors.phone = "Invalid phone format (e.g., 123-456-7890)";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validateForm()) {
      return;
    }

    // In production, this would submit the booking to the backend
    if (typeof window !== "undefined") {
      // Create the booking record
      const bookingRecord = {
        ...bookingData,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        status: "pending_approval",
        createdAt: new Date().toISOString(),
        bookingId: `BK-${Date.now()}`,
      };
      
      // Save to pending bookings
      const existingBookings = localStorage.getItem("pendingBookings");
      const bookings = existingBookings ? JSON.parse(existingBookings) : [];
      bookings.push(bookingRecord);
      localStorage.setItem("pendingBookings", JSON.stringify(bookings));
      
      // Clear pending booking data
      localStorage.removeItem("pendingStaffData");
      localStorage.removeItem("pendingBookingData");
      localStorage.removeItem("pendingTimeData");
    }
    alert("Booking submitted! Awaiting admin approval. You will receive a confirmation email/SMS once approved.");
    // Redirect to home or booking list
    router.push("/");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-800">
      <Header />
      <main className="w-full px-4 py-6">
        {/* Main Content Card - White Background */}
        <div className="mx-auto max-w-md bg-white rounded-lg p-6 shadow-lg">
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col items-center flex-1">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mb-1">
                  <div className="w-4 h-4 rounded-full bg-white"></div>
                </div>
                <span className="text-black text-xs">Pick a time</span>
              </div>
              <div className="flex-1 h-0.5 bg-green-500 mx-2"></div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mb-1">
                  <div className="w-4 h-4 rounded-full bg-white"></div>
                </div>
                <span className="text-black text-xs">Your details</span>
              </div>
              <div className="flex-1 h-0.5 bg-green-500 mx-2"></div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mb-1">
                  <div className="w-4 h-4 rounded-full bg-white"></div>
                </div>
                <span className="text-black text-xs">Confirm</span>
              </div>
            </div>
          </div>

          {/* User Details Form */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-black mb-4">Your Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 border rounded text-black ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 border rounded text-black ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full px-4 py-3 border rounded text-black ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="123-456-7890"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="mb-6 border-t border-gray-300 pt-6">
            <h2 className="text-xl font-bold text-black mb-4">
              Booking Summary
            </h2>

            {/* Staff Member */}
            {bookingData.staff && (
              <div className="mb-4 pb-4 border-b border-gray-300">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Staff Member</h3>
                <p className="text-lg font-bold text-black">{bookingData.staff}</p>
              </div>
            )}

            {/* Service */}
            {bookingData.services && bookingData.services.length > 0 && (
              <div className="mb-4 pb-4 border-b border-gray-300">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Service{bookingData.services.length > 1 ? "s" : ""}</h3>
                <p className="text-lg font-bold text-black">{bookingData.services.join(", ")}</p>
              </div>
            )}

            {/* Date & Time */}
            {bookingData.date && (
              <div className="mb-4 pb-4 border-b border-gray-300">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Date & Time</h3>
                <p className="text-lg font-bold text-black">{bookingData.date}</p>
                {bookingData.startTime && bookingData.endTime && (
                  <p className="text-sm text-gray-600">
                    {bookingData.startTime} - {bookingData.endTime}
                  </p>
                )}
              </div>
            )}

            {/* Room */}
            {bookingData.room && (
              <div className="mb-4 pb-4 border-b border-gray-300">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Room</h3>
                <p className="text-lg font-bold text-black">{bookingData.room}</p>
              </div>
            )}

            {/* Total with Breakdown */}
            <div className="mb-6 pt-4">
              <div 
                className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded -mx-2"
                onClick={() => setShowBreakdown(!showBreakdown)}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-black">Estimated Total</h3>
                  <button className="text-gray-500 hover:text-gray-700">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className={`transform transition-transform ${showBreakdown ? "rotate-180" : ""}`}
                    >
                      <path d="M4 6l4 4 4-4H4z" />
                    </svg>
                  </button>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ${totalPrice.toFixed(2)}
                </p>
              </div>
              
              {/* Price Breakdown Dropdown */}
              {showBreakdown && priceBreakdown && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-black mb-3">Price Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    {/* Duration */}
                    <div className="flex justify-between text-gray-600">
                      <span>Duration:</span>
                      <span className="font-semibold">{priceBreakdown.durationHours.toFixed(1)} hour{priceBreakdown.durationHours !== 1 ? "s" : ""}</span>
                    </div>
                    
                    {/* Room Price */}
                    {priceBreakdown.roomPrice > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">
                          {priceBreakdown.roomName}
                          {priceBreakdown.roomPerHour && (
                            <span className="text-xs text-gray-500 ml-1">
                              (${(priceBreakdown.roomPrice / priceBreakdown.durationHours).toFixed(2)}/hr × {priceBreakdown.durationHours.toFixed(1)}hr)
                            </span>
                          )}
                        </span>
                        <span className="font-semibold text-black">
                          ${priceBreakdown.roomPrice.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {/* Service Prices */}
                    {priceBreakdown.servicePrices.map((service, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-gray-700">
                          {service.name}
                          {service.perHour && (
                            <span className="text-xs text-gray-500 ml-1">
                              (${(service.price / priceBreakdown.durationHours).toFixed(2)}/hr × {priceBreakdown.durationHours.toFixed(1)}hr)
                            </span>
                          )}
                        </span>
                        <span className="font-semibold text-black">
                          ${service.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    
                    {/* Subtotal */}
                    <div className="flex justify-between pt-2 mt-2 border-t border-gray-300">
                      <span className="font-semibold text-black">Subtotal:</span>
                      <span className="font-semibold text-black">
                        ${priceBreakdown.subtotal.toFixed(2)}
                      </span>
                    </div>
                    
                    {/* Total */}
                    <div className="flex justify-between pt-2 border-t-2 border-gray-400">
                      <span className="font-bold text-black text-lg">Total:</span>
                      <span className="font-bold text-green-600 text-lg">
                        ${priceBreakdown.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2 text-right">
                Final price subject to admin review
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              Confirm Booking
            </button>
            <button
              onClick={handleBack}
              className="w-full bg-gray-300 hover:bg-gray-400 text-black font-semibold py-3 px-4 rounded transition-colors"
            >
              Back
            </button>
          </div>

          {/* Notice */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-black">
              <strong>Note:</strong> Your booking will be submitted for admin approval. 
              You will receive a confirmation email and/or SMS once approved by our team.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

