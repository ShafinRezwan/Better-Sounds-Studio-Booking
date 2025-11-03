"use client";

import Header from "@/components/Header";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ServicePrice {
  id: string;
  name: string;
  basePrice: number;
  perHour: boolean;
}

interface RoomPrice {
  id: string;
  name: string;
  basePrice: number;
  perHour: boolean;
}

export default function PricingPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  const [servicePrices, setServicePrices] = useState<ServicePrice[]>([
    { id: "mixing", name: "MIXING", basePrice: 100, perHour: true },
    { id: "mastering", name: "MASTERING", basePrice: 150, perHour: true },
    { id: "recording", name: "Recording", basePrice: 200, perHour: true },
  ]);

  const [roomPrices, setRoomPrices] = useState<RoomPrice[]>([
    { id: "studio-a", name: "STUDIO A", basePrice: 50, perHour: true },
    { id: "studio-b", name: "STUDIO B", basePrice: 75, perHour: true },
    { id: "studio-c", name: "STUDIO C", basePrice: 100, perHour: true },
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("adminAuthenticated") === "true";
      if (!isAuth) {
        router.push("/admin/login");
      } else {
        setAuthenticated(true);
        
        // Load saved prices
        const savedServicePrices = localStorage.getItem("servicePrices");
        if (savedServicePrices) {
          try {
            setServicePrices(JSON.parse(savedServicePrices));
          } catch (e) {
            console.error("Failed to load service prices", e);
          }
        }

        const savedRoomPrices = localStorage.getItem("roomPrices");
        if (savedRoomPrices) {
          try {
            setRoomPrices(JSON.parse(savedRoomPrices));
          } catch (e) {
            console.error("Failed to load room prices", e);
          }
        }
      }
    }
  }, [router]);

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("servicePrices", JSON.stringify(servicePrices));
      localStorage.setItem("roomPrices", JSON.stringify(roomPrices));
      alert("Pricing saved successfully!");
    }
  };

  const updateServicePrice = (id: string, field: "basePrice" | "perHour", value: number | boolean) => {
    setServicePrices((prev) =>
      prev.map((service) =>
        service.id === id ? { ...service, [field]: value } : service
      )
    );
  };

  const updateRoomPrice = (id: string, field: "basePrice" | "perHour", value: number | boolean) => {
    setRoomPrices((prev) =>
      prev.map((room) =>
        room.id === id ? { ...room, [field]: value } : room
      )
    );
  };

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-800">
      <Header />
      <main className="w-full px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Manage Pricing</h1>
            <div className="flex gap-4">
              <button
                onClick={() => router.push("/admin/dashboard")}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Pricing */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-bold text-black mb-4">Service Pricing</h2>
              <div className="space-y-4">
                {servicePrices.map((service) => (
                  <div key={service.id} className="border border-gray-300 rounded-lg p-4">
                    <h3 className="font-semibold text-black mb-3">{service.name}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">
                          Base Price ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={service.basePrice}
                          onChange={(e) =>
                            updateServicePrice(service.id, "basePrice", parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">
                          Pricing Type
                        </label>
                        <select
                          value={service.perHour ? "hourly" : "flat"}
                          onChange={(e) =>
                            updateServicePrice(service.id, "perHour", e.target.value === "hourly")
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                        >
                          <option value="hourly">Per Hour</option>
                          <option value="flat">Flat Rate</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Room Pricing */}
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-bold text-black mb-4">Room Pricing</h2>
              <div className="space-y-4">
                {roomPrices.map((room) => (
                  <div key={room.id} className="border border-gray-300 rounded-lg p-4">
                    <h3 className="font-semibold text-black mb-3">{room.name}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">
                          Base Price ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={room.basePrice}
                          onChange={(e) =>
                            updateRoomPrice(room.id, "basePrice", parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">
                          Pricing Type
                        </label>
                        <select
                          value={room.perHour ? "hourly" : "flat"}
                          onChange={(e) =>
                            updateRoomPrice(room.id, "perHour", e.target.value === "hourly")
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                        >
                          <option value="hourly">Per Hour</option>
                          <option value="flat">Flat Rate</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Notes */}
          <div className="mt-6 bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-lg font-bold text-black mb-3">Pricing Notes</h2>
            <ul className="list-disc list-inside space-y-2 text-black text-sm">
              <li>Per Hour pricing multiplies by the duration of the booking</li>
              <li>Flat Rate pricing is a one-time charge regardless of duration</li>
              <li>Total booking price = Room price + Service price(s)</li>
              <li>Prices are displayed to customers during the booking flow</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}


