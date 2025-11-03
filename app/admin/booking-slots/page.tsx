"use client";

import Header from "@/components/Header";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface BookingSlotConfig {
  startTime: string;
  endTime: string;
}

interface DayConfig {
  enabled: boolean;
  slots: BookingSlotConfig[];
}

type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday" | "default";

type ConfigType = "days" | "dates";

export default function BookingSlotsPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [configType, setConfigType] = useState<ConfigType>("days");
  const [selectedDay, setSelectedDay] = useState<DayKey>("default");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [dayConfigs, setDayConfigs] = useState<Record<DayKey, DayConfig>>({
    monday: { enabled: true, slots: [{ startTime: "8:00 AM", endTime: "12:00 AM" }] },
    tuesday: { enabled: true, slots: [{ startTime: "8:00 AM", endTime: "12:00 AM" }] },
    wednesday: { enabled: true, slots: [{ startTime: "8:00 AM", endTime: "12:00 AM" }] },
    thursday: { enabled: true, slots: [{ startTime: "8:00 AM", endTime: "12:00 AM" }] },
    friday: { enabled: true, slots: [{ startTime: "8:00 AM", endTime: "12:00 AM" }] },
    saturday: { enabled: true, slots: [{ startTime: "8:00 AM", endTime: "12:00 AM" }] },
    sunday: { enabled: true, slots: [{ startTime: "8:00 AM", endTime: "12:00 AM" }] },
    default: { enabled: true, slots: [{ startTime: "8:00 AM", endTime: "12:00 AM" }] },
  });

  const [dateConfigs, setDateConfigs] = useState<Record<string, DayConfig>>({});

  // Generate time options (30-minute intervals from 12:00 AM to 11:30 PM)
  const timeOptions = useMemo(() => {
    const times: string[] = [];
    
    // 12:00 AM to 11:30 AM
    times.push("12:00 AM");
    for (let hour = 1; hour < 12; hour++) {
      times.push(`${hour}:00 AM`);
      times.push(`${hour}:30 AM`);
    }
    
    // 12:00 PM to 11:30 PM
    times.push("12:00 PM");
    times.push("12:30 PM");
    for (let hour = 1; hour < 12; hour++) {
      times.push(`${hour}:00 PM`);
      times.push(`${hour}:30 PM`);
    }
    
    // Add midnight (12:00 AM) at the end if not already there
    if (!times.includes("12:00 AM")) {
      times.push("12:00 AM");
    }
    
    return times;
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = localStorage.getItem("adminAuthenticated") === "true";
      if (!isAuth) {
        router.push("/admin/login");
      } else {
        setAuthenticated(true);
        // Load saved day configurations
        const savedDayConfigs = localStorage.getItem("bookingSlotConfigs");
        if (savedDayConfigs) {
          try {
            setDayConfigs(JSON.parse(savedDayConfigs));
          } catch (e) {
            console.error("Failed to load saved day configs", e);
          }
        }
        // Load saved date configurations
        const savedDateConfigs = localStorage.getItem("bookingSlotDateConfigs");
        if (savedDateConfigs) {
          try {
            setDateConfigs(JSON.parse(savedDateConfigs));
          } catch (e) {
            console.error("Failed to load saved date configs", e);
          }
        }
      }
    }
  }, [router]);

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bookingSlotConfigs", JSON.stringify(dayConfigs));
      localStorage.setItem("bookingSlotDateConfigs", JSON.stringify(dateConfigs));
      alert("Booking slot configurations saved successfully!");
    }
  };

  const addSlot = (day?: DayKey, date?: string) => {
    if (configType === "days" && day) {
      setDayConfigs((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          slots: [...prev[day].slots, { startTime: "8:00 AM", endTime: "12:00 AM" }],
        },
      }));
    } else if (configType === "dates" && date) {
      const currentConfig = dateConfigs[date] || { enabled: true, slots: [] };
      setDateConfigs((prev) => ({
        ...prev,
        [date]: {
          ...currentConfig,
          slots: [...currentConfig.slots, { startTime: "8:00 AM", endTime: "12:00 AM" }],
        },
      }));
    }
  };

  const removeSlot = (day: DayKey | undefined, date: string | undefined, index: number) => {
    if (configType === "days" && day) {
      setDayConfigs((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          slots: prev[day].slots.filter((_, i) => i !== index),
        },
      }));
    } else if (configType === "dates" && date) {
      const currentConfig = dateConfigs[date];
      if (currentConfig && currentConfig.slots.length > 0) {
        setDateConfigs((prev) => ({
          ...prev,
          [date]: {
            ...currentConfig,
            slots: currentConfig.slots.filter((_, i) => i !== index),
          },
        }));
      }
    }
  };

  const updateSlot = (
    day: DayKey | undefined,
    date: string | undefined,
    index: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    if (configType === "days" && day) {
      setDayConfigs((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          slots: prev[day].slots.map((slot, i) =>
            i === index ? { ...slot, [field]: value } : slot
          ),
        },
      }));
    } else if (configType === "dates" && date) {
      const currentConfig = dateConfigs[date] || { enabled: true, slots: [] };
      setDateConfigs((prev) => ({
        ...prev,
        [date]: {
          ...currentConfig,
          slots: currentConfig.slots.map((slot, i) =>
            i === index ? { ...slot, [field]: value } : slot
          ),
        },
      }));
    }
  };

  const toggleEnabled = (day: DayKey | undefined, date: string | undefined) => {
    if (configType === "days" && day) {
      setDayConfigs((prev) => ({
        ...prev,
        [day]: { ...prev[day], enabled: !prev[day].enabled },
      }));
    } else if (configType === "dates" && date) {
      const currentConfig = dateConfigs[date] || { enabled: true, slots: [{ startTime: "8:00 AM", endTime: "12:00 AM" }] };
      setDateConfigs((prev) => ({
        ...prev,
        [date]: { ...currentConfig, enabled: !currentConfig.enabled },
      }));
    }
  };

  // Calendar functions - use useMemo to prevent initialization issues
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const trailingDates: number[] = [];
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      trailingDates.push(prevMonthLastDay - i);
    }

    const totalCells = 42;
    const nextMonthDates = totalCells - trailingDates.length - daysInMonth;

    return { year, month, daysInMonth, trailingDates, nextMonthDates };
  }, [currentMonth]);

  const handleDateSelect = (date: number) => {
    const dateStr = `${calendarData.year}-${String(calendarData.month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    setConfigType("dates");
    // Initialize if doesn't exist
    if (!dateConfigs[dateStr]) {
      setDateConfigs((prev) => ({
        ...prev,
        [dateStr]: { enabled: true, slots: [{ startTime: "8:00 AM", endTime: "12:00 AM" }] },
      }));
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return dateObj.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const currentConfig = configType === "days"
    ? dayConfigs[selectedDay]
    : dateConfigs[selectedDate] || { enabled: true, slots: [{ startTime: "8:00 AM", endTime: "12:00 AM" }] };

  if (!authenticated) {
    return null;
  }

  const dayLabels: Record<DayKey, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    default: "Default (All Days)",
  };

  return (
    <div className="min-h-screen bg-gray-800">
      <Header />
      <main className="w-full px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Manage Booking Slots</h1>
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

          {/* Configuration Type Tabs */}
          <div className="mb-6 bg-white rounded-lg p-4 shadow-lg">
            <div className="flex gap-4">
              <button
                onClick={() => setConfigType("days")}
                className={`px-6 py-3 rounded font-semibold transition-colors ${
                  configType === "days"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                Configure by Day of Week
              </button>
              <button
                onClick={() => setConfigType("dates")}
                className={`px-6 py-3 rounded font-semibold transition-colors ${
                  configType === "dates"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                Configure by Specific Date
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar */}
            <div className="bg-white rounded-lg p-4 shadow-lg">
              {configType === "days" ? (
                <>
                  <h2 className="text-lg font-bold text-black mb-4">Select Day</h2>
                  <div className="space-y-2">
                    {Object.keys(dayLabels).map((day) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day as DayKey)}
                        className={`w-full text-left px-4 py-3 rounded transition-colors ${
                          selectedDay === day
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-black"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{dayLabels[day as DayKey]}</span>
                          <span
                            className={`w-3 h-3 rounded-full ${
                              dayConfigs[day as DayKey].enabled ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-black mb-4">Select Date</h2>
                  {/* Calendar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCurrentMonth(new Date(calendarData.year, calendarData.month - 1, 1))}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        ←
                      </button>
                      <h3 className="text-lg font-bold text-black">
                        {monthNames[calendarData.month]} {calendarData.year}
                      </h3>
                      <button
                        onClick={() => setCurrentMonth(new Date(calendarData.year, calendarData.month + 1, 1))}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        →
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div key={day} className="text-center text-xs font-semibold text-gray-600">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {calendarData.trailingDates.map((date, idx) => (
                        <div key={`prev-${idx}`} className="text-gray-400 text-sm text-center py-2">
                          {date}
                        </div>
                      ))}
                      {Array.from({ length: calendarData.daysInMonth }, (_, i) => {
                        const date = i + 1;
                        const dateStr = `${calendarData.year}-${String(calendarData.month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
                        const isSelected = selectedDate === dateStr;
                        const hasConfig = dateConfigs[dateStr];
                        return (
                          <button
                            key={date}
                            onClick={() => handleDateSelect(date)}
                            className={`text-sm text-center py-2 rounded transition-colors ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : hasConfig
                                ? "bg-yellow-200 text-black hover:bg-yellow-300"
                                : "bg-gray-100 text-black hover:bg-gray-200"
                            }`}
                          >
                            {date}
                          </button>
                        );
                      })}
                      {Array.from({ length: calendarData.nextMonthDates }, (_, i) => (
                        <div key={`next-${i + 1}`} className="text-gray-400 text-sm text-center py-2">
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedDate && (
                    <div className="mt-4 p-3 bg-blue-50 rounded">
                      <p className="text-sm text-black font-semibold">
                        Selected: {formatDateDisplay(selectedDate)}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Configuration Panel */}
            <div className="lg:col-span-2 bg-white rounded-lg p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-black">
                  {configType === "days"
                    ? `${dayLabels[selectedDay]} Configuration`
                    : selectedDate
                    ? formatDateDisplay(selectedDate)
                    : "Select a date to configure"}
                </h2>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentConfig.enabled}
                    onChange={() => toggleEnabled(selectedDay, selectedDate)}
                    className="w-5 h-5"
                  />
                  <span className="text-black font-semibold">
                    {currentConfig.enabled ? "Enabled" : "Disabled"}
                  </span>
                </label>
              </div>

              {!currentConfig.enabled && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                  This {configType === "days" ? "day" : "date"} is currently disabled. No bookings will be available.
                </div>
              )}

              {configType === "dates" && !selectedDate && (
                <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
                  Please select a date from the calendar to configure time slots.
                </div>
              )}

              {(configType === "days" || selectedDate) && (
                <div className="space-y-4">
                  {currentConfig.slots.map((slot, index) => (
                    <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-black">Time Slot {index + 1}</h3>
                        {currentConfig.slots.length > 1 && (
                          <button
                            onClick={() => removeSlot(selectedDay, selectedDate, index)}
                            className="text-red-600 hover:text-red-800 font-semibold"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-2">
                            Start Time
                          </label>
                          <select
                            value={slot.startTime}
                            onChange={(e) =>
                              updateSlot(selectedDay, selectedDate, index, "startTime", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded text-black bg-white"
                          >
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black mb-2">
                            End Time
                          </label>
                          <select
                            value={slot.endTime}
                            onChange={(e) =>
                              updateSlot(selectedDay, selectedDate, index, "endTime", e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded text-black bg-white"
                          >
                            {timeOptions
                              .filter((time) => {
                                const startIdx = timeOptions.indexOf(slot.startTime);
                                const endIdx = timeOptions.indexOf(time);
                                return endIdx > startIdx;
                              })
                              .map((time) => (
                                <option key={time} value={time}>
                                  {time}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addSlot(selectedDay, selectedDate)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                  >
                    + Add Another Time Slot
                  </button>
                </div>
              )}

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-black">
                  <strong>Note:</strong> Time slots are configured in 30-minute intervals.
                  Date-specific configurations override day-of-week configurations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
