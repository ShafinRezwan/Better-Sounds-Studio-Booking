"use client";

import Header from "@/components/Header";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChooseRoomPage() {
  const router = useRouter();
  const [selectedRoom, setSelectedRoom] = useState(0);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const rooms = [
    { id: "studio-a", name: "STUDIO A" },
    { id: "studio-b", name: "STUDIO B" },
    { id: "studio-c", name: "STUDIO C" },
  ];

  const currentRoom = rooms[selectedRoom];

  const handlePrevRoom = () => {
    setSelectedRoom((prev) => (prev === 0 ? rooms.length - 1 : prev - 1));
  };

  const handleNextRoom = () => {
    setSelectedRoom((prev) => (prev === rooms.length - 1 ? 0 : prev + 1));
  };

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleDone = () => {
    // Store booking data in localStorage for the confirm page
    if (typeof window !== "undefined") {
      const bookingData = {
        room: currentRoom.name,
        roomId: currentRoom.id,
        services: selectedServices,
      };
      localStorage.setItem("pendingBookingData", JSON.stringify(bookingData));
    }
    router.push("/booking/confirm");
  };

  return (
    <div className="min-h-screen bg-gray-800">
      <Header />
      <main className="w-full px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 text-white hover:text-gray-300 flex items-center gap-2"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Back</span>
        </button>

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
              <div className="flex-1 h-0.5 bg-gray-400 mx-2"></div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center mb-1">
                  <div className="w-4 h-4 rounded-full bg-white"></div>
                </div>
                <span className="text-black text-xs">Confirm</span>
              </div>
            </div>
          </div>

          {/* Room Selection Section */}
          <div className="mb-6">
            <h2 className="text-black text-xl font-bold text-center mb-4">
              Choose a room
            </h2>

            {/* Room Name with Navigation */}
            <div className="flex items-center justify-center mb-4">
              <button
                onClick={handlePrevRoom}
                className="text-green-600 hover:text-green-700 mr-4"
                aria-label="Previous room"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <h3 className="text-black text-2xl font-bold text-center">
                {currentRoom.name}
              </h3>

              <button
                onClick={handleNextRoom}
                className="text-green-600 hover:text-green-700 ml-4"
                aria-label="Next room"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Image Placeholders */}
            <div className="mb-4">
              {/* Main large placeholder */}
              <div className="w-full h-48 bg-gray-300 rounded-lg mb-3"></div>
              {/* Three smaller square placeholders */}
              <div className="flex gap-3">
                <div className="w-20 h-20 bg-gray-300 rounded"></div>
                <div className="w-20 h-20 bg-gray-300 rounded"></div>
                <div className="w-20 h-20 bg-gray-300 rounded"></div>
              </div>
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
                  onClick={() => toggleService("MIXING")}
                  className={`px-4 py-3 rounded font-semibold transition-colors ${
                    selectedServices.includes("MIXING")
                      ? "bg-green-400 text-white hover:bg-green-500"
                      : "bg-gray-300 text-black hover:bg-gray-400"
                  }`}
                >
                  MIXING
                </button>
                <button
                  onClick={() => toggleService("MASTERING")}
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
                onClick={() => toggleService("Recording")}
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

          {/* Done Button at Bottom */}
          <div className="mt-6 pt-4 border-t border-gray-400">
            <button
              onClick={handleDone}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

