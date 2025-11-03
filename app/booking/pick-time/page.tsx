"use client";

import Header from "@/components/Header";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function PickTimePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 10, 1)); // November 2025
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

  // Unavailable dates (crossed out in calendar - specific unavailable dates)
  const unavailableDates = [10, 16];

  // Dates that have all times fully booked
  const fullyBookedDates = [5, 12, 20, 25];

  // Convert time string to minutes since midnight for comparison
  const timeToMinutesForSlot = (timeStr: string): number => {
    const [time, ampm] = timeStr.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let totalMinutes = hours * 60 + minutes;

    if (ampm === "PM" && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (ampm === "AM" && hours === 12) {
      totalMinutes = minutes; // 12:00 AM = 0, 12:30 AM = 30
    }

    return totalMinutes;
  };

  // Generate time slots between start and end times (30-minute intervals)
  const generateSlotsBetweenTimes = (
    startTime: string,
    endTime: string
  ): string[] => {
    const slots: string[] = [];
    const startMinutes = timeToMinutesForSlot(startTime);
    let endMinutes = timeToMinutesForSlot(endTime);

    // If end time is midnight (12:00 AM), treat it as 24:00
    if (endTime === "12:00 AM" || endTime.includes("12:00 AM")) {
      endMinutes = 24 * 60;
    }

    // Generate 30-minute intervals
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;

      if (hours === 0) {
        slots.push(`12:${mins.toString().padStart(2, "0")} AM`);
      } else if (hours < 12) {
        slots.push(`${hours}:${mins.toString().padStart(2, "0")} AM`);
      } else if (hours === 12) {
        slots.push(`12:${mins.toString().padStart(2, "0")} PM`);
      } else {
        slots.push(`${hours - 12}:${mins.toString().padStart(2, "0")} PM`);
      }
    }

    // Always add midnight if end time is 12:00 AM
    if (endTime === "12:00 AM" || endTime.includes("12:00 AM")) {
      slots.push("12:00 AM");
    }

    return slots;
  };

  // Get day name from date number
  const getDayName = (date: number): string => {
    const dateObj = new Date(year, month, date);
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    return days[dateObj.getDay()];
  };

  // Load admin booking slot configuration (client-side only)
  const getBookingSlotConfig = () => {
    if (typeof window === "undefined") {
      // Return default config during SSR
      return {
        dayConfigs: {
          default: {
            enabled: true,
            slots: [{ startTime: "8:00 AM", endTime: "12:00 AM" }],
          },
        } as Record<string, DayConfig>,
        dateConfigs: {} as Record<string, DayConfig>,
      };
    }

    const savedDayConfigs = localStorage.getItem("bookingSlotConfigs");
    const savedDateConfigs = localStorage.getItem("bookingSlotDateConfigs");

    let dayConfigs: Record<string, DayConfig> = {
      default: {
        enabled: true,
        slots: [{ startTime: "8:00 AM", endTime: "12:00 AM" }],
      },
    };

    let dateConfigs: Record<string, DayConfig> = {};

    if (savedDayConfigs) {
      try {
        dayConfigs = JSON.parse(savedDayConfigs);
      } catch (e) {
        console.error("Failed to load day configs", e);
      }
    }

    if (savedDateConfigs) {
      try {
        dateConfigs = JSON.parse(savedDateConfigs);
      } catch (e) {
        console.error("Failed to load date configs", e);
      }
    }

    return { dayConfigs, dateConfigs };
  };

  interface DayConfig {
    enabled: boolean;
    slots: { startTime: string; endTime: string }[];
  }

  // Get available time slots for a specific date using admin configuration
  const getAvailableTimeSlots = (date: number): string[] => {
    // If date is in fullyBookedDates, return empty array
    if (fullyBookedDates.includes(date)) {
      return [];
    }

    const { dayConfigs, dateConfigs } = getBookingSlotConfig();

    // Get year and month from currentMonth
    const currentYear = currentMonth.getFullYear();
    const currentMonthNum = currentMonth.getMonth();

    // Format date string (YYYY-MM-DD)
    const dateStr = `${currentYear}-${String(currentMonthNum + 1).padStart(
      2,
      "0"
    )}-${String(date).padStart(2, "0")}`;

    // Check for date-specific configuration first (takes precedence)
    let dayConfig: DayConfig | undefined;
    if (dateConfigs[dateStr]) {
      dayConfig = dateConfigs[dateStr];
    } else {
      // Fall back to day-of-week configuration
      const dayName = getDayName(date);
      dayConfig = dayConfigs[dayName] || dayConfigs.default;
    }

    // If day/date is disabled, return empty array
    if (!dayConfig || !dayConfig.enabled) {
      return [];
    }

    // Generate slots for each time range configured
    const allSlots: string[] = [];
    dayConfig.slots.forEach((slot: { startTime: string; endTime: string }) => {
      const slots = generateSlotsBetweenTimes(slot.startTime, slot.endTime);
      allSlots.push(...slots);
    });

    // Remove duplicates and sort
    const uniqueSlots = Array.from(new Set(allSlots));
    uniqueSlots.sort((a, b) => {
      return timeToMinutesForSlot(a) - timeToMinutesForSlot(b);
    });

    return uniqueSlots;
  };

  // Check if a date has any available time slots
  const isDateFullyBooked = (date: number): boolean => {
    return getAvailableTimeSlots(date).length === 0;
  };

  // Get available time slots for selected date
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return [];
    return getAvailableTimeSlots(selectedDate);
  }, [selectedDate]);

  // Convert time string to minutes since midnight for comparison
  const timeToMinutes = (timeStr: string): number => {
    const [time, ampm] = timeStr.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let totalMinutes = hours * 60 + minutes;

    if (ampm === "PM" && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (ampm === "AM" && hours === 12) {
      totalMinutes -= 12 * 60;
    }

    return totalMinutes;
  };

  // Get available end times based on selected start time (1 hour intervals)
  const getAvailableEndTimes = (startTime: string): string[] => {
    if (!startTime || !selectedDate) return [];

    const startIndex = availableTimeSlots.indexOf(startTime);
    if (startIndex === -1) return [];

    const startMinutes = timeToMinutes(startTime);
    const oneHourLater = startMinutes + 60; // 1 hour = 60 minutes

    // Filter to only show times that are at least 1 hour after start time
    return availableTimeSlots.slice(startIndex + 1).filter((time) => {
      const timeMinutes = timeToMinutes(time);
      return timeMinutes >= oneHourLater;
    });
  };

  const availableEndTimes = useMemo(() => {
    return getAvailableEndTimes(startTime);
  }, [startTime, availableTimeSlots]);

  // Get days in month
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday

  // Previous month's trailing dates
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const trailingDates: number[] = [];
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    trailingDates.push(prevMonthLastDay - i);
  }

  // Calculate how many days to show in total (42 = 6 rows × 7 days)
  const totalCells = 42;
  const nextMonthDates = totalCells - trailingDates.length - daysInMonth;

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
    setSelectedDate(null);
    setStartTime("");
    setEndTime("");
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
    setSelectedDate(null);
    setStartTime("");
    setEndTime("");
  };

  const handleDateSelect = (date: number) => {
    setSelectedDate(date);
    // Reset times when date changes
    setStartTime("");
    setEndTime("");
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    // Reset end time if it's no longer valid
    if (endTime && !getAvailableEndTimes(time).includes(endTime)) {
      setEndTime("");
    }
  };

  const handleChooseRoom = () => {
    if (startTime && endTime && selectedDate) {
      // Store time data for the confirm page
      if (typeof window !== "undefined") {
        const currentYear = currentMonth.getFullYear();
        const currentMonthNum = currentMonth.getMonth();
        const dateStr = `${currentYear}-${String(currentMonthNum + 1).padStart(
          2,
          "0"
        )}-${String(selectedDate).padStart(2, "0")}`;
        const dateObj = new Date(currentYear, currentMonthNum, selectedDate);
        const formattedDate = dateObj.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const timeData = {
          date: formattedDate,
          dateStr: dateStr,
          startTime: startTime,
          endTime: endTime,
        };
        localStorage.setItem("pendingTimeData", JSON.stringify(timeData));
      }
      // Navigate to room selection page
      router.push("/booking/choose-room");
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="min-h-screen bg-gray-800">
      <Header />
      <main className="w-full px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
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

        {/* Main Content Card - Blue Background */}
        <div className="mx-auto max-w-md bg-blue-600 rounded-lg p-6 shadow-lg border-2 border-blue-400">
          {/* Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col items-center flex-1">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mb-1">
                  <div className="w-4 h-4 rounded-full bg-white"></div>
                </div>
                <span className="text-white text-xs">Pick a time</span>
              </div>
              <div className="flex-1 h-0.5 bg-green-500 mx-2"></div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center mb-1">
                  <div className="w-4 h-4 rounded-full bg-white"></div>
                </div>
                <span className="text-white text-xs">Your details</span>
              </div>
              <div className="flex-1 h-0.5 bg-gray-400 mx-2"></div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center mb-1">
                  <div className="w-4 h-4 rounded-full bg-white"></div>
                </div>
                <span className="text-white text-xs">Confirm</span>
              </div>
            </div>
          </div>

          {/* Calendar Section */}
          <div className="mb-6 bg-white rounded-lg p-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-center mb-4">
              <button
                onClick={handlePrevMonth}
                className="text-gray-400 hover:text-gray-600 mr-4"
                aria-label="Previous month"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <path d="M7.5 1.5L2.5 6l5 4.5V1.5z" />
                </svg>
              </button>
              <h3 className="text-black text-xl font-bold underline pixelated">
                {monthNames[month]} {year}
              </h3>
              <button
                onClick={handleNextMonth}
                className="text-black hover:text-gray-600 ml-4"
                aria-label="Next month"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <path d="M4.5 1.5L9.5 6l-5 4.5V1.5z" />
                </svg>
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                <div
                  key={day}
                  className="text-red-600 text-xs font-bold text-center pixelated"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Previous month dates (gray) */}
              {trailingDates.map((date, idx) => (
                <div
                  key={`prev-${idx}`}
                  className="text-gray-400 text-sm text-center py-2"
                >
                  {date}
                </div>
              ))}

              {/* Current month dates */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const date = i + 1;
                const isUnavailable = unavailableDates.includes(date);
                const isFullyBooked = isDateFullyBooked(date);
                const isSelected = selectedDate === date;
                const isDisabled = isUnavailable || isFullyBooked;

                return (
                  <button
                    key={date}
                    onClick={() => !isDisabled && handleDateSelect(date)}
                    disabled={isDisabled}
                    className={`text-sm text-center py-2 rounded transition-colors ${
                      isSelected
                        ? "bg-green-400 text-white"
                        : isDisabled
                        ? "text-red-600 line-through cursor-not-allowed"
                        : "text-black hover:bg-gray-200"
                    }`}
                  >
                    {date}
                  </button>
                );
              })}

              {/* Next month dates (if needed) */}
              {Array.from({ length: nextMonthDates }, (_, i) => {
                const date = i + 1;
                return (
                  <div
                    key={`next-${date}`}
                    className="text-gray-400 text-sm text-center py-2"
                  >
                    {date}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Slot Selection - Only show when date is selected */}
          {selectedDate && availableTimeSlots.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white text-lg font-bold mb-4 underline pixelated">
                PICK A TIME SLOT
              </h3>

              {/* Start Time */}
              <div className="mb-4">
                <label className="block text-white text-sm mb-2">
                  Start time
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      fill="currentColor"
                    >
                      <path d="M4 0L3 3H0L2.5 5L1.5 8L4 6L6.5 8L5.5 5L8 3H5L4 0z" />
                    </svg>
                  </div>
                  <select
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full bg-white text-black px-10 py-3 rounded pl-10 appearance-none cursor-pointer"
                  >
                    <option value="">Select start time</option>
                    {availableTimeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      fill="currentColor"
                    >
                      <path d="M0 2l4 4 4-4H0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* End Time */}
              <div className="mb-6">
                <label className="block text-white text-sm mb-2">
                  End Time
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      fill="currentColor"
                    >
                      <path d="M4 0L3 3H0L2.5 5L1.5 8L4 6L6.5 8L5.5 5L8 3H5L4 0z" />
                    </svg>
                  </div>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={!startTime || availableEndTimes.length === 0}
                    className={`w-full bg-white text-black px-10 py-3 rounded pl-10 appearance-none ${
                      !startTime || availableEndTimes.length === 0
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <option value="">
                      {!startTime
                        ? "Select start time first"
                        : availableEndTimes.length === 0
                        ? "No available end times"
                        : "Select end time"}
                    </option>
                    {availableEndTimes.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      fill="currentColor"
                    >
                      <path d="M0 2l4 4 4-4H0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Choose Room Button */}
              <button
                onClick={handleChooseRoom}
                disabled={!startTime || !endTime}
                className={`w-full font-bold py-3 px-4 rounded transition-colors ${
                  !startTime || !endTime
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                Choose Room
              </button>
            </div>
          )}

          {/* Message when date is selected but no slots available */}
          {selectedDate && availableTimeSlots.length === 0 && (
            <div className="mb-6 p-4 bg-yellow-500 rounded-lg">
              <p className="text-white text-sm font-semibold">
                No available time slots for this date. Please select another
                date.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
