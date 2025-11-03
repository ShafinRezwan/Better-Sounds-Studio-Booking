"use client";

import Header from "@/components/Header";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const staffMembers = [
    { id: "as-if", name: "AS IF!" },
    { id: "naif", name: "NAIF" },
    { id: "tt", name: "TT" },
    { id: "richie", name: "RICHIE" },
  ];

  const handleDone = () => {
    // Store staff and service data for the confirm page
    if (typeof window !== "undefined") {
      const staffMember = staffMembers.find((s) => s.id === selectedStaff);
      const staffData = {
        staff: staffMember ? staffMember.name : "Not selected",
        services: selectedServices,
      };
      localStorage.setItem("pendingStaffData", JSON.stringify(staffData));
    }
    // Navigate to date/time selection page
    router.push("/booking/pick-time");
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="w-full px-4 py-6">
        {/* Main Content Card - Light Gray */}
        <div className="mx-auto max-w-md bg-gray-200 rounded-lg p-6 shadow-lg">
          {/* Staff Member Selection Section */}
          <div className="mb-6">
            <h2 className="text-black text-lg font-semibold mb-4">
              Choose a staff member
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {staffMembers.map((staff) => {
                const isSelected = selectedStaff === staff.id;
                return (
                  <button
                    key={staff.id}
                    onClick={() => setSelectedStaff(staff.id)}
                    className={`px-4 py-3 rounded text-white font-semibold transition-colors ${
                      isSelected
                        ? "bg-gray-600 hover:bg-gray-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {staff.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Placeholder Area - Empty space with image placeholders */}
          <div className="mb-6">
            <div className="h-32 bg-white rounded mb-3"></div>
            <div className="flex gap-3">
              <div className="w-20 h-20 bg-gray-300 rounded"></div>
              <div className="w-20 h-20 bg-gray-300 rounded"></div>
              <div className="w-20 h-20 bg-gray-300 rounded"></div>
            </div>
          </div>

          {/* Service Required Section */}
          <div className="border-t border-gray-400 pt-4">
            <h3 className="text-black text-lg font-semibold mb-4 underline">
              SERVICE REQUIRED
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setSelectedServices((prev) =>
                      prev.includes("MIXING")
                        ? prev.filter((s) => s !== "MIXING")
                        : [...prev, "MIXING"]
                    );
                  }}
                  className={`px-4 py-3 rounded font-semibold transition-colors ${
                    selectedServices.includes("MIXING")
                      ? "bg-green-400 text-white hover:bg-green-500"
                      : "bg-gray-300 text-black hover:bg-gray-400"
                  }`}
                >
                  MIXING
                </button>
                <button
                  onClick={() => {
                    setSelectedServices((prev) =>
                      prev.includes("MASTERING")
                        ? prev.filter((s) => s !== "MASTERING")
                        : [...prev, "MASTERING"]
                    );
                  }}
                  className={`px-4 py-3 rounded font-semibold transition-colors ${
                    selectedServices.includes("MASTERING")
                      ? "bg-green-400 text-white hover:bg-green-500"
                      : "bg-gray-300 text-black hover:bg-gray-400"
                  }`}
                >
                  MASTERING
                </button>
              </div>
              <button
                onClick={() => {
                  setSelectedServices((prev) =>
                    prev.includes("Recording")
                      ? prev.filter((s) => s !== "Recording")
                      : [...prev, "Recording"]
                  );
                }}
                className={`w-full px-4 py-3 rounded font-semibold transition-colors ${
                  selectedServices.includes("Recording")
                    ? "bg-green-400 text-white hover:bg-green-500"
                    : "bg-gray-300 text-black hover:bg-gray-400"
                }`}
              >
                Recording
              </button>
            </div>
          </div>

          {/* Done Button at Bottom of Container */}
          <div className="mt-6 pt-4 border-t border-gray-400">
            <button
              onClick={handleDone}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
